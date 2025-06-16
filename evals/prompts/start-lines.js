module.exports = async function ({ vars }) {
  const { input = '', eventSummaries = [] } = vars;
  // Ensure we have numbered text so the model can reference lines
  const numbered = input
    .replace(/\\n/g, '\n')
    .trim()
    .split(/\r?\n/)
    .map((line, idx) => `${idx + 1}: ${line}`)
    .join('\n');

  const systemPrompt = `You are an expert calendar assistant.\n\nThe user will give you:\n1. A block of text where each line is prefixed by its 1-based line number.\n2. An array of short event summaries that were extracted from this text in an earlier step.\n\nTask: For each summary, choose the line number where that event FIRST begins in the numbered text.\n\nReturn your answer via an OpenAI function call named \\\"start_lines\\\" with JSON arguments of the form:{\\n  \"starts\": [1,15,42]\\n}`;

  return [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: `Event summaries:\n${JSON.stringify(eventSummaries)}\n\nNumbered text:\n${numbered}`,
    },
  ];
};
