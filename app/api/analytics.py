from fastapi import APIRouter, Depends
from app.auth import get_current_user_and_session
from app.database import get_analytics_data

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("")
async def get_analytics(session: dict = Depends(get_current_user_and_session), hours: int = 24):
    """
    Returns 24h/7d uptime analytics, average TPS, peak players,
    hourly availability blocks, and timeline samples for charting.
    """
    return get_analytics_data(hours=hours)
