/* eslint-disable max-lines-per-function */
const IDENTIFICATION_PROMPT = `You are an expert calendar assistant.

Read the following text and decide how many distinct calendar events it describes. It might be zero, one, or many.

Return JSON in this structure:
{
  "events": [
    { "summary": "One-sentence description with a date" }
  ]
}`;

function buildStartLinesPrompt(eventsJson) {
  return `You are helping segment a block of text that has been prefixed with 1-based line numbers (e.g., "3: Lunch at noon").

The user has already identified the following distinct events in this text:
${eventsJson}

Task: For each event summary, choose the line number where that event FIRST begins in the numbered text below. Output JSON in this form:
{
  "starts": [1, 15, 42]
}`;
}

module.exports = async ({ llm, vars }) => {
  const rawText = vars.input.replace(/\\n/g, '\n').trim();
  // Stage 1: identification
  const idResponse = await llm.chat({
    messages: [
      { role: 'system', content: IDENTIFICATION_PROMPT },
      { role: 'user', content: rawText },
    ],
  });
  const idJson = JSON.parse(idResponse);
  const events = Array.isArray(idJson.events) ? idJson.events : [];
  if (events.length <= 1) {
    // Single event → starts at line 1
    return JSON.stringify({ starts: [1] });
  }

  // Stage 2: choose start lines
  const enumerated = rawText
    .split(/\r?\n/)
    .map((l, i) => `${i + 1}: ${l}`)
    .join('\n');
  const startPrompt = buildStartLinesPrompt(JSON.stringify(events));
  const startsResp = await llm.chat({
    messages: [
      { role: 'system', content: startPrompt },
      { role: 'user', content: enumerated },
    ],
  });
  return startsResp; // already JSON
};
