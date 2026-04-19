import json
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

SYSTEM_PROMPT = """You are a professional resume writer. Your job is to tailor a candidate's existing resume to a specific job description.

STRICT RULES — you MUST follow all of these:
1. Only use facts, experiences, skills, and achievements that are EXPLICITLY stated in the provided resume.
2. Do NOT invent, infer, or hallucinate any skills, roles, companies, dates, metrics, or accomplishments.
3. Rephrase and reorder existing content to align with the language and priorities of the job description.
4. Omit experience sections that are entirely irrelevant to the job — do not include them in the output at all.
5. Mirror terminology from the job description where it accurately describes something already in the resume.
6. Output ONLY valid JSON — no markdown, no code fences, no explanation text.

OUTPUT FORMAT (strict):
{
  "summary": "<2-3 sentence professional summary drawn only from resume facts, optimized for the job>",
  "skills": ["<skill1>", "<skill2>", ...],
  "experience": [
    {
      "role": "<Job Title at Company>",
      "bullets": ["<achievement or responsibility>", ...]
    }
  ]
}

If the resume contains no relevant experience for the job, return an empty experience array.
Never fabricate. Accuracy is paramount."""


def generate_resume(resume_text: str, job_description: str) -> dict:
    """
    Tailors a resume to a job description using a single LLM call.

    Args:
        resume_text: The candidate's raw resume as plain text.
        job_description: The target job description as plain text.

    Returns:
        A dict with keys: summary (str), skills (list[str]), experience (list[dict]).

    Raises:
        ValueError: If the LLM returns malformed or non-JSON output.
        openai.OpenAIError: If the API call fails.
    """
    provider = os.getenv("LLM_PROVIDER", "openai").lower()

    if provider == "ollama":
        client = OpenAI(
            base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1"),
            api_key="ollama",  # Ollama doesn't require a real key
        )
        model = os.getenv("OLLAMA_MODEL", "llama3.2")
        # Ollama doesn't support response_format json_object on all models,
        # so we rely on the system prompt instruction instead.
        extra_kwargs = {}
    else:
        client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        model = "gpt-4o"
        extra_kwargs = {"response_format": {"type": "json_object"}}

    user_message = f"""RESUME:
{resume_text.strip()}

JOB DESCRIPTION:
{job_description.strip()}

Tailor the resume to this job description following the rules in your instructions. Return only the JSON object."""

    response = client.chat.completions.create(
        model=model,
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ],
        **extra_kwargs,
    )

    raw = response.choices[0].message.content

    try:
        result = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError(f"LLM returned invalid JSON: {e}\n\nRaw output:\n{raw}") from e

    # Validate required top-level keys are present
    required_keys = {"summary", "skills", "experience"}
    missing = required_keys - result.keys()
    if missing:
        raise ValueError(f"LLM output missing required keys: {missing}\n\nRaw output:\n{raw}")

    return result


if __name__ == "__main__":
    sample_resume = """
    Jane Doe | jane@example.com | github.com/janedoe

    SUMMARY
    Software engineer with 4 years of experience building web applications in Python and JavaScript.

    SKILLS
    Python, JavaScript, React, Flask, PostgreSQL, REST APIs, Git, Docker, AWS (EC2, S3)

    EXPERIENCE
    Backend Engineer — Acme Corp (2022–Present)
    - Designed and maintained REST APIs serving 500k requests/day using Flask and PostgreSQL
    - Reduced API response time by 40% by introducing Redis caching
    - Led migration of monolithic app to microservices on AWS ECS

    Junior Developer — StartupXYZ (2020–2022)
    - Built React dashboards for internal analytics tools
    - Wrote Python ETL scripts to process CSV data into PostgreSQL
    - Collaborated in agile team of 6 engineers using GitHub and Jira

    EDUCATION
    B.S. Computer Science — State University, 2020
    """

    sample_job = """
    Senior Backend Engineer — CloudBase Inc.

    We are looking for a backend engineer to join our platform team.

    Requirements:
    - 3+ years building scalable REST APIs
    - Strong Python skills
    - Experience with PostgreSQL or other relational databases
    - Familiarity with cloud infrastructure (AWS preferred)
    - Comfortable with Docker and CI/CD pipelines

    Nice to have:
    - Redis or other caching systems
    - Microservices architecture experience
    """

    tailored = generate_resume(sample_resume, sample_job)
    print(json.dumps(tailored, indent=2))
