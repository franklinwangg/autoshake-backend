import tempfile
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

from services.tailored_resume_generation.pipeline_runner import run_pipeline

router = APIRouter()


class GenerateResumeRequest(BaseModel):
    resume: dict[str, Any]
    job_description: str


@router.get("/health", tags=["meta"])
def health():
    return {"status": "ok"}


@router.post("/generate-resume", tags=["pipeline"])
def generate_resume(body: GenerateResumeRequest):
    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description must not be empty")
    if not body.resume:
        raise HTTPException(status_code=400, detail="resume must not be empty")

    tmp_dir = Path(tempfile.gettempdir()) / "autoshake"
    tmp_dir.mkdir(parents=True, exist_ok=True)
    output_path = tmp_dir / f"{uuid.uuid4().hex}.pdf"

    try:
        run_pipeline(body.resume, body.job_description, str(output_path))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    if not output_path.exists():
        raise HTTPException(status_code=500, detail="PDF generation produced no output")

    return FileResponse(
        path=str(output_path),
        media_type="application/pdf",
        filename="tailored_resume.pdf",
        background=BackgroundTask(output_path.unlink, missing_ok=True),
    )
