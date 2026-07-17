from binance.client import Client
from core.state import live_prices
import os
import requests

# We will use environment variables for keys later, for now we use public API
# Binance public API allows price fetching without API key

client = Client()
def get_current_price(symbol: str):
    # First try to get from live_prices (websocket feed)
    price = live_prices.get(symbol.upper())
    if price:
        return price
    
    # If not available, fetch from Binance API directly
    try:
        ticker = client.get_symbol_ticker(symbol=symbol.upper())
        return float(ticker['price'])
    except Exception as e:
        print(f"Error fetching current price for {symbol}: {e}")
        return None
    

def get_historical_price(symbol: str, limit: int = 50, interval: str = "1h") -> list:
    
    try:
        klines = client.get_klines(symbol=symbol.upper(), interval=interval, limit=limit)
        closing_prices = [float(kline[4]) for kline in klines]  # Close price is index 4
        return closing_prices
    except Exception as e:
        print(f"Error fetching historical prices for {symbol}: {e}")
        return []
    

def seed_initial_data(symbol):
    candles = get_historical_price(symbol, limit=200, interval="1m")
    return candles