# AGENTS.md

## Project Architecture

This project follows a layered structure:

- `controllers/` → API layer and route handlers
- `services/` → business logic and orchestration
- `tailored_resume_generation/` → end-to-end resume tailoring pipeline
- `ml_pipeline/` → ML/data processing logic
- `resume_generator/` → resume formatting and generation logic

---

# Directory Structure

```text
project_root/
│
├── controllers/
│   ├── __init__.py
│   └── tailored_resume_controller.py
│
├── services/
│   ├── __init__.py
│   │
│   └── tailored_resume_generation/
│       ├── __init__.py
│       ├── pipeline_runner.py
│       │
│       ├── ml_pipeline/
│       │   ├── __init__.py
│       │   └── ...
│       │
│       └── resume_generator/
│           ├── __init__.py
│           └── ...
│
├── main.py
├── requirements.txt
└── AGENTS.md