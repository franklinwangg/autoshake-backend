from pathlib import Path

from .ml_pipeline.pipelines.extract_skills import extract_skills
from .ml_pipeline.pipelines.rewrite_resume_structured import rewrite_resume_structured
from .resume_generator.export_pdf import edit_resume, export_to_pdf

TEMPLATE = Path(__file__).resolve().parent / "resume_generator" / "templates" / "templateOne.html"


def run_pipeline(resume_data: dict, job_description: str, output_pdf: str) -> str:
    output_path = Path(output_pdf)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    intermediate_html = output_path.with_suffix(".html")

    print("[1/3] Extracting skills from job description...")
    skills = extract_skills(job_description)

    print("[2/3] Rewriting resume to match job...")
    tailored = rewrite_resume_structured(resume_data, skills)

    print("[3/3] Generating PDF...")
    edit_resume(str(TEMPLATE), str(intermediate_html), tailored)
    export_to_pdf(str(intermediate_html), str(output_path))
    intermediate_html.unlink(missing_ok=True)

    return str(output_path)
