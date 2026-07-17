import time
from database import SessionLocal
from services.candle_service import save_candle

# store candle per symbol
candle_store = {}

CANDLE_DURATION = 60  # 1 minute


def process_tick(symbol: str, price: float):
    now = time.time()

    # first time
    if symbol not in candle_store:
        candle_store[symbol] = {
            "start_time": now,
            "open": price,
            "high": price,
            "low": price,
            "close": price,
            "volume": 1
        }
        return

    candle = candle_store[symbol]

    # update candle
    candle["high"] = max(candle["high"], price)
    candle["low"] = min(candle["low"], price)
    candle["close"] = price
    candle["volume"] += 1

    # 🔥 check time-based close
    if now - candle["start_time"] >= CANDLE_DURATION:
        db = SessionLocal()
        try:
            save_candle(
                db,
                symbol,
                "1m",
                candle["open"],
                candle["high"],
                candle["low"],
                candle["close"],
                candle["volume"]
            )

            print(f"✅ Time-based candle saved for {symbol}")

        finally:
            db.close()

        # reset new candle
        candle_store[symbol] = {
            "start_time": now,
            "open": price,
            "high": price,
            "low": price,
            "close": price,
            "volume": 1
        }