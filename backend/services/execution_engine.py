import random
from services.market_service import get_current_price
from models.trade import Trade


def execute_order(order, db):
    """
    Simulates real market execution
    """

    price = get_current_price(order.symbol)

    if price is None:
        return None

    # Slippage simulation (realistic trading behavior)
    slippage = random.uniform(0.001, 0.005)

    if order.trade_type.upper() == "BUY":
        executed_price = price * (1 + slippage)
    else:
        executed_price = price * (1 - slippage)

    # Mark order as filled
    order.status = "FILLED"

    # Create actual trade
    trade = Trade(
        user_id=order.user_id,
        symbol=order.symbol,
        price=executed_price,
        quantity=order.quantity,
        trade_type=order.trade_type
    )

    db.add(trade)
    db.commit()
    db.refresh(trade)

    return trade