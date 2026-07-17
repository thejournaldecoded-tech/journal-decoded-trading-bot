from fastapi import APIRouter
from services.history_service import get_trade_history

router = APIRouter(prefix="/history", tags=["Trade History"])


@router.get("/{user_id}")
def trade_history(user_id: int):
    return get_trade_history(user_id)