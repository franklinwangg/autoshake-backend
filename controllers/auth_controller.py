from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase_auth.errors import AuthApiError

from services.supabase_client import supabase

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(body: AuthRequest):
    try:
        response = supabase.auth.sign_up({"email": body.email, "password": body.password})
    except AuthApiError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if response.user is None:
        raise HTTPException(status_code=400, detail="Sign-up failed")
    return {
        "user_id": response.user.id,
        "email": response.user.email,
        "message": "Account created. Check your email to confirm your address.",
    }


@router.post("/login")
def login(body: AuthRequest):
    try:
        response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
    except AuthApiError as e:
        raise HTTPException(status_code=401, detail=str(e))
    if response.user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return {
        "access_token": response.session.access_token,
        "token_type": "bearer",
        "user_id": response.user.id,
        "email": response.user.email,
    }
