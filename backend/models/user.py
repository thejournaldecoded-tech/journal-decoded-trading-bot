from sqlalchemy import Column, Integer, String, Float, Boolean
from database import engine
from models.base import Base


class User(Base):

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(String, unique=True, nullable=False)

    email = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)

    balance = Column(Float, default=10000.0)

    is_admin = Column(Boolean, default=False)
