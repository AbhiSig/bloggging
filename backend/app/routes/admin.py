from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
import asyncio

from app.database.connection import SessionLocal
from app.models.blog import Blog, BlogStatus
from app.schemas.blog import BlogResponse
from app.dependencies.auth import admin_required
from app.models.user import User
from app.services.ai_comment_service import generate_ai_comment
from app.models.comment import Comment

router = APIRouter(prefix="/admin", tags=["Admin"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Background task (same pattern as blogs.py) ──────────────────────────────

async def _post_ai_comment(blog_id: UUID, blog_title: str, blog_content: str, author_name: str):
    await asyncio.sleep(3)

    comment_text = await generate_ai_comment(
        blog_title=blog_title,
        blog_content=blog_content,
        author_name=author_name,
    )

    if not comment_text:
        return

    db = SessionLocal()
    try:
        ai_comment = Comment(
            content=comment_text,
            blog_id=blog_id,
            user_id=None,
            is_ai=True,
        )
        db.add(ai_comment)
        db.commit()
        print(f"✅ AI comment saved for approved blog {blog_id}")
    except Exception as e:
        print(f"❌ Failed to save AI comment: {e}")
        db.rollback()
    finally:
        db.close()


# ─── Routes ──────────────────────────────────────────────────────────────────

# ✅ View All Rejected Blogs
@router.get("/rejected", response_model=list[BlogResponse])
def get_rejected_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    return db.query(Blog).filter(Blog.status == BlogStatus.REJECTED).all()


# ✅ View All Pending Blogs
@router.get("/pending", response_model=list[BlogResponse])
def get_pending_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(admin_required),
):
    return db.query(Blog).filter(Blog.status == BlogStatus.PENDING).all()


# ✅ Manually Approve Blog — now async so we can fire the AI comment task
@router.put("/approve/{blog_id}")
async def approve_blog(
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
    db.refresh(blog)

    # Trigger AI comment in background — never blocks the admin response
    asyncio.create_task(
        _post_ai_comment(
            blog_id=blog.id,
            blog_title=blog.title,
            blog_content=blog.content,
            author_name=blog.author.email if blog.author else "Author",
        )
    )

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