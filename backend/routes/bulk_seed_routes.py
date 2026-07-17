from fastapi import APIRouter
from services.market_service import get_historical_price
from services.feature_service import build_features
from services.dataset_service import save_row, generate_label
from services.candle_service import save_candle
from models.candle import Candle
from database import get_db
from sqlalchemy.orm import Session

router = APIRouter()

@router.get("/seed-all")
def seed_all_symbols():
    """Seed data for all major cryptocurrency symbols"""
    
    symbols = [
        "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", 
        "BNBUSDT", "XRPUSDT", "DOGEUSDT", "AVAXUSDT",
        "DOTUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT"
    ]
    
    results = {}
    total_rows = 0
    
    for symbol in symbols:
        try:
            # Get historical data
            candles = get_historical_price(symbol, limit=200, interval="1m")
            
            if not candles:
                results[symbol] = {"status": "error", "message": "No historical data"}
                continue
            
            # Build features
            features_list = build_features(candles)
            
            if not features_list or len(features_list) < 2:
                results[symbol] = {"status": "error", "message": "Not enough features"}
                continue
            
            # Generate and save training data
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
            
            results[symbol] = {"status": "success", "rows_added": count}
            total_rows += count
            
        except Exception as e:
            results[symbol] = {"status": "error", "message": str(e)}
    
    return {
        "status": "completed",
        "total_rows_added": total_rows,
        "symbols": results
    }
