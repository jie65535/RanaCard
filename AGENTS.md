# RanaCard Assistant – Project Guide for Agents

A single, practical reference for agents and contributors to understand, run, and extend this project. Reading this file alone should give enough context to get productive quickly.

## 1. Architecture at a Glance
- SPA frontend (Vue 3 + Vite + TypeScript + Pinia + Element Plus).
- FastAPI backend (Python) serving JSON APIs: baseline/data, validate, encode/decode, share, patch.
- No database. Shares are JSON files under `server/uploads/share` tracked by `index.json`.
- All cryptography lives only on the server (`server/services/crypto.py`). The UI never handles keys or algorithms.
- Game data is edited relative to official baselines in `Data/`, then exported back to the game.

## 2. Repository Layout
- `ui/` Frontend (Vite build to `ui/dist/`).
- `server/` Backend (FastAPI, routers, crypto).
- `Data/` Official baseline JSON files.
- `deploy/nginx/` Nginx config for production.
- `docker-compose.yml` Web + API orchestration.

## 3. Run & Build
- Backend (dev)
  - `cd server && pip install -r requirements.txt && uvicorn main:app --reload`
- Frontend (dev)
  - `cd ui && npm i && npm run dev`
  - If API is not same-origin, set `VITE_API_BASE` in `ui/.env` (e.g. `http://127.0.0.1:8000`).
- Production (Docker)
  - Repo root: `docker compose up -d --build` (binds `127.0.0.1:8080`).
- Validate before encode/export
  - `POST /api/validate?kind=card|pendant|mapevent|begineffect` (kinds below).

## 4. Data Model (ID‑Addressable Kinds)
Patch support targets kinds that can be addressed by stable IDs:
- `card` → `Data/Card.json`: `{ Name: string, Cards: Array<{ ID: string, ... }> }`
- `pendant` → `Data/Pendant.json`: `{ Name: string, Pendant: Array<{ ID: string, ... }> }`
- `disaster` → `Data/Disaster.json`: `{ Name: string, Pendant: Array<{ ID: string, ... }> }` (backend baseline supported)
- `mapevent` → `Data/MapEvent.json`: `Array<{ ID: string, Name?, LimitStage?, Character?, Content?, Choices?: Array<{ Description?, Effect? }> }>`
- `begineffect` → `Data/BeginEffect.json`: `Array<{ ID: string, EffectDescription?, EffectString?, UnLocked?, UnlockCondition?, StarCount? }>`

Other files exist in `Data/`, but patching focuses on the kinds above.

## 5. Patch‑Only Sharing (Core Design)
All change sharing uses patches (diffs). Whole‑file sharing is not used.

- Patch schema v1
  - Adds: `{ id, data }`
  - Updates: `{ id, fields: { key: { from, to } } }` (shallow field‑level)
  - Deletes: `{ id }`
  - Conflicts: when `from` exists and the current value differs; update is skipped and recorded.
- Multi‑kind sharing
  - A share can carry one `patch` or multiple `patches: Patch[]`, each with `meta.kind`.
- Share storage
  - Catalog: `server/uploads/share/index.json` → `{ items: [{ id, title, author, description, baseDataVersion, createdAt, size, downloads, tokenHash, mode?, kinds? }] }`
  - Payload: `server/uploads/share/<id>.json` → `{ meta, patch }` or `{ meta, patches }`.
- Migration
  - On server startup, legacy whole‑data shares are auto‑migrated to patch‑only (`patch`/`patches`). Flag file: `server/uploads/share/migrated_v1.flag`.

## 6. Backend API
- Health: `GET /api/health` → `{ ok: true }`
- Baseline/Data: `GET /api/baseline/{kind}` and `GET /api/data/{kind}` (kinds: `card|pendant|mapevent|begineffect|disaster`)
- Validate: `POST /api/validate?kind=...` with payload → `{ ok, errors[] }`
- Encode/Decode: `POST /api/encode` with `{ payload }` → encrypted text; `POST /api/decode` (multipart with `file`) → JSON
- Share
  - Create: `POST /api/share` with `{ meta, patch }` or `{ meta, patches }` → `{ id, url, manageToken }`
  - List: `GET /api/share?q&limit` → compact list (without token hash)
  - Get: `GET /api/share/{id}` → full stored object (includes patch/patches)
  - Delete: `DELETE /api/share/{id}?manageToken=`
- Patch
  - Diff: `POST /api/patch/diff?kind=card|pendant|mapevent|begineffect|disaster` with edited dataset → `{ meta, changes }`
  - Apply: `POST /api/patch/apply?kind=...` with `{ patch, target? }` → `{ result, stats, conflicts[] }`

## 7. Frontend Overview
- Store: `ui/src/store/data.ts` (Pinia) keeps `cards`, `pendants`, `mapEvents`, `beginEffects`.
- Views: `CardsView.vue`, `PendantsView.vue`, `MapEventsView.vue`, `BeginEffectsView.vue`, `ShareView.vue`.
- Common components: `components/common/ShareDialog.vue` (single kind), `components/common/GlobalShareDialog.vue` (multi‑kind), `components/common/ErrorAlert.vue`, `components/common/TopNav.vue`.
- Effects editor: `components/effect/*` (e.g., `EffectEditor.vue`, `BuilderDialog.vue`).
- API wrapper: `ui/src/api.ts` → `getData`, `validate`, `encodeEncrypted`, `decodeEncrypted`, `patchDiff`, `patchApply`, `shareCreatePatch`, `shareCreatePatches`, `shareList`, `shareGet`, `shareDelete`.

### UX Flows
- Edit → Validate → Encode/Export → Replace game file.
- Share Changes (single kind) on each edit view → generates patch and publishes.
- Share All Changes (Share page) → aggregates diffs of all loaded kinds and publishes once (multi‑kind patches).
- Import on Share page → choose Replace (apply on baseline) or Merge (apply on current data; conflicts skipped). After applying, export the related `*.json` and replace the game file.
- Patch previews show all additions/updates/deletions; long values compact in UI with hover tooltip for full content.

## 8. Conventions
- Python: PEP 8, 4 spaces, UTF‑8; keep diffs minimal and focused.
- Frontend: TypeScript + Vue SFC; keep user‑facing labels in Chinese; avoid gratuitous complexity.
- JSON: 2‑space indent; preserve key order/casing; avoid schema churn.

## 9. Security
- Never implement crypto in the frontend.
- Keep keys/algorithms in `server/services/crypto.py`.
- Always use backend for encode/decode; never expose keys or intermediate secrets.

## 10. Adding a New Kind (ID‑based)
1) Backend: extend `assets.get_baseline` and validator (if needed).
2) Patch: add the kind to `SUPPORTED_KINDS` and `_kind_shape` in `server/routers/patch.py`.
3) Frontend: add state in `store/data.ts`, load/validate in `api.ts`, and (optionally) a View/editor.
4) Global share/import: include it in `GlobalShareDialog` and handle it in Share import switch.

## 11. Troubleshooting & Tips
- Vite may warn about large chunks in production; acceptable as of now.
- For UI dev against a remote API, set `VITE_API_BASE` to the API origin.
- If a patch applies with conflicts, those fields are skipped; user can resolve manually, then share a new patch.

## 12. Commit & PR Guidelines
- Conventional Commits: `feat(scope): …`, `fix(scope): …`, `chore(scope): …` (e.g., `feat(ui):`, `fix(docker):`).
- PRs: clear description, linked issues, repro steps; include screenshots/GIFs when applicable.
- Never commit build artifacts, secrets, or local env files.

