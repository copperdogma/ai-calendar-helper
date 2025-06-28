import { CalendarService, GoogleCalendarClient } from '../../../../lib/google/calendarService';

const makeMockClient = (
  pages: Array<{ items: any[]; nextPageToken?: string | null; nextSyncToken?: string | null }>
): GoogleCalendarClient => {
  let callCount = 0;
  return {
    async listEvents(_params) {
      const page = pages[callCount] ?? { items: [] };
      callCount += 1;
      return page as any;
    },
    async listCalendars() {
      return { items: [] } as any;
    },
  };
};

describe('CalendarService', () => {
  const start = new Date('2025-01-01T00:00:00Z');
  const end = new Date('2025-01-02T00:00:00Z');

  it('performs initial full sync with pagination and returns events + syncToken', async () => {
    const pages = [
      {
        items: [
          {
            id: '1',
            summary: 'Event 1',
            start: { dateTime: '2025-01-01T10:00:00Z' },
            end: { dateTime: '2025-01-01T11:00:00Z' },
          },
        ],
        nextPageToken: 'tokenA',
      },
      {
        items: [
          {
            id: '2',
            summary: 'Event 2',
            start: { dateTime: '2025-01-01T12:00:00Z' },
            end: { dateTime: '2025-01-01T13:00:00Z' },
          },
        ],
        nextSyncToken: 'sync123',
      },
    ];
    const client = makeMockClient(pages);
    const service = new CalendarService(client);

    const result = await service.fetchEvents({ start, end });

    expect(result.events).toHaveLength(2);
    expect(result.events.map((e: any) => e.id)).toEqual(['1', '2']);
    expect(result.nextSyncToken).toBe('sync123');
  });

  it('uses incremental sync when syncToken provided', async () => {
    const pages = [
      {
        items: [
          {
            id: '3',
            summary: 'Event 3',
            start: { dateTime: '2025-01-02T09:00:00Z' },
            end: { dateTime: '2025-01-02T10:00:00Z' },
          },
        ],
        nextSyncToken: 'sync456',
      },
    ];
    const client = makeMockClient(pages);
    const service = new CalendarService(client);

    const result = await service.fetchEvents({ start, end, syncToken: 'sync123' });

    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('3');
    expect(result.nextSyncToken).toBe('sync456');
  });

  it('returns empty array and null syncToken when no events', async () => {
    const pages = [{ items: [], nextSyncToken: 'sync789' }];
    const client = makeMockClient(pages);
    const service = new CalendarService(client);

    const result = await service.fetchEvents({ start, end });

    expect(result.events).toHaveLength(0);
    expect(result.nextSyncToken).toBe('sync789');
  });
});
