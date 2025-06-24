import fs from 'fs';
import path from 'path';

// Converts legacy image-events-dataset.jsonl lines (image,text,expected) -> promptfoo 0.115 TestCase format
// New shape per line: { description: "Row #N", vars: { image, text }, assert: expected }

const DATASET_PATH = path.resolve('evals/fixtures/image-events-dataset.jsonl');

function convert() {
  const lines = fs.readFileSync(DATASET_PATH, 'utf8').split(/\n+/).filter(Boolean);
  const newLines = lines.map((line, idx) => {
    const obj = JSON.parse(line);
    const { image, text = '', expected } = obj;
    return JSON.stringify({ description: `Row #${idx + 1}`, vars: { image, text }, expected });
  });
  fs.writeFileSync(DATASET_PATH, newLines.join('\n') + '\n');
  console.log(`Converted ${lines.length} rows to new TestCase format.`);
}

convert();
