from fastapi import APIRouter, Depends
from services.analytics_service import get_trade_analytics
from utils.dependencies import get_current_user

router = APIRouter()

@router.get("/analytics")
def trade_analytics(user_id: int = Depends(get_current_user)):
    """
    Returns trade analytics for the logged-in user.
    """
    return get_trade_analytics(user_id)