import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DEFAULT_DB_URL = 'postgresql://neondb_owner:npg_n3tDFhKqJ0sc@ep-empty-violet-a1e4xf24-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()