# Release Plan: MVP (Fully Connected Resume Generator)



## Objective

Deliver a fully functional system that allows users to generate tailored resumes from selected jobs.

\---

## User Value

* Users can select jobs
* Upload resume
* Generate tailored PDFs
* Download outputs

\---

## Included Features

* Chrome extension job selection
* Resume upload
* Backend API (FastAPI)
* Single-shot LLM resume generation
* PDF generation
* Basic storage + links

\---

## Reach Goals

* Async processing
* Status tracking
* Persistent storage guarantees
* Advanced AI pipeline

\---

## Release Criteria

* End-to-end flow works without manual intervention
* Multiple jobs generate separate PDFs
* No critical crashes
* Output is usable (not perfect)

\---

## Known Limitations

* Slow processing (blocking)
* Inconsistent formatting
* No progress visibility

\---

## Testing Scope

* Unit test coverage throughout the program

