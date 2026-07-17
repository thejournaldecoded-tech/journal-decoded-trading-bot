from datetime import datetime
from collections import defaultdict

candles = defaultdict(lambda: None)


def update_candle(symbol, price):
    now = datetime.utcnow()

    if candles[symbol] is None:
        candles[symbol] = {
            "open": price,
            "high": price,
            "low": price,
            "close": price,
            "volume": 1,
            "start_time": now
        }
    else:
        candle = candles[symbol]

        candle["high"] = max(candle["high"], price)
        candle["low"] = min(candle["low"], price)
        candle["close"] = price
        candle["volume"] += 1

    return candles[symbol]


def should_close_candle(symbol):
    candle = candles[symbol]
    if candle is None:
        return False

    now = datetime.utcnow()
    return (now - candle["start_time"]).seconds >= 60


def reset_candle(symbol):
    candles[symbol] = None