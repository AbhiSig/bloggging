from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class CommentCreate(BaseModel):
    content: str


class CommentUser(BaseModel):
    username: str

    class Config:
        from_attributes = True


class CommentResponse(BaseModel):
    id: UUID
    content: str
    created_at: datetime
    user: CommentUser

    class Config:
        from_attributes = True