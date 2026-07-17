from fastapi import APIRouter, Depends, HTTPException
from services.auto_trading_service import auto_trading_service
from utils.dependencies import get_current_user
from pydantic import BaseModel
from typing import Dict

router = APIRouter()

class AutoTradingConfig(BaseModel):
    enabled: bool
    symbols: list[str] = ['BTCUSDT']
    min_confidence: float = 60.0
    min_accuracy: float = 60.0
    position_size: float = 5.0  # percentage
    max_trades_per_hour: int = 5
    risk_level: str = 'medium'  # low, medium, high

@router.post("/auto-trading/start")
def start_auto_trading(config: AutoTradingConfig, user_id: int = Depends(get_current_user)):
    """Start auto trading for the current user"""
    try:
        config_dict = config.dict()
        auto_trading_service.start_auto_trading(user_id, config_dict)
        return {
            "status": "success",
            "message": "Auto trading started",
            "config": config_dict
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auto-trading/stop")
def stop_auto_trading(user_id: int = Depends(get_current_user)):
    """Stop auto trading for the current user"""
    try:
        auto_trading_service.stop_auto_trading(user_id)
        return {
            "status": "success",
            "message": "Auto trading stopped"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/auto-trading/status")
def get_auto_trading_status(user_id: int = Depends(get_current_user)):
    """Get auto trading status for the current user"""
    try:
        status = auto_trading_service.get_auto_trading_status(user_id)
        if not status:
            return {
                "status": "not_started",
                "message": "Auto trading not started"
            }
        return {
            "status": "success",
            "auto_trading": status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/auto-trading/all-status")
def get_all_auto_trading_status():
    """Get all auto trading status (admin only)"""
    try:
        return {
            "status": "success",
            "auto_traders": auto_trading_service.auto_traders
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/auto-trading/process-signals")
async def process_signals():
    """Manually trigger signal processing (for testing)"""
    try:
        await auto_trading_service.process_signals()
        return {
            "status": "success",
            "message": "Signals processed"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
