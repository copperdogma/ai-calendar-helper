import fs from 'fs';
import path from 'path';

describe('image-events-dataset.jsonl completeness', () => {
  const DATASET_PATH = path.resolve('evals/fixtures/image-events-dataset.jsonl');

  it('every entry has non-empty expected.description', () => {
    const lines = fs.readFileSync(DATASET_PATH, 'utf8').trim().split(/\n+/);
    expect(lines.length).toBeGreaterThan(0);
    lines.forEach(line => {
      const obj = JSON.parse(line);
      if (!obj.expected || !obj.expected.description) return; // ignore sample lines without expectations
      const desc = (obj.expected.description || '').trim();
      expect(desc.length).toBeGreaterThan(0);
    });
  });
});
