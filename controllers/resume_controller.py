import io
import logging

import httpx
import pypdf
from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from pydantic import BaseModel
from supabase_auth.errors import AuthApiError

from services.supabase_client import supabase, supabase_admin

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/resume", tags=["resume"])

BUCKET = "resumes"
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


def _get_user_from_token(authorization: str):
    token = authorization.removeprefix("Bearer").strip()
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    try:
        user_response = supabase.auth.get_user(token)
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user_response.user


@router.get("")
def get_resume(authorization: str = Header(...)):
    user = _get_user_from_token(authorization)
    db = supabase_admin or supabase
    try:
        result = db.table("resumes").select("*").eq("user_id", user.id).order("created_at", desc=True).execute()
    except Exception as e:
        logger.exception(f"[resume/get] DB query failed for user_id: {user.id}, error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch resumes")
    return {"resumes": result.data}


class ExtractTextRequest(BaseModel):
    url: str


@router.post("/extract-text")
def extract_text(body: ExtractTextRequest, authorization: str = Header(...)):
    _get_user_from_token(authorization)

    try:
        response = httpx.get(body.url, follow_redirects=True, timeout=30)
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch PDF: {e}")

    try:
        reader = pypdf.PdfReader(io.BytesIO(response.content))
        text = "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Failed to extract text from PDF: {e}")

    return {"text": text.strip()}


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    logger.info(f"[resume/upload] Request received — filename: {file.filename}, content_type: {file.content_type}")

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        logger.warning(f"[resume/upload] Rejected non-PDF file: {file.filename}")
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    user = _get_user_from_token(authorization)
    user_id = user.id
    logger.info(f"[resume/upload] Token valid — user_id: {user_id}, email: {user.email}")

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

    db = supabase_admin or supabase
    try:
        result = db.table("resumes").upsert({
            "user_id": user_id,
            "filename": file.filename,
            "storage_path": storage_path,
            "url": public_url,
        }, on_conflict="user_id,storage_path").execute()
        logger.debug(f"[resume/upload] DB record upserted — data: {result.data}")
    except Exception as e:
        logger.exception(f"[resume/upload] Failed to upsert DB record — path: {storage_path}, error: {e}")
        raise HTTPException(status_code=500, detail="Upload succeeded but failed to save record")

    logger.info(f"[resume/upload] Success — user_id: {user_id}, path: {storage_path}, url: {public_url}")

    return {
        "message": "Resume uploaded successfully",
        "path": storage_path,
        "url": public_url,
    }
