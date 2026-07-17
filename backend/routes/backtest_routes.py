from fastapi import APIRouter
from services.market_service import get_historical_price
from services.backtest_service import run_backtest

router = APIRouter(prefix="/backtest", tags=["Backtesting"])


@router.get("/{symbol}")

def backtest(symbol: str):
    prices = get_historical_price(symbol)

    if not prices:
        return {"error": "No price data"}
    result = run_backtest(symbol, prices)

    return result