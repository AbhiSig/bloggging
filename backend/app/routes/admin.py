from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID

from app.database.connection import SessionLocal
from app.models.blog import Blog, BlogStatus
from app.schemas.blog import BlogResponse
from app.dependencies.auth import admin_required
from app.models.user import User

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ✅ View All Rejected Blogs
@router.get("/rejected", response_model=list[BlogResponse])
def get_rejected_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    blogs = db.query(Blog).filter(
        Blog.status == BlogStatus.REJECTED
    ).all()

    return blogs


# ✅ View All Pending Blogs
@router.get("/pending", response_model=list[BlogResponse])
def get_pending_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    blogs = db.query(Blog).filter(
        Blog.status == BlogStatus.PENDING
    ).all()

    return blogs


# ✅ Manually Approve Blog
@router.put("/approve/{blog_id}")
def approve_blog(
    blog_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()

    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    blog.status = BlogStatus.APPROVED
    blog.moderation_reason = None

    db.commit()

    return {"message": "Blog approved successfully"}


# ✅ Manually Reject Blog
@router.put("/reject/{blog_id}")
def reject_blog(
    blog_id: UUID,
    reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()

    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    blog.status = BlogStatus.REJECTED
    blog.moderation_reason = reason

    db.commit()

    return {"message": "Blog rejected successfully"}