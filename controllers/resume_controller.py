from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from supabase_auth.errors import AuthApiError

from services.supabase_client import supabase

router = APIRouter(prefix="/resume", tags=["resume"])

BUCKET = "resumes"
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    authorization: str = Header(...),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted")

    token = authorization.removeprefix("Bearer ").strip()

    try:
        user_response = supabase.auth.get_user(token)
    except AuthApiError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = user_response.user.id

    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")

    storage_path = f"{user_id}/{file.filename}"

    supabase.storage.from_(BUCKET).upload(
        path=storage_path,
        file=contents,
        file_options={"content-type": "application/pdf", "upsert": "true"},
    )

    public_url = supabase.storage.from_(BUCKET).get_public_url(storage_path)

    return {
        "message": "Resume uploaded successfully",
        "path": storage_path,
        "url": public_url,
    }
