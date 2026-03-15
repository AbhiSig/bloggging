from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.connection import engine
from app.database.base import Base

# Models
from app.models import user, blog, comment

# Routes
from app.routes import auth, blogs, comments, admin, ws_admin

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Blog AI Platform")

# ----------------------------
# Middleware
# ----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Static files
# ----------------------------
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ----------------------------
# Routers
# ----------------------------
app.include_router(auth.router)
app.include_router(blogs.router)
app.include_router(comments.router)  # NEW
app.include_router(admin.router)
app.include_router(ws_admin.router)


@app.get("/")
def root():
    return {
        "message": "Blog AI Backend Running 🚀",
        "features": [
            "User authentication",
            "AI blog moderation",
            "Admin dashboard",
            "Real-time admin notifications",
            "Image upload support",
            "Blog comment system"
        ],
    }