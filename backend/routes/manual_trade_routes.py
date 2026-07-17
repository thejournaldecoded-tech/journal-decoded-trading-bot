from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from utils.dependencies import get_current_user
from services.trade_services import add_trade
from services.market_service import get_current_price
from schemas.trade_schema import TradeRequest
from services.position_service import position_service

router = APIRouter()

@router.post("/manual-trade")
def execute_manual_trade(
    trade_request: dict = Body(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Execute manual trade with proper position synchronization"""
    try:
        symbol = trade_request.get("symbol")
        trade_type = trade_request.get("trade_type")
        quantity = trade_request.get("quantity")
        
        if not all([symbol, trade_type, quantity]):
            return {
                "status": "error",
                "message": "Missing required fields: symbol, trade_type, quantity"
            }
        
        # Get current price
        current_price = get_current_price(symbol)
        if current_price is None:
            return {
                "status": "error",
                "message": f"Could not get current price for {symbol}"
            }
        
        # Check position synchronization for SELL trades
        if trade_type.upper() == "SELL":
            position = position_service.get_position_for_symbol(user_id, symbol, db)
            if not position or position.quantity < quantity:
                return {
                    "status": "error",
                    "message": f"Insufficient position. Available: {position.quantity if position else 0:.8f}, Required: {quantity:.8f}"
                }
        
        # Create trade request
        trade_data = TradeRequest(
            symbol=symbol,
            price=current_price,
            quantity=quantity,
            trade_type=trade_type
        )
        
        # Execute trade
        trade = add_trade(trade_data, user_id, db)
        
        return {
            "status": "success",
            "trade": {
                "id": trade.id,
                "symbol": trade.symbol,
                "trade_type": trade.trade_type,
                "quantity": trade.quantity,
                "price": trade.price,
                "created_at": trade.created_at,
                "pnl": trade.pnl
            }
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@router.get("/positions")
def get_positions(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current positions"""
    positions = position_service.get_user_positions(user_id, db)
    return {
        "status": "success",
        "positions": [
            {
                "symbol": pos.symbol,
                "quantity": pos.quantity,
                "avg_price": pos.avg_price,
                "last_updated": pos.last_updated
            }
            for pos in positions
        ]
    }
