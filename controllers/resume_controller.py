import logging

from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from supabase_auth.errors import AuthApiError

from services.supabase_client import supabase, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resume", tags=["resume"])

BUCKET = "resumes"
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    logger.info(f"[resume/upload] Request received — filename: {file.filename}, content_type: {file.content_type}")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        logger.warning(f"[resume/upload] Rejected non-PDF file: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    raw_token = authorization
    token = authorization.removeprefix("Bearer").strip()
    logger.debug(f"[resume/upload] Authorization header received: '{raw_token}'")
    logger.debug(f"[resume/upload] Extracted token: '{token[:30]}...' (length: {len(token)})")

    if not token:
        logger.error(f"[resume/upload] Token is empty after stripping 'Bearer' — raw header was: '{raw_token}'")
        raise HTTPException(status_code=401, detail="No token provided — Authorization header must be 'Bearer <token>'")

    try:
        logger.debug(f"[resume/upload] Calling supabase.auth.get_user with token: {token}")
        user_response = supabase.auth.get_user(token)
        logger.debug(f"[resume/upload] get_user response: {user_response}")
    except AuthApiError as e:
        logger.error(f"[resume/upload] AuthApiError validating token — token: {token}, error: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    except Exception as e:
        logger.exception(f"[resume/upload] Unexpected error calling get_user — token: {token}, error: {e}")
        raise HTTPException(status_code=500, detail="Unexpected error validating token")

    user_id = user_response.user.id
    logger.info(f"[resume/upload] Token valid — user_id: {user_id}, email: {user_response.user.email}")

    contents = await file.read()
    logger.debug(f"[resume/upload] File read — size: {len(contents)} bytes, limit: {MAX_SIZE_BYTES} bytes")

    if len(contents) > MAX_SIZE_BYTES:
        logger.warning(f"[resume/upload] File too large — size: {len(contents)} bytes, user_id: {user_id}")
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    storage_path = f"{user_id}/{file.filename}"
    logger.debug(f"[resume/upload] Uploading to Supabase Storage — bucket: {BUCKET}, path: {storage_path}")

    storage_client = supabase_admin or supabase
    try:
        storage_client.storage.from_(BUCKET).upload(
            path=storage_path,
            file=contents,
            file_options={"content-type": "application/pdf", "upsert": "true"},
        )
        logger.debug(f"[resume/upload] Upload to Supabase Storage succeeded — path: {storage_path}")
    except Exception as e:
        logger.exception(f"[resume/upload] Failed to upload to Supabase Storage — path: {storage_path}, error: {e}")
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {e}")

    public_url = storage_client.storage.from_(BUCKET).get_public_url(storage_path)
    logger.info(f"[resume/upload] Success — user_id: {user_id}, path: {storage_path}, url: {public_url}")

    return {
        "message": "Resume uploaded successfully",
        "path": storage_path,
        "url": public_url,
    }
