"""
app/models/comment.py — Replace your existing file with this.
Changes: added `is_ai` boolean + made `user_id` nullable so AI can post without a user account.
"""

import uuid
from datetime import datetime

from sqlalchemy import Column, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database.base import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    content = Column(Text, nullable=False)

    blog_id = Column(UUID(as_uuid=True), ForeignKey("blogs.id", ondelete="CASCADE"), nullable=False)

    # nullable=True so AI comments don't need a real user
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)

    # True for Ollama-generated comments
    is_ai = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    blog = relationship("Blog", backref="comments")
    user = relationship("User", foreign_keys=[user_id])