import { streamLLM } from '../integrations/llm.js';
import { loadPrompt } from '../utils/load_prompt.js';

export async function rewriteResume(resume, targetSkills) {
  const prompt = loadPrompt('rewrite_resume.md', {
    resume,
    target_skills: JSON.stringify(targetSkills, null, 2),
  });
  return streamLLM(prompt, { maxTokens: 8096 });
}
