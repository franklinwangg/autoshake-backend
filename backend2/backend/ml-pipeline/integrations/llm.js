import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';

const PROVIDER = process.env.LLM_PROVIDER ?? 'claude';

// --- Claude ---

const claude = PROVIDER === 'claude' ? new Anthropic() : null;
const CLAUDE_MODEL = 'claude-opus-4-7';

async function callClaude(prompt, { maxTokens = 2048 } = {}) {
  const message = await claude.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });
  return message.content.find(b => b.type === 'text')?.text ?? '';
}

async function streamClaude(prompt, { maxTokens = 8096 } = {}) {
  const stream = claude.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: maxTokens,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: prompt }],
  });
  const message = await stream.finalMessage();
  return message.content.find(b => b.type === 'text')?.text ?? '';
}

// --- Ollama ---

const OLLAMA_BASE = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3';

function ollamaFetchError(cause) {
  return new Error(
    `Could not reach Ollama at ${OLLAMA_BASE}. Is it running? Try: ollama serve\nCause: ${cause.message}`
  );
}

async function callOllama(prompt, { maxTokens = 2048 } = {}) {
  let res;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        options: { num_predict: maxTokens },
      }),
    });
  } catch (e) { throw ollamaFetchError(e); }
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.message?.content ?? '';
}

async function streamOllama(prompt, { maxTokens = 8096 } = {}) {
  let res;
  try {
    res = await fetch(`${OLLAMA_BASE}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [{ role: 'user', content: prompt }],
        stream: true,
        options: { num_predict: maxTokens },
      }),
    });
  } catch (e) { throw ollamaFetchError(e); }
  if (!res.ok) throw new Error(`Ollama error: ${res.status} ${await res.text()}`);

  let result = '';
  const decoder = new TextDecoder();
  for await (const chunk of res.body) {
    const lines = decoder.decode(chunk).split('\n').filter(Boolean);
    for (const line of lines) {
      const data = JSON.parse(line);
      result += data.message?.content ?? '';
    }
  }
  return result;
}

// --- Public API ---

export async function callLLM(prompt, options = {}) {
  return PROVIDER === 'ollama' ? callOllama(prompt, options) : callClaude(prompt, options);
}

export async function streamLLM(prompt, options = {}) {
  return PROVIDER === 'ollama' ? streamOllama(prompt, options) : streamClaude(prompt, options);
}
