from database import SessionLocal
from models.user import User
from utils.security import hash_password, verify_password
from sqlalchemy import or_ # needed for OR queries
from sqlalchemy.orm import Session


def create_user(db: Session, username: str, email: str, password: str):

    #db = SessionLocal()

    hashed = hash_password(password)

    user = User(
        username=username,
        email=email,
        password=hashed
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    #db.close()

    return user



def authenticate_user(db: Session, identifier: str, password: str):

    user = db.query(User).filter(
        or_(User.username == identifier, User.email == identifier)
    ).first()

    if not user:
        return None

    if not verify_password(password, user.password):
        return None

    return user