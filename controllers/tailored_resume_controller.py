import json
import tempfile
import uuid
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from starlette.background import BackgroundTask

from services.tailored_resume_generation.pipeline_runner import run_pipeline
from services.tailored_resume_generation.ml_pipeline.pipelines.extract_skills import extract_skills

TEMPLATES_DIR = (
    Path(__file__).resolve().parents[1]
    / "services" / "tailored_resume_generation" / "resume_generator" / "templates"
)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request models
# ---------------------------------------------------------------------------

class GenerateResumeRequest(BaseModel):
    resume: dict[str, Any]
    job_description: str

class ExtractSkillsRequest(BaseModel):
    job_description: str


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/health", tags=["meta"])
def health():
    """Liveness check."""
    return {"status": "ok"}


@router.get("/templates", tags=["meta"])
def list_templates():
    """List available HTML resume templates by name."""
    if not TEMPLATES_DIR.exists():
        return {"templates": []}
    return {"templates": [f.stem for f in TEMPLATES_DIR.glob("*.html")]}


@router.post("/extract-skills", tags=["pipeline"])
def extract_skills_endpoint(body: ExtractSkillsRequest):
    """Extract structured skills from a job description."""
    if not body.job_description.strip():
        raise HTTPException(status_code=400, detail="job_description must not be empty")
    try:
        skills = extract_skills(body.job_description)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    return {"skills": skills}


@router.post("/generate-resume", tags=["pipeline"])
def generate_resume(body: GenerateResumeRequest):
    """
    Run the full pipeline: resume JSON + job description → tailored PDF.
    Streams the PDF back as an attachment and cleans up the temp file after delivery.
    """
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


@router.post("/generate-resume-from-files", tags=["pipeline"])
def generate_resume_from_files(resume_path: str, job_path: str, output_path: str = "output.pdf"):
    """Run the pipeline using server-side file paths. Returns the saved PDF path."""
    rp = Path(resume_path)
    jp = Path(job_path)

    if not rp.exists():
        raise HTTPException(status_code=400, detail=f"resume file not found: {resume_path}")
    if not jp.exists():
        raise HTTPException(status_code=400, detail=f"job file not found: {job_path}")

    try:
        resume_data = json.loads(rp.read_text(encoding="utf-8"))
        job_description = jp.read_text(encoding="utf-8")
        result = run_pipeline(resume_data, job_description, output_path)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return {"output_pdf": result}
