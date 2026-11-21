import asyncio
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.auth import get_current_user_and_session
from app.config import MINECRAFT_DATA_DIR

router = APIRouter(prefix="/api/logs", tags=["logs"])

LOG_PATH = MINECRAFT_DATA_DIR / "logs" / "latest.log"

@router.get("/tail")
async def get_log_tail(session: dict = Depends(get_current_user_and_session), lines: int = 500):
    """Returns the last N lines (default 500) from latest.log"""
    if not LOG_PATH.exists():
        return {"lines": ["[No logs yet. Server has not generated latest.log]"], "total": 0}

    try:
        with open(LOG_PATH, "r", encoding="utf-8", errors="replace") as f:
            all_lines = f.readlines()
            tail_lines = [line.rstrip("\r\n") for line in all_lines[-lines:]]
            return {"lines": tail_lines, "total": len(tail_lines)}
    except Exception as e:
        return {"lines": [f"[Error reading log file: {e}]"], "total": 1}

@router.get("/stream")
async def stream_logs(session: dict = Depends(get_current_user_and_session)):
    """Server-Sent Events (SSE) live follow of latest.log"""
    async def log_generator():
        # Open file and seek to end
        if not LOG_PATH.exists():
            yield "data: [Log file does not exist yet]\n\n"
            return

        with open(LOG_PATH, "r", encoding="utf-8", errors="replace") as f:
            f.seek(0, 2)  # Seek to end
            while True:
                line = f.readline()
                if line:
                    clean = line.rstrip("\r\n").replace("\n", " ")
                    yield f"data: {clean}\n\n"
                else:
                    await asyncio.sleep(0.5)

    return StreamingResponse(log_generator(), media_type="text/event-stream")
