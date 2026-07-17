from fastapi import APIRouter
from services.feature_service import get_recent_candles, build_features

router = APIRouter()


@router.get("/features/{symbol}")
def features(symbol: str):
    return get_features(symbol.upper())