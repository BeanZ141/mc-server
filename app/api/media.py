import json
import logging
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel, Field
from app.auth import get_current_user_and_session
from app.config import MC_WATCH_STATE_PATH
from app.docker_client import docker_client
from app.helper_client import helper_client
from app.database import log_audit

router = APIRouter(prefix="/api/media", tags=["media"])
logger = logging.getLogger("media_api")

class SetGraceRequest(BaseModel):
    grace: int = Field(..., ge=60, le=3600, description="Grace period in seconds (60-3600)")

@router.get("/status")
async def get_media_status(session: dict = Depends(get_current_user_and_session)):
    """
    Returns:
    - mc_watch state: mc state, media state, media_start_at countdown, grace value
    - per-container status: jellyfin, sonarr, radarr, etc. (Up or Exited)
    """
    state_data = {
        "mc": "stopped",
        "media": "running",
        "media_start_at": None,
        "grace": 300
    }

    if MC_WATCH_STATE_PATH.exists():
        try:
            content = MC_WATCH_STATE_PATH.read_text(encoding="utf-8")
            state_data = json.loads(content)
        except Exception as e:
            logger.error(f"Error reading {MC_WATCH_STATE_PATH}: {e}")

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
