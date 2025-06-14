/* eslint-disable max-lines-per-function, max-statements, complexity, sonarjs/cognitive-complexity */
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

    const compareEvent = (idealEvent, actualEvent) => {
      const fields = ['title', 'startDate', 'endDate', 'location'];
      let correct = 0;
      const mismatches = [];

      fields.forEach(field => {
        if (idealEvent[field] === actualEvent[field]) {
          correct += 1;
        } else {
          mismatches.push(field);
        }
      });

      return { correct, mismatches, total: fields.length };
    };

    // Determine if we are dealing with multiple events
    const idealIsArray = Array.isArray(ideal);
    const actualIsArray = Array.isArray(actual);

    if (idealIsArray !== actualIsArray) {
      // Allow treating a single-element array and a single object as equivalent
      if (idealIsArray && !actualIsArray && ideal.length === 1) {
        const { correct, mismatches, total } = compareEvent(ideal[0], actual);

        return {
          pass: correct === total,
          score: correct / total,
          reason:
            correct === total
              ? 'All fields match (len1 array vs object)'
              : `Mismatch: ${mismatches.join(', ')}`,
        };
      } else if (!idealIsArray && actualIsArray && actual.length === 1) {
        const { correct, mismatches, total } = compareEvent(ideal, actual[0]);

        return {
          pass: correct === total,
          score: correct / total,
          reason:
            correct === total
              ? 'All fields match (object vs len1 array)'
              : `Mismatch: ${mismatches.join(', ')}`,
        };
      }

      return {
        pass: false,
        score: 0,
        reason: 'Shape mismatch between expected and actual (array vs object)',
      };
    }

    if (!idealIsArray) {
      // Single event comparison (existing behavior)
      const { correct, mismatches, total } = compareEvent(ideal, actual);
      score = correct / total;
      pass = score === 1;
      reason = pass ? 'All fields match' : `Mismatch: ${mismatches.join(', ')}`;
    } else {
      // Multi-event comparison – naïve pair-by-index matching
      if (ideal.length !== actual.length) {
        return {
          pass: false,
          score: 0,
          reason: `Event count mismatch (expected ${ideal.length}, got ${actual.length})`,
        };
      }

      let totalCorrect = 0;
      let totalFields = 0;
      const mismatchDetails = [];

      for (let i = 0; i < ideal.length; i += 1) {
        const { correct, mismatches, total } = compareEvent(ideal[i], actual[i]);
        totalCorrect += correct;
        totalFields += total;
        if (mismatches.length > 0) {
          mismatchDetails.push(`event ${i}: ${mismatches.join(', ')}`);
        }
      }

      score = totalCorrect / totalFields;
      pass = score === 1;
      reason = pass ? 'All events match' : `Mismatches: ${mismatchDetails.join('; ')}`;
    }
  } catch (err) {
    pass = false;
    score = 0;
    reason = `Error comparing JSON: ${err instanceof Error ? err.message : 'unknown'}`;
  }

  return { pass, score, reason };
};
