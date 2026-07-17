from database import SessionLocal
from models.trade import Trade
from models.user import User
from sqlalchemy import func


def get_portfolio(user_id: int):

    db = SessionLocal()

    user = db.query(User).filter(User.id == user_id).first()

    open_trades = db.query(Trade).filter(
        Trade.user_id == user_id,
        Trade.status == "OPEN"
    ).count()

    closed_trades = db.query(Trade).filter(
        Trade.user_id == user_id,
        Trade.status == "CLOSED"
    ).count()

    total_pnl = db.query(func.sum(Trade.pnl)).filter(
        Trade.user_id == user_id,
        Trade.status == "CLOSED"
    ).scalar()

    total_pnl = total_pnl or 0

    wins = db.query(Trade).filter(
        Trade.user_id == user_id,
        Trade.status == "CLOSED",
        Trade.pnl > 0
    ).count()

    win_rate = 0
    if closed_trades > 0:
        win_rate = (wins / closed_trades) * 100

    db.close()

    return {
        "balance": user.balance if user else 0,
        "open_trades": open_trades,
        "closed_trades": closed_trades,
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 2)
    }