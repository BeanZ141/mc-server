import json
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field
from app.auth import get_current_user_and_session
from app.config import get_mc_watch_state_path
from app.docker_client import docker_client
from app.helper_client import helper_client
from app.database import log_audit

router = APIRouter(prefix="/api/media", tags=["media"])
logger = logging.getLogger("media_api")

_WATCH_STATE_CACHE: dict = {"key": None, "data": None}


def read_mc_watch_state() -> dict:
    """Reads mc-watch state JSON cleanly, cached by path + mtime_ns."""
    default_state = {
        "mc": "stopped",
        "media": "running",
        "media_start_at": None,
        "grace": 300
    }
    state_path = get_mc_watch_state_path()
    if not state_path.exists():
        return default_state
    try:
        stat = state_path.stat()
        cache_key = (str(state_path), stat.st_mtime_ns, stat.st_size)
        if _WATCH_STATE_CACHE["key"] == cache_key and isinstance(_WATCH_STATE_CACHE["data"], dict):
            return dict(_WATCH_STATE_CACHE["data"])
        content = state_path.read_text(encoding="utf-8")
        parsed = json.loads(content)
        if isinstance(parsed, dict):
            merged = {**default_state, **parsed}
            _WATCH_STATE_CACHE["key"] = cache_key
            _WATCH_STATE_CACHE["data"] = merged
            return dict(merged)
    except Exception as e:
        logger.error(f"Error reading {state_path}: {e}")
    return default_state


class SetGraceRequest(BaseModel):
    grace: int = Field(..., ge=60, le=3600, description="Grace period in seconds (60-3600)")


@router.get("/status")
async def get_media_status(session: dict = Depends(get_current_user_and_session)):
    """
    Returns:
    - mc_watch state: mc state, media state, media_start_at countdown, grace value
    - per-container status: jellyfin, sonarr, radarr, etc. (Up or Exited)
    """
    state_data = read_mc_watch_state()

    # Fetch status of media containers via docker socket proxy
    containers = await docker_client.get_media_status()

    return {
        "watch_state": state_data,
        "containers": containers
    }

@router.post("/set-grace")
async def set_grace(payload: SetGraceRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    success, output = await helper_client.execute_and_collect("set-grace", str(payload.grace))
    if not success:
        log_audit("admin", "set_grace", "mc-watch", f"Failed to set grace to {payload.grace}s ({output})", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Helper failed: {output}")

    log_audit("admin", "set_grace", "mc-watch", f"Grace set to {payload.grace}s", "SUCCESS", client_ip)
    return {"success": True, "grace": payload.grace, "output": output}

@router.post("/start-now")
async def start_media_now(request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    success, output = await helper_client.execute_and_collect("start-media")
    if not success:
        log_audit("admin", "start_media_now", "media", f"Failed ({output})", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=f"Helper failed: {output}")

    log_audit("admin", "start_media_now", "media", "Triggered start-media now", "SUCCESS", client_ip)
    return {"success": True, "output": output}
