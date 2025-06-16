module.exports = async function ({ vars }) {
  const systemPrompt = `You are an expert calendar assistant. Read the user text and identify each distinct calendar event, summarizing each in one concise sentence that includes its date. Respond via OpenAI function call returning valid JSON.`;

  const userText = (vars.input || '').replace(/\\n/g, '\n');

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText },
  ];
};
