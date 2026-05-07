# 🚀 Sprint 2 Report — MVP End-to-End (Raw LLM Pipeline)

## 🧠 Sprint Goal
Deliver a complete working pipeline from Chrome extension → backend → AI → PDF output, enabling users to generate tailored resumes for selected jobs.

---

# 📅 Sprint Timeline

| Start Date | End Date |
|---|---|
| 05/19 | 06/03 |

---

# 🎯 Sprint Deliverables

- Chrome extension for job selection + resume upload
- FastAPI backend for request handling
- LLM-based resume generation pipeline
- PDF generation + storage system
- End-to-end functional workflow

---

# 📦 Sprint Scope

| ID | Task | Status |
|---|---|---|
| #EXT-1 | Job scraping + display | ✅ |
| #EXT-2 | Job selection UI | ✅ |
| #EXT-3 | Resume upload | ✅ |
| #BE-1 | API endpoint for job + resume intake | ✅ |
| #BE-2 | Validation layer (Pydantic) | ✅ |
| #AI-1 | Resume generation prompt | ✅ |
| #OUT-1 | PDF generation | ✅ |
| #OUT-2 | Storage + link return | ✅ |

---

# ⚙️ Task Breakdown

## 🧩 Extension — Tyler

### Completed
- Integrated job scraping flow from Handshake
- Built multi-select job UI
- Added resume upload input
- Connected frontend submission flow to backend API

### Notes
- Focused on minimizing friction in the user flow
- Extension successfully packages selected jobs + resume into backend payload

---

## 🖥️ Backend — Nirav

### Completed
- Implemented FastAPI intake endpoint
- Added Pydantic validation layer
- Built per-job processing loop
- Standardized response formatting

### Notes
- Backend now supports multiple job requests in a single submission
- Validation catches malformed requests before AI processing

---

## 🤖 AI Engine — Franklin

### Completed
- Developed initial single-prompt LLM resume tailoring system
- Added job description alignment logic
- Reduced hallucination risk through prompt constraints

### Notes
- Current system uses raw prompting without multi-agent orchestration
- Emphasis placed on preserving factual correctness of resume content

---

## 📄 Output & Storage — Nataniel

### Completed
- Built text → PDF conversion pipeline
- Added PDF storage handling
- Implemented job-to-link mapping return format

### Notes
- Storage currently supports local/S3-compatible architecture
- PDFs are returned through generated links for frontend consumption

---

# 🔗 Dependencies

| Dependency | Status |
|---|---|
| OpenAI API availability | Stable |
| Chrome extension permissions | Configured |
| PDF library integration | Functional |

---

# ⚠️ Risks / Concerns

## LLM Hallucinations
- AI may generate unsupported resume claims
- Mitigation: tighter prompt constraints and validation checks

## PDF Formatting Inconsistencies
- Layout differences across resume structures
- Mitigation: standardized formatting templates

## Batch Processing Latency
- Multiple job requests increase generation time
- Mitigation: optimize request handling and parallel processing later

---

# 📊 Definition of Done

| Requirement | Status |
|---|---|
| End-to-end flow works | ✅ |
| PDFs generated for multiple jobs | ✅ |
| Links returned to frontend | ✅ |
| Basic testing completed | ✅ |

---

# 🧪 Testing Notes

## Extension Testing
- Manual end-to-end extension testing completed
- Verified job selection + upload flow

## Backend Testing
- API endpoints tested using Postman
- Validated payload handling and response formatting

## Output Testing
- Verified PDF generation pipeline
- Confirmed downloadable link generation

---

# 📌 Product Decision Discussions

| Issue | Topic | Status |
|---|---|---|
| #21 | Determining resume relevance to job details | 🟡 In Progress |
| #22 | Defining strong vs weak experience alignment | 🟡 In Progress |

### Current Direction
- Resume relevance currently evaluated through semantic alignment with job descriptions
- Strong/weak experience classification still under refinement and may evolve into a scoring system

---

# 📈 Sprint Outcome

Sprint 2 successfully established the first fully functional MVP pipeline for automated resume tailoring.

The system now supports:
1. Selecting jobs from the Chrome extension
2. Uploading a base resume
3. Sending requests through FastAPI
4. Generating tailored resumes using an LLM
5. Producing downloadable PDF outputs

This sprint validates the core technical feasibility of the platform and establishes the foundation for future improvements including ranking systems, better prompt orchestration, structured resume parsing, and higher-quality formatting.

---

# 🚧 Next Focus Areas

- Resume relevance scoring
- Experience strength classification
- Improved PDF formatting
- Faster batch processing
- Structured resume parsing
- Better hallucination prevention
- Enhanced frontend UX
