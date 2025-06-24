const { OpenAI } = require('openai');

/**
 * Custom Promptfoo provider that calls the OpenAI Responses API with JSON-object format
 * and returns the parsed JSON as `output`.
 *
 * @type {import('promptfoo').ProviderFunction}
 */
module.exports = async function openaiResponsesProvider(prompt, context) {
  const client = new OpenAI();

  // `prompt` is the raw JSON string we defined in the prompt file
  let input;
  try {
    input = JSON.parse(prompt);
  } catch (_) {
    // If parsing fails just wrap as simple text
    input = [{ role: 'user', content: [{ type: 'input_text', text: prompt }] }];
  }

  // Build request
  const resp = await client.responses.create({
    model: 'gpt-4.1-nano',
    input,
    text: { format: { type: 'json_object' } },
  });

  const first = resp.output?.[0];
  let raw = first?.output_text;
  if (!raw && Array.isArray(first?.content)) {
    const part = first.content.find(p => p.type === 'output_text');
    raw = part?.text;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (_) {
    parsed = raw;
  }

  return {
    output: parsed,
    tokenUsage: {
      total: resp.usage?.total_tokens || 0,
      prompt: resp.usage?.input_tokens || 0,
      completion: resp.usage?.output_tokens || 0,
    },
  };
};
