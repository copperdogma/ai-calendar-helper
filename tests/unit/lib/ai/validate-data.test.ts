/**
 * @jest-environment node
 */

import { AIProcessingService } from '@/lib/ai';

describe('AIProcessingService.validateAndEnhanceData', () => {
  const svc = new AIProcessingService();

  it('maps fallback keys and validates dates', () => {
    const rawData = {
      summary: 'Standup',
      description: 'Daily sync',
      start: '2025-08-01T09:00:00Z',
      end: '2025-08-01T09:15:00Z',
      location: 'HQ',
      timezone: 'UTC',
      confidence: 0.8,
      isAllDay: false,
      recurrence: null,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const enriched = (svc as any).validateAndEnhanceData(rawData);
    expect(enriched.title).toBe('Standup');
    expect(enriched.startDate).toBeInstanceOf(Date);
    expect(enriched.endDate).toBeInstanceOf(Date);
    expect(enriched.confidence.title).toBeCloseTo(0.8);
  });

  it('throws when endDate is before startDate', () => {
    const badData = {
      title: 'Bad',
      description: 'Oops',
      startDate: '2025-10-10T10:00:00Z',
      endDate: '2025-10-10T09:00:00Z',
      location: 'Somewhere',
      timezone: 'UTC',
      confidence: 0.5,
      isAllDay: false,
      recurrence: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(() => (svc as any).validateAndEnhanceData(badData)).toThrow(
      'End date must be after start date'
    );
  });

  it('throws on invalid date strings', () => {
    const badData = {
      title: 'Bad',
      description: 'Oops',
      startDate: 'invalid-date',
      endDate: 'another-bad-date',
      location: 'Nowhere',
      timezone: 'UTC',
      confidence: 0.4,
      isAllDay: false,
      recurrence: null,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    expect(() => (svc as any).validateAndEnhanceData(badData)).toThrow('Invalid date format');
  });
});
