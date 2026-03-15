import uuid
import enum
from datetime import datetime

from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class BlogStatus(str, enum.Enum):
    PENDING = "PENDING"      # waiting for admin review
    APPROVED = "APPROVED"    # visible publicly
    REJECTED = "REJECTED"    # blocked by moderation


class Blog(Base):
    __tablename__ = "blogs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)

    image_url = Column(String, nullable=True)

    author_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    author = relationship("User", backref="blogs")

    status = Column(
        Enum(BlogStatus),
        default=BlogStatus.PENDING,
        nullable=False,
        index=True
    )

    # why the blog was flagged or rejected
    moderation_reason = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )