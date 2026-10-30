"""Auth API routes."""

from fastapi import APIRouter, HTTPException, Request
from typing import Optional
from pydantic import BaseModel

from app.auth import create_access_token, verify_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


@router.post("/login")
async def login(
    request: Request,
    username: Optional[str] = None,
    password: Optional[str] = None,
):
    """
    Login endpoint supporting JSON body, Form data, or query params.
    Generates a JWT access token.
    """
    user = username
    pwd = password

    # 1. Try reading as JSON body
    try:
        data = await request.json()
        if isinstance(data, dict):
            user = user or data.get("username") or data.get("email")
            pwd = pwd or data.get("password")
    except Exception:
        pass

    # 2. Try reading as Form data
    if not user or not pwd:
        try:
            form = await request.form()
            user = user or form.get("username") or form.get("email")
            pwd = pwd or form.get("password")
        except Exception:
            pass

    if not user or not pwd:
        raise HTTPException(
            status_code=400,
            detail="Username (or email) and password are required"
        )

    access_token = create_access_token(data={"sub": str(user)})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": str(user),
    }


@router.post("/logout")
async def logout():
    """Logout endpoint (client removes token)."""
    return {"message": "Logged out successfully"}
