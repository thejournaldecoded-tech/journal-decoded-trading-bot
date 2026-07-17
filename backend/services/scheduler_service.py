from apscheduler.schedulers.background import BackgroundScheduler
from services.trade_services import add_trade, get_open_trades, close_trade
from services.strategy_services import generate_signal_from_features, log_strategy
from services.market_service import get_current_price, get_historical_price
from services.alert_service import send_trade_alert
from schemas.trade_schema import TradeRequest
from models.user import User
from database import SessionLocal
import time

SYMBOLS = ["AAPL", "MSFT", "GOOGL"]  # stocks example

def auto_trade():
    print("Running auto trade job...")
    db = SessionLocal()
    user = db.query(User).filter(User.id == 1).first()
    account_balance = user.balance if user else 10000
    db.close()

    for symbol in SYMBOLS:
        historical = get_historical_price(symbol)
        signal = generate_signal_from_features(symbol, historical)
        current_price = get_current_price(symbol)
        if not current_price or not signal:
            continue

        risk_per_trade = 0.02
        position_size = (account_balance * risk_per_trade) / current_price

        if signal == "BUY":
            stop_loss = current_price * 0.98
            take_profit = current_price * 1.04
        else:
            stop_loss = current_price * 1.02
            take_profit = current_price * 0.96

        trade_data = TradeRequest(
            symbol=symbol,
            price=current_price,
            quantity=round(position_size, 4),
            trade_type=signal,
            stop_loss=round(stop_loss, 2),
            take_profit=round(take_profit, 2)
        )

        add_trade(trade_data, user_id=1)
        log_strategy(user_id=1, symbol=symbol, signal=signal, price=current_price)
        print(f"Auto {signal} trade executed for {symbol}")

        send_trade_alert(f"New {signal} trade executed for {symbol}")

def check_exit_conditions():
    open_trades = get_open_trades()

    for trade in open_trades:
        current_price = get_current_price(trade.symbol)

        
        if current_price is None:
            print(f"Skipping trade {trade.id}, no price yet")
            continue

        should_exit = False

        # BUYing logic
        if trade.trade_type == "BUY":
            if (
                (trade.stop_loss is not None and current_price <= trade.stop_loss)
                or
                (trade.take_profit is not None and current_price >= trade.take_profit)
            ):
                should_exit = True

        #  SELLing logic
        elif trade.trade_type == "SELL":
            if (
                (trade.stop_loss is not None and current_price >= trade.stop_loss)
                or
                (trade.take_profit is not None and current_price <= trade.take_profit)
            ):
                should_exit = True

        #
        if should_exit:
            close_trade(trade.id, current_price)

            log_strategy(
                trade.user_id,
                trade.symbol,
                trade.trade_type,
                trade.price,
                pnl=trade.pnl
            )

            send_trade_alert(
                f"Trade closed for {trade.symbol} at {current_price}"
            )

            print(f"Trade {trade.id} closed via exit conditions.")


def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(auto_trade, "interval", minutes=5)
    scheduler.add_job(check_exit_conditions, "interval", seconds=10)
    scheduler.start()
    print("Scheduler started, auto-trading enabled.")