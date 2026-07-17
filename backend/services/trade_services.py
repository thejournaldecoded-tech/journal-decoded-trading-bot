from sqlalchemy.orm import Session
from database import SessionLocal
from models.trade import Trade
from models.wallet import Wallet
from models.position import Position
from services.market_service import get_current_price
from services.position_service import position_service
from models.user import User
from models.order import Order
from sqlalchemy import func
from datetime import datetime
import random
import logging

logger = logging.getLogger(__name__)

MAX_TRADE_SIZE = 10000  # ₹

def add_trade(trade_data, user_id, db: Session):

    print("USER ID FROM TOKEN:", user_id)

    # get user wallet
    wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()

    if not wallet:
        raise Exception("Wallet not found")
    
    #  GET LIVE PRICE
    current_price = get_current_price(trade_data.symbol)

    if current_price is None:
        raise Exception("Live price not available")
    
    quantity = trade_data.quantity
    if quantity <= 0:
        raise Exception("Quantity must be greater than 0")
    

    #  APPLY SLIPPAGE HERE
    slippage_percent = random.uniform(0.001, 0.005)
    
    # Handle different trade types including short selling
    if trade_data.trade_type.upper() == "BUY":
        executed_price = current_price * (1 + slippage_percent)
        required_amount = executed_price * quantity
        trade_direction = "LONG"
        
    elif trade_data.trade_type.upper() == "SELL":
        # For regular selling (selling owned assets)
        executed_price = current_price * (1 - slippage_percent)
        required_amount = 0  # No money needed for selling owned assets
        trade_direction = "CLOSE_LONG"
        
    elif trade_data.trade_type.upper() == "SHORT":
        # For short selling (selling borrowed assets)
        executed_price = current_price * (1 - slippage_percent)
        # Short selling requires margin/collateral
        margin_requirement = executed_price * quantity * 0.5  # 50% margin
        required_amount = margin_requirement
        trade_direction = "SHORT"
        
    else:
        raise Exception("Invalid trade type. Use BUY, SELL, or SHORT")

    print("WALLET RESULT:", wallet)
    print("TRADE TYPE:", trade_data.trade_type.upper())
    print("REQUIRED AMOUNT:", required_amount)

    # 🔥 MAX LIMIT CHECK
    MAX_TRADE_SIZE = 100000  # ₹10,0000
    #  MAX LIMIT CHECK HERE
    if required_amount > MAX_TRADE_SIZE:
        raise Exception("Trade size exceeds ₹10,000 limit")

    # balance check (only for BUY and SHORT trades)
    if trade_data.trade_type.upper() in ["BUY", "SHORT"] and wallet.balance < required_amount:
        raise Exception("Insufficient balance")

    # Check position synchronization for SELL trades
    if trade_data.trade_type.upper() == "SELL":
        position = position_service.get_position_for_symbol(user_id, trade_data.symbol, db)
        if not position or position.quantity < quantity:
            raise Exception(f"Insufficient position. Available: {position.quantity if position else 0}, Required: {quantity}")

    # deduct balance for BUY and SHORT trades
    if trade_data.trade_type.upper() in ["BUY", "SHORT"]:
        wallet.balance -= required_amount
        print(f"Deducted ${required_amount} from wallet. New balance: ${wallet.balance}")
    # For SELL trades, add money to wallet
    elif trade_data.trade_type.upper() == "SELL":
        proceeds = executed_price * quantity
        wallet.balance += proceeds
        print(f"Added ${proceeds} to wallet. New balance: ${wallet.balance}")

    # Create trade with timestamp
    trade = Trade(
        symbol=trade_data.symbol,
        price=executed_price,
        quantity=trade_data.quantity,
        trade_type=trade_data.trade_type,
        user_id=user_id,
        created_at=datetime.utcnow()
    )

    db.add(trade)
    db.flush()  # Get trade ID without committing yet

    # Update positions
    position_result = position_service.update_position(
        user_id, trade_data.symbol, quantity, trade_data.trade_type, executed_price, db
    )
    
    # Calculate P&L for SELL trades
    if trade_data.trade_type.upper() == "SELL" and position_result.get("status") == "success":
        trade.pnl = position_result.get("pnl", 0)
        trade.exit_price = executed_price
        trade.closed_at = datetime.utcnow()
        print(f"Trade P&L: ${trade.pnl}")

    # Commit everything
    db.add(wallet)  # Ensure wallet is updated
    db.commit()

    db.refresh(trade)
    print(f"Trade created successfully: ID {trade.id}, Type: {trade_data.trade_type}, Symbol: {trade_data.symbol}")

    return trade


def get_user_trades(user_id):

    db = SessionLocal()

    trades = db.query(Trade).filter(
        Trade.user_id == user_id
    ).all()

    db.close()

    return trades

def get_trades_with_pnl(user_id: int):
    db: Session = SessionLocal()
    trades = db.query(Trade).filter(Trade.user_id == user_id).all()

    trade_list = []

    for trade in trades:
        current_price = get_current_price(trade.symbol)

        # If no live price yet → skip safely
        if current_price is None:
            pnl = 0
        else:
            if trade.trade_type.upper() == "BUY":
                pnl = (current_price - trade.price) * trade.quantity
            else:
                pnl = (trade.price - current_price) * trade.quantity

        trade_list.append({
            "id": trade.id,
            "symbol": trade.symbol,
            "price": trade.price,
            "quantity": trade.quantity,
            "trade_type": trade.trade_type,
            "current_price": current_price,
            "pnl": round(pnl, 2)
        })

    db.close()
    return trade_list

# developing performance matric

def get_performance(user_id: int):
    db = SessionLocal()

    trades = db.query(Trade).filter(Trade.user_id == user_id).all()
    db.close()

    if not trades:
        return {
            "total_trades": 0,
            "total_profit": 0,
            "total_loss": 0,
            "net_pnl": 0,
            "win_rate": 0,
            "best_trade": None,
            "worst_trade": None
        }

    total_profit = 0
    total_loss = 0
    best_trade = None
    worst_trade = None
    wins = 0

    for trade in trades:
        current_price = get_current_price(trade.symbol)
        # Skip if price not available
        if current_price is None:
          continue

        if trade.trade_type == "BUY":
            pnl = (current_price - trade.price) * trade.quantity
        else:
            pnl = (trade.price - current_price) * trade.quantity

        # Track wins
        if pnl > 0:
            wins += 1
            total_profit += pnl
        else:
            total_loss += pnl

        # Best trade
        if best_trade is None or pnl > best_trade["pnl"]:
            best_trade = {
                "symbol": trade.symbol,
                "pnl": pnl
            }

        # Worst trade
        if worst_trade is None or pnl < worst_trade["pnl"]:
            worst_trade = {
                "symbol": trade.symbol,
                "pnl": pnl
            }

    total_trades = len(trades)
    net_pnl = total_profit + total_loss
    win_rate = (wins / total_trades) * 100

    return {
        "total_trades": total_trades,
        "total_profit": round(total_profit, 2),
        "total_loss": round(total_loss, 2),
        "net_pnl": round(net_pnl, 2),
        "win_rate": round(win_rate, 2),
        "best_trade": best_trade,
        "worst_trade": worst_trade
    }


# creating portfolio

def get_portfolio(user_id: int):
    db = SessionLocal()
    trades = db.query(Trade).filter(Trade.user_id == user_id).all()
    db.close()

    if not trades:
        return {
            "total_invested": 0,
            "current_value": 0,
            "net_pnl": 0,
            "positions": []
        }

    portfolio = {}
    total_invested = 0
    current_value = 0

    # Group trades by symbol
    for trade in trades:
        if trade.symbol not in portfolio:
            portfolio[trade.symbol] = {
                "quantity": 0,
                "total_cost": 0
            }

        if trade.trade_type == "BUY":
            portfolio[trade.symbol]["quantity"] += trade.quantity
            portfolio[trade.symbol]["total_cost"] += trade.price * trade.quantity
        else:
            portfolio[trade.symbol]["quantity"] -= trade.quantity
            portfolio[trade.symbol]["total_cost"] -= trade.price * trade.quantity

    positions = []

    for symbol, data in portfolio.items():
        quantity = data["quantity"]

        if quantity == 0:
            continue

        avg_price = data["total_cost"] / quantity
        current_price = get_current_price(symbol)

        if current_price is None:
            continue

        invested = avg_price * quantity
        value = current_price * quantity
        pnl = value - invested

        total_invested += invested
        current_value += value

        positions.append({
            "symbol": symbol,
            "quantity": quantity,
            "avg_price": round(avg_price, 2),
            "current_price": round(current_price, 2),
            "pnl": round(pnl, 2)
        })

    net_pnl = current_value - total_invested

    return {
        "total_invested": round(total_invested, 2),
        "current_value": round(current_value, 2),
        "net_pnl": round(net_pnl, 2),
        "positions": positions
    }

        # new additions
def get_open_trades():
    db: Session = SessionLocal()
    trades = db.query(Trade).filter(Trade.status == "OPEN").all()
    db.close()
    return trades





def close_trade(trade_id: int, exit_price: float):
    db: Session = SessionLocal()

    trade = db.query(Trade).filter(Trade.id == trade_id).first()
    if not trade or trade.status != "OPEN":
        db.close()
        return

    # 🔥 Calculate PnL
    if trade.trade_type == "BUY":
        pnl = (exit_price - trade.price) * trade.quantity
    else:  # SELL
        pnl = (trade.price - exit_price) * trade.quantity

    trade.exit_price = exit_price
    trade.pnl = pnl
    trade.status = "CLOSED"

    # 🔥 Update user balance
    user = db.query(User).filter(User.id == trade.user_id).first()
    if user:
        user.balance += pnl

    db.commit()
    db.close()

    print(f"Trade {trade_id} closed. PnL: {round(pnl,2)}")


def get_account_summary(user_id: int):
    db: Session = SessionLocal()

    trades = db.query(Trade).filter(Trade.user_id == user_id).all()
    user = db.query(User).filter(User.id == user_id).first()

    total_trades = len(trades)
    closed_trades = [t for t in trades if t.status == "CLOSED"]

    total_pnl = sum(t.pnl for t in closed_trades if t.pnl is not None)
    wins = len([t for t in closed_trades if t.pnl and t.pnl > 0])
    losses = len([t for t in closed_trades if t.pnl and t.pnl < 0])

    win_rate = (wins / len(closed_trades) * 100) if closed_trades else 0

    result = {
        "balance": user.balance if user else 0,
        "total_trades": total_trades,
        "closed_trades": len(closed_trades),
        "total_pnl": round(total_pnl, 2),
        "win_rate": round(win_rate, 2),
        "wins": wins,
        "losses": losses
    }

    db.close()
    return result


def create_order(trade_data, user_id, db):
    """
    Step 1: Create order (NOT trade yet)
    """

    order = Order(
        user_id=user_id,
        symbol=trade_data.symbol,
        trade_type=trade_data.trade_type,
        quantity=trade_data.quantity,
        status="PENDING"
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order