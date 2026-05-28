import json
import tempfile
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from fastapi.testclient import TestClient

from main import app

client = TestClient(app, raise_server_exceptions=False)

MOCK_RESUME = {"basics": {"name": "Alex"}, "experience": [], "skills": []}
MOCK_SKILLS = {"languages": ["Python"], "frameworks": ["FastAPI"]}

RUN_PIPELINE = "controllers.tailored_resume_controller.run_pipeline"
EXTRACT_SKILLS = "controllers.tailored_resume_controller.extract_skills"


# ---------------------------------------------------------------------------
# /health
# ---------------------------------------------------------------------------

def test_health_called_returnsOk():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


# ---------------------------------------------------------------------------
# /templates
# ---------------------------------------------------------------------------

def test_listTemplates_templatesExist_returnsNameList():
    r = client.get("/templates")
    assert r.status_code == 200
    assert "templates" in r.json()
    assert isinstance(r.json()["templates"], list)


def test_listTemplates_dirMissing_returnsEmpty():
    with patch("controllers.tailored_resume_controller.TEMPLATES_DIR", Path("/nonexistent")):
        r = client.get("/templates")
    assert r.status_code == 200
    assert r.json() == {"templates": []}


# ---------------------------------------------------------------------------
# /extract-skills — input validation
# ---------------------------------------------------------------------------

def test_extractSkills_emptyString_returns400():
    r = client.post("/extract-skills", json={"job_description": ""})
    assert r.status_code == 400

def test_extractSkills_whitespaceString_returns400():
    r = client.post("/extract-skills", json={"job_description": "   "})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# /extract-skills — happy path
# ---------------------------------------------------------------------------

def test_extractSkills_validJobDescription_returnsSkillsDict():
    with patch(EXTRACT_SKILLS, return_value=MOCK_SKILLS):
        r = client.post("/extract-skills", json={"job_description": "We need a Python engineer."})
    assert r.status_code == 200
    assert r.json() == {"skills": MOCK_SKILLS}


def test_extractSkills_validJobDescription_callsExtractWithDescription():
    with patch(EXTRACT_SKILLS, return_value=MOCK_SKILLS) as mock_fn:
        client.post("/extract-skills", json={"job_description": "Looking for Go developer."})
    mock_fn.assert_called_once_with("Looking for Go developer.")


# ---------------------------------------------------------------------------
# /extract-skills — pipeline error becomes 500
# ---------------------------------------------------------------------------

def test_extractSkills_pipelineRaisesException_returns500():
    with patch(EXTRACT_SKILLS, side_effect=RuntimeError("LLM unavailable")):
        r = client.post("/extract-skills", json={"job_description": "Some job."})
    assert r.status_code == 500
    assert "LLM unavailable" in r.json()["detail"]


# ---------------------------------------------------------------------------
# /generate-resume — input validation
# ---------------------------------------------------------------------------

def test_generateResume_emptyJobDescription_returns400():
    r = client.post("/generate-resume", json={"resume": MOCK_RESUME, "job_description": ""})
    assert r.status_code == 400

def test_generateResume_whitespaceJobDescription_returns400():
    r = client.post("/generate-resume", json={"resume": MOCK_RESUME, "job_description": "  "})
    assert r.status_code == 400

def test_generateResume_emptyResume_returns400():
    r = client.post("/generate-resume", json={"resume": {}, "job_description": "Great job."})
    assert r.status_code == 400


# ---------------------------------------------------------------------------
# /generate-resume — happy path
# ---------------------------------------------------------------------------

def test_generateResume_validInput_returnsPdfResponse():
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        fake_pdf = Path(f.name)
        fake_pdf.write_bytes(b"%PDF-1.4 fake")

    def fake_pipeline(resume, job_desc, output_path):
        Path(output_path).write_bytes(fake_pdf.read_bytes())

    with patch(RUN_PIPELINE, side_effect=fake_pipeline):
        r = client.post("/generate-resume", json={
            "resume": MOCK_RESUME,
            "job_description": "Looking for a Python engineer.",
        })

    fake_pdf.unlink(missing_ok=True)
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert "tailored_resume.pdf" in r.headers["content-disposition"]


def test_generateResume_validInput_callsPipelineWithCorrectArgs():
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        fake_pdf = Path(f.name)
        fake_pdf.write_bytes(b"%PDF-1.4 fake")

    def fake_pipeline(resume, job_desc, output_path):
        Path(output_path).write_bytes(b"%PDF-1.4 fake")

    with patch(RUN_PIPELINE, side_effect=fake_pipeline) as mock_fn:
        client.post("/generate-resume", json={
            "resume": MOCK_RESUME,
            "job_description": "Looking for a Python engineer.",
        })

    fake_pdf.unlink(missing_ok=True)
    call_args = mock_fn.call_args
    assert call_args[0][0] == MOCK_RESUME
    assert call_args[0][1] == "Looking for a Python engineer."


def test_generateResume_validInput_deletesTempFileAfterResponse():
    created_path = None

    def fake_pipeline(resume, job_desc, output_path):
        nonlocal created_path
        created_path = Path(output_path)
        created_path.write_bytes(b"%PDF-1.4 fake")

    with patch(RUN_PIPELINE, side_effect=fake_pipeline):
        client.post("/generate-resume", json={
            "resume": MOCK_RESUME,
            "job_description": "Some job.",
        })

    assert created_path is not None
    assert not created_path.exists(), "temp PDF should be deleted after response"


# ---------------------------------------------------------------------------
# /generate-resume — pipeline error becomes 500
# ---------------------------------------------------------------------------

def test_generateResume_pipelineRaisesException_returns500():
    with patch(RUN_PIPELINE, side_effect=RuntimeError("render failed")):
        r = client.post("/generate-resume", json={
            "resume": MOCK_RESUME,
            "job_description": "Some job.",
        })
    assert r.status_code == 500
    assert "render failed" in r.json()["detail"]


# ---------------------------------------------------------------------------
# /generate-resume-from-files — input validation
# ---------------------------------------------------------------------------

def test_generateResumeFromFiles_missingResumeFile_returns400():
    r = client.post("/generate-resume-from-files", params={
        "resume_path": "/nonexistent/resume.json",
        "job_path": "test_data/job_description.txt",
    })
    assert r.status_code == 400
    assert "resume file not found" in r.json()["detail"]

def test_generateResumeFromFiles_missingJobFile_returns400(tmp_path):
    resume_file = tmp_path / "resume.json"
    resume_file.write_text(json.dumps(MOCK_RESUME))
    r = client.post("/generate-resume-from-files", params={
        "resume_path": str(resume_file),
        "job_path": "/nonexistent/job.txt",
    })
    assert r.status_code == 400
    assert "job file not found" in r.json()["detail"]


# ---------------------------------------------------------------------------
# /generate-resume-from-files — happy path
# ---------------------------------------------------------------------------

def test_generateResumeFromFiles_validInput_returnsOutputPath(tmp_path):
    resume_file = tmp_path / "resume.json"
    resume_file.write_text(json.dumps(MOCK_RESUME))
    job_file = tmp_path / "job.txt"
    job_file.write_text("We need a Python engineer.")
    out = str(tmp_path / "output.pdf")

    with patch(RUN_PIPELINE, return_value=out):
        r = client.post("/generate-resume-from-files", params={
            "resume_path": str(resume_file),
            "job_path": str(job_file),
            "output_path": out,
        })

    assert r.status_code == 200
    assert r.json() == {"output_pdf": out}


def test_generateResumeFromFiles_validInput_passesFileContentsToPipeline(tmp_path):
    resume_file = tmp_path / "resume.json"
    resume_file.write_text(json.dumps(MOCK_RESUME))
    job_file = tmp_path / "job.txt"
    job_file.write_text("We need a Go developer.")

    with patch(RUN_PIPELINE, return_value="output.pdf") as mock_fn:
        client.post("/generate-resume-from-files", params={
            "resume_path": str(resume_file),
            "job_path": str(job_file),
        })

    call_args = mock_fn.call_args[0]
    assert call_args[0] == MOCK_RESUME
    assert call_args[1] == "We need a Go developer."
