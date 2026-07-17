import pandas as pd


def calculate_ema(prices, period=14):
    return prices.ewm(span=period, adjust=False).mean()


def calculate_rsi(prices, period=14):
    delta = prices.diff()

    gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()

    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))

    return rsi