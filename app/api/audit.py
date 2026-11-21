from fastapi import APIRouter, Depends
from app.auth import get_current_user_and_session
from app.database import get_db_connection

router = APIRouter(prefix="/api/audit", tags=["audit"])

@router.get("")
async def get_audit_logs(limit: int = 100, offset: int = 0, session: dict = Depends(get_current_user_and_session)):
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
    rows = cursor.fetchall()
    
    cursor.execute("SELECT COUNT(*) as count FROM audit_log")
    total = cursor.fetchone()["count"]
    conn.close()

    return {
        "entries": [dict(r) for r in rows],
        "total": total,
        "limit": limit,
        "offset": offset
    }
