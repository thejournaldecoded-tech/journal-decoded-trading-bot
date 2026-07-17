from database import SessionLocal
from models.trade import Trade


def get_trade_history(user_id: int):

    db = SessionLocal()

    trades = db.query(Trade).filter(
        Trade.user_id == user_id
    ).order_by(Trade.id.desc()).all()

    result = []

    for trade in trades:
        result.append({
            "id": trade.id,
            "symbol": trade.symbol,
            "type": trade.trade_type,
            "entry_price": trade.price,
            "exit_price": trade.exit_price,
            "quantity": trade.quantity,
            "status": trade.status,
            "pnl": trade.pnl
        })

    db.close()

    return result