from typing import List
import pandas as pd
import numpy as np
from database import SessionLocal


def compute_sma(prices: List[float], period: int = 14) -> float:
    """Compute the last SMA value from the list of prices"""
    if len(prices) < period:
        return float(prices[-1])  # fallback if not enough data
    sma_series = pd.Series(prices).rolling(period).mean()
    return float(sma_series.iloc[-1])


def compute_ema(prices: List[float], period: int = 14) -> List[float]:
    """Compute EMA for the given period, return full list aligned with input"""
    prices = np.array(prices)
    if len(prices) < period:
        return [float(prices[-1])]  # fallback
    ema = list(np.mean(prices[:period]) * np.ones(period))  # pad first period with initial mean
    k = 2 / (period + 1)
    for price in prices[period:]:
        ema.append(price * k + ema[-1] * (1 - k))
    return ema


def compute_rsi(prices: List[float], period: int = 14) -> float:
    """Compute RSI for the last period"""
    prices = np.array(prices)
    if len(prices) < period + 1:
        return 50  # neutral RSI if not enough data
    deltas = np.diff(prices)
    gains = deltas[deltas > 0].sum() / period
    losses = -deltas[deltas < 0].sum() / period
    if losses == 0:
        return 100
    rs = gains / losses
    return 100 - (100 / (1 + rs))

# ----------------OLD STRATEGY (EMA CROSSOVER)------not-used-anymore-----
def generate_signal(symbol: str, historical_prices: List[float]) -> str:
    """Generate trading signal based on EMA crossover + RSI filter"""
    if len(historical_prices) < 30:
        return "HOLD"

    ema9 = compute_ema(historical_prices, 9)
    ema21 = compute_ema(historical_prices, 21)
    rsi = compute_rsi(historical_prices)

    # Ensure we have at least 2 points for crossover check
    if len(ema9) < 2 or len(ema21) < 2:
        return "HOLD"

    # BUY condition: EMA9 crosses above EMA21, RSI < 70
    if ema9[-2] < ema21[-2] and ema9[-1] > ema21[-1] and rsi < 70:
        return "BUY"

    # SELL condition: EMA9 crosses below EMA21, RSI > 30
    if ema9[-2] > ema21[-2] and ema9[-1] < ema21[-1] and rsi > 30:
        return "SELL"

    return "HOLD"

# -------------OLD STRATEGY-(EMA-CROSSOVER)---ends-here---not-used-anymore-----keptforreference----

def log_strategy(symbol: str, signal: str):
    print(f"[STRATEGY] {symbol} -> {signal}")

def get_strategy_logs(user_id: int):
    db = SessionLocal()

    logs = db.query(StrategyLog).filter(
        StrategyLog.user_id == user_id
    ).order_by(StrategyLog.timestamp.desc()).all()
    
    db.close()

    return [
        {
            "symbol": log.symbol,
            "signal": log.signal,
            "price" : log.price,
            "pnl" : log.pnl,
            "timestamp": log.timestamp
        }
        for log in logs

    ]


def generate_signal_from_features(features_list):

    print("Signal input type:", type(features_list))
    print("Signal input size:", len(features_list))

    if not features_list:
        return "HOLD"

    last = features_list[-10:]

    rsi_vals = [f["rsi"] for f in last if f.get("rsi") is not None]
    ema_fast_vals = [f["ema_fast"] for f in last]
    ema_slow_vals = [f["ema_slow"] for f in last]
    momentum_vals = [f["momentum"] for f in last]

    if not rsi_vals:
        return "HOLD"

    avg_rsi = sum(rsi_vals) / len(rsi_vals)
    avg_ema_fast = sum(ema_fast_vals) / len(ema_fast_vals)
    avg_ema_slow = sum(ema_slow_vals) / len(ema_slow_vals)
    avg_momentum = sum(momentum_vals) / len(momentum_vals)

    # stronger logic (more stable)
    bullish = avg_ema_fast > avg_ema_slow and avg_rsi < 65 and avg_momentum > 0
    bearish = avg_ema_fast < avg_ema_slow and avg_rsi > 70

    if bullish:
        return "BUY"
    elif bearish:
        return "SELL"
    else:
        return "HOLD"