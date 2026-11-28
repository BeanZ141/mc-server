from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.docker_client import docker_client
from app.rcon_client import rcon_client
from app.database import log_audit
from app.api.status import invalidate_status_cache

router = APIRouter(prefix="/api/control", tags=["control"])

class StopRequest(BaseModel):
    force: bool = False

@router.post("/start")
async def start_server(request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    success = await docker_client.start_container("mc")
    if not success:
        log_audit("admin", "start_server", "mc", "Failed to start container", "FAILURE", client_ip)
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Docker proxy ({docker_client.base_url}). If testing locally, the panel must be deployed on palviserver or connected via SSH tunnel."
        )

    invalidate_status_cache()
    log_audit("admin", "start_server", "mc", "Started mc container", "SUCCESS", client_ip)
    return {"success": True, "message": "Minecraft server container started."}

@router.post("/stop")
async def stop_server(payload: StopRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    
    # Check if players are online
    players_online = []
    try:
        player_info = await rcon_client.get_online_players()
        players_online = player_info.get("players", [])
    except Exception:
        pass

    if players_online and not payload.force:
        return {
            "success": False,
            "needs_confirmation": True,
            "players": players_online,
            "message": f"There are {len(players_online)} player(s) online: {', '.join(players_online)}. Confirm stop to proceed."
        }

    # Save world before stopping
    try:
        await rcon_client.save_all_flush()
    except Exception:
        pass

    success = await docker_client.stop_container("mc", timeout=60)
    if not success:
        log_audit("admin", "stop_server", "mc", "Failed to stop container", "FAILURE", client_ip)
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Docker proxy ({docker_client.base_url}). If testing locally, the panel must be deployed on palviserver or connected via SSH tunnel."
        )

    invalidate_status_cache()
    log_audit("admin", "stop_server", "mc", f"Stopped mc container (forced={payload.force})", "SUCCESS", client_ip)
    return {"success": True, "message": "Minecraft server stopped cleanly."}

@router.post("/restart")
async def restart_server(payload: StopRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"

    players_online = []
    try:
        player_info = await rcon_client.get_online_players()
        players_online = player_info.get("players", [])
    except Exception:
        pass

    if players_online and not payload.force:
        return {
            "success": False,
            "needs_confirmation": True,
            "players": players_online,
            "message": f"There are {len(players_online)} player(s) online: {', '.join(players_online)}. Confirm restart to proceed."
        }

    try:
        await rcon_client.save_all_flush()
    except Exception:
        pass

    success = await docker_client.restart_container("mc", timeout=60)
    if not success:
        log_audit("admin", "restart_server", "mc", "Failed to restart container", "FAILURE", client_ip)
        raise HTTPException(
            status_code=503,
            detail=f"Cannot reach Docker proxy ({docker_client.base_url}). If testing locally, the panel must be deployed on palviserver or connected via SSH tunnel."
        )

    invalidate_status_cache()
    log_audit("admin", "restart_server", "mc", "Restarted mc container", "SUCCESS", client_ip)
    return {"success": True, "message": "Minecraft server restarting."}
