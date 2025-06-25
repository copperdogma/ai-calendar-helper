/**
 * @jest-environment node
 */

import {
  buildIdentificationMessages,
} from '@/lib/prompts/identificationPrompt';
import {
  buildExtractEventMessages,
} from '@/lib/prompts/extractEventPrompt';
import {
  buildStartLinesMessages,
} from '@/lib/prompts/startLinesPrompt';

describe('Prompt builder helpers', () => {
  it('buildIdentificationMessages returns system and user roles', () => {
    const msgs = buildIdentificationMessages('Dinner at 7pm');
    expect(msgs[0].role).toBe('system');
    expect(msgs[1].role).toBe('user');
    expect(msgs[1].content).toContain('Dinner');
  });

  it('buildExtractEventMessages includes timezone and current date', () => {
    const msgs = buildExtractEventMessages('Doctor appointment', 'UTC');
    expect(msgs[0].content).toContain('UTC');
    expect(msgs[1].content).toContain('Doctor');
  });

  it('buildStartLinesMessages returns expected user payload', () => {
    const numbered = '1: Meeting at 10\n2: Lunch at 12';
    const summaries = [{ summary: 'Meeting' }, { summary: 'Lunch' }];
    const msgs = buildStartLinesMessages(numbered, summaries);
    expect(msgs[1].content).toContain('Event summaries');
    expect(msgs[1].content).toContain('Lunch');
  });
}); 