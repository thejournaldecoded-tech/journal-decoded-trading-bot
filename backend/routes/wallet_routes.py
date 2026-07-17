from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.wallet import Wallet
from utils.dependencies import get_current_user

router = APIRouter()

@router.post("/wallet/create")
def create_wallet(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a wallet for the current user"""
    try:
        # Check if wallet already exists
        existing_wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if existing_wallet:
            return {
                "status": "success",
                "message": "Wallet already exists",
                "wallet": {
                    "balance": existing_wallet.balance
                }
            }
        
        # Create new wallet with default balance
        wallet = Wallet(
            user_id=user_id,
            balance=10000.0  # Default paper trading balance
        )
        
        db.add(wallet)
        db.commit()
        db.refresh(wallet)
        
        return {
            "status": "success",
            "message": "Wallet created successfully",
            "wallet": {
                "balance": wallet.balance
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/wallet")
def get_wallet(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get wallet balance for the current user"""
    try:
        wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            return {
                "status": "not_found",
                "message": "Wallet not found"
            }
        
        return {
            "status": "success",
            "wallet": {
                "balance": wallet.balance
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/wallet/reset")
def reset_wallet(user_id: int = Depends(get_current_user), db: Session = Depends(get_db)):
    """Reset wallet to default balance"""
    try:
        wallet = db.query(Wallet).filter(Wallet.user_id == user_id).first()
        if not wallet:
            # Create wallet if it doesn't exist
            wallet = Wallet(
                user_id=user_id,
                balance=10000.0
            )
            db.add(wallet)
        else:
            # Reset existing wallet
            wallet.balance = 10000.0
        
        db.commit()
        db.refresh(wallet)
        
        return {
            "status": "success",
            "message": "Wallet reset to $10,000",
            "wallet": {
                "balance": wallet.balance
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
