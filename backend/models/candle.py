from sqlalchemy import Column, Integer, String, Float, DateTime
from models.base import Base
from datetime import datetime


class Candle(Base):
    __tablename__ = "candles"

    id = Column(Integer, primary_key=True, index=True)

    symbol = Column(String)
    interval = Column(String)  # 1m, 5m, 1h

    open = Column(Float)
    high = Column(Float)
    low = Column(Float)
    close = Column(Float)
    volume = Column(Float)

    timestamp = Column(DateTime, default=datetime.utcnow)