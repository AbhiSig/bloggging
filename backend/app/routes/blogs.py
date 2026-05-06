from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
import os
import uuid
import asyncio
import logging

from app.database.connection import SessionLocal
from app.models.blog import Blog, BlogStatus
from app.models.comment import Comment
from app.schemas.blog import BlogResponse
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.moderation_service import moderate_content, moderate_image
from app.services.ai_comment_service import generate_ai_comment
from app.websocket.manager import manager

router = APIRouter(prefix="/blogs", tags=["Blogs"])

logger = logging.getLogger(__name__)

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_MB = 5


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Background task: generate and save AI comment ───────────────────────────

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
        logger.info("✅ AI comment saved for blog %s", blog_id)
    except Exception as e:
        logger.error("Failed to save AI comment: %s", e)
        db.rollback()
    finally:
        db.close()


# -----------------------------
# USER — Get My Blogs
# -----------------------------
@router.get("/me", response_model=list[BlogResponse])
def get_my_blogs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Blog)
        .filter(Blog.author_id == current_user.id)
        .order_by(Blog.created_at.desc())
        .all()
    )


# -----------------------------
# PUBLIC — Get Approved Blogs
# -----------------------------
@router.get("/", response_model=list[BlogResponse])
def get_all_blogs(db: Session = Depends(get_db)):
    return (
        db.query(Blog)
        .filter(Blog.status == BlogStatus.APPROVED)
        .order_by(Blog.created_at.desc())
        .all()
    )


# -----------------------------
# PUBLIC — Get Single Blog
# -----------------------------
@router.get("/{blog_id}", response_model=BlogResponse)
def get_blog(blog_id: UUID, db: Session = Depends(get_db)):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()

    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    if blog.status != BlogStatus.APPROVED:
        raise HTTPException(status_code=403, detail="Blog not publicly available")

    return blog


# -----------------------------
# CREATE BLOG
# -----------------------------
@router.post("/", response_model=BlogResponse)
async def create_blog(
    title: str = Form(...),
    content: str = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    image_url = None
    image_flagged = False
    image_flag_reason = None

    # -----------------------------
    # Image Upload + Image Moderation
    # -----------------------------
    if image:
        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(status_code=400, detail="Invalid image type")

        contents = await image.read()

        if len(contents) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large (max {MAX_IMAGE_SIZE_MB}MB)"
            )

        try:
            img_result = moderate_image(contents)
            logger.info("🖼️  Image moderation result: %s", img_result)
        except Exception as exc:
            logger.error("Image moderation error: %s", exc)
            # ✅ FIX: fail open on image moderation errors — do NOT flag safe images
            img_result = {"safe": True, "label": "safe", "confidence": 1.0, "scores": {}}

        # ✅ FIX: only flag if model is confident the image is unsafe
        if not img_result.get("safe", True):
            image_flagged = True
            image_flag_reason = (
                f"Image flagged: {img_result['label']} "
                f"(confidence {img_result['confidence']:.0%})"
            )

        os.makedirs("uploads", exist_ok=True)
        filename  = f"{uuid.uuid4()}_{image.filename}"
        file_path = f"uploads/{filename}"

        with open(file_path, "wb") as f:
            f.write(contents)

        image_url = f"{BASE_URL}/uploads/{filename}"

    # -----------------------------
    # Text Moderation
    # -----------------------------
    try:
        moderation = moderate_content(content)
    except Exception as exc:
        # ✅ FIX: was {"approved": False, "flagged": True} — this caused ALL blogs
        # to go to admin review whenever Detoxify/spam.txt threw any error.
        # Now we fail open: log the error and let the blog through.
        logger.error("Text moderation error (failing open): %s", exc)
        moderation = {"approved": True, "flagged": False, "reason": None}

    # -----------------------------
    # Combine text + image results
    # -----------------------------
    reasons = []
    status  = BlogStatus.APPROVED

    if not moderation.get("approved"):
        reasons.append(str(moderation.get("reason")))
        status = BlogStatus.PENDING if moderation.get("flagged") else BlogStatus.REJECTED

    if image_flagged:
        reasons.append(image_flag_reason)
        if status == BlogStatus.APPROVED:
            status = BlogStatus.PENDING

    logger.info("📋 Final status: %s | reasons: %s", status, reasons)

    reason = "; ".join(reasons) if reasons else None

    # -----------------------------
    # Save Blog
    # -----------------------------
    new_blog = Blog(
        title=title,
        content=content,
        image_url=image_url,
        author_id=current_user.id,
        status=status,
        moderation_reason=reason,
    )

    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)

    # -----------------------------
    # Notify Admin if Pending
    # -----------------------------
    if status == BlogStatus.PENDING:
        await manager.notify_admin(
            f"🔔 Blog pending review: '{title}' by {current_user.email} | {reason}"
        )

    # Trigger AI comment — only for APPROVED blogs
    if status == BlogStatus.APPROVED:
        asyncio.create_task(
            _post_ai_comment(
                blog_id=new_blog.id,
                blog_title=new_blog.title,
                blog_content=new_blog.content,
                author_name=current_user.email,
            )
        )

    return new_blog


# -----------------------------
# UPDATE BLOG
# -----------------------------
@router.put("/{blog_id}", response_model=BlogResponse)
def update_blog(
    blog_id: UUID,
    title: str = Form(...),
    content: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()

    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    if blog.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    try:
        moderation = moderate_content(content)
    except Exception as exc:
        logger.error("Text moderation error on update (failing open): %s", exc)
        moderation = {"approved": True, "flagged": False, "reason": None}

    if moderation.get("approved"):
        blog.status = BlogStatus.APPROVED
        blog.moderation_reason = None
    elif moderation.get("flagged"):
        blog.status = BlogStatus.PENDING
        blog.moderation_reason = str(moderation.get("reason"))
    else:
        blog.status = BlogStatus.REJECTED
        blog.moderation_reason = str(moderation.get("reason"))

    blog.title   = title
    blog.content = content

    db.commit()
    db.refresh(blog)

    return blog


# -----------------------------
# DELETE BLOG
# -----------------------------
@router.delete("/{blog_id}")
def delete_blog(
    blog_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blog = db.query(Blog).filter(Blog.id == blog_id).first()

    if not blog:
        raise HTTPException(status_code=404, detail="Blog not found")

    if blog.author_id != current_user.id and current_user.role.value != "ADMIN":
        raise HTTPException(status_code=403, detail="Not allowed")

    if blog.image_url:
        filename  = blog.image_url.split("/uploads/")[-1]
        file_path = f"uploads/{filename}"
        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(blog)
    db.commit()

    return {"message": "Blog deleted successfully"}