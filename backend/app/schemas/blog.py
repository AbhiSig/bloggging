from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class BlogAuthor(BaseModel):
    username: str

    class Config:
        from_attributes = True


class BlogCreate(BaseModel):
    title: str
    content: str


class BlogResponse(BaseModel):
    id: UUID
    title: str
    content: str
    image_url: str | None
    author: BlogAuthor
    created_at: datetime

    class Config:
        from_attributes = True