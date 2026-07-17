from models.candle import Candle
from database import SessionLocal


def save_candle(db, symbol, interval, o, h, l, c, v):
    candle = Candle(
        symbol=symbol,
        interval=interval,
        open=o,
        high=h,
        low=l,
        close=c,
        volume=v
    )

    db.add(candle)
    db.commit()
    db.refresh(candle)

    return candle