import numpy as np
from models.candle import Candle
from database import SessionLocal

# ----------------------------
#  RSI CALCULATION
# ----------------------------
def calculate_rsi(closes, period=14):
    if len(closes) < period:
        return None

    gains = []
    losses = []

    for i in range(14, len(closes)):
        diff = closes[i] - closes[i-1]
        if diff >= 0:
            gains.append(diff)
            losses.append(0)
        else:
            gains.append(0)
            losses.append(abs(diff))

    avg_gain = np.mean(gains[-period:])
    avg_loss = np.mean(losses[-period:])

    if avg_loss == 0:
        return 100

    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))

    return round(rsi, 2)


# ----------------------------
#  EMA CALCULATION
# ----------------------------
def calculate_ema(prices, period=10):
    if len(prices) < period:
        return None

    prices = np.array(prices)
    weights = np.exp(np.linspace(-1., 0., period))
    weights /= weights.sum()

    ema = np.convolve(prices, weights, mode='valid')
    return round(ema[-1], 2)

# ----------------------------
#  FETCH CANDLES
# ----------------------------
def get_recent_candles(symbol, limit=50):
    db = SessionLocal()

    candles = db.query(Candle)\
        .filter(Candle.symbol == symbol)\
        .order_by(Candle.timestamp.desc())\
        .limit(limit)\
        .all()

    db.close()

    return list(reversed(candles))



# ----------------------------
#  FEATURE BUILDER
# ----------------------------
def build_features(candles):
    # Handle both candle objects and float prices
    if candles and hasattr(candles[0], 'close'):
        closes = [c.close for c in candles]
    else:
        closes = candles  # Already a list of float prices

    features = []

    for i in range(20, len(closes)):  # need enough history
        subset = closes[:i+1]

        rsi = calculate_rsi(subset)
        ema_fast = calculate_ema(subset, 10)
        ema_slow = calculate_ema(subset, 20)

        ema_signal = 1 if ema_fast > ema_slow else -1

        momentum = subset[-1] - subset[-5] if len(subset) >= 5 else 0

        features.append({
            "close": subset[-1],
            "rsi": rsi,
            "ema_fast": ema_fast,
            "ema_slow": ema_slow,
            "ema_signal": ema_signal,
            "momentum": momentum
        })

    # ✅ DEBUG PRINTS GO HERE 👇
    print("Candles:", len(candles))
    print("Features generated:", len(features))
    print("Last feature sample:", features[-1] if features else None)

    return features

