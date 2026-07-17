from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from datetime import datetime
from models.base import Base

class StrategyLog(Base):
    __tablename__ = "strategy_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    symbol = Column(String)
    signal = Column(String)
    price = Column(Float)
    pnl = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)