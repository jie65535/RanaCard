from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Union

from fastapi import APIRouter, HTTPException, UploadFile, File, Response, Body
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api", tags=["assets"])

ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = ROOT / "Data"


def _load_json(path: Path) -> Union[Dict[str, Any], List[Any]]:
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Not found: {path.name}")
    with path.open("rb") as f:
        return json.load(f)


@router.get("/baseline/{kind}")
def get_baseline(kind: str) -> Dict[str, Any]:
    kind_l = kind.lower()
    if kind_l == "card":
        return _load_json(DATA_DIR / "Card.json")
    if kind_l == "pendant":
        return _load_json(DATA_DIR / "Pendant.json")
    if kind_l == "mapevent":
        return _load_json(DATA_DIR / "MapEvent.json")
    if kind_l == "begineffect":
        return _load_json(DATA_DIR / "BeginEffect.json")
    raise HTTPException(status_code=400, detail="kind must be 'card' or 'pendant' or 'mapevent' or 'begineffect'")


@router.get("/data/{kind}")
def get_data(kind: str) -> Union[Dict[str, Any], List[Any]]:
    return get_baseline(kind)


class ValidateResult(BaseModel):
    ok: bool
    errors: List[str] = Field(default_factory=list)


@router.post("/validate", response_model=ValidateResult)
def validate_payload(kind: str, payload: Any = Body(...)) -> ValidateResult:
    kind_l = kind.lower()
    errors: List[str] = []

    if kind_l == "card":
        root_name = payload.get("Name")
        cards = payload.get("Cards")
        if not isinstance(root_name, str):
            errors.append("Name must be string")
        if not isinstance(cards, list):
            errors.append("Cards must be list")
        else:
            ids = set()
            for i, c in enumerate(cards):
                if not isinstance(c, dict):
                    errors.append(f"Cards[{i}] must be object")
                    continue
                cid = c.get("ID")
                if not isinstance(cid, str) or not cid:
                    errors.append(f"Cards[{i}].ID required")
                elif cid in ids:
                    errors.append(f"Duplicate ID: {cid}")
                else:
                    ids.add(cid)
                name = c.get("Name")
                if name is not None and not isinstance(name, str):
                    errors.append(f"Cards[{i}].Name must be string")
                level = c.get("Level")
                if level is not None and not isinstance(level, int):
                    errors.append(f"Cards[{i}].Level must be int")

    elif kind_l == "pendant":
        root_name = payload.get("Name")
        items = payload.get("Pendant")
        if not isinstance(root_name, str):
            errors.append("Name must be string")
        if not isinstance(items, list):
            errors.append("Pendant must be list")
        else:
            ids = set()
            for i, p in enumerate(items):
                if not isinstance(p, dict):
                    errors.append(f"Pendant[{i}] must be object")
                    continue
                pid = p.get("ID")
                if not isinstance(pid, str) or not pid:
                    errors.append(f"Pendant[{i}].ID required")
                elif pid in ids:
                    errors.append(f"Duplicate ID: {pid}")
                else:
                    ids.add(pid)
                name = p.get("Name")
                if name is not None and not isinstance(name, str):
                    errors.append(f"Pendant[{i}].Name must be string")
                level = p.get("Level")
                if level is not None and not isinstance(level, int):
                    errors.append(f"Pendant[{i}].Level must be int")
    elif kind_l == "mapevent":
        items = payload if isinstance(payload, list) else None
        if items is None:
            errors.append("payload must be an array of events")
        else:
            ids = set()
            for i, ev in enumerate(items):
                if not isinstance(ev, dict):
                    errors.append(f"[{i}] must be object")
                    continue
                eid = ev.get("ID")
                if not isinstance(eid, str) or not eid:
                    errors.append(f"[{i}].ID required")
                elif eid in ids:
                    errors.append(f"Duplicate ID: {eid}")
                else:
                    ids.add(eid)
                name = ev.get("Name")
                if name is not None and not isinstance(name, str):
                    errors.append(f"[{i}].Name must be string")
                limit = ev.get("LimitStage")
                if limit is not None and not isinstance(limit, int):
                    errors.append(f"[{i}].LimitStage must be int")
                character = ev.get("Character")
                if character is not None and not isinstance(character, str):
                    errors.append(f"[{i}].Character must be string")
                content = ev.get("Content")
                if content is not None and not isinstance(content, str):
                    errors.append(f"[{i}].Content must be string")
                choices = ev.get("Choices")
                if choices is not None and not isinstance(choices, list):
                    errors.append(f"[{i}].Choices must be list")
                elif isinstance(choices, list):
                    for j, ch in enumerate(choices):
                        if not isinstance(ch, dict):
                            errors.append(f"[{i}].Choices[{j}] must be object")
                            continue
                        desc = ch.get("Description")
                        eff = ch.get("Effect")
                        if desc is not None and not isinstance(desc, str):
                            errors.append(f"[{i}].Choices[{j}].Description must be string")
                        if eff is not None and not isinstance(eff, str):
                            errors.append(f"[{i}].Choices[{j}].Effect must be string")
    elif kind_l == "begineffect":
        items = payload if isinstance(payload, list) else None
        if items is None:
            errors.append("payload must be an array of begin effects")
        else:
            ids = set()
            for i, it in enumerate(items):
                if not isinstance(it, dict):
                    errors.append(f"[{i}] must be object")
                    continue
                eid = it.get("ID")
                if not isinstance(eid, str) or not eid:
                    errors.append(f"[{i}].ID required")
                elif eid in ids:
                    errors.append(f"Duplicate ID: {eid}")
                else:
                    ids.add(eid)
                edesc = it.get("EffectDescription")
                if edesc is not None and not isinstance(edesc, str):
                    errors.append(f"[{i}].EffectDescription must be string")
                estr = it.get("EffectString")
                if estr is not None and not isinstance(estr, str):
                    errors.append(f"[{i}].EffectString must be string")
                unlocked = it.get("UnLocked")
                if unlocked is not None and not isinstance(unlocked, int):
                    errors.append(f"[{i}].UnLocked must be int")
                cond = it.get("UnlockCondition")
                if cond is not None and not isinstance(cond, str):
                    errors.append(f"[{i}].UnlockCondition must be string")
                star = it.get("StarCount")
                if star is not None and not isinstance(star, int):
                    errors.append(f"[{i}].StarCount must be int")
    else:
        errors.append("kind must be 'card' or 'pendant' or 'mapevent' or 'begineffect'")

    return ValidateResult(ok=len(errors) == 0, errors=errors)


# --- Encode/Decode (server-side secrets) ---


def _decrypt_text(enc_text: str) -> str:
    # Local import to keep dependency optional outside server
    from services.crypto import decrypt_text

    return decrypt_text(enc_text)


def _encrypt_text(json_text: str) -> str:
    from services.crypto import encrypt_text

    return encrypt_text(json_text)


@router.post("/decode")
async def decode_encrypted(file: UploadFile = File(...)) -> Dict[str, Any]:
    text = (await file.read()).decode("utf-8")
    try:
        plain = _decrypt_text(text)
        data = json.loads(plain)
        return data
    except Exception as e:  # noqa: PIE786
        raise HTTPException(status_code=400, detail=f"解密失败: {e}")


class EncodeBody(BaseModel):
    # Accept dict or list payloads
    payload: Any


@router.post("/encode")
def encode_encrypted(body: EncodeBody) -> Response:
    try:
        text = json.dumps(body.payload, ensure_ascii=False)
        enc = _encrypt_text(text)
        return Response(content=enc, media_type="text/plain; charset=utf-8")
    except Exception as e:  # noqa: PIE786
        raise HTTPException(status_code=400, detail=f"加密失败: {e}")
