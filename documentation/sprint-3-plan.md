# Sprint 3 Plan
**Product:** AutoShake AI MVP | **Team:** AutoShake Team | **Due:** May 17, 2026

## Sprint Goal
Integrate components into an end-to-end flow so selected jobs move from the extension through the backend, AI pipeline, and PDF delivery.

## Team Roles
| Member | Role |
|--------|------|
| Nirav Rawal | Scrum Master |
| Franklin Wang | Product Owner |
| Nataniel Jayaseelan | Developer |
| Tyler Roth | Developer |

## User Stories
### US1 - As a user, I want to select multiple jobs so that I can generate tailored resumes for each one. (8 sp)
**Acceptance Criteria:**
1. Job clicks are detected in the extension.
2. Jobs are added to a list to be sent to backend.
3. Parser is fired for each job you click.
4. Jobs are only added when extension is enabled.

| Task | Assignee | Hours |
|------|----------|-------|
| 1.3 - Parser is fired for each job you click | Tyler | 3h |
| 1.4 - Jobs are only added when extension is enabled | Tyler | 2h |
| **Story Total** | | **5h** |

### US3 - As a user, I want to submit my selected jobs so that they are sent for processing. (3 sp)
**Acceptance Criteria:**
1. Job list is shown in the extension window.
2. Submit button sends jobs and clears the job list.
3. User limits prevent exhausting API tokens.

| Task | Assignee | Hours |
|------|----------|-------|
| 3.2 - Button to submit jobs, clearing the job list | Tyler | 1h |
| 3.3 - User limits to not use all of our API tokens | Franklin | 3h |
| **Story Total** | | **4h** |

### US5 - As a user, I want the jobs I've sent in to be processed and returned to me as PDFs. (13 sp)
**Acceptance Criteria:**
1. Backend server exposes an API.
2. Job data is sent to backend upon submitting jobs.
3. Data is sent to the ML pipeline.
4. PDFs are generated from ML output.
5. PDFs are returned to the frontend.

| Task | Assignee | Hours |
|------|----------|-------|
| 5.1 - Backend server has an API | Nirav/Franklin | 5h |
| 5.3 - Data Sent to ML pipeline | Nirav/Franklin | 3h |
| 5.4 - PDFs generated from ML output | Nataniel | 5h |
| **Story Total** | | **13h** |

### US6 - As a user, I want to be able to send the jobs to a functional backend server. (8 sp))
**Acceptance Criteria:**
1. Backend remains hosted and reachable.
2. Backend communicates reliably with the LLM API.

| Task | Assignee | Hours |
|------|----------|-------|
| 6.1 - Backend code hosted on a server | Franklin | 5h |
| 6.2 - Backend can communicate with an LLM API | Franklin | 2h |
| **Story Total** | | **7h** |

## Total committed: 29h

## Scrum Schedule
| Day | Time | Type |
|-----|------|------|
| Sunday | 8:00 PM | Team Meeting |
| Tuesday | 8:00 AM | Team Meeting |
| Thursday | 2:00 PM | TA Meeting |
