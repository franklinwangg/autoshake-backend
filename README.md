# Job Application Automater

Automates tailored resume generation for Handshake job postings.

## Overview

A Chrome extension lets users select job postings on Handshake. Those postings are sent to a FastAPI backend that runs an AI pipeline to generate a customized resume for each job. The resumes are stored in AWS S3 as PDFs, and the user receives a downloadable spreadsheet of all results.

## Architecture

```
Chrome Extension
      │
      │  (job posting data)
      ▼
FastAPI Backend
      │
      ├── OpenAI + LangChain  ──►  Resume generation (tailored per job)
      │
      ├── Vector Database  ──────►  Semantic matching (user profile ↔ job requirements)
      │
      └── AWS S3  ───────────────►  PDF storage
            │
            ▼
   Downloadable Spreadsheet (links to all generated resumes)
```

## Tech Stack

| Layer | Technology |
|---|---|
| Browser Extension | Chrome Extension (Manifest V3) |
| Backend | FastAPI (Python) |
| AI Pipeline | OpenAI API + LangChain |
| Vector Store | TBD |
| File Storage | AWS S3 |
| Output | Excel/CSV spreadsheet |

## How It Works

1. User browses Handshake and selects one or more job postings via the Chrome extension.
2. The extension sends the job data to the FastAPI backend.
3. For each job, the AI pipeline analyzes the posting and the user's profile to generate a tailored resume.
4. Each resume is rendered as a PDF and uploaded to AWS S3.
5. The backend returns a spreadsheet with job details and download links for each resume.

## API

The backend is deployed on Railway:

**Base URL:** `https://autoshake-production.up.railway.app`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| GET | `/templates` | List available resume templates |
| POST | `/auth/signup` | Create a new user account |
| POST | `/auth/login` | Log in and receive an access token |
| POST | `/resume/upload` | Upload a PDF resume (requires Bearer token) |
| POST | `/extract-skills` | Extract skills from a job description |
| POST | `/generate-resume` | Generate a tailored resume PDF |

## Development

Active development is on the `feature/scrape-and-parse` branch.

## Status

Work in progress — not yet production ready.
