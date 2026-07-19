from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime
from sqlalchemy.sql import func
from models.base import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=False)
    content = Column(Text, nullable=False)
    section = Column(String, nullable=False)  # 'economics' | 'strategy' | 'insights'
    images = Column(Text, default="[]")       # JSON string: [{url, caption}]
    author = Column(String, default="JournalDecoded")
    read_time = Column(String, default="5 min read")
    published = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
