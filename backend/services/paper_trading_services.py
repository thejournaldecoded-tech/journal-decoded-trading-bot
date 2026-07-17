from services.trade_services import add_trade, get_trades_with_pnl
from services.market_service import get_current_price, get_historical_price
from services.strategy_services import generate_signal_from_features
from utils.dependencies import get_current_user

# You can adjust how many historical prices to fetch
HISTORICAL_PRICE_COUNT = 50  

def run_paper_trading(user_id: int, symbols: list):
    """
    Simulate trades for a user based on signals
    """
    trades_made = []

    for symbol in symbols:
        # Get historical prices
        historical_prices = get_historical_price(symbol)

        # Generate signal
        signal = generate_signal_from_features(symbol, historical_prices)

        # Decide trade parameters
        current_price = get_current_price(symbol)
        if current_price is None:
            continue

        quantity = 1  # you can make it dynamic
        trade_type = signal.upper()

        # Only create BUY or SELL trades, skip HOLD
        if trade_type in ["BUY", "SELL"]:
            trade_data = type('TradeRequest', (), {
                "symbol": symbol,
                "price": current_price,
                "quantity": quantity,
                "trade_type": trade_type
            })()
            trade = add_trade(trade_data, user_id)
            trades_made.append({
                "trade_id": trade.id,
                "symbol": symbol,
                "trade_type": trade_type,
                "price": current_price
            })

    # Return all trades made in this simulation
    return trades_made
