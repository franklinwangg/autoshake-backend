import copy
import json
import re

from ..integrations.llm import stream_llm
from ..utils.load_prompt import load_prompt


def rewrite_resume_structured(resume_data: dict, target_skills: dict) -> dict:
    basics = resume_data.get("basics", {})
    experience = resume_data.get("experience", [])
    projects = resume_data.get("projects", [])

    prompt = load_prompt("rewrite_resume_structured.md", {
        "summary": basics.get("summary", ""),
        "experience_bullets": json.dumps(
            [exp.get("bullets", []) for exp in experience], indent=2
        ),
        "project_bullets": json.dumps(
            [proj.get("bullets", []) for proj in projects], indent=2
        ),
        "target_skills": json.dumps(target_skills, indent=2),
    })

    response = stream_llm(prompt, max_tokens=4096)

    match = re.search(r'\{[\s\S]*\}', response)
    if not match:
        raise ValueError("rewrite_resume_structured: no JSON found in LLM response")

    updates = json.loads(match.group(0))

    result = copy.deepcopy(resume_data)

    if "summary" in updates:
        result.setdefault("basics", {})["summary"] = updates["summary"]

    for i, bullets in enumerate(updates.get("experience_bullets", [])):
        if i < len(result.get("experience", [])):
            result["experience"][i]["bullets"] = bullets

    for i, bullets in enumerate(updates.get("project_bullets", [])):
        if i < len(result.get("projects", [])):
            result["projects"][i]["bullets"] = bullets

    return result
