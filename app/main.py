import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.database import init_db
from app.watcher import watcher
from app.config import BASE_DIR, DATA_DIR

# Import routers
from app.api.auth import router as auth_router
from app.api.status import router as status_router
from app.api.control import router as control_router
from app.api.console import router as console_router
from app.api.logs import router as logs_router
from app.api.media import router as media_router
from app.api.settings import router as settings_router
from app.api.mods import router as mods_router
from app.api.backups import router as backups_router
from app.api.players import router as players_router
from app.api.chunky import router as chunky_router
from app.api.audit import router as audit_router
from app.api.analytics import router as analytics_router

STATIC_DIR = Path(__file__).resolve().parent / "static"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure directories and database
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    init_db()
    
    # Check if ADMIN_PASSWORD is provided in environment on first run
    env_admin_pass = os.environ.get("ADMIN_PASSWORD")
    if env_admin_pass:
        from app.auth import is_admin_set_up, setup_admin_password
        if not is_admin_set_up():
            setup_admin_password(env_admin_pass, "env_init")

    watcher.start()
    yield
    # Shutdown
    watcher.stop()

app = FastAPI(
    title="mcadmin.palvi.org",
    version="1.0.0",
    description="LAN-only Minecraft Admin Panel for palviserver",
    lifespan=lifespan
)

# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "same-origin"
    return response

# Mount routers
app.include_router(auth_router)
app.include_router(status_router)
app.include_router(control_router)
app.include_router(console_router)
app.include_router(logs_router)
app.include_router(media_router)
app.include_router(settings_router)
app.include_router(mods_router)
app.include_router(backups_router)
app.include_router(players_router)
app.include_router(chunky_router)
app.include_router(audit_router)
app.include_router(analytics_router)

# Healthz endpoint for Uptime Kuma
@app.get("/healthz")
async def healthz():
    return {"status": "ok", "app": "mcadmin.palvi.org"}

# Mount static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")

@app.get("/")
async def root():
    index_file = STATIC_DIR / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return JSONResponse({"status": "running", "message": "UI assets under construction"})
