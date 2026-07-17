from sqlalchemy.orm import Session
from database import SessionLocal
from models.trade import Trade
from models.wallet import Wallet
from models.position import Position
from services.market_service import get_current_price
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PositionService:
    """Service to manage user positions and ensure proper synchronization"""
    
    def __init__(self):
        pass
    
    def get_user_positions(self, user_id: int, db: Session) -> List[Position]:
        """Get all open positions for a user"""
        return db.query(Position).filter(
            Position.user_id == user_id,
            Position.quantity > 0
        ).all()
    
    def get_position_for_symbol(self, user_id: int, symbol: str, db: Session) -> Optional[Position]:
        """Get position for a specific symbol"""
        return db.query(Position).filter(
            Position.user_id == user_id,
            Position.symbol == symbol,
            Position.quantity > 0
        ).first()
    
    def update_position(self, user_id: int, symbol: str, quantity: float, trade_type: str, price: float, db: Session) -> Dict:
        """Update position based on trade"""
        try:
            position = self.get_position_for_symbol(user_id, symbol, db)
            
            if trade_type.upper() == "BUY":
                # Add to position
                if position:
                    # Average price calculation
                    total_cost = position.quantity * position.avg_price + quantity * price
                    total_quantity = position.quantity + quantity
                    position.avg_price = total_cost / total_quantity
                    position.quantity = total_quantity
                    position.last_updated = datetime.utcnow()
                else:
                    # Create new position
                    position = Position(
                        user_id=user_id,
                        symbol=symbol,
                        quantity=quantity,
                        avg_price=price,
                        last_updated=datetime.utcnow()
                    )
                    db.add(position)
                
                db.commit()
                return {
                    "status": "success",
                    "action": "position_opened/increased",
                    "new_quantity": position.quantity,
                    "avg_price": position.avg_price
                }
                
            elif trade_type.upper() == "SELL":
                # Check if user has enough position to sell
                if not position or position.quantity < quantity:
                    return {
                        "status": "error",
                        "message": f"Insufficient position. Available: {position.quantity if position else 0}, Required: {quantity}"
                    }
                
                # Calculate P&L for this sell
                pnl = (price - position.avg_price) * quantity
                
                # Update position
                position.quantity -= quantity
                
                if position.quantity <= 0.000001:  # Close position if very small
                    db.delete(position)
                    action = "position_closed"
                else:
                    position.last_updated = datetime.utcnow()
                    action = "position_reduced"
                
                db.commit()
                
                return {
                    "status": "success",
                    "action": action,
                    "pnl": pnl,
                    "remaining_quantity": position.quantity if position.quantity > 0.000001 else 0,
                    "sell_price": price,
                    "avg_price": position.avg_price if position else 0
                }
                
            elif trade_type.upper() == "SHORT":
                # Handle short selling (create negative position)
                short_position = db.query(Position).filter(
                    Position.user_id == user_id,
                    Position.symbol == symbol,
                    Position.quantity < 0  # Short positions are negative
                ).first()
                
                if short_position:
                    # Add to short position
                    short_position.quantity -= quantity  # More negative
                    total_cost = abs(short_position.quantity) * price
                    short_position.avg_price = price
                    short_position.last_updated = datetime.utcnow()
                else:
                    # Create new short position
                    short_position = Position(
                        user_id=user_id,
                        symbol=symbol,
                        quantity=-quantity,  # Negative for short
                        avg_price=price,
                        last_updated=datetime.utcnow()
                    )
                    db.add(short_position)
                
                db.commit()
                return {
                    "status": "success",
                    "action": "short_position_opened",
                    "short_quantity": abs(short_position.quantity),
                    "avg_price": short_position.avg_price
                }
                
        except Exception as e:
            logger.error(f"Error updating position: {e}")
            db.rollback()
            return {
                "status": "error",
                "message": str(e)
            }
    
    def calculate_pnl_for_position(self, position: Position, current_price: float) -> float:
        """Calculate unrealized P&L for a position"""
        if position.quantity > 0:  # Long position
            return (current_price - position.avg_price) * position.quantity
        elif position.quantity < 0:  # Short position
            return (position.avg_price - current_price) * abs(position.quantity)
        return 0
    
    def get_portfolio_summary(self, user_id: int, db: Session) -> Dict:
        """Get complete portfolio summary with P&L"""
        try:
            # Get wallet
            wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
            if not wallet:
                return {"status": "error", "message": "Wallet not found"}
            
            # Get positions
            positions = self.get_user_positions(user_id, db)
            
            # Calculate unrealized P&L
            total_unrealized_pnl = 0
            position_details = []
            
            for position in positions:
                current_price = get_current_price(position.symbol)
                if current_price:
                    unrealized_pnl = self.calculate_pnl_for_position(position, current_price)
                    total_unrealized_pnl += unrealized_pnl
                    
                    position_details.append({
                        "symbol": position.symbol,
                        "quantity": position.quantity,
                        "avg_price": position.avg_price,
                        "current_price": current_price,
                        "unrealized_pnl": unrealized_pnl,
                        "value": position.quantity * current_price
                    })
            
            # Get realized P&L from closed trades
            realized_pnl = db.query(Trade).filter(
                Trade.user_id == user_id,
                Trade.pnl.isnot(None)
            ).with_entities(Trade.pnl).all()
            
            total_realized_pnl = sum(pnl[0] for pnl in realized_pnl) if realized_pnl else 0
            
            # Total portfolio value
            total_value = wallet.balance + total_unrealized_pnl + total_realized_pnl
            
            return {
                "status": "success",
                "wallet_balance": wallet.balance,
                "total_unrealized_pnl": total_unrealized_pnl,
                "total_realized_pnl": total_realized_pnl,
                "total_portfolio_value": total_value,
                "positions": position_details,
                "position_count": len(positions)
            }
            
        except Exception as e:
            logger.error(f"Error getting portfolio summary: {e}")
            return {"status": "error", "message": str(e)}

# Global position service instance
position_service = PositionService()
