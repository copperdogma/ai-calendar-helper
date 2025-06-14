module.exports = (output, context) => {
  let pass = false;
  let score = 0;
  let reason = '';

  try {
    const expected = context.test.expected;
    if (!expected) {
      return {
        pass: false,
        score: 0,
        reason: 'Missing expected data in test case',
      };
    }

    const ideal = expected;
    const actual = typeof output === 'string' ? JSON.parse(output) : output;

    const fields = ['title', 'startDate', 'endDate', 'location'];
    let correct = 0;
    const mismatches = [];

    fields.forEach(field => {
      if (ideal[field] === actual[field]) {
        correct += 1;
      } else {
        mismatches.push(field);
      }
    });

    score = correct / fields.length;
    pass = score === 1;
    reason = pass ? 'All fields match' : `Mismatch: ${mismatches.join(', ')}`;
  } catch (err) {
    pass = false;
    score = 0;
    reason = `Error comparing JSON: ${err instanceof Error ? err.message : 'unknown'}`;
  }

  return { pass, score, reason };
};
