import asyncio
from fastapi import APIRouter, Depends
from app.auth import get_current_user_and_session
from app.database import get_db_connection

router = APIRouter(prefix="/api/audit", tags=["audit"])


def _query_audit_sync(limit: int, offset: int) -> dict:
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        """
        SELECT id, timestamp, user, action, target, details, result, ip_address
        FROM audit_log
        ORDER BY id DESC
        LIMIT ? OFFSET ?
        """,
        (limit, offset)
    )
    rows = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT COUNT(*) as count FROM audit_log")
    total = cursor.fetchone()["count"]
    conn.close()

    return {
        "entries": rows,
        "total": total,
        "limit": limit,
        "offset": offset
    }


@router.get("")
async def get_audit_logs(limit: int = 100, offset: int = 0, session: dict = Depends(get_current_user_and_session)):
    clamped_limit = max(1, min(limit, 500))
    clamped_offset = max(0, offset)
    return await asyncio.to_thread(_query_audit_sync, clamped_limit, clamped_offset)
