/**
 * customer-feedback-analyzer
 * scripts/build-workflows.js
 * Reads workflow templates from n8n/workflows/, replaces __KEY__ placeholders
 * with values from .env, and writes generated JSON files to n8n/dist/.
 */

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const OPTIONAL_KEYS = new Set([
  'GOOGLE_PLACE_ID',
  'CRED_PLACES_HEADER_ID'
]);

const projectRoot = path.resolve(import.meta.dirname, '..');
const workflowsDir = path.join(projectRoot, 'n8n', 'workflows');
const distDir = path.join(projectRoot, 'n8n', 'dist');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

if (!fs.existsSync(workflowsDir)) {
  fs.mkdirSync(workflowsDir, { recursive: true });
}

const templateFiles = fs
  .readdirSync(workflowsDir)
  .filter((file) => file.endsWith('.template.json'));

if (templateFiles.length === 0) {
  console.log('No workflow templates found in n8n/workflows/. Created n8n/dist/ successfully.');
  process.exit(0);
}

const missingKeysSet = new Set();
const compiledWorkflows = [];

for (const file of templateFiles) {
  const filePath = path.join(workflowsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  const matches = content.matchAll(/__([A-Z0-9_]+)__/g);
  for (const match of matches) {
    const key = match[1];
    const val = process.env[key];
    if ((val === undefined || val === '') && !OPTIONAL_KEYS.has(key)) {
      missingKeysSet.add(key);
    }
  }

  const replaced = content.replace(/__([A-Z0-9_]+)__/g, (_match, key) => {
    return process.env[key] !== undefined ? process.env[key] : '';
  });

  const outputName = file.replace('.template.json', '.json');
  compiledWorkflows.push({ outputName, content: replaced });
}

if (missingKeysSet.size > 0) {
  console.error('\nERROR: The following required environment variables are missing in .env:');
  for (const key of missingKeysSet) {
    console.error(`  - ${key}`);
  }
  console.error('\nPlease populate these variables before building workflows.\n');
  process.exit(1);
}

// Clean old dist files
for (const file of fs.readdirSync(distDir)) {
  if (file.endsWith('.json')) {
    fs.unlinkSync(path.join(distDir, file));
  }
}

for (const wf of compiledWorkflows) {
  const outPath = path.join(distDir, wf.outputName);
  fs.writeFileSync(outPath, wf.content, 'utf8');
  console.log(`Generated: ${path.relative(projectRoot, outPath)}`);
}

console.log(`\nSuccessfully built ${compiledWorkflows.length} workflow(s) to n8n/dist/.`);
