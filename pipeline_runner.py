#!/usr/bin/env python3
"""
AutoShake Pipeline Runner
Runs the full end-to-end pipeline: resume JSON + job description -> tailored PDF

Usage:
    python pipeline_runner.py --resume path/to/resume.json --job path/to/job.txt --output out.pdf
    python pipeline_runner.py --resume path/to/resume.json --job "We are looking for..." --output out.pdf
"""

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent

sys.path.insert(0, str(ROOT / "ml_backend" / "backend"))
sys.path.insert(0, str(ROOT / "resume_generator"))

from ml_pipeline.pipelines.extract_skills import extract_skills
from ml_pipeline.pipelines.rewrite_resume_structured import rewrite_resume_structured
from export_pdf import edit_resume, export_to_pdf

TEMPLATE = ROOT / "resume_generator" / "templates" / "templateOne.html"


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


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AutoShake: generate a tailored resume PDF")
    parser.add_argument("--resume", required=True, help="Path to structured resume JSON file")
    parser.add_argument("--job", required=True, help="Path to job description .txt file, or the job text inline")
    parser.add_argument("--output", default="output.pdf", help="Output PDF path (default: output.pdf)")
    args = parser.parse_args()

    with open(args.resume, encoding="utf-8") as f:
        resume_data = json.load(f)

    job_path = Path(args.job)
    job_description = job_path.read_text(encoding="utf-8") if job_path.exists() else args.job

    result = run_pipeline(resume_data, job_description, args.output)
    print(f"\nDone. PDF saved to: {result}")
