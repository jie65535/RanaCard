from __future__ import annotations

import hashlib
import json
import secrets
import time
import re
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse

from .assets import ValidateResult, validate_payload  # reuse existing validators
from .patch import SUPPORTED_KINDS, diff_patch  # for patch-kind validation and migration


router = APIRouter(prefix="/api/share", tags=["share"])

# Repo root
ROOT = Path(__file__).resolve().parents[2]
STORE_DIR = ROOT / "server" / "uploads" / "share"
INDEX_PATH = STORE_DIR / "index.json"
ID_RE = re.compile(r"^[A-Za-z0-9\-]{6,24}$")


def _now_iso() -> str:
    # time.strftime ensures fixed formatting without importing datetime
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _ensure_store():
    STORE_DIR.mkdir(parents=True, exist_ok=True)
    if not INDEX_PATH.exists():
        INDEX_PATH.write_text(json.dumps({"items": []}, ensure_ascii=False, indent=2), encoding="utf-8")


def _load_index() -> Dict[str, Any]:
    _ensure_store()
    with INDEX_PATH.open("r", encoding="utf-8") as f:
        return json.load(f)


def _save_index(idx: Dict[str, Any]) -> None:
    with INDEX_PATH.open("w", encoding="utf-8") as f:
        json.dump(idx, f, ensure_ascii=False, indent=2)


def run_migration() -> None:
    """Migrate legacy share files (with `data`) into patch format once.
    Creates a flag file to avoid repeating work.
    """
    _ensure_store()
    flag = STORE_DIR / "migrated_v1.flag"
    if flag.exists():
        return
    idx = _load_index()
    items = idx.get("items", [])
    changed = False
    for it in items:
        # Skip already patch-mode entries
        if it.get("mode") == "patch":
            continue
        sid = it.get("id")
        if not sid:
            continue
        fpath = STORE_DIR / f"{sid}.json"
        if not fpath.exists():
            continue
        try:
            obj = json.loads(fpath.read_text(encoding="utf-8"))
        except Exception:
            continue
        data = obj.get("data") if isinstance(obj, dict) else None
        if not isinstance(data, dict):
            # Nothing to migrate
            continue
        # Determine single kind present
        mapping = {
            "cards": "card",
            "pendants": "pendant",
            "mapEvents": "mapevent",
            "beginEffects": "begineffect",
        }
        present = [k for k in mapping.keys() if k in data and data[k] is not None]
        if not present:
            continue
        try:
            meta = obj.get("meta") or {}
            meta["mode"] = "patch"
            patches: List[Dict[str, Any]] = []
            kinds: List[str] = []
            for data_key in present:
                kind = mapping[data_key]
                edited = data[data_key]
                p = diff_patch(kind, edited)
                patches.append(p)
                kinds.append(kind)
            # If只有一种，用单 patch；多种则用 patches 数组
            if len(patches) == 1:
                obj = {"meta": meta, "patch": patches[0]}
                it["kinds"] = [kinds[0]]
            else:
                obj = {"meta": meta, "patches": patches}
                it["kinds"] = sorted(list(set(kinds)))
            fpath.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding="utf-8")
            it["mode"] = "patch"
            it["size"] = fpath.stat().st_size
            changed = True
        except Exception:
            continue
    if changed:
        _save_index(idx)
    # Create flag to avoid repeated migration
    try:
        flag.write_text("ok", encoding="utf-8")
    except Exception:
        pass


def _gen_id(existing: set[str]) -> str:
    # short, URL-safe id
    for _ in range(10):
        cand = secrets.token_urlsafe(6).replace("_", "-")  # ~8 chars
        if cand not in existing:
            return cand
    # very unlikely; fall back to longer
    return secrets.token_urlsafe(10).replace("_", "-")


def _hash_token(tok: str) -> str:
    return hashlib.sha256(tok.encode("utf-8")).hexdigest()


def _ensure_valid_id(share_id: str) -> None:
    if not isinstance(share_id, str) or not ID_RE.match(share_id):
        raise HTTPException(status_code=400, detail="无效的分享ID")


# ---- API ----


@router.post("")
async def create_share(request: Request) -> Dict[str, Any]:
    """
    Accept JSON body with shape:
    {
      "meta": {"title": str, "author": str|None, "note": str|None, "baseDataVersion": str|None, "createdAt": str|None},
      "data": { "cards"?: CardRoot, "pendants"?: PendantRoot }
    }
    """
    try:
        body = await request.json()
    except Exception:  # noqa: PIE786
        raise HTTPException(status_code=400, detail="请求体必须为 JSON")

    if not isinstance(body, dict):
        raise HTTPException(status_code=400, detail="请求体格式错误")

    meta = body.get("meta") or {}
    data = body.get("data")
    patch = body.get("patch")
    patches = body.get("patches")
    if data is None and patch is None and patches is None:
        raise HTTPException(status_code=400, detail="必须包含 data 或 patch/patches 之一")
    if data is not None and not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="data 必须为对象")
    if patch is not None and not isinstance(patch, dict):
        raise HTTPException(status_code=400, detail="patch 必须为对象")
    if patches is not None and not isinstance(patches, list):
        raise HTTPException(status_code=400, detail="patches 必须为数组")

    title = meta.get("title")
    author = meta.get("author")
    description = meta.get("description") or meta.get("note")  # backward compat: accept note
    base_ver = meta.get("baseDataVersion")
    created_at = meta.get("createdAt") or _now_iso()

    if not isinstance(title, str) or not title.strip():
        raise HTTPException(status_code=400, detail="meta.title 必填")
    if not isinstance(author, str) or not author.strip():
        raise HTTPException(status_code=400, detail="meta.author 必填")
    if not isinstance(description, str) or not description.strip():
        raise HTTPException(status_code=400, detail="meta.description 必填")
    if base_ver is not None and not isinstance(base_ver, str):
        raise HTTPException(status_code=400, detail="meta.baseDataVersion 必须为字符串")

    # length limits
    title_s = title.strip()
    author_s = author.strip()
    description_s = description.strip()
    if len(title_s) > 100:
        raise HTTPException(status_code=400, detail="title 过长（最多 100 字符）")
    if len(author_s) > 50:
        raise HTTPException(status_code=400, detail="author 过长（最多 50 字符）")
    if len(description_s) > 3000:
        raise HTTPException(status_code=400, detail="description 过长（最多 3000 字符）")

    mode = "data"
    share_kinds: List[str] = []
    if patch is not None or patches is not None:
        # Patch mode: expect diff-like object: { meta?: {kind,...}, changes: {...} }
        if patches is not None:
            kinds: List[str] = []
            for p in patches:
                if not isinstance(p, dict):
                    raise HTTPException(status_code=400, detail="patches[*] 必须为对象")
                ch = p.get("changes")
                if not isinstance(ch, dict):
                    raise HTTPException(status_code=400, detail="patches[*].changes 缺失或格式错误")
                kind = ((p.get("meta") or {}).get("kind") if isinstance(p.get("meta"), dict) else None)
                if not isinstance(kind, str) or kind.lower() not in SUPPORTED_KINDS:
                    raise HTTPException(status_code=400, detail="patches[*].meta.kind 无效")
                kinds.append(kind.lower())
            share_kinds = sorted(list(set(kinds)))
        else:
            ch = patch.get("changes") if isinstance(patch, dict) else None
            if not isinstance(ch, dict):
                raise HTTPException(status_code=400, detail="patch.changes 缺失或格式错误")
            kind_from_meta = (patch.get("meta") or {}).get("kind") if isinstance(patch.get("meta"), dict) else None
            kind = kind_from_meta or meta.get("kind")
            if not isinstance(kind, str):
                raise HTTPException(status_code=400, detail="无法识别 patch 的种类(kind)")
            kind_l = kind.lower()
            if kind_l not in SUPPORTED_KINDS:
                raise HTTPException(status_code=400, detail=f"不支持的 patch 种类: {kind}")
            share_kinds = [kind_l]
        mode = "patch"
        data = None  # ignore data when patch is present
    else:
        # Data mode: Validate supported kinds using existing validators
        has_any = False
        if "cards" in data and data["cards"] is not None:
            if not isinstance(data["cards"], dict):
                raise HTTPException(status_code=400, detail="data.cards 必须为对象")
            res: ValidateResult = validate_payload("card", data["cards"])  # type: ignore[arg-type]
            if not res.ok:
                raise HTTPException(status_code=400, detail={"kind": "card", "errors": res.errors})
            has_any = True
            share_kinds.append("card")
        if "pendants" in data and data["pendants"] is not None:
            if not isinstance(data["pendants"], dict):
                raise HTTPException(status_code=400, detail="data.pendants 必须为对象")
            res = validate_payload("pendant", data["pendants"])  # type: ignore[arg-type]
            if not res.ok:
                raise HTTPException(status_code=400, detail={"kind": "pendant", "errors": res.errors})
            has_any = True
            share_kinds.append("pendant")
        if "mapEvents" in data and data["mapEvents"] is not None:
            if not isinstance(data["mapEvents"], list):
                raise HTTPException(status_code=400, detail="data.mapEvents 必须为数组")
            res = validate_payload("mapevent", data["mapEvents"])  # type: ignore[arg-type]
            if not res.ok:
                raise HTTPException(status_code=400, detail={"kind": "mapevent", "errors": res.errors})
            has_any = True
            share_kinds.append("mapevent")
        if "beginEffects" in data and data["beginEffects"] is not None:
            if not isinstance(data["beginEffects"], list):
                raise HTTPException(status_code=400, detail="data.beginEffects 必须为数组")
            res = validate_payload("begineffect", data["beginEffects"])  # type: ignore[arg-type]
            if not res.ok:
                raise HTTPException(status_code=400, detail={"kind": "begineffect", "errors": res.errors})
            has_any = True
            share_kinds.append("begineffect")
        if not has_any:
            raise HTTPException(status_code=400, detail="data 至少包含一个受支持的集合")

    # Normalize write object
    pkg_obj = {
        "meta": {
            "title": title_s,
            "author": author_s,
            "description": description_s,
            "baseDataVersion": (base_ver or "").strip() if isinstance(base_ver, str) else "",
            "createdAt": created_at,
            "mode": mode,
            "kinds": share_kinds,
        }
    }
    if mode == "patch":
        if patches is not None:
            pkg_obj["patches"] = patches
        else:
            pkg_obj["patch"] = patch
    else:
        pkg_obj["data"] = {k: v for k, v in data.items() if k in ("cards", "pendants", "mapEvents", "beginEffects") and v is not None}

    # Persist
    idx = _load_index()
    existing_ids = {it["id"] for it in idx.get("items", [])}
    share_id = _gen_id(existing_ids)
    raw_text = json.dumps(pkg_obj, ensure_ascii=False, indent=2)
    _ensure_store()
    fpath = STORE_DIR / f"{share_id}.json"
    fpath.write_text(raw_text, encoding="utf-8")
    size = fpath.stat().st_size

    # Management token (hash stored in index only)
    manage_token = secrets.token_urlsafe(18)
    token_hash = _hash_token(manage_token)

    entry = {
        "id": share_id,
        "title": pkg_obj["meta"]["title"],
        "author": pkg_obj["meta"].get("author", ""),
        "description": pkg_obj["meta"].get("description", ""),
        "baseDataVersion": pkg_obj["meta"].get("baseDataVersion", ""),
        "createdAt": created_at,
        "size": size,
        "downloads": 0,
        "tokenHash": token_hash,
        "mode": mode,
        "kinds": share_kinds,
    }

    items: List[Dict[str, Any]] = idx.get("items", [])
    items.append(entry)
    # Cap total items to prevent unbounded growth
    MAX_ITEMS = 1000
    if len(items) > MAX_ITEMS:
        # delete oldest files beyond cap
        items.sort(key=lambda x: x.get("createdAt", ""))
        to_remove = items[:-MAX_ITEMS]
        for it in to_remove:
            try:
                (STORE_DIR / f"{it['id']}.json").unlink(missing_ok=True)
            except Exception:
                pass
        items = items[-MAX_ITEMS:]
    # Persist index
    idx["items"] = items
    _save_index(idx)

    return {
        "id": share_id,
        "url": f"/api/share/{share_id}",
        "manageToken": manage_token,
    }


@router.get("")
def list_shares(q: Optional[str] = Query(None), limit: int = Query(30, ge=1, le=200)) -> Dict[str, Any]:
    idx = _load_index()
    items: List[Dict[str, Any]] = idx.get("items", [])
    # filter and sort by createdAt desc
    if q:
        qs = q.lower()
        items = [it for it in items if qs in str(it.get("title", "")).lower()]
    items.sort(key=lambda x: x.get("createdAt", ""), reverse=True)
    # enrich description from file if not present, and strip tokenHash
    out: List[Dict[str, Any]] = []
    for it in items[:limit]:
        safe = {k: v for k, v in it.items() if k != "tokenHash"}
        desc = safe.get("description")
        if not desc:
            try:
                with (STORE_DIR / f"{it['id']}.json").open("r", encoding="utf-8") as f:
                    obj = json.load(f)
                    meta = obj.get("meta") or {}
                    desc = meta.get("description") or meta.get("note") or ""
            except Exception:
                desc = ""
            safe["description"] = desc
        out.append(safe)
    return {"items": out}


@router.get("/{share_id}")
def get_share(share_id: str) -> JSONResponse:
    _ensure_valid_id(share_id)
    fpath = STORE_DIR / f"{share_id}.json"
    if not fpath.exists():
        raise HTTPException(status_code=404, detail="未找到分享")

    # read content
    with fpath.open("r", encoding="utf-8") as f:
        obj = json.load(f)

    # bump downloads (best-effort)
    try:
        idx = _load_index()
        changed = False
        for it in idx.get("items", []):
            if it.get("id") == share_id:
                it["downloads"] = int(it.get("downloads", 0)) + 1
                changed = True
                break
        if changed:
            _save_index(idx)
    except Exception:
        pass

    return JSONResponse(content=obj)


@router.delete("/{share_id}")
def delete_share(share_id: str, manageToken: Optional[str] = Query(None)) -> Dict[str, Any]:
    _ensure_valid_id(share_id)
    token = manageToken
    if not token:
        raise HTTPException(status_code=400, detail="缺少 manageToken")
    idx = _load_index()
    items: List[Dict[str, Any]] = idx.get("items", [])
    pos = None
    for i, it in enumerate(items):
        if it.get("id") == share_id:
            pos = i
            if it.get("tokenHash") != _hash_token(token):
                raise HTTPException(status_code=403, detail="无权限删除该分享")
            break
    if pos is None:
        raise HTTPException(status_code=404, detail="未找到分享")

    # remove file and index entry
    try:
        (STORE_DIR / f"{share_id}.json").unlink(missing_ok=True)
    except Exception:
        pass
    del items[pos]
    idx["items"] = items
    _save_index(idx)
    return {"ok": True}
