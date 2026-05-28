import json
import os

import httpx
import anthropic
from openai import AzureOpenAI
from dotenv import load_dotenv

load_dotenv()

PROVIDER = os.getenv("LLM_PROVIDER", "claude")
CLAUDE_MODEL = "claude-opus-4-7"
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
AZURE_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")

_claude = anthropic.Anthropic() if PROVIDER == "claude" else None
_azure = AzureOpenAI(
    api_key=os.getenv("AZURE_OPENAI_API_KEY"),
    azure_endpoint=os.getenv("AZURE_OPENAI_ENDPOINT"),
    api_version=os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01"),
) if PROVIDER == "azure" else None


def call_llm(prompt: str, max_tokens: int = 2048) -> str:
    if PROVIDER == "azure":
        return _call_azure(prompt, max_tokens)
    if PROVIDER == "ollama":
        return _call_ollama(prompt, max_tokens)
    return _call_claude(prompt, max_tokens)


def stream_llm(prompt: str, max_tokens: int = 8096) -> str:
    if PROVIDER == "azure":
        return _call_azure(prompt, max_tokens)
    if PROVIDER == "ollama":
        return _stream_ollama(prompt, max_tokens)
    return _stream_claude(prompt, max_tokens)


# --- Claude ---

def _call_claude(prompt: str, max_tokens: int) -> str:
    message = _claude.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    )
    return next(b.text for b in message.content if b.type == "text")


def _stream_claude(prompt: str, max_tokens: int) -> str:
    with _claude.messages.stream(
        model=CLAUDE_MODEL,
        max_tokens=max_tokens,
        thinking={"type": "adaptive"},
        messages=[{"role": "user", "content": prompt}],
    ) as stream:
        message = stream.get_final_message()
    return next(b.text for b in message.content if b.type == "text")


# --- Azure OpenAI ---

def _call_azure(prompt: str, max_tokens: int) -> str:
    response = _azure.chat.completions.create(
        model=AZURE_DEPLOYMENT,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=max_tokens,
    )
    return response.choices[0].message.content


# --- Ollama ---

def _ollama_error(e: Exception) -> RuntimeError:
    return RuntimeError(
        f"Could not reach Ollama at {OLLAMA_BASE}. Is it running? Try: ollama serve\nCause: {e}"
    )


def _call_ollama(prompt: str, max_tokens: int) -> str:
    try:
        resp = httpx.post(
            f"{OLLAMA_BASE}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
                "options": {"num_predict": max_tokens},
            },
            timeout=120.0,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]
    except httpx.ConnectError as e:
        raise _ollama_error(e)


def _stream_ollama(prompt: str, max_tokens: int) -> str:
    try:
        result = []
        with httpx.stream(
            "POST",
            f"{OLLAMA_BASE}/api/chat",
            json={
                "model": OLLAMA_MODEL,
                "messages": [{"role": "user", "content": prompt}],
                "stream": True,
                "options": {"num_predict": max_tokens},
            },
            timeout=300.0,
        ) as resp:
            resp.raise_for_status()
            for line in resp.iter_lines():
                if line:
                    data = json.loads(line)
                    result.append(data.get("message", {}).get("content", ""))
        return "".join(result)
    except httpx.ConnectError as e:
        raise _ollama_error(e)
