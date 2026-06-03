# Sprint 3 Report - Integration Foundation
**Product:** AutoShake AI MVP | **Date:** May 17, 2026

## Retrospective: Start / Stop / Continue

### Stop Doing
| Action | Reason |
|--------|--------|
| Extra component features | Integration and MVP is the highest priority now |

### Start Doing
| Action | Reason |
|--------|--------|
| Integration | Components need to be integrated to reach MVP |

### Keep Doing
| Action | Reason |
|--------|--------|
| Component-focused implementation | Delivered the GraphQL, ML, backend, and PDF pieces needed for integration |

## Sprint Timeline

| Start Date | End Date |
|---|---|
| 05/03/2026 | 05/17/2026 |

## Sprint Outcomes

### Completed Deliverables
- GraphQL interception implemented
- Employer and job name extraction built
- Functional extension toggle switch completed
- ML pipeline connected to Ollama and stabilized
- Full PDF generation path completed
- FastAPI endpoint and backend flow finished

### Incomplete / Continued Work
- Full job submission UX and list management still needs refinement
- Authentication and persistent resume storage still pending
- Structured AI output formatting needs additional work

### Completed Subtasks
- US1.3: Parser is fired for each job you click
- US1.4: Jobs are only added when extension is enabled
- US2.1: Improved prompt templates
- US5.4: PDFs generated from ML output
- US6.2: Backend can communicate with an LLM API

## Velocity

| Metric | Value |
|--------|-------|
| Stories completed | 1 (US1) |
| Sprint days | 14 |
| Stories/day | 0.07 |

## Burnup Chart

todo

## Sprint Deliverables

- GraphQL-based job extraction support
- Employer and job metadata parsing
- Functional extension toggle and selection flow
- ML pipeline connected to Ollama
- PDF generation from LLM output
- FastAPI backend complete for current MVP needs

## Task Breakdown

### Extension

#### Completed
- Implemented GraphQL interception for job data capture
- Extracted employer and job name metadata from graphql to show in list
- Built a functional toggle switch in the extension UI
- Persisted a job list for selected items

#### Notes
- The extension now tracks clicked jobs more reliably
- Highest priority work is to connect frontend submission flows to backend processing

### Backend

#### Completed
- Finished FastAPI implementation for request handling

### AI Engine

#### Completed
- Connected the ML pipeline to Ollama for resume tailoring
- Implemented the resume generation flow through the backend
- Validated end-to-end output for PDF generation

### Output & Storage

#### Completed
- Built full PDF generation end-to-end from ML output
- Ensured PDFs can be generated from the current pipeline outputs

## Risks / Concerns

### Resume Quality
- Tailored resume output quality varies with prompt and data structure
- Mitigation: add stronger prompt templates and structured formatting rules

### Authentication Delay
- No login/auth flow yet means no persistent user storage
- Mitigation: prioritize login and account pages in the next sprint

## Sprint Outcome

Sprint 3 established the core integration foundation for Autoshake MVP. The team completed GraphQL interception, metadata extraction, a working toggle switch, ML pipeline connectivity to Ollama, PDF generation, and the FastAPI backend.

This sprint proved the core technical flow for generating tailored PDFs from selected jobs and set the stage for Sprint 4, where authentication, tests, and connecting all the components together will be the focus.

## Next Focus Areas

- Submission button and frontend submit flow
- Login and create account pages
- ML pipeline connected to PDF generator with authenticated context
- Deploy backend to an online server
- Integration of login, signup, job submission, and resume upload services
