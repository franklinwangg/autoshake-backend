import { callLLM } from '../integrations/llm.js';
import { loadPrompt } from '../utils/load_prompt.js';

export async function extractSkills(jobDescription) {
  const prompt = loadPrompt('extract_job_skills.md', { job_description: jobDescription });
  const response = await callLLM(prompt, { maxTokens: 2048 });

  // Strip markdown code fences if Claude wrapped the JSON
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('extract_skills: no JSON found in response');

  return JSON.parse(jsonMatch[0]);
}
