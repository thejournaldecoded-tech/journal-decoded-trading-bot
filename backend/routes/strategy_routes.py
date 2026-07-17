from fastapi import APIRouter
from services.strategy_services import get_strategy_logs

router = APIRouter(prefix="/strategy", tags=["Strategy"])

@router.get("/logs/{user_id}")
def strategy_logs(user_id: int):

    logs = get_strategy_logs(user_id)

    return {
        "user_id": user_id,
        "logs": logs
    }