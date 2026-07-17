from fastapi import APIRouter, Depends
from pydantic import BaseModel
from services.user_service import create_user, authenticate_user
from utils.security import create_access_token
from models.wallet import Wallet
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()


class SignupRequest(BaseModel):

    username: str
    email: str
    password: str


class LoginRequest(BaseModel):

    username: str
    password: str


@router.post("/signup")
def signup(data: SignupRequest, db: Session = Depends(get_db)):

    user = create_user(
        db,
        data.username,
        data.email,
        data.password
    )


    # 🔥 Create wallet for new user
    wallet = Wallet(
        user_id=user.id,
        balance=100000
    )

    db.add(wallet)
    db.commit()

    return {
        "status": "success",
        "user_id": user.id
    }


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = authenticate_user(
        db,
        data.username,
        data.password
    )

    if not user:

        return {
            "status": "error",
            "message": "Invalid credentials"
        }

    token = create_access_token(
        {"user_id": user.id}
    )

    return {
        "status": "success",
        "access_token": token
    }
