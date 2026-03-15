from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import SessionLocal
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserLogin
from app.schemas.token import Token
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# -----------------------------
# REGISTER USER
# -----------------------------
@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):

    existing = db.query(User).filter(
        (User.email == user.email) | (User.username == user.username)
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=UserRole.USER
    )

    db.add(new_user)
    db.commit()

    return {"message": "User registered successfully"}


# -----------------------------
# LOGIN USER
# -----------------------------
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):

    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = create_access_token({
        "sub": str(db_user.id),
        "role": db_user.role.value
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "role": db_user.role.value,
        "username": db_user.username   # ✅ added
    }