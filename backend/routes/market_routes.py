from fastapi import APIRouter
from services.market_service import get_current_price , get_historical_price
from services.strategy_services import generate_signal_from_features
from services.feature_service import build_features, get_recent_candles
from services.dataset_service import save_row, generate_label

router = APIRouter()

@router.get("/price/{symbol}")
def current_price(symbol: str):
    price = get_current_price(symbol)
    if price is None:
        return {"status": "error", "message": "Could not fetch price"}
    return {"status": "success", "symbol": symbol.upper(), "price": price}


# --- New route for algo signals ---
@router.get("/signal/{symbol}")
def get_signal(symbol: str):

    candles = get_recent_candles(symbol.upper(), limit=50)

    if not candles:
        return {"error": "No candle data"}

    features_list = build_features(candles)

    if not features_list:
        return {"error": "No features"}

    signal = generate_signal_from_features(features_list)

    return {
        "status": "success",
        "symbol": symbol.upper(),
        "signal": signal,
        "features": features_list[-1]
    }

@router.get("/features/{symbol}")
def get_features(symbol: str):

    candles = get_recent_candles(symbol.upper(), limit=100)

    if not candles:
        return {"error": "No candle data yet"}

    features_list = build_features(candles)

    if not features_list or len(features_list) < 2:
        return {"error": "Not enough features"}

    rows_to_save = []

    # ✅ Generate labels properly
    for i in range(len(features_list) - 1):
        current = features_list[i]
        next_price = features_list[i + 1]["close"]

        label = generate_label(current["close"], next_price)

        row = {
            "close": float(current["close"]),
            "rsi": float(current["rsi"]),
            "ema_fast": float(current["ema_fast"]),
            "ema_slow": float(current["ema_slow"]),
            "momentum": float(current["momentum"]),
            "label": label
        }

        rows_to_save.append(row)

    # ✅ Save bulk data
    for row in rows_to_save:
        save_row(row)

    latest_feature = features_list[-1]

    return {
        "symbol": symbol.upper(),
        "features": latest_feature
    }