const fs = require('fs');
const inPath = 'evals/fixtures/split-lines-dataset.jsonl';
const outPath = 'evals/fixtures/split-lines-dataset-summaries.jsonl';
const lines = fs.readFileSync(inPath, 'utf8').trim().split(/\n+/);
const out = lines
  .map(line => {
    const obj = JSON.parse(line);
    const count = obj.expected.length;
    obj.vars.eventSummaries = Array.from({ length: count }, (_, i) => `Event ${i + 1}`);
    return JSON.stringify(obj);
  })
  .join('\n');
fs.writeFileSync(outPath, out);
console.log('Wrote', outPath);
