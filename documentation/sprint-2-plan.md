# Sprint 2 Plan

**Product:** AutoShake AI MVP | **Team:** AutoShake Team | **Due:** May 3, 2026

## 

## Sprint Goal

Finish every core component so the extension, backend, ML processing, and PDF output are all implemented.

## 

## Team Roles

|Member|Role|
|-|-|
|Nataniel Jayaseelan|Scrum Master|
|Franklin Wang|Product Owner|
|Nirav Rawal|Developer|
|Tyler Roth|Developer|

## 

## User Stories

### US1 - As a user, I want to select multiple jobs so that I can generate tailored resumes for each one. (8 sp)

**Acceptance Criteria:**

1. Job clicks are detected in the extension.
2. Jobs are added to a list to be sent to backend.
3. Parser is fired for each job you click.
4. Jobs are only added when extension is enabled.

|Task|Assignee|Hours|
|-|-|-|
|1.1 - Detect when job is clicked|Tyler|1h|
|1.2 - Jobs are added to a list to be sent to backend|Tyler|2h|
|1.3 - Parser is fired for each job you click|Tyler|3h|
|1.4 - Jobs are only added when extension is enabled|Tyler|2h|
|**Story Total**||**8h**|

### 

### US2 - As a user, I want the resume outputs to follow a predictable format. (5 sp)

**Acceptance Criteria:**

1. Improved prompt templates are implemented.
2. AI outputs are structured for predictable formatting.

|Task|Assignee|Hours|
|-|-|-|
|2.1 - Improved prompt templates|Franklin|2h|
|2.2 - Structure AI outputs|Franklin|2h|
|**Story Total**||**4h**|

### 

### US3 - As a user, I want to submit my selected jobs so that they are sent for processing. (3 sp)

**Acceptance Criteria:**

1. Job list is shown in the extension window.
2. Submit button sends jobs and clears the job list.
3. User limits prevent exhausting API tokens.

|Task|Assignee|Hours|
|-|-|-|
|3.1 - Show job list in the extension window|Tyler|2h|
|3.2 - Button to submit jobs, clearing the job list|Tyler|1h|
|3.3 - User limits to not use all of our API tokens|Franklin|3h|
|**Story Total**||**6h**|

### 

### (Partial) US5 - As a user, I want the jobs I've sent in to be processed and returned to me as PDFs. (13 sp)

**Acceptance Criteria:**

1. Backend server exposes an API.
2. Job data is sent to backend upon submitting jobs.
3. Data is sent to the ML pipeline.
4. PDFs are generated from ML output.
5. PDFs are returned to the frontend.

|Task|Assignee|Hours|
|-|-|-|
|5.1 - Backend server has an API|Nirav/Franklin|5h|
|5.3 - Data Sent to ML pipeline|Nirav/Franklin|3h|
|5.4 - PDFs generated from ML output|Nataniel|5h|
|**Story Total**||**13h**|



## 

## Total committed: 31h

## 

## Scrum Schedule

|Day|Time|Type|
|-|-|-|
|Saturday|8:00 PM|Team Meeting|
|Tuesday|8:00 AM|Team Meeting|
|Thursday|2:00 PM|TA Meeting|



