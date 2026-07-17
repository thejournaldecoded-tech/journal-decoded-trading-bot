from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)

    symbol = Column(String)
    trade_type = Column(String)  # BUY / SELL
    quantity = Column(Float)

    status = Column(String, default="PENDING")  # PENDING / FILLED / FAILED

    created_at = Column(DateTime, default=datetime.utcnow)