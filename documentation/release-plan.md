# Release Plan: MVP (Fully Connected Resume Generator)

**Product:** AutoShake AI MVP | **Release:** v1.0 | **Release Date:** June 03, 2026 | **Rev:** 1.0 | **Rev Date:** June 02, 2026

## 

## High-Level Goals

1. Enable users to select multiple jobs from the Chrome extension and generate tailored resume PDFs for each selected job.
2. Deliver predictable, structured resume outputs through improved prompt engineering and output formatting.
3. Provide login/account support so users can persist and manage resume generation activity.
4. Ensure a functional backend with end-to-end communication to an LLM-powered processing pipeline.

## 

## User Value

* Users can select and review multiple job postings in the extension.
* Users can submit selected jobs for backend processing and receive tailored PDF resumes.
* Resume outputs follow a consistent structure and format.
* Users can authenticate and persist resume generation data.

## 

## User Stories

|ID|User Story|Story Points|Priority|Sprint|
|-|-|-|-|-|
|US1|As a user, I want to select multiple jobs so that I can generate tailored resumes for each one.|8|High|1|
|US2|As a user, I want the resume outputs to follow a predictable format.|5|High|1|
|US3|As a user, I want to submit my selected jobs so that they are sent for processing.|3|High|1|
|US4|As a user, I want to be able to create an account and log in to have persistent resume data.|8|High|2|
|US5|As a user, I want the jobs I've sent in to be processed and returned to me as PDFs.|13|High|2|
|US6|As a user, I want to be able send the jobs to a functional backend server.|5|High|1|
|US7|As a user, I want to be able to download the extension online.|3|Medium|2|

**Total story points:** 45 | **Team velocity estimate:** 12 pts/sprint | **Sprints needed:** \~4

## 

## Acceptance Criteria

* Jobs can be selected in the extension and added to a submission list only when the extension is enabled.
* Selected jobs are visible in the extension window and can be submitted with a button.
* Submitted jobs are sent to the backend API and routed through the ML pipeline.
* Resume outputs are generated as PDFs and returned to the frontend.
* Account creation, login, logout, and client token handling are connected to the backend.
* The backend is hosted and can communicate with an LLM API.
* Users can download the extension from an online source.

## 

## Reach Goals

* Async processing and status tracking for submitted jobs.
* Persistent storage for user-generated resume outputs.
* Advanced AI pipeline improvements for better formatting and extraction.



