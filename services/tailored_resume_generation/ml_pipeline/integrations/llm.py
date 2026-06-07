import json
import logging
import os

import httpx
import anthropic
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

PROVIDER = os.getenv("LLM_PROVIDER", "claude")
CLAUDE_MODEL = "claude-opus-4-7"
OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")

logger.info("[llm] Provider: %s | Claude model: %s | Ollama model: %s | OpenAI model: %s",
            PROVIDER, CLAUDE_MODEL, OLLAMA_MODEL, OPENAI_MODEL)

_claude = anthropic.Anthropic() if PROVIDER == "claude" else None
_openai = OpenAI(api_key=os.getenv("OPENAI_API_KEY")) if PROVIDER == "openai" else None


def call_llm(prompt: str, max_tokens: int = 2048) -> str:
    logger.debug("[llm] call_llm — provider: %s, max_tokens: %d, prompt_length: %d", PROVIDER, max_tokens, len(prompt))
    if PROVIDER == "openai":
        return _call_openai(prompt, max_tokens)
    if PROVIDER == "ollama":
        return _call_ollama(prompt, max_tokens)
    return _call_claude(prompt, max_tokens)


def stream_llm(prompt: str, max_tokens: int = 8096) -> str:
    logger.debug("[llm] stream_llm — provider: %s, max_tokens: %d, prompt_length: %d", PROVIDER, max_tokens, len(prompt))
    if PROVIDER == "openai":
        return _call_openai(prompt, max_tokens)
    if PROVIDER == "ollama":
        return _stream_ollama(prompt, max_tokens)
    return _stream_claude(prompt, max_tokens)


# --- Claude ---

def _call_claude(prompt: str, max_tokens: int) -> str:
    logger.debug("[llm] Calling Claude — model: %s, max_tokens: %d", CLAUDE_MODEL, max_tokens)
    try:
        message = _claude.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            messages=[{"role": "user", "content": prompt}],
        )
        logger.debug("[llm] Claude response — stop_reason: %s, content blocks: %d", message.stop_reason, len(message.content))
        return next(b.text for b in message.content if b.type == "text")
    except Exception:
        logger.exception("[llm] Claude API call failed — model: %s", CLAUDE_MODEL)
        raise


def _stream_claude(prompt: str, max_tokens: int) -> str:
    logger.debug("[llm] Streaming Claude — model: %s, max_tokens: %d", CLAUDE_MODEL, max_tokens)
    try:
        with _claude.messages.stream(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            thinking={"type": "adaptive"},
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            message = stream.get_final_message()
        logger.debug("[llm] Claude stream complete — stop_reason: %s, content blocks: %d", message.stop_reason, len(message.content))
        return next(b.text for b in message.content if b.type == "text")
    except Exception:
        logger.exception("[llm] Claude streaming failed — model: %s", CLAUDE_MODEL)
        raise


# --- OpenAI ---

def _call_openai(prompt: str, max_tokens: int) -> str:
    response = _openai.chat.completions.create(
        model=OPENAI_MODEL,
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
