import re
from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.rcon_client import rcon_client
from app.database import log_audit

router = APIRouter(prefix="/api/chunky", tags=["chunky"])

_ALLOWED_ACTIONS = {"start", "pause", "continue", "cancel", "progress", "radius", "shape", "world", "center", "quiet"}
_PARAM_RE = re.compile(r"^[a-zA-Z0-9_.: \-]{1,64}$")


class ChunkyCommandRequest(BaseModel):
    action: str
    param: str | None = None


@router.post("/command")
async def execute_chunky(payload: ChunkyCommandRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    action = payload.action.strip().lower()
    if action not in _ALLOWED_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported chunky action: '{payload.action}'")

    cmd = f"chunky {action}"
    if payload.param:
        param = payload.param.strip()
        if not _PARAM_RE.match(param):
            raise HTTPException(status_code=400, detail="Invalid chunky command parameter.")
        cmd += f" {param}"

    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "chunky", action, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "chunky", action, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))
