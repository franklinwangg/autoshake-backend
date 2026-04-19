# Job Application Automater

Tailors your resume to a job description using AI.

## Run it

1. Install dependencies:
   ```bash
   pip install openai python-dotenv
   ```

2. Make sure Ollama is running:
   ```bash
   ollama serve
   ollama pull llama3.2
   ```

3. Run:
   ```bash
   python ai_engine.py
   ```

## Swap to OpenAI later

In `.env`, set:
```
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```
