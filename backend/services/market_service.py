from core.state import live_prices
import os
import requests

# Bybit interval codes map directly from standard Binance codes
BYBIT_INTERVAL_MAP = {
    "1m": "1",
    "3m": "3",
    "5m": "5",
    "15m": "15",
    "30m": "30",
    "1h": "60",
    "2h": "120",
    "4h": "240",
    "6h": "360",
    "8h": "480",
    "12h": "720",
    "1d": "D",
    "3d": "3D",
    "1w": "W",
    "1M": "M"
}

def get_current_price(symbol: str):
    # First try to get from live_prices (websocket feed)
    price = live_prices.get(symbol.upper())
    if price:
        return price
    
    # If not available, fetch from Bybit API directly
    try:
        url = f"https://api.bybit.com/v5/market/tickers?category=spot&symbol={symbol.upper()}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("retCode") == 0 and "result" in data:
                tickers_list = data["result"].get("list", [])
                if tickers_list:
                    return float(tickers_list[0]["lastPrice"])
        print(f"Bybit current price response error for {symbol}: {response.text}")
        return None
    except Exception as e:
        print(f"Error fetching current price from Bybit for {symbol}: {e}")
        return None

def get_historical_price(symbol: str, limit: int = 50, interval: str = "1h") -> list:
    try:
        bybit_interval = BYBIT_INTERVAL_MAP.get(interval, "60")
        url = f"https://api.bybit.com/v5/market/kline?category=spot&symbol={symbol.upper()}&interval={bybit_interval}&limit={limit}"
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            data = response.json()
            if data.get("retCode") == 0 and "result" in data:
                kline_list = data["result"].get("list", [])
                # Bybit returns klines in reverse chronological order (newest first).
                # We must reverse the list to match Binance's ascending chronological order.
                kline_list.reverse()
                
                # Bybit kline format: [startTime, openPrice, highPrice, lowPrice, closePrice, volume, turnover]
                # Close price is at index 4, which is identical to Binance's index 4.
                closing_prices = [float(kline[4]) for kline in kline_list]
                return closing_prices
        print(f"Bybit kline response error for {symbol}: {response.text}")
        return []
    except Exception as e:
        print(f"Error fetching historical prices from Bybit for {symbol}: {e}")
        return []

def seed_initial_data(symbol):
    candles = get_historical_price(symbol, limit=200, interval="1m")
    return candles