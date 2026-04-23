from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

app = FastAPI()

class Job(BaseModel):
    title: str
    description: str

class ResumeRequest(BaseModel):
    resume_text: str
    jobs: List[Job]

@app.get("/")
def home():
    return {"status": "Backend running"}

@app.post("/generate-resumes")
def generate_resumes(request: ResumeRequest):
    results = []

    for job in request.jobs:
        results.append({
            "job": job.title,
            "tailored_summary": f"Matched to {job.title}",
            "resume_url": f"/fake/{job.title}.pdf"
        })

    return {"results": results}