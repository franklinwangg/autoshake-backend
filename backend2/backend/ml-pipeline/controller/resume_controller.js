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

async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', chunk => { data += chunk; });
    process.stdin.on('end', () => resolve(data.trim()));
  });
}

async function main() {
  let input;

  if (process.argv[2]) {
    input = JSON.parse(readFileSync(process.argv[2], 'utf-8'));
  } else {
    const raw = await readStdin();
    input = JSON.parse(raw);
  }

  console.error('Step 1: Extracting skills from job description...');
  const output = await handleRequest(input);
  console.error('Step 2: Resume rewrite complete.');

  const outputPath = join(__dirname, '..', 'outputs', `resume_${Date.now()}.json`);
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.error(`Output saved to ${outputPath}`);

  // stdout is the return channel when called as a subprocess
  console.log(JSON.stringify(output));
}

// Only run as CLI when executed directly (not when imported)
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(err.message);
    process.exit(1);
  });
}
