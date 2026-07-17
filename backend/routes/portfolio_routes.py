from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from utils.dependencies import get_current_user
from services.position_service import position_service
from services.portfolio_service import get_portfolio

router = APIRouter(prefix="/portfolio", tags=["Portfolio"])


@router.get("/all-positions")
def get_positions(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get all open positions"""
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


@router.get("/symbol/{symbol}")
def get_position(symbol: str, user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get position for specific symbol"""
    position = position_service.get_position_for_symbol(user_id, symbol, db)
    if not position:
        return {"status": "not_found", "message": "No position found"}
    
    return {
        "status": "success",
        "position": {
            "symbol": position.symbol,
            "quantity": position.quantity,
            "avg_price": position.avg_price,
            "last_updated": position.last_updated
        }
    }


@router.get("/")
def get_user_portfolio(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get complete portfolio with positions and P&L"""
    return position_service.get_portfolio_summary(user_id, db)


@router.get("/{user_id}")
def portfolio(user_id: int):
    return get_portfolio(user_id)