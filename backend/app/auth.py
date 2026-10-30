"""Authentication endpoints and utilities."""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import jwt
import os

from app.schemas import AnalyzeRepoRequest
from app.database import get_db

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Secret key untuk JWT
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> dict:
    """Verify JWT token."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/login")
async def login(username: str, password: str):
    """
    Login endpoint. Accepts any credentials (demo mode).
    In production: validate against user database.
    """
    # Demo: accept any username/password
    # Production: check against database
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    # Create token
    access_token = create_access_token(data={"sub": username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": username,
    }


@router.post("/logout")
async def logout():
    """
    Logout endpoint (client-side: just delete token).
    """
    return {"message": "Logged out successfully"}


def get_current_user(token: str = None) -> dict:
    """
    Dependency to get current user from token.
    If no token, return None (for optional auth).
    """
    if not token:
        return None
    return verify_token(token)
