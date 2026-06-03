# Sprint 4 Plan
**Product:** AutoShake AI MVP | **Team:** AutoShake Team | **Due:** May 31, 2026

## Sprint Goal
Add authentication and persistent user context while finishing final integration for the full sign-on, submit, and resume delivery experience.

## Team Roles
| Member | Role |
|--------|------|
| Tyler Roth | Scrum Master |
| Franklin Wang | Product Owner |
| Nataniel Jayaseelan | Developer |
| Nirav Rawal | Developer |

## User Stories
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

### US4 - As a user, I want to be able to create an account and log in to have persistent resume data. (8 sp)
**Acceptance Criteria:**
1. Login page is available.
2. Create account page is available.
3. Login and create account are connected to the backend.
4. Client token handling is implemented.
5. Backend security is in place.
6. Logout ends the session.

| Task | Assignee | Hours |
|------|----------|-------|
| 4.1 - Login Page | Tyler | 2h |
| 4.2 - Create Account Page | Tyler | 2h |
| 4.3 - Login and create account connected to backend | Franklin | 3h |
| 4.4 - Client Token | Franklin | 3h |
| 4.5 - Backend Security | Franklin | 3h |
| 4.6 - Logout | Tyler | 1h |
| **Story Total** | | **14h** |

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
| **Story Total** | | **8h** |

### US6 - As a user, I want to be able send the jobs to a functional backend server. (8 sp)
**Acceptance Criteria:**
1. Backend code is hosted on a server.
2. Backend can communicate with an LLM API.

| Task | Assignee | Hours |
|------|----------|-------|
| 6.1 - Backend code hosted on a server | Franklin | 6h |
| 6.2 - Backend can communicate with an LLM API | Franklin | 2h |
| **Story Total** | | **8h** |

### US7 - As a user, I want to be able to download the extension online. (3 sp)
**Acceptance Criteria:**
1. Extension packaging is ready for distribution.
2. An online download source is available.
3. Users can install the extension from that source.

**Story Total:** **5h**

## Total committed: 39h

## Scrum Schedule
| Day | Time | Type |
|-----|------|------|
| Sunday | 8:00 PM | Team Meeting |
| Tuesday | 8:00 AM | Team Meeting |
| Thursday | 2:00 PM | TA Meeting |
