from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from services.supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(body: AuthRequest):
    response = supabase.auth.sign_up({"email": body.email, "password": body.password})
    if response.user is None:
        raise HTTPException(status_code=400, detail="Sign-up failed")
    return {
        "user_id": response.user.id,
        "email": response.user.email,
        "message": "Account created. Check your email to confirm your address.",
    }


@router.post("/login")
def login(body: AuthRequest):
    response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    if response.user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": response.session.access_token,
        "token_type": "bearer",
        "user_id": response.user.id,
        "email": response.user.email,
    }
