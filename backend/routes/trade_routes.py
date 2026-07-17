from fastapi import APIRouter, Depends,Body , Query
from pydantic import BaseModel
from services.trade_services import add_trade, get_user_trades, get_trades_with_pnl, get_performance, get_portfolio, get_account_summary, create_order
from utils.dependencies import get_current_user
from services.market_service import get_current_price, get_historical_price
from services.execution_engine import execute_order
from core.auth import get_current_user
from services.paper_trading_services import run_paper_trading
from services.feature_service import get_recent_candles, build_features
from services.strategy_services import generate_signal_from_features
from services.model_service import train_model, predict_signal
from services.enhanced_model_service import predict_with_model, get_model_info
from services.consensus_service import consensus_service
from schemas.trade_schema import TradeRequest
from typing import Optional
from database import get_db
from sqlalchemy.orm import Session


router = APIRouter()


# ------------------- Create a Trade -------------------
@router.post("/trade")
def create_trade(
    trade: TradeRequest,
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    result = add_trade(trade, user_id,db)
    return {
        "status": "success",
        "trade_id": result.id
    }


# ------------------- Get User Trades -------------------
@router.get("/trades")
def fetch_trades(
    symbol: Optional[str] = Query(None),
    trade_type: Optional[str] = Query(None),
    sort: Optional[str] = Query(None),
    user_id: int = Depends(get_current_user)
):
    trades = get_user_trades(user_id)

    # Filter by symbol
    if symbol:
        trades = [t for t in trades if t.symbol == symbol]

    # Filter by trade type
    if trade_type:
        trades = [t for t in trades if t.trade_type == trade_type]

    # Sort logic
    if sort == "price":
        trades.sort(key=lambda x: x.price)
    elif sort == "quantity":
        trades.sort(key=lambda x: x.quantity)
    elif sort == "symbol":
        trades.sort(key=lambda x: x.symbol)

    # Format trades for frontend display
    formatted_trades = []
    for trade in trades:
        formatted_trade = {
            "id": trade.id,
            "symbol": trade.symbol,
            "trade_type": trade.trade_type,
            "quantity": float(trade.quantity),  # Ensure float for fractional quantities
            "price": float(trade.price),
            "pnl": float(trade.pnl) if trade.pnl is not None else 0.0,
            "status": trade.status,
            "created_at": trade.created_at.isoformat() if trade.created_at else None,
            "closed_at": trade.closed_at.isoformat() if trade.closed_at else None,
            "exit_price": float(trade.exit_price) if trade.exit_price is not None else None
        }
        formatted_trades.append(formatted_trade)

    return {
        "status": "success",
        "count": len(formatted_trades),
        "data": formatted_trades
    }


# ------------------- Get Trades with Analytics (P&L) -------------------
@router.get("/trades/analytics")
def fetch_trades_analytics(user_id: int = Depends(get_current_user)):
    # Returns user trades with real-time P&L
    trades_with_pnl = get_trades_with_pnl(user_id)
    return {
        "status": "success",
        "count": len(trades_with_pnl),
        "data": trades_with_pnl
    }


# ------------------- Get Signal for a Symbol -------------------
@router.get("/signal/{symbol}")
def get_signal(symbol: str, algorithm: str = "RandomForest"):

    candles = get_recent_candles(symbol.upper(), limit=50)

    if not candles:
        return {"status": "error", "message": "No candles"}

    features = build_features(candles)

    if not features or len(features) < 5:
        return {"status": "error", "message": "Not enough features"}

    # 🔥 TAKE LAST 5 FEATURES (IMPORTANT FIX)
    last_5 = features[-5:]

    # Use AI model for prediction with confidence scores
    latest_feature = last_5[-1]
    ai_prediction = predict_with_model(algorithm, latest_feature)
    
    # Also get traditional strategy signal for comparison
    strategy_signal = generate_signal_from_features(last_5)

    return {
        "status": "success",
        "symbol": symbol.upper(),
        "algorithm": algorithm,
        "ai_signal": ai_prediction.get("signal", "MODEL_NOT_TRAINED"),
        "ai_confidence": ai_prediction.get("confidence", 0),
        "ai_probabilities": ai_prediction.get("probabilities", {}),
        "model_accuracy": ai_prediction.get("model_accuracy", 0),
        "strategy_signal": strategy_signal,
        "features": last_5
    }

@router.get("/signal/{symbol}/compare")
def compare_algorithms(symbol: str):

    candles = get_recent_candles(symbol.upper(), limit=50)

    if not candles:
        return {"status": "error", "message": "No candles"}

    features = build_features(candles)

    if not features or len(features) < 5:
        return {"status": "error", "message": "Not enough features"}

    # 🔥 TAKE LAST 5 FEATURES (IMPORTANT FIX)
    last_5 = features[-5:]
    latest_feature = last_5[-1]

    # Get predictions from all algorithms
    algorithms = ["RandomForest", "SVM", "LogisticRegression"]
    predictions = {}
    
    for algo in algorithms:
        pred = predict_with_model(algo, latest_feature)
        predictions[algo] = pred
    
    # Get consensus decision
    consensus = consensus_service.get_consensus_signal(predictions)
    
    # Also get traditional strategy signal for comparison
    strategy_signal = generate_signal_from_features(last_5)

    return {
        "status": "success",
        "symbol": symbol.upper(),
        "predictions": predictions,
        "consensus": consensus,
        "strategy_signal": strategy_signal,
        "features": last_5
    }

@router.get("/signal/{symbol}/consensus")
def get_consensus_signal(symbol: str):

    candles = get_recent_candles(symbol.upper(), limit=50)

    if not candles:
        return {"status": "error", "message": "No candles"}

    features = build_features(candles)

    if not features or len(features) < 5:
        return {"status": "error", "message": "Not enough features"}

    # 🔥 TAKE LAST 5 FEATURES (IMPORTANT FIX)
    last_5 = features[-5:]
    latest_feature = last_5[-1]

    # Get predictions from all algorithms
    algorithms = ["RandomForest", "SVM", "LogisticRegression"]
    predictions = {}
    
    for algo in algorithms:
        pred = predict_with_model(algo, latest_feature)
        predictions[algo] = pred
    
    # Get consensus decision
    consensus = consensus_service.get_consensus_signal(predictions)
    
    # Also get traditional strategy signal for comparison
    strategy_signal = generate_signal_from_features(last_5)

    return {
        "status": "success",
        "symbol": symbol.upper(),
        "consensus_signal": consensus["consensus_signal"],
        "consensus_strength": consensus["consensus_strength"],
        "weighted_confidence": consensus["weighted_confidence"],
        "explanation": consensus["explanation"],
        "voting_breakdown": consensus["voting_breakdown"],
        "individual_predictions": consensus["individual_predictions"],
        "strategy_signal": strategy_signal,
        "features": last_5
    }

@router.get("/model-performance")
def get_model_performance():
    """Get dynamic model performance and accuracies"""
    return {
        "status": "success",
        "performance": consensus_service.get_performance_summary(),
        "current_accuracies": consensus_service.get_dynamic_accuracies()
    }

@router.post("/paper-trade")
def paper_trade_run(
    symbols: list[str],
    user_id: int = Depends(get_current_user)
):
    """
    Auto-create trades based on signals for selected symbols
    """
    trades = run_paper_trading(user_id, symbols)
    return {
        "status": "success",
        "trades_created": trades
    }

# Add this in trade_routes.py temporarily
@router.get("/paper-trade-test")
def paper_trade_test(user_id: int = Depends(get_current_user)):
    """
    Quick browser test for paper trading.
    Auto-trades BTCUSDT and ETHUSDT for the current user.
    """
    trades = run_paper_trading(user_id, ["BTCUSDT","ETHUSDT"])
    return {
        "status": "success",
        "trades_created": trades
    }

# a single backend endpoint that does everything in one go for testing:

@router.post("/paper-trade/full")
def paper_trade_full(
    symbols: list[str] = Body(...),
    user_id: int = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Creates trades for all symbols (simulated)
    Uses the existing add_trade function for proper execution
    """
    trades_created = []
    skipped = []
    
    for symbol in symbols:
        current_price = get_current_price(symbol)
        if current_price is None:
            print(f"No price for {symbol}, skipping trade")
            skipped.append(symbol)
            continue

        try:
            # Calculate reasonable quantity based on $10 default trade size for testing
            trade_value = 10.0  # Default $10 trade size for testing
            
            # For expensive assets, use fractional quantity
            if current_price > trade_value:
                quantity = trade_value / current_price  # This will be < 1
            else:
                quantity = trade_value / current_price  # This will be >= 1
            
            print(f"Calculated quantity: {quantity} for {symbol} at ${current_price}")
            
            # Create a proper TradeRequest using the schema with current price
            trade_data = TradeRequest(
                symbol=symbol,
                price=current_price,
                quantity=quantity,
                trade_type="BUY"
            )
            
            # Use the existing add_trade function
            trade = add_trade(trade_data, user_id, db)
            
            if trade:
                trades_created.append(trade.id)
                print(f"Trade created: {trade.id} for {symbol} - {quantity} units at ${current_price}")
            
        except Exception as e:
            print(f"Error creating trade for {symbol}: {e}")
            skipped.append(symbol)

    return {
        "status": "success",
        "trades_created": trades_created,
        "skipped": skipped
    }

# router for performance one
@router.get("/performance")
def performance(user_id: int = Depends(get_current_user)):
    return get_performance(user_id)


# route for portfolio
@router.get("/portfolio")
def portfolio(user_id: int = Depends(get_current_user)):
    return get_portfolio(user_id)



@router.get("/summary/{user_id}")
def account_summary(user_id: int):
    return get_account_summary(user_id)

# for account summary we use this
@router.get("/account")
def account_summary(user_id: int = Depends(get_current_user)):
    """
    Returns the account summary for the current logged-in user
    """
    summary = get_account_summary(user_id)
    return summary


@router.get("/train")
def train():
    result = train_model()
    return result