from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional, List
from database import get_db
from models.post import Post
from models.user import User
from utils.security import decode_access_token
import json

router = APIRouter()


# ── Helpers ──────────────────────────────────────────────────────────────────

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == payload.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)):
    if not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


# ── Schemas ───────────────────────────────────────────────────────────────────

class ImageItem(BaseModel):
    url: str
    caption: str = ""


class CreatePostRequest(BaseModel):
    title: str
    summary: str
    content: str
    section: str          # 'economics' | 'strategy' | 'insights'
    images: List[ImageItem] = []
    read_time: str = "5 min read"


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/posts")
def list_posts(section: Optional[str] = None, db: Session = Depends(get_db)):
    """Public: list published posts, optionally filtered by section."""
    query = db.query(Post).filter(Post.published == True)
    if section:
        query = query.filter(Post.section == section.lower())
    posts = query.order_by(Post.created_at.desc()).all()
    return [
        {
            "id": p.id,
            "title": p.title,
            "summary": p.summary,
            "section": p.section,
            "images": json.loads(p.images or "[]"),
            "author": p.author,
            "read_time": p.read_time,
            "created_at": p.created_at.isoformat() if p.created_at else None,
        }
        for p in posts
    ]


@router.get("/posts/{post_id}")
def get_post(post_id: int, db: Session = Depends(get_db)):
    """Public: get a single post by ID."""
    post = db.query(Post).filter(Post.id == post_id, Post.published == True).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return {
        "id": post.id,
        "title": post.title,
        "summary": post.summary,
        "content": post.content,
        "section": post.section,
        "images": json.loads(post.images or "[]"),
        "author": post.author,
        "read_time": post.read_time,
        "created_at": post.created_at.isoformat() if post.created_at else None,
    }


@router.post("/posts")
def create_post(data: CreatePostRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin only: create a new post."""
    valid_sections = {"economics", "strategy", "insights"}
    if data.section.lower() not in valid_sections:
        raise HTTPException(status_code=400, detail=f"section must be one of: {valid_sections}")

    post = Post(
        title=data.title,
        summary=data.summary,
        content=data.content,
        section=data.section.lower(),
        images=json.dumps([img.dict() for img in data.images]),
        author=admin.username,
        read_time=data.read_time,
        published=True,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return {"status": "success", "post_id": post.id, "section": post.section}


@router.delete("/posts/{post_id}")
def delete_post(post_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    """Admin only: delete a post."""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"status": "deleted", "post_id": post_id}


@router.get("/admin/check")
def check_admin(user: User = Depends(get_current_user)):
    """Check if the current user is an admin."""
    return {"is_admin": user.is_admin, "username": user.username}
