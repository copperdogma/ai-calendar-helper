/* eslint-disable max-lines-per-function, newline-before-return */
module.exports = (output, context) => {
  const expectedArr = context.test.expected;
  if (!Array.isArray(expectedArr)) {
    return { pass: false, score: 0, reason: 'Expected is not array' };
  }
  let parsed;
  try {
    parsed = typeof output === 'string' ? JSON.parse(output) : output;
  } catch {
    return { pass: false, score: 0, reason: 'Output is not valid JSON' };
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.starts)) {
    return { pass: false, score: 0, reason: 'Output missing starts array' };
  }
  const clean = arr =>
    Array.from(new Set(arr.filter(n => Number.isInteger(n)).map(n => n))).sort((a, b) => a - b);
  const exp = clean(expectedArr);
  const act = clean(parsed.starts);
  const pass = exp.length === act.length && exp.every((v, i) => v === act[i]);

  return { pass, score: pass ? 1 : 0, reason: pass ? 'Matches' : `Expected [${exp}] got [${act}]` };
};
