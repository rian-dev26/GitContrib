"""Auth API routes."""

from fastapi import APIRouter

router = APIRouter(prefix="/api/auth", tags=["auth"])

from app.auth import create_access_token, verify_token
from fastapi import HTTPException


@router.post("/login")
async def login(username: str, password: str):
    """Login with username and password."""
    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password required")
    
    access_token = create_access_token(data={"sub": username})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": username,
    }


@router.post("/logout")
async def logout():
    """Logout endpoint (client removes token)."""
    return {"message": "Logged out successfully"}
