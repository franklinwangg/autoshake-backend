import json
import re

from ..integrations.llm import call_llm
from ..utils.load_prompt import load_prompt


def extract_skills(job_description: str) -> dict:
    prompt = load_prompt("extract_job_skills.md", {"job_description": job_description})
    response = call_llm(prompt, max_tokens=2048)

    match = re.search(r'\{[\s\S]*\}', response)
    if not match:
        raise ValueError("extract_skills: no JSON found in response")

    return json.loads(match.group(0))
