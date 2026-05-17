import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { runPipeline } from '../service/pipeline_service.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function handleRequest(input) {
  if (!input.job_description || !input.resume) {
    throw new Error('Input must include job_description and resume');
  }
  return runPipeline(input);
}

async function main() {
  const inputPath = process.argv[2] ?? join(__dirname, '..', 'test-data', 'sample_input.json');
  const input = JSON.parse(readFileSync(inputPath, 'utf-8'));

  console.error('Step 1: Extracting skills from job description...');
  const output = await handleRequest(input);
  console.error('Step 2: Resume rewrite complete.');

  const outputPath = join(__dirname, '..', 'outputs', `resume_${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`Output saved to ${outputPath}`);

  console.log(JSON.stringify(output, null, 2));
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
