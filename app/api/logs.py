import os
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
    """Server-Sent Events (SSE) live follow of latest.log surviving rotation and truncation."""
    async def log_generator():
        f = None
        current_ino = None
        try:
            while True:
                if not LOG_PATH.exists():
                    if f:
                        try:
                            f.close()
                        except Exception:
                            pass
                        f = None
                        current_ino = None
                    await asyncio.sleep(0.5)
                    continue

                try:
                    stat = os.stat(LOG_PATH)
                except OSError:
                    await asyncio.sleep(0.5)
                    continue

                if f is None:
                    try:
                        f = open(LOG_PATH, "r", encoding="utf-8", errors="replace")
                        current_ino = stat.st_ino
                        f.seek(0, 2)
                    except OSError:
                        await asyncio.sleep(0.5)
                        continue

                if stat.st_ino != current_ino:
                    try:
                        f.close()
                    except Exception:
                        pass
                    try:
                        f = open(LOG_PATH, "r", encoding="utf-8", errors="replace")
                        current_ino = stat.st_ino
                        f.seek(0, 0)
                    except OSError:
                        f = None
                        current_ino = None
                        await asyncio.sleep(0.5)
                        continue

                current_offset = f.tell()
                if stat.st_size < current_offset:
                    f.seek(0, 0)

                lines_read = 0
                while True:
                    line = f.readline()
                    if not line:
                        break
                    lines_read += 1
                    clean = line.rstrip("\r\n").replace("\n", " ")
                    yield f"data: {clean}\n\n"

                if lines_read == 0:
                    await asyncio.sleep(0.5)
        finally:
            if f:
                try:
                    f.close()
                except Exception:
                    pass

    return StreamingResponse(log_generator(), media_type="text/event-stream")
