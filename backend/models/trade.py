from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from datetime import datetime
from database import engine
from models.base import Base


class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String)
    price = Column(Float)
    quantity = Column(Float)  # Changed to float for fractional trading
    trade_type = Column(String)

    stop_loss = Column(Float, nullable=True)
    take_profit = Column(Float, nullable=True)

    status = Column(String, default="OPEN")
    
    exit_price = Column(Float, nullable=True)
    pnl = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime, nullable=True)

    user_id = Column(Integer, ForeignKey("users.id"))

