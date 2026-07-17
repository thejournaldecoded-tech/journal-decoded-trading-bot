from services.strategy_services import generate_signal_from_features

def run_backtest(symbol, prices):
    
    balance = 10000
    position = None
    entry_price = 0
    trades = []

    for i in range(30, len(prices)):

        historical = prices[:i]
        signal = generate_signal_from_features(symbol, historical)
        current_price = prices[i]

        if signal == "BUY" and position is None:
            position = "LONG"
            entry_price = current_price

        elif signal == "SELL" and position == "LONG":

            pnl = current_price - entry_price
            balance += pnl

            trades.append({
                "entry": entry_price,
                "exit": current_price,
                "pnl": pnl
            })

            position = None

    return {
        "symbol": symbol,
        "initial_balance": 10000,
        "final_balance": round(balance,2),
        "trades": trades,
        "total_trades": len(trades)
    }