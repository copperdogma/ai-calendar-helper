module.exports = function (params) {
  const { expected } = params;
  let rawOutput = params.llmOutput ?? params.output ?? params.outputStr;
  /**
   * IMPORTANT ─ Do NOT convert this back to a simple boolean.
   * We deliberately return an object that includes a `reason` string so that
   * Promptfoo's HTML/console reports show *why* a test failed.  In early June
   * 2025 we spent hours tweaking prompts that were already correct because the
   * real issue was trailing non-JSON text that made JSON.parse fail.  Rich
   * error messages make that class of failure obvious at a glance.
   *
   * Update 2025-06-16: Promptfoo's `type: javascript` assertions accept only a
   * primitive return value (boolean/number). Returning an object causes the
   * framework itself to throw and masks real results.  We therefore keep the
   * *boolean* contract but emit the detailed context via `console.error`.  The
   * messages appear inline in CLI and HTML reports, preserving debuggability
   * without breaking Promptfoo.
   */
  try {
    console.error('[DEBUG] params keys:', Object.keys(params));
    console.error('[DEBUG] raw output param:', rawOutput);

    // Some models (e.g., gpt-4.1-nano) append stray tokens or pretty-print the
    // JSON across multiple lines.  We capture the FIRST complete JSON object
    // in the string by balancing braces.
    const extractJson = text => {
      const start = text.indexOf('{');
      if (start === -1) return null;
      let depth = 0;
      for (let i = start; i < text.length; i++) {
        const ch = text[i];
        if (ch === '{') depth++;
        if (ch === '}') {
          depth--;
          if (depth === 0) return text.slice(start, i + 1);
        }
      }
      return null; // no balanced object found
    };

    if (rawOutput == null) {
      console.error('[PARSE]', 'rawOutput is null/undefined');
      return false;
    }
    let raw;
    if (typeof rawOutput === 'string') {
      raw = rawOutput;
    } else {
      raw = JSON.stringify(rawOutput) || '';
    }

    const jsonStr = extractJson(raw);
    if (!jsonStr) {
      console.error('[PARSE]', 'no JSON object found');
      return false;
    }

    const parsed = JSON.parse(jsonStr);

    let eventsArr = null;
    if (Array.isArray(parsed.events)) {
      eventsArr = parsed.events;
    } else if (
      parsed &&
      typeof parsed === 'object' &&
      parsed.name === 'identify_events' &&
      typeof parsed.arguments === 'string'
    ) {
      try {
        const inner = JSON.parse(parsed.arguments);
        if (Array.isArray(inner.events)) {
          eventsArr = inner.events;
        }
      } catch (e) {
        console.error('[PARSE]', 'arguments JSON parse error');
        return false;
      }
    }

    const count = Array.isArray(eventsArr) ? eventsArr.length : 0;
    const pass = count === expected;
    if (!pass) {
      console.error('[COUNT]', `expected ${expected} events, got ${count}`);
    }
    return pass;
  } catch (err) {
    console.error('[PARSE]', `JSON.parse error: ${err.message}`);
    return false;
  }
};
