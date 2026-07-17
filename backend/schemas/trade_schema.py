from pydantic import BaseModel
# ------------------- Pydantic Request -------------------
class TradeRequest(BaseModel):
    symbol: str
    price: float
    quantity: float
    trade_type: str