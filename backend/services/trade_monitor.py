from database import SessionLocal
from services.market_service import get_current_price
from services.trade_services import close_trade
from models.trade import Trade


def monitor_open_trades():

    db = SessionLocal()

    trades = db.query(Trade).filter(Trade.status == "OPEN").all()

    for trade in trades:

        current_price = get_current_price(trade.symbol)

        if current_price is None:
            continue

        # BUY trade
        if trade.trade_type == "BUY":

            if trade.stop_loss and current_price <= trade.stop_loss:
                close_trade(trade.id, current_price)

            if trade.take_profit and current_price >= trade.take_profit:
                close_trade(trade.id, current_price)

        # SELL trade
        else:

            if trade.stop_loss and current_price >= trade.stop_loss:
                close_trade(trade.id, current_price)

            if trade.take_profit and current_price <= trade.take_profit:
                close_trade(trade.id, current_price)

    db.close()