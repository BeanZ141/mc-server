from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.rcon_client import rcon_client
from app.database import log_audit

router = APIRouter(prefix="/api/players", tags=["players"])

class WhitelistAction(BaseModel):
    action: str  # add, remove, on, off
    player: str | None = None

class OpAction(BaseModel):
    action: str  # op, deop
    player: str

class KickAction(BaseModel):
    player: str
    reason: str = "Kicked by admin"

class BanAction(BaseModel):
    player: str
    reason: str = "Banned by admin"

class PardonAction(BaseModel):
    player: str

@router.get("/online")
async def get_online_players(session: dict = Depends(get_current_user_and_session)):
    return await rcon_client.get_online_players()

@router.get("/whitelist")
async def get_whitelist(session: dict = Depends(get_current_user_and_session)):
    try:
        output = await rcon_client.execute("whitelist list")
        # Example: "There are 2 whitelisted players: Steve, Alex"
        return {"output": output}
    except Exception as e:
        return {"output": f"Unavailable: {e}"}

@router.post("/whitelist")
async def modify_whitelist(payload: WhitelistAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = ""
    if payload.action in ("on", "off"):
        cmd = f"whitelist {payload.action}"
    elif payload.action in ("add", "remove") and payload.player:
        cmd = f"whitelist {payload.action} {payload.player}"
    else:
        raise HTTPException(status_code=400, detail="Invalid whitelist action or player.")

    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "whitelist", payload.player or payload.action, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "whitelist", payload.player or payload.action, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ops")
async def modify_ops(payload: OpAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    if payload.action not in ("op", "deop"):
        raise HTTPException(status_code=400, detail="Action must be 'op' or 'deop'.")

    cmd = f"{payload.action} {payload.player}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "op_management", payload.player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "op_management", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/kick")
async def kick_player(payload: KickAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"kick {payload.player} {payload.reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "kick_player", payload.player, payload.reason, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "kick_player", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ban")
async def ban_player(payload: BanAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"ban {payload.player} {payload.reason}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "ban_player", payload.player, payload.reason, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "ban_player", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/unban")
async def unban_player(payload: PardonAction, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = f"pardon {payload.player}"
    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "unban_player", payload.player, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "unban_player", payload.player, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))
