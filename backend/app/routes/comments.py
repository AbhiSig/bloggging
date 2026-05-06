"""
app/routes/comments.py — Replace your existing file.
Change: CommentResponse now includes `is_ai` so the frontend can show the AI badge.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from uuid import UUID
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from app.database.connection import SessionLocal
from app.models.comment import Comment
from app.schemas.comment import CommentCreate, CommentResponse
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.moderation_service import moderate_content

router = APIRouter(prefix="/comments", tags=["Comments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Inline response schema (override your existing CommentResponse if needed) ─
# If your app/schemas/comment.py already defines CommentResponse, just add
# `is_ai: bool = False` to that class instead of using this one.

class CommentResponse(BaseModel):
    id: UUID
    content: str
    blog_id: UUID
    user_id: Optional[UUID] = None   # None for AI comments
    is_ai: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.post("/{blog_id}", response_model=CommentResponse)
def create_comment(
    blog_id: UUID,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    moderation = moderate_content(comment.content)

    if not moderation["approved"]:
        raise HTTPException(
            status_code=400,
            detail="Comment contains abusive language",
        )

    new_comment = Comment(
        content=comment.content,
        blog_id=blog_id,
        user_id=current_user.id,
        is_ai=False,
    )

    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)

    return new_comment


@router.get("/{blog_id}", response_model=list[CommentResponse])
def get_blog_comments(
    blog_id: UUID,
    db: Session = Depends(get_db),
):
    comments = (
        db.query(Comment)
        .options(joinedload(Comment.user))
        .filter(Comment.blog_id == blog_id)
        .order_by(Comment.created_at.desc())
        .all()
    )

    return comments