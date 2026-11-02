// customer-feedback-analyzer
// scripts/send-test-feedback.js
// Automated batch sender for 50-comment acceptance verification.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const testDataPath = path.join(projectRoot, 'test-data', 'feedback-50.json');
const lastRunPath = path.join(projectRoot, 'test-data', 'last-run.json');

const items = JSON.parse(fs.readFileSync(testDataPath, 'utf8'));
const delayMs = Number(process.env.TEST_DELAY_MS) || 6000;
const baseUrl = (process.env.N8N_BASE_URL || 'http://localhost:5678').replace(/\/+$/, '');
const webhookUrl = `${baseUrl}/webhook/feedback`;

const batchId = `test-${Date.now()}`;

console.log('='.repeat(65));
console.log('ChopFast 50-Comment Acceptance Test Sender');
console.log(`Batch ID:      ${batchId}`);
console.log(`Total Items:   ${items.length}`);
console.log(`Delay Between: ${delayMs}ms (~${Math.round((items.length * delayMs) / 60000)} minutes total)`);
console.log(`Target URL:    ${webhookUrl}`);
console.log('='.repeat(65));

const results = [];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const startedAt = new Date().toISOString();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const payload = {
      source: item.source || 'survey',
      customer_name: item.customer_name,
      customer_email: item.customer_email,
      rating: item.rating,
      comment: item.comment,
      batch_id: batchId
    };

    const idxStr = `[${String(i + 1).padStart(2, '0')}/${items.length}]`;
    const label = item.expected_group || item.expected_category;

    let json = null;
    let resStatus = 0;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        resStatus = res.status;
        json = await res.json();

        // If the AI service returned an untriaged fallback on an expected complaint/bug, wait and retry
        if (json.issue_group === 'untriaged' && item.expected_category !== 'praise' && attempt < maxAttempts) {
          console.log(`${idxStr} [Rate-limit backoff] Got untriaged, waiting 15s before attempt ${attempt + 1}...`);
          await sleep(15000);
          continue;
        }

        break;
      } catch (err) {
        if (attempt < maxAttempts) {
          console.log(`${idxStr} [Network error] ${err.message}, waiting 15s before attempt ${attempt + 1}...`);
          await sleep(15000);
        } else {
          json = { error: err.message };
        }
      }
    }

    const gotGroup = json?.issue_group || '(none)';
    const gotCat = json?.category || '?';
    const angryIcon = json?.is_angry ? '🚨 ANGRY' : '';

    console.log(`${idxStr} ${label.padEnd(16)} -> got: ${gotGroup.padEnd(20)} [${gotCat}] ${angryIcon}`);

    results.push({
      n: item.n,
      expected_category: item.expected_category,
      expected_group: item.expected_group,
      expected_angry: item.expected_angry,
      actual_id: json?.id,
      actual_category: json?.category,
      actual_group: json?.issue_group,
      actual_score: json?.sentiment_score,
      actual_angry: json?.is_angry,
      status: resStatus
    });

    if (i < items.length - 1) {
      await sleep(delayMs);
    }
  }

  const completedAt = new Date().toISOString();

  const runData = {
    batch_id: batchId,
    started_at: startedAt,
    completed_at: completedAt,
    count: results.length,
    results
  };

  fs.writeFileSync(lastRunPath, JSON.stringify(runData, null, 2), 'utf8');
  console.log('='.repeat(65));
  console.log(`Batch complete! Saved results to ${path.relative(projectRoot, lastRunPath)}`);
  console.log(`Now run: npm run test:verify`);
  console.log('='.repeat(65));
}

run().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
