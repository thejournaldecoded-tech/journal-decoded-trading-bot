from fastapi import APIRouter
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
import joblib

router = APIRouter()

@router.get("/train")
def train_model():
    try:
        df = pd.read_csv("dataset.csv")

        if len(df) < 50:
            return {"error": "Not enough data to train"}

        X = df[["rsi", "ema_fast", "ema_slow", "momentum"]]
        y = df["label"]

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )

        model = RandomForestClassifier()
        model.fit(X_train, y_train)

        accuracy = model.score(X_test, y_test)

        joblib.dump(model, "model.pkl")

        return {
            "status": "trained",
            "accuracy": round(accuracy * 100, 2),
            "rows_used": len(df)
        }

    except Exception as e:
        return {"error": str(e)}
    

from services.market_service import get_historical_price
from services.feature_service import build_features
from services.dataset_service import save_row, generate_label

@router.get("/seed")
def seed_data():

    symbol = "BTCUSDT"
    candles = get_historical_price(symbol, limit=200, interval="1m")

    if not candles:
        return {"error": "No historical data"}

    features_list = build_features(candles)

    if not features_list or len(features_list) < 2:
        return {"error": "Not enough features"}

    count = 0

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

        save_row(row)
        count += 1

    return {"status": "seeded", "rows_added": count}

@router.get("/seed/{symbol}")
def seed_symbol_data(symbol: str):
    
    candles = get_historical_price(symbol.upper(), limit=200, interval="1m")

    if not candles:
        return {"error": "No historical data"}

    features_list = build_features(candles)

    if not features_list or len(features_list) < 2:
        return {"error": "Not enough features"}

    count = 0

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

        save_row(row)
        count += 1

    return {"status": "seeded", "symbol": symbol.upper(), "rows_added": count}

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

        save_row(row)
        count += 1

    return {"status": "seeded", "rows_added": count}