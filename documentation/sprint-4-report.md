# Sprint 4 Report - MVP Completion and Service Integration
**Product:** AutoShake AI MVP | **Team:** AutoShake Team | **Date:** May 31, 2026

## Retrospective: Start / Stop / Continue

### Stop Doing
| Action | Reason |
|--------|--------|
| Extra component features | Integration and MVP is the highest priority now |

### Start Doing
| Action | Reason |
|--------|--------|
| Increase unit test coverage | Increased confidence in the project's stability |
| Enforcing code standards | Made the repo easier to understand and explain for all team members |

### Keep Doing
| Action | Reason |
|--------|--------|
| Manual Testing | Discover program defects and potential improvements |
| Bugfixing | Make the final user experience for the MVP seamless |

## Sprint Timeline

| Start Date | End Date |
|---|---|
| 05/17/2026 | 05/31/2026 |

## Sprint Outcomes

### Completed Deliverables
- Unit testing added for backend and ML pipeline components
- Code standards and formatting enforced across much of the repo
- Submission button implemented in the frontend flow
- Login and Create Account pages built
- ML pipeline connected to PDF generator end-to-end
- Deployment infrastructure created with Docker and Railway for the ML pipeline service
- Integration work completed for login, signup, resume upload, and service orchestration

### Story Progress
- US3: As a user, I want to submit my selected jobs so that they are sent for processing — completed, with submission button, list clearing, and backend posting implemented
- US4: As a user, I want to be able to create an account and log in to have persistent resume data — completed, with login and create account pages connected to backend flows
- US5: As a user, I want the jobs I've sent in to be processed and returned to me as PDFs — completed, with ML pipeline connected to PDF output and downloadable resume generation
- US6: As a user, I want to be able to send the jobs to a functional backend server — completed, with backend hosted and communicating with the ML service through deployment infrastructure

### Incomplete
- US7: As a user, I want to be able to download the extension online — not completed, extension distribution and online install flow remain outstanding

## Velocity

| Metric | Value |
|--------|-------|
| Stories completed | 4 |
| Sprint days | 14 |
| Stories/day | 0.27 |

## Burnup Chart

todo

## Sprint Deliverables

- End-to-end submission and resume generation flow
- Login and account management pages
- Unit tests for key backend and ML components
- Docker and Railway deployment for ML pipeline service
- Integration of login, sign up, resume upload, and PDF output services

## Task Breakdown

### Extension

#### Completed
- Built submission button for selected jobs
- Connected job list selection into backend submission flows
- Continued support for job persistence and list state

#### Notes
- Final extension distribution / download workflow is still to be completed

### Backend

#### Completed
- Added unit tests for backend endpoints
- Built authentication and account creation support
- Connected signup/login flows to backend services

#### Notes
- Backend now supports the main user journey through authentication and submission

### AI Engine

#### Completed
- Validated end-to-end generation from job input to downloadable PDF

#### Notes
- Continued work on prompt stability and output consistency remains valuable

## Risks / Concerns

### Output Consistency
- Generated resumes can still vary in format and quality
- Mitigation: continue refining prompt structure and output parsing

## Sprint Outcome

Sprint 4 delivered the core end-to-end MVP flow for AutoShake. The team completed user authentication pages, submission UX, unit test coverage, ML-to-PDF connectivity, and deployment infrastructure for the single ML pipeline service.

This sprint moves the product from component readiness into an integrated workflow, with the remaining focus on deployment robustness, persistent storage, and extension distribution.

## Next Focus Areas

- Finalize extension distribution/download workflow
- Continue refining prompt structure and AI output formatting
- Add more automated tests for the full end-to-end flow
- Fix buggy behavior with the extension
