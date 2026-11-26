import os
import asyncio
from pathlib import Path
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from app.auth import get_current_user_and_session
from app.config import get_minecraft_data_dir

router = APIRouter(prefix="/api/logs", tags=["logs"])


def _get_log_path() -> Path:
    return get_minecraft_data_dir() / "logs" / "latest.log"


def _read_tail_sync(lines: int) -> dict:
    log_path = _get_log_path()
    if not log_path.exists():
        return {"lines": ["[No logs yet. Server has not generated latest.log]"], "total": 0}

    try:
        file_size = log_path.stat().st_size
        # Read at most max(64KB, lines * 512 bytes) from end of file for bounded memory use
        read_window = max(65536, lines * 512)
        with open(log_path, "rb") as f:
            if file_size > read_window:
                f.seek(file_size - read_window)
                # Drop partial first line
                f.readline()
            chunk = f.read().decode("utf-8", errors="replace")
        all_lines = chunk.splitlines()
        tail_lines = all_lines[-lines:] if lines > 0 else all_lines
        return {"lines": tail_lines, "total": len(tail_lines)}
    except Exception as e:
        return {"lines": [f"[Error reading log file: {e}]"], "total": 1}


@router.get("/tail")
async def get_log_tail(session: dict = Depends(get_current_user_and_session), lines: int = 500):
    """Returns the last N lines (default 500) from latest.log"""
    clamped = max(1, min(lines, 5000))
    return await asyncio.to_thread(_read_tail_sync, clamped)


@router.get("/stream")
async def stream_logs(session: dict = Depends(get_current_user_and_session)):
    """Server-Sent Events (SSE) live follow of latest.log surviving rotation and truncation."""
    async def log_generator():
        f = None
        current_ino = None
        try:
            while True:
                log_path = _get_log_path()
                if not log_path.exists():
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
                    stat = os.stat(log_path)
                except OSError:
                    await asyncio.sleep(0.5)
                    continue

                if f is None:
                    try:
                        f = open(log_path, "r", encoding="utf-8", errors="replace")
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
                        f = open(log_path, "r", encoding="utf-8", errors="replace")
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
