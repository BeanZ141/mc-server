from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.settings_manager import settings_manager
from app.helper_client import helper_client
from app.rcon_client import rcon_client
from app.database import log_audit

router = APIRouter(prefix="/api/settings", tags=["settings"])

class DiffRequest(BaseModel):
    raw_content: str | None = None
    updates: dict[str, str] | None = None

class ApplyRequest(BaseModel):
    raw_content: str | None = None
    updates: dict[str, str] | None = None
    force: bool = False

@router.get("")
async def get_settings(session: dict = Depends(get_current_user_and_session)):
    return settings_manager.get_structured_settings()

@router.post("/diff")
async def get_settings_diff(payload: DiffRequest, session: dict = Depends(get_current_user_and_session)):
    new_content = ""
    if payload.raw_content is not None:
        valid, msg = settings_manager.validate_raw(payload.raw_content)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        new_content = payload.raw_content
    elif payload.updates is not None:
        valid, msg = settings_manager.validate_settings(payload.updates)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        
        # Merge updates with current
        current = settings_manager.parse_env()
        current.update(payload.updates)
        lines = [f"{k}={v}" for k, v in current.items()]
        new_content = "\n".join(lines) + "\n"
    else:
        raise HTTPException(status_code=400, detail="Provide raw_content or updates dict.")

    diff_text = settings_manager.generate_diff(new_content)
    return {"diff": diff_text, "new_content": new_content}

@router.post("/apply")
async def apply_settings(payload: ApplyRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
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
            "message": f"There are {len(players_online)} player(s) online: {', '.join(players_online)}. Applying settings recreates the server."
        }

    # Determine content to save
    if payload.raw_content is not None:
        valid, msg = settings_manager.validate_raw(payload.raw_content)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        target_content = payload.raw_content
    elif payload.updates is not None:
        valid, msg = settings_manager.validate_settings(payload.updates)
        if not valid:
            raise HTTPException(status_code=400, detail=msg)
        current = settings_manager.parse_env()
        current.update(payload.updates)
        lines = [f"{k}={v}" for k, v in current.items()]
        target_content = "\n".join(lines) + "\n"
    else:
        raise HTTPException(status_code=400, detail="No content provided to apply.")

    # Save and write backup
    backup_file = settings_manager.save_with_backup(target_content)

    # Run recreate-mc helper action
    success, output = await helper_client.execute_and_collect("recreate-mc")

    if not success:
        log_audit("admin", "apply_settings", "mc.env", f"Settings applied but recreate failed: {output}", "FAILURE", client_ip)
        return {
            "success": False,
            "backup_file": backup_file,
            "message": f"Settings saved to {backup_file}, but recreate-mc encountered an error.",
            "output": output
        }

    log_audit("admin", "apply_settings", "mc.env", f"Applied settings and recreated mc (backup: {backup_file})", "SUCCESS", client_ip)
    return {
        "success": True,
        "backup_file": backup_file,
        "message": "Settings applied successfully and server safely transitioned to asleep.",
        "output": output
    }
