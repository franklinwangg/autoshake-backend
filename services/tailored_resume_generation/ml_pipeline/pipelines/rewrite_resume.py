import json

from ..integrations.llm import stream_llm
from ..utils.load_prompt import load_prompt


def rewrite_resume(resume: str, target_skills: dict) -> str:
    prompt = load_prompt("rewrite_resume.md", {
        "resume": resume,
        "target_skills": json.dumps(target_skills, indent=2),
    })
    return stream_llm(prompt, max_tokens=8096)
