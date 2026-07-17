from database import SessionLocal
from models.trade import Trade
from models.wallet import Wallet
from services.market_service import get_current_price


def check_trades():
    print("Checking trades...")
    db = SessionLocal()

    open_trades = db.query(Trade).filter(Trade.status == "OPEN").all()

    for trade in open_trades:
        

        price = get_current_price(trade.symbol)

        if price is None:
            continue

        close_trade = False

        # STOP LOSS
        if trade.stop_loss:
            if trade.trade_type == "BUY" and price <= trade.stop_loss:
                close_trade = True
            elif trade.trade_type == "SELL" and price >= trade.stop_loss:
                close_trade = True

        # TAKE PROFIT
        if trade.take_profit:
            if trade.trade_type == "BUY" and price >= trade.take_profit:
                close_trade = True
            elif trade.trade_type == "SELL" and price <= trade.take_profit:
                close_trade = True

        if close_trade:

            trade.exit_price = price
            trade.status = "CLOSED"

            # PnL calculation
            if trade.trade_type == "BUY":
                trade.pnl = (price - trade.price) * trade.quantity
            else:
                trade.pnl = (trade.price - price) * trade.quantity

            # wallet update
            wallet = db.query(Wallet).filter(Wallet.user_id == trade.user_id).first()

            if wallet:
                wallet.balance += trade.pnl

            print("Trade Closed:", trade.id, "PnL:", trade.pnl)

    db.commit()
    db.close()