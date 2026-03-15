from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from uuid import UUID
import os
import uuid

from app.database.connection import SessionLocal
from app.models.blog import Blog, BlogStatus
from app.schemas.blog import BlogResponse
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.services.moderation_service import moderate_content
from app.websocket.manager import manager

router = APIRouter(prefix="/blogs", tags=["Blogs"])

BASE_URL = os.getenv("BASE_URL", "http://localhost:8000")

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_IMAGE_SIZE_MB = 5


def get_db():
    db = SessionLocal()
    try:
        yield db
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
        raise HTTPException(
            status_code=403,
            detail="Blog not publicly available"
        )

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

    # -----------------------------
    # Image Upload Handling
    # -----------------------------
    if image:

        if image.content_type not in ALLOWED_IMAGE_TYPES:
            raise HTTPException(
                status_code=400,
                detail="Invalid image type"
            )

        contents = await image.read()

        if len(contents) > MAX_IMAGE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"Image too large (max {MAX_IMAGE_SIZE_MB}MB)"
            )

        os.makedirs("uploads", exist_ok=True)

        filename = f"{uuid.uuid4()}_{image.filename}"
        file_path = f"uploads/{filename}"

        with open(file_path, "wb") as f:
            f.write(contents)

        image_url = f"{BASE_URL}/uploads/{filename}"

    # -----------------------------
    # AI MODERATION
    # -----------------------------
    try:
        moderation = moderate_content(content)
    except Exception:
        moderation = {
            "approved": False,
            "flagged": True,
            "reason": "Moderation service error"
        }

    status = BlogStatus.APPROVED
    reason = None

    if not moderation.get("approved"):

        if moderation.get("flagged"):
            status = BlogStatus.PENDING
        else:
            status = BlogStatus.REJECTED

        reason = str(moderation.get("reason"))

    # -----------------------------
    # SAVE BLOG
    # -----------------------------
    new_blog = Blog(
        title=title,
        content=content,
        image_url=image_url,
        author_id=current_user.id,
        status=status,
        moderation_reason=reason
    )

    db.add(new_blog)
    db.commit()
    db.refresh(new_blog)

    # -----------------------------
    # Notify Admin if Pending
    # -----------------------------
    if status == BlogStatus.PENDING:
        await manager.notify_admin(
            f"🔔 Blog pending review: '{title}' by {current_user.email}"
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

    moderation = moderate_content(content)

    if moderation.get("approved"):
        blog.status = BlogStatus.APPROVED
        blog.moderation_reason = None

    elif moderation.get("flagged"):
        blog.status = BlogStatus.PENDING
        blog.moderation_reason = str(moderation.get("reason"))

    else:
        blog.status = BlogStatus.REJECTED
        blog.moderation_reason = str(moderation.get("reason"))

    blog.title = title
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
        filename = blog.image_url.split("/uploads/")[-1]
        file_path = f"uploads/{filename}"

        if os.path.exists(file_path):
            os.remove(file_path)

    db.delete(blog)
    db.commit()

    return {"message": "Blog deleted successfully"}