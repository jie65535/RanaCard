from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.assets import router as assets_router
from routers.share import router as share_router
from routers.share import run_migration
from routers.patch import router as patch_router


app = FastAPI(title="种呱得呱助手 API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(assets_router)
app.include_router(share_router)
app.include_router(patch_router)

# Migrate legacy shares to patch format on startup (best-effort)
try:
    run_migration()
except Exception:
    pass


@app.get("/api/health")
def health():
    return {"ok": True}


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
