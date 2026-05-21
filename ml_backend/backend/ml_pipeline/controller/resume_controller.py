from ..service.pipeline_service import run_pipeline


def handle_request(input_data: dict) -> dict:
    job_description = input_data.get("job_description")
    resume = input_data.get("resume")
    if not job_description or not resume:
        raise ValueError("Input must include job_description and resume")
    return run_pipeline(job_description, resume)
