from fastapi import APIRouter, Depends, Request, HTTPException
from pydantic import BaseModel
from app.auth import get_current_user_and_session
from app.rcon_client import rcon_client
from app.database import log_audit

router = APIRouter(prefix="/api/console", tags=["console"])

class CommandRequest(BaseModel):
    command: str

@router.post("/execute")
async def execute_console_command(payload: CommandRequest, request: Request, session: dict = Depends(get_current_user_and_session)):
    client_ip = request.client.host if request.client else "unknown"
    cmd = payload.command.strip()
    if not cmd:
        raise HTTPException(status_code=400, detail="Command cannot be empty.")

    # Remove leading slash if provided
    if cmd.startswith("/"):
        cmd = cmd[1:]

    try:
        output = await rcon_client.execute(cmd)
        log_audit("admin", "console_command", None, f"Executed: {cmd}", "SUCCESS", client_ip)
        return {"success": True, "command": cmd, "output": output}
    except Exception as e:
        log_audit("admin", "console_command", None, f"Failed: {cmd} ({e})", "FAILURE", client_ip)
        return {"success": False, "command": cmd, "output": f"Error: {str(e)}"}
