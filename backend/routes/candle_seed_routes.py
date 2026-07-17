from fastapi import APIRouter
from services.market_service import get_historical_price
from models.candle import Candle
from database import SessionLocal
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/seed-candles/{symbol}")
def seed_candles_for_symbol(symbol: str):
    """Seed candle data for a specific symbol"""
    db = SessionLocal()
    
    try:
        # Get historical data
        prices = get_historical_price(symbol.upper(), limit=200, interval="1m")
        
        if not prices:
            return {"status": "error", "message": "No historical data"}
        
        # Clear existing candles for this symbol
        db.query(Candle).filter(Candle.symbol == symbol.upper()).delete()
        db.commit()
        
        # Create candle records
        candles_created = 0
        base_time = datetime.now() - timedelta(minutes=len(prices))
        
        for i, price in enumerate(prices):
            candle = Candle(
                symbol=symbol.upper(),
                interval="1m",
                open=price,
                high=price * 1.001,  # Small variation
                low=price * 0.999,   # Small variation
                close=price,
                volume=1000.0,  # Dummy volume
                timestamp=base_time + timedelta(minutes=i)
            )
            db.add(candle)
            candles_created += 1
        
        db.commit()
        
        return {
            "status": "success",
            "symbol": symbol.upper(),
            "candles_created": candles_created
        }
        
    except Exception as e:
        db.rollback()
        return {"status": "error", "message": str(e)}
    finally:
        db.close()

@router.get("/seed-all-candles")
def seed_all_candles():
    """Seed candle data for all major symbols"""
    
    symbols = [
        "BTCUSDT", "ETHUSDT", "ADAUSDT", "SOLUSDT", 
        "BNBUSDT", "XRPUSDT", "DOGEUSDT", "AVAXUSDT",
        "DOTUSDT", "MATICUSDT", "LINKUSDT", "UNIUSDT"
    ]
    
    results = {}
    total_candles = 0
    db = SessionLocal()
    
    for symbol in symbols:
        try:
            # Get historical data
            prices = get_historical_price(symbol.upper(), limit=200, interval="1m")
            
            if not prices:
                results[symbol] = {"status": "error", "message": "No historical data"}
                continue
            
            # Clear existing candles for this symbol
            db.query(Candle).filter(Candle.symbol == symbol.upper()).delete()
            
            # Create candle records
            candles_created = 0
            base_time = datetime.now() - timedelta(minutes=len(prices))
            
            for i, price in enumerate(prices):
                candle = Candle(
                    symbol=symbol.upper(),
                    interval="1m",
                    open=price,
                    high=price * 1.001,  # Small variation
                    low=price * 0.999,   # Small variation
                    close=price,
                    volume=1000.0,  # Dummy volume
                    timestamp=base_time + timedelta(minutes=i)
                )
                db.add(candle)
                candles_created += 1
            
            db.commit()
            results[symbol] = {"status": "success", "candles_created": candles_created}
            total_candles += candles_created
            
        except Exception as e:
            db.rollback()
            results[symbol] = {"status": "error", "message": str(e)}
    
    db.close()
    
    return {
        "status": "completed",
        "total_candles_created": total_candles,
        "symbols": results
    }
