import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { IDENTIFY_EVENTS_FUNCTION } from './schemas';

/**
 * Build the messages array for the first stage (event identification).
 */
export function buildIdentificationMessages(userText: string): ChatCompletionMessageParam[] {
  const systemPrompt = `You are an expert calendar assistant.\n\nRead the user text and identify each distinct calendar event, summarizing each in one concise sentence that includes its date. Respond via OpenAI function call \"identify_events\".`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userText.trim() },
  ];
}

export { IDENTIFY_EVENTS_FUNCTION };
