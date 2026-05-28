from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from export_pdf import edit_resume, export_to_pdf


app = FastAPI()


class ResumePayload(BaseModel):
    basics: dict[str, Any] = Field(default_factory=dict)
    experience: list[dict[str, Any]] = Field(default_factory=list)
    education: list[dict[str, Any]] = Field(default_factory=list)
    projects: list[dict[str, Any]] = Field(default_factory=list)
    skills: list[dict[str, Any]] = Field(default_factory=list)


def _validate_experience(experiences: list[dict[str, Any]]) -> None:
    if not experiences:
        raise HTTPException(
            status_code=422,
            detail="At least one experience entry is required.",
        )

    required_fields = {"position", "company", "startDate", "bullets"}
    for index, exp in enumerate(experiences):
        missing = [
            field
            for field in required_fields
            if field not in exp or exp[field] in (None, "", [])
        ]
        if missing:
            raise HTTPException(
                status_code=422,
                detail=f"Experience item {index} is missing required fields: {missing}",
            )


@app.post("/generate_resume_pdf/")
async def generate_resume_pdf(resume_data: ResumePayload):
    _validate_experience(resume_data.experience)

    base_dir = Path(__file__).resolve().parent
    template_path = base_dir / "templates" / "templateOne.html"
    output_html = base_dir / "templates" / "generated_resume.html"
    output_pdf = base_dir / "templates" / "generated_resume.pdf"

    edit_resume(
        html_path=str(template_path),
        output_path=str(output_html),
        resume_data=resume_data.model_dump(),
    )
    export_to_pdf(
        html_path=str(output_html),
        output_path=str(output_pdf),
    )

    return FileResponse(
        path=str(output_pdf),
        media_type="application/pdf",
        filename="generated_resume.pdf",
    )
