from pathlib import Path

PROMPTS_DIR = Path(__file__).resolve().parents[1] / "prompts"


def load_prompt(filename: str, vars: dict = {}) -> str:
    template = (PROMPTS_DIR / filename).read_text(encoding="utf-8")
    for key, value in vars.items():
        template = template.replace(f"{{{{{key}}}}}", value)
    return template
