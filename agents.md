# Agents Pipeline Specification

## Overview

This project is part of a multi-stage pipeline designed to generate **tailored resume PDFs** from structured input data.

This component is responsible for receiving incoming data, passing it through a machine learning pipeline for resume tailoring, and forwarding the processed output to a PDF generation system.

The final output is a customized resume in PDF format.

---

## Pipeline Flow

```text
Incoming Data → ML Pipeline → PDF Generator → Output PDF
```

```text
Chrome Extension
      │
      │  { resume_text, jobs: [{ title, description }] }
      ▼
FastAPI  /generate-resumes          (ml_backend/backend/main.py)
      │
      ▼
Resume Controller                   (ml_pipeline/controller/resume_controller.py)
      │  validates: job_description + resume present
      ▼
Pipeline Service                    (ml_pipeline/service/pipeline_service.py)
      │
      ├──► Stage 1: Extract Skills  (ml_pipeline/pipelines/extract_skills.py)
      │         LLM call → structured JSON of skills / keywords
      │
      └──► Stage 2: Rewrite Resume  (ml_pipeline/pipelines/rewrite_resume.py)
                LLM call → plain-text tailored resume
                      │
                      ▼
              [[ TODO: structured JSON conversion ]]
                      │
                      ▼
            PDF Generator           (resume_generator/)
                  HTML template + BeautifulSoup → WeasyPrint → .pdf
```

---

## Stage 1 — API Layer

**File:** `ml_backend/backend/main.py`

**Endpoint:** `POST /generate-resumes`

**Input:**
```json
{
  "resume_text": "full plain-text resume",
  "jobs": [
    { "title": "Software Engineer", "description": "job posting text..." }
  ]
}
```

**Output:**
```json
{
  "input_jobs_count": 1,
  "results": [
    { "job_title": "Software Engineer", "generated_resume": "rewritten plain-text resume..." }
  ]
}
```

Iterates over each job and calls the controller once per job.

---

## Stage 2 — Resume Controller

**File:** `ml_backend/backend/ml_pipeline/controller/resume_controller.py`

Validates that `job_description` and `resume` are both present, then calls the pipeline service. Raises `ValueError` if either is missing.

**Input:** `{ "job_description": str, "resume": str }`
**Output:** `{ "generated_resume": str }`

---

## Stage 3 — Pipeline Service

**File:** `ml_backend/backend/ml_pipeline/service/pipeline_service.py`

Orchestrates the two sub-pipelines in sequence:
1. `extract_skills(job_description)` → `extracted_skills: dict`
2. `rewrite_resume(resume, extracted_skills)` → `generated_resume: str`

---

## Stage 4a — Extract Skills

**File:** `ml_backend/backend/ml_pipeline/pipelines/extract_skills.py`

**Prompt:** `ml_backend/backend/ml_pipeline/prompts/extract_job_skills.md`

Sends the job description to the LLM and parses the response for a JSON block.

**Input:** `job_description: str`

**Output:**
```json
{
  "must_have_skills": [],
  "nice_to_have_skills": [],
  "non_technical_skills": [],
  "responsibilities": [],
  "ats_keywords": []
}
```

---

## Stage 4b — Rewrite Resume

**File:** `ml_backend/backend/ml_pipeline/pipelines/rewrite_resume.py`

**Prompt:** `ml_backend/backend/ml_pipeline/prompts/rewrite_resume.md`

Takes the original resume and the extracted skills dict, streams an LLM response, and returns the rewritten resume as plain text. Does not fabricate experience or skills.

**Input:** `resume: str`, `target_skills: dict`
**Output:** `generated_resume: str` (plain text)

---

## Stage 5 — LLM Integration

**File:** `ml_backend/backend/ml_pipeline/integrations/llm.py`

Supports two providers, selected via `LLM_PROVIDER` env var:

| Provider | Default model | Config |
|---|---|---|
| `claude` (default) | `claude-opus-4-7` | `ANTHROPIC_API_KEY` |
| `ollama` | `llama3` | `OLLAMA_BASE_URL`, `OLLAMA_MODEL` |

Both providers expose two functions:
- `call_llm(prompt, max_tokens)` — single response, used by extract_skills
- `stream_llm(prompt, max_tokens)` — streaming, used by rewrite_resume

Claude calls use `thinking: adaptive` for both functions.

---

## Stage 6 — PDF Generator

**File:** `resume_generator/export-pdf.py`

**Input:** structured JSON matching this schema (see `resume_generator/data/sample1.json`):
```json
{
  "basics": { "name", "headline", "email", "links": { "linkedin", "github", "website" }, "summary" },
  "experience": [{ "position", "company", "startDate", "endDate", "bullets": [] }],
  "education": [{ "institution", "degree", "field", "startDate", "endDate", "gpa", "honors", "coursework" }],
  "projects": [{ "name", "date", "description", "bullets": [], "technologies": [] }],
  "skills": [{ "category", "items": [] }]
}
```

**Functions:**
- `edit_resume(html_path, output_path, resume_data)` — injects data into `templates/templateOne.html` via BeautifulSoup, saves populated HTML
- `export_to_pdf(html_path, output_path)` — renders populated HTML to PDF via WeasyPrint

**Output:** `.pdf` file at `output_path`

---

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `LLM_PROVIDER` | `integrations/llm.py` | `claude` or `ollama` |
| `ANTHROPIC_API_KEY` | `integrations/llm.py` | Claude API auth |
| `OLLAMA_BASE_URL` | `integrations/llm.py` | Ollama server URL (default: `http://localhost:11434`) |
| `OLLAMA_MODEL` | `integrations/llm.py` | Ollama model name (default: `llama3`) |

Set in `ml_backend/backend/ml_pipeline/.env`.

---

## Known Gap

The ML pipeline (Stage 4b) outputs a **plain-text string**. The PDF generator (Stage 6) expects a **structured JSON object**. These are not yet connected — a conversion step is needed to parse the plain-text resume into the structured schema before PDF generation can be triggered.
