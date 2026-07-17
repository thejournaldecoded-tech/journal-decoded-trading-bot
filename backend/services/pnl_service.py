from services.trade_services import get_open_trades
from services.market_service import get_current_price


def calculate_live_pnl():

    open_trades = get_open_trades()

    result = []

    for trade in open_trades:

        current_price = get_current_price(trade.symbol)

        if current_price is None:
            continue

        if trade.trade_type == "BUY":
            pnl = (current_price - trade.price) * trade.quantity
        else:
            pnl = (trade.price - current_price) * trade.quantity

        result.append({
            "trade_id": trade.id,
            "symbol": trade.symbol,
            "entry_price": trade.price,
            "current_price": current_price,
            "quantity": trade.quantity,
            "pnl": round(pnl, 2)
        })

    return result