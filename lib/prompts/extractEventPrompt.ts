import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { EXTRACT_EVENTS_FUNCTION } from './schemas';

export function buildExtractEventMessages(
  snippet: string,
  tz: string
): ChatCompletionMessageParam[] {
  const nowISODate = new Date().toISOString().split('T')[0];
  const systemPrompt = `You are an expert calendar event extraction AI. The CURRENT DATE is ${nowISODate} (ISO 8601). The user's timezone is ${tz}.\n\nGiven a snippet that describes EXACTLY ONE calendar event, return the structured JSON via OpenAI function call \"extract_events\".`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: snippet.trim() },
  ];
}

export { EXTRACT_EVENTS_FUNCTION };
