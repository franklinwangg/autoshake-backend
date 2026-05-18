from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List

from ml_pipeline.controller.resume_controller import handle_request

app = FastAPI(title="AutoShake Backend")


# -------------------------
# Data Models
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
# Main endpoint
# -------------------------

@app.post("/generate-resumes")
def generate_resumes(request: ResumeRequest):
    if not request.jobs:
        raise HTTPException(status_code=400, detail="No jobs provided")

    results = []

    for job in request.jobs:
        output = handle_request({
            "job_description": job.description,
            "resume": request.resume_text,
        })
        results.append({
            "job_title": job.title,
            "generated_resume": output["generated_resume"],
        })

    return {
        "input_jobs_count": len(request.jobs),
        "results": results,
    }
