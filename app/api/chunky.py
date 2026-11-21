from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.rcon_client import rcon_client
from app.database import log_audit

router = APIRouter(prefix="/api/chunky", tags=["chunky"])

class ChunkyCommandRequest(BaseModel):
    action: str  # start, pause, continue, cancel, progress, radius, shape
    param: str | None = None

@router.post("/command")
async def execute_chunky(payload: ChunkyCommandRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    
    cmd = f"chunky {payload.action}"
    if payload.param:
        cmd += f" {payload.param}"

    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "chunky", payload.action, cmd, "SUCCESS", client_ip)
        return {"success": True, "output": output}
    except Exception as e:
        log_audit("admin", "chunky", payload.action, f"Error: {e}", "FAILURE", client_ip)
        raise HTTPException(status_code=500, detail=str(e))
