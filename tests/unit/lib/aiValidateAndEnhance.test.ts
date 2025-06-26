import { AIProcessingService } from '@/lib/ai';

// Minimal mock OpenAI client to satisfy constructor
const mockClient = { chat: { completions: { create: jest.fn() } } } as any;

describe('AIProcessingService.validateAndEnhanceData (private)', () => {
  const service = new AIProcessingService(mockClient);
  // Access private method reflectively
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const validate = (data: unknown) => service['validateAndEnhanceData'](data);

  it('maps summary/start/end keys and returns valid ExtractedEventData', () => {
    const raw = {
      summary: 'Team meeting at Shiki Menya',
      start: '2025-06-26T16:00:00-06:00',
      end: '2025-06-26T17:00:00-06:00',
      location: 'Shiki Menya',
      description: 'Regular team meeting scheduled for attendees.',
      timezone: 'America/Denver',
      confidence: {
        overall: 0.9,
      },
    };

    const result = validate(raw);

    expect(result.title).toBe('Team meeting at Shiki Menya');
    expect(result.startDate).toBeInstanceOf(Date);
    expect(result.endDate).toBeInstanceOf(Date);
    expect(result.endDate.getTime()).toBeGreaterThan(result.startDate.getTime());
    expect(result.location).toBe('Shiki Menya');
    expect(result.confidence.overall).toBeCloseTo(0.9);
  });

  it('throws when dates are invalid', () => {
    const raw = {
      summary: 'Invalid',
      start: 'invalid-date',
      end: 'invalid-date',
      location: '',
      timezone: 'UTC',
      confidence: 0.5,
    };

    expect(() => validate(raw)).toThrow('Invalid date format');
  });
});
