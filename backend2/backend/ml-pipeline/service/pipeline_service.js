import { extractSkills } from '../pipelines/extract_skills.js';
import { rewriteResume } from '../pipelines/rewrite_resume.js';

export async function runPipeline({ job_description, resume }) {
  const extractedSkills = await extractSkills(job_description);
  const generatedResume = await rewriteResume(resume, extractedSkills);
  return { generated_resume: generatedResume };
}
