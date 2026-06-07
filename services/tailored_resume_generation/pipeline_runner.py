import logging
from pathlib import Path

from .ml_pipeline.pipelines.extract_skills import extract_skills
from .ml_pipeline.pipelines.rewrite_resume_structured import rewrite_resume_structured
from .resume_generator.export_pdf import edit_resume, export_to_pdf

logger = logging.getLogger(__name__)

TEMPLATE = Path(__file__).resolve().parent / "resume_generator" / "templates" / "templateOne.html"


def run_pipeline(resume_data: dict, job_description: str, output_pdf: str) -> str:
    output_path = Path(output_pdf)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    intermediate_html = output_path.with_suffix(".html")

    logger.info("[pipeline] Step 1/3 — extracting skills from job description (%d chars)", len(job_description))
    try:
        skills = extract_skills(job_description)
        logger.debug("[pipeline] Extracted skills: %s", skills)
    except Exception:
        logger.exception("[pipeline] Step 1/3 FAILED — extract_skills raised an exception")
        raise

    logger.info("[pipeline] Step 2/3 — rewriting resume to match job")
    try:
        tailored = rewrite_resume_structured(resume_data, skills)
        logger.debug("[pipeline] Rewrite complete — keys in result: %s", list(tailored.keys()))
    except Exception:
        logger.exception("[pipeline] Step 2/3 FAILED — rewrite_resume_structured raised an exception")
        raise

    logger.info("[pipeline] Step 3/3 — generating PDF at %s", output_path)
    try:
        edit_resume(str(TEMPLATE), str(intermediate_html), tailored)
        logger.debug("[pipeline] HTML written to %s", intermediate_html)
        export_to_pdf(str(intermediate_html), str(output_path))
        intermediate_html.unlink(missing_ok=True)
        logger.debug("[pipeline] PDF exported to %s", output_path)
    except Exception:
        logger.exception("[pipeline] Step 3/3 FAILED — PDF generation raised an exception")
        raise

    logger.info("[pipeline] Done — output: %s", output_path)
    return str(output_path)
