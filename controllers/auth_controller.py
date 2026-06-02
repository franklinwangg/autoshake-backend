import logging
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from supabase_auth.errors import AuthApiError

from services.supabase_client import supabase, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])


class AuthRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
def signup(body: AuthRequest):
    logger.info(f"[signup] Request received for email: {body.email}")

    try:
        logger.debug(f"[signup] Sending sign_up request to Supabase for: {body.email}")
        response = supabase.auth.sign_up({"email": body.email, "password": body.password})
        print("SIGNUP RESULT:", response)
        logger.debug(f"[signup] Supabase response received — user: {response.user}, session: {response.session}")
    except AuthApiError as e:
        logger.error(f"[signup] Supabase AuthApiError for {body.email}: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.exception(f"[signup] Unexpected error for {body.email}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error during sign-up")

    if response.user is None:
        logger.warning(f"[signup] No user returned by Supabase for {body.email}")
        raise HTTPException(status_code=400, detail="Sign-up failed")

    logger.info(f"[signup] Success — user_id: {response.user.id}, email: {response.user.email}, confirmed: {response.user.email_confirmed_at}")
    # profiles row is created automatically by the on_auth_user_created DB trigger

    return {
        "user_id": response.user.id,
        "email": response.user.email,
        "message": "Account created. Check your email to confirm your address.",
    }


@router.post("/login")
def login(body: AuthRequest):
    logger.info(f"[login] Request received for email: {body.email}")

    try:
        logger.debug(f"[login] Sending sign_in_with_password to Supabase — email: {body.email}, password: {body.password}")
        response = supabase.auth.sign_in_with_password({"email": body.email, "password": body.password})
        print("LOGIN RESULT:", response)
        logger.debug(f"[login] Supabase response received — user: {response.user}, session present: {response.session is not None}")
    except AuthApiError as e:
        logger.error(f"[login] Supabase AuthApiError — email: {body.email}, password: {body.password}, error: {e}")
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        logger.exception(f"[login] Unexpected error for {body.email}: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error during login")

    if response.user is None:
        logger.warning(f"[login] No user returned by Supabase for {body.email}")
        raise HTTPException(status_code=401, detail="Invalid email or password")

    logger.info(f"[login] Success — user_id: {response.user.id}, email: {response.user.email}")

    if supabase_admin:
        try:
            supabase_admin.table("profiles").update({
                "last_seen_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", response.user.id).execute()
            logger.debug(f"[login] last_seen_at updated for user_id: {response.user.id}")
        except Exception as e:
            logger.warning(f"[login] Profile update failed for user_id: {response.user.id} — {e}")
    else:
        logger.warning("[login] SUPABASE_SERVICE_ROLE_KEY not set — skipping last_seen_at update")

    return {
        "access_token": response.session.access_token,
        "token_type": "bearer",
        "user_id": response.user.id,
        "email": response.user.email,
    }
