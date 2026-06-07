import json
import logging
import re

from ..integrations.llm import call_llm
from ..utils.load_prompt import load_prompt

logger = logging.getLogger(__name__)


def extract_skills(job_description: str) -> dict:
    prompt = load_prompt("extract_job_skills.md", {"job_description": job_description})
    response = call_llm(prompt, max_tokens=2048)
    logger.debug("[extract_skills] Raw LLM response:\n%s", response)

    match = re.search(r'\{[\s\S]*\}', response)
    if not match:
        logger.error("[extract_skills] No JSON found in response. Full response was:\n%s", response)
        raise ValueError("extract_skills: no JSON found in response")

    return json.loads(match.group(0))
