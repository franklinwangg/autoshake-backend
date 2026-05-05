from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AutoShake Backend")

# -------------------------
# Data Models (Validation Layer)
# -------------------------

class Job(BaseModel):
    title: str
    description: str

class ResumeRequest(BaseModel):
    resume_text: str
    jobs: List[Job]

# -------------------------
# Root endpoint (health check)
# -------------------------
@app.get("/")
def home():
    return {"status": "Backend running"}

# -------------------------
# Mock AI logic (Sprint 1 placeholder)
# -------------------------
def generate_tailored_resume(job: Job, resume_text: str):
    """
    Simulates AI processing.
    Later replaced with OpenAI / LangChain.
    """
    return {
        "job_title": job.title,
        "tailored_summary": (
            f"This resume is optimized for {job.title}. "
            f"Focuses on skills relevant to: {job.description[:60]}..."
        ),
        "keywords_used": ["python", "backend", "apis"],  # placeholder
        "status": "mock_generated"
    }

# -------------------------
# Main endpoint (Chrome extension will call this later)
# -------------------------
@app.post("/generate-resumes")
def generate_resumes(request: ResumeRequest):

    print("\n--- Incoming Request ---")
    print("Resume:", request.resume_text)
    print("Jobs:", request.jobs)

    if not request.jobs:
        return {"error": "No jobs provided"}

    results = []

    for job in request.jobs:
        result = generate_tailored_resume(job, request.resume_text)
        results.append(result)

    return {
        "input_jobs_count": len(request.jobs),
        "results": results
    }