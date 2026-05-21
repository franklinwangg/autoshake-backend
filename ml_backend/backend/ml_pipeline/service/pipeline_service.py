from ..pipelines.extract_skills import extract_skills
from ..pipelines.rewrite_resume import rewrite_resume


def run_pipeline(job_description: str, resume: str) -> dict:
    extracted_skills = extract_skills(job_description)
    generated_resume = rewrite_resume(resume, extracted_skills)
    return {"generated_resume": generated_resume}
