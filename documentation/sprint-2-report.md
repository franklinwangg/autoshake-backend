# Sprint 2 Report - MVP Components

**Product:** AutoShake AI MVP | **Team:** AutoShake Team | **Date:** May 03, 2026

## 

## Sprint Goal

Build the core Autoshake MVP components so they can be integrated in later sprints: extension job selection, backend API, AI resume generation, and PDF output.

## 

## Retrospective: Start / Stop / Continue

### Stop Doing

|Action|Reason|
|-|-|
|Over-focusing on full integration too early|Slowed progress on individual component work|
|Assuming login/auth could be delayed without impact|Delayed design for persistent resume data|

### 

### Start Doing

|Action|Reason|
|-|-|
|Establish JSON formatting for objects sent across frontend and backend|Makes later integration of systems smoother|

### 

### Keep Doing

|Action|Reason|
|-|-|
|Component-focused development|Delivered extension, backend, AI, and PDF building blocks|
|Cross-team coordination|Kept extension, backend, and ML work updated between team members|

## 

## Sprint Timeline

|Start Date|End Date|
|-|-|
|04/19/2026|05/03/2026|

## 

## Sprint Outcomes

### Completed Deliverables

* Chrome extension job selection component built
* FastAPI backend endpoint scaffolded
* Initial LLM resume generation pipeline developed
* Text-to-PDF conversion pipeline created
* Temporary popup toggle switch implemented
* Job link detection and persistent job list started

### 

### Completed Stories

* US2: As a user, I want the resume outputs to follow a predictable format — completed, with prompt and pipeline improvements toward more consistent formatting

### 

### Completed Subtasks

* US1.1: Detect when job is clicked
* US1.2: Jobs are added to a list to be sent to backend
* US2.1: Improved prompt templates
* US2.2: Structure AI outputs
* US3.1: Show job list in the extension window

## 

## Velocity

|Metric|Value|
|-|-|
|Stories completed|1|
|Sprint days|14|
|Stories/day|0.07|

## 

## Burnup Chart

todo

## 

## Sprint Deliverables

* Chrome extension for job selection
* FastAPI backend for request handling
* LLM-based resume generation pipeline
* PDF generation + storage system

## 

## Task Breakdown

### Extension

#### Completed

* Integrated job click detection on Handshake
* Built a job UI which shows a list of all selected jobs
* User can remove jobs from selected list
* Implemented temporary popup toggle switch

#### Notes

* Will implement GraphQL reponse tracking in sprint 3

### 

### Backend

#### Completed

* Created a backend endpoint
* Researched API endpoint design
* Defined response formatting and FastAPI structure

#### Notes

* Finish FastAPI and connect full request flow in Sprint 3

### 

### AI Engine

#### Completed

* Developed initial single-prompt LLM resume tailoring system
* Experimented with prompting and research
* Continued ML work for prompt quality and resume formatting

#### Notes

* Current system uses raw prompting without multi-agent orchestration
* Emphasis placed on preserving factual correctness of resume content

### 

### Output \& Storage

#### Completed

* Built text-to-PDF conversion pipeline
* Added PDF storage handling
* Implemented job-to-link mapping return format

## 

## Risks / Concerns

### LLM Hallucinations

* AI may generate unsupported resume claims
* Mitigation: tighter prompt constraints and validation checks

### 

### PDF Formatting Inconsistencies

* Layout differences across resume structures
* Mitigation: standardized formatting templates

## 

## Sprint Outcome

Sprint 2 delivered the core components required for later integration into a full MVP pipeline. The team built or started the extension, backend, AI pipeline, and PDF output systems, while noting missing authentication, submit UI, and GraphQL interception work.

The system now supports:

1. Selecting jobs from the Chrome extension
2. Sending requests through FastAPI
3. Generating tailored resumes using an LLM
4. Producing downloadable PDF outputs

This sprint validates the technical feasibility of the platform and establishes the foundation for future improvements including structured resume parsing, better prompt orchestration, stronger formatting, and a full login/auth flow.

## 

## Next Focus Areas

* GraphQL interception
* Employer and job name extraction
* Functional toggle switch completion
* Full PDF generation flow
* Finish FastAPI and backend integration
* User auth and persistent resume data

