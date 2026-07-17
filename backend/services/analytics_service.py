from services.trade_services import get_user_trades, get_portfolio
from datetime import datetime
from collections import defaultdict

def get_trade_analytics(user_id: int):
    trades = get_user_trades(user_id)
    portfolio = get_portfolio(user_id)

    if not trades:
        return {
            "win_rate": 0,
            "total_trades": 0,
            "max_drawdown": 0,
            "equity_curve": [],
            "daily_pnl": [],
            "best_trade": None,
            "worst_trade": None
        }

    wins = 0
    equity_curve = []
    daily_pnl_map = defaultdict(float)
    max_equity = 0
    max_drawdown = 0
    net_equity = portfolio["total_invested"] + portfolio["net_pnl"]
    current_equity = 0

    best_trade = None
    worst_trade = None

    for trade in trades:
        # Calculate PnL
        trade_pnl = trade.pnl if trade.pnl else 0

        # Track wins
        if trade_pnl > 0:
            wins += 1

        # Best/Worst trade
        if not best_trade or trade_pnl > best_trade["pnl"]:
            best_trade = {"symbol": trade.symbol, "pnl": trade_pnl}

        if not worst_trade or trade_pnl < worst_trade["pnl"]:
            worst_trade = {"symbol": trade.symbol, "pnl": trade_pnl}

        # Daily PnL
        trade_day = trade.created_at.date()
        daily_pnl_map[trade_day] += trade_pnl

        # Equity Curve (cumulative)
        current_equity += trade_pnl
        equity_curve.append({"date": trade.created_at.strftime("%Y-%m-%d"), "equity": current_equity})

        # Max drawdown
        if current_equity > max_equity:
            max_equity = current_equity
        drawdown = max_equity - current_equity
        if drawdown > max_drawdown:
            max_drawdown = drawdown

    win_rate = (wins / len(trades)) * 100

    # Format daily PnL
    daily_pnl = [{"date": str(k), "pnl": v} for k, v in daily_pnl_map.items()]

    return {
        "win_rate": round(win_rate, 2),
        "total_trades": len(trades),
        "max_drawdown": round(max_drawdown, 2),
        "equity_curve": equity_curve,
        "daily_pnl": daily_pnl,
        "best_trade": best_trade,
        "worst_trade": worst_trade
    }