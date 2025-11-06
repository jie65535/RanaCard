from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from typing import Any, Dict, List, Tuple

from fastapi import APIRouter, Body, HTTPException

from .assets import get_baseline


router = APIRouter(prefix="/api/patch", tags=["patch"])


# Supported kinds for ID-based patching
SUPPORTED_KINDS = {"card", "pendant", "mapevent", "begineffect", "disaster"}


def _sha256_of_obj(obj: Any) -> str:
    # Deterministic hash: stable JSON form
    text = json.dumps(obj, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def _kind_shape(kind: str) -> Tuple[str, str | None]:
    """Return (mode, list_key) where mode is 'object_list' or 'array_root'."""
    k = kind.lower()
    if k in {"card", "pendant", "disaster"}:
        # Card.json: { Name, Cards: [...] }
        # Pendant.json / Disaster.json: { Name, Pendant: [...] }
        return ("object_list", "Cards" if k == "card" else "Pendant")
    if k in {"mapevent", "begineffect"}:
        return ("array_root", None)
    raise HTTPException(status_code=400, detail=f"不支持的种类: {kind}")


def _list_from_data(kind: str, data: Any) -> List[Dict[str, Any]]:
    mode, list_key = _kind_shape(kind)
    if mode == "object_list":
        if not isinstance(data, dict):
            raise HTTPException(status_code=400, detail="数据应为对象")
        lst = data.get(list_key or "")
        if not isinstance(lst, list):
            raise HTTPException(status_code=400, detail=f"缺少 {list_key} 列表")
        return lst
    # array_root
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="数据应为数组")
    return data


def _entity_map(items: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    out: Dict[str, Dict[str, Any]] = {}
    for it in items:
        if not isinstance(it, dict):
            continue
        eid = it.get("ID")
        if isinstance(eid, str) and eid:
            out[eid] = it
    return out


def _diff_entities(base: Dict[str, Any], edited: Dict[str, Any]) -> Dict[str, Any]:
    """Compute adds/updates/deletes for entity maps keyed by ID.
    Updates are reported as field-level changes (no deep pathing)."""
    adds: List[Dict[str, Any]] = []
    deletes: List[Dict[str, Any]] = []
    updates: List[Dict[str, Any]] = []

    base_ids = set(base.keys())
    edited_ids = set(edited.keys())

    for new_id in sorted(edited_ids - base_ids):
        adds.append({"id": new_id, "data": deepcopy(edited[new_id])})

    for old_id in sorted(base_ids - edited_ids):
        deletes.append({"id": old_id})

    for same_id in sorted(base_ids & edited_ids):
        before = base[same_id]
        after = edited[same_id]
        # field-level shallow diff excluding ID
        fields_changed: Dict[str, Dict[str, Any]] = {}
        keys = set(before.keys()) | set(after.keys())
        for key in keys:
            if key == "ID":
                continue
            b = before.get(key, None)
            a = after.get(key, None)
            if _value_equal(b, a):
                continue
            fields_changed[key] = {"from": deepcopy(b), "to": deepcopy(a)}
        if fields_changed:
            updates.append({"id": same_id, "fields": fields_changed})

    return {"adds": adds, "updates": updates, "deletes": deletes}


def _value_equal(a: Any, b: Any) -> bool:
    if a is b:
        return True
    # Normalize via JSON where possible for structural types
    if isinstance(a, (dict, list)) or isinstance(b, (dict, list)):
        try:
            sa = json.dumps(a, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            sb = json.dumps(b, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
            return sa == sb
        except Exception:
            return a == b
    return a == b


@router.post("/diff")
def diff_patch(kind: str, edited: Any = Body(...)) -> Dict[str, Any]:
    kind_l = kind.lower()
    if kind_l not in SUPPORTED_KINDS:
        raise HTTPException(status_code=400, detail=f"暂不支持的种类: {kind}")

    baseline = get_baseline(kind_l)
    base_list = _list_from_data(kind_l, baseline)
    edited_list = _list_from_data(kind_l, edited)

    base_map = _entity_map(base_list)
    edited_map = _entity_map(edited_list)

    changes = _diff_entities(base_map, edited_map)
    meta = {
        "schema": 1,
        "kind": kind_l,
        "baseSha256": _sha256_of_obj(baseline),
    }
    return {"meta": meta, "changes": changes}


@router.post("/apply")
def apply_patch(kind: str, patch: Dict[str, Any] = Body(...), target: Any | None = Body(None)) -> Dict[str, Any]:
    kind_l = kind.lower()
    if kind_l not in SUPPORTED_KINDS:
        raise HTTPException(status_code=400, detail=f"暂不支持的种类: {kind}")

    # Determine starting dataset
    if target is None:
        data = deepcopy(get_baseline(kind_l))
    else:
        data = deepcopy(target)

    mode, list_key = _kind_shape(kind_l)
    if mode == "object_list":
        if not isinstance(data, dict):
            raise HTTPException(status_code=400, detail="target 数据应为对象")
        items = data.get(list_key or "")
        if not isinstance(items, list):
            raise HTTPException(status_code=400, detail=f"target 缺少 {list_key} 列表")
    else:
        if not isinstance(data, list):
            raise HTTPException(status_code=400, detail="target 数据应为数组")
        items = data

    # Build current map and index
    id_to_idx: Dict[str, int] = {}
    for i, it in enumerate(items):
        if isinstance(it, dict) and isinstance(it.get("ID"), str):
            id_to_idx[it["ID"]] = i

    stats = {"addsApplied": 0, "updatesApplied": 0, "deletesApplied": 0}
    conflicts: List[Dict[str, Any]] = []

    chg = (patch or {}).get("changes") or patch  # accept either wrapped or direct changes
    adds = chg.get("adds") or []
    updates = chg.get("updates") or []
    deletes = chg.get("deletes") or []

    # Deletes first
    for d in deletes:
        eid = d.get("id")
        if not isinstance(eid, str):
            continue
        idx = id_to_idx.get(eid)
        if idx is None:
            # nothing to delete
            continue
        items.pop(idx)
        # rebuild index after removal
        id_to_idx = {it.get("ID"): i for i, it in enumerate(items) if isinstance(it, dict) and isinstance(it.get("ID"), str)}
        stats["deletesApplied"] += 1

    # Adds
    for a in adds:
        eid = a.get("id")
        data_obj = a.get("data")
        if not isinstance(eid, str) or not isinstance(data_obj, dict):
            continue
        if eid in id_to_idx:
            conflicts.append({"id": eid, "type": "add_exists"})
            continue
        items.append(deepcopy(data_obj))
        id_to_idx[eid] = len(items) - 1
        stats["addsApplied"] += 1

    # Updates
    for u in updates:
        eid = u.get("id")
        fields = u.get("fields") or {}
        if not isinstance(eid, str) or not isinstance(fields, dict):
            continue
        idx = id_to_idx.get(eid)
        if idx is None:
            conflicts.append({"id": eid, "type": "update_missing"})
            continue
        obj = items[idx]
        if not isinstance(obj, dict):
            conflicts.append({"id": eid, "type": "update_not_object"})
            continue
        for key, ft in fields.items():
            if not isinstance(ft, dict) or "to" not in ft:
                continue
            expected = ft.get("from", None)
            current = obj.get(key, None)
            if expected is not None and not _value_equal(current, expected):
                conflicts.append({"id": eid, "field": key, "type": "conflict", "current": deepcopy(current), "expected": deepcopy(expected)})
                continue
            obj[key] = deepcopy(ft.get("to"))
            stats["updatesApplied"] += 1

    result = data
    return {
        "ok": True,
        "result": result,
        "stats": stats,
        "conflicts": conflicts,
    }

