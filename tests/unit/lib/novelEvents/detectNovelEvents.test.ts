import { detectNovelEvents } from '../../../../lib/novelEvents/NovelEventsService';
import { GoogleCalendarClient } from '../../../../lib/google/calendarService';

// Create helper to build fake events
function makeEvent(id: string, title: string, date: string, calendarId: string) {
  return {
    id,
    summary: title,
    start: date,
    end: new Date(new Date(date).getTime() + 60 * 60 * 1000).toISOString(),
    calendarId,
  } as any;
}

describe('detectNovelEvents blacklist/whitelist', () => {
  const userId = 'user-123';

  const histEvents = [
    makeEvent('1', 'Standup', '2025-01-01T10:00:00Z', 'work'),
    makeEvent('2', 'Standup', '2025-01-02T10:00:00Z', 'work'),
  ];

  const workUpcoming = [makeEvent('3', 'New Project Kickoff', '2025-01-10T12:00:00Z', 'work')];

  const holidayUpcoming = [
    makeEvent('4', 'Holiday Celebration', '2025-01-11T09:00:00Z', 'holidays'),
  ];

  let prismaMock: any;
  let calendarClientMock: jest.Mocked<GoogleCalendarClient>;

  beforeEach(() => {
    // Reset mocks
    jest.resetAllMocks();

    // Fake GoogleCalendarClient with listEvents mocked via CalendarService wrapper if needed
    const mockList = jest.fn().mockImplementation(({ calendarId }) => {
      if (calendarId === 'holidays') {
        return Promise.resolve({ items: holidayUpcoming, nextSyncToken: null });
      }
      // primary or work calendar
      return Promise.resolve({ items: [...histEvents, ...workUpcoming], nextSyncToken: null });
    });

    calendarClientMock = {
      listEvents: mockList,
      listCalendars: jest.fn().mockResolvedValue({ items: [] }),
    } as unknown as jest.Mocked<GoogleCalendarClient>;

    prismaMock = {
      userSettings: {
        findUnique: jest.fn(),
      },
      calendarSyncState: {
        findUnique: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
  });

  it('excludes events from blacklisted calendars', async () => {
    prismaMock.userSettings.findUnique.mockResolvedValue({
      userId,
      blacklist: ['holidays'],
      whitelist: null,
    });

    const novel = await detectNovelEvents(userId, {
      prisma: prismaMock,
      calendarClient: calendarClientMock,
    });

    // Should include kickoff event and exclude holiday celebration
    const titles = novel.map(n => n.event.title);
    expect(titles).toContain('New Project Kickoff');
    expect(titles).not.toContain('Holiday Celebration');
  });

  it('honours whitelist over blacklist', async () => {
    prismaMock.userSettings.findUnique.mockResolvedValue({
      userId,
      blacklist: ['holidays'],
      whitelist: ['holidays'],
    });

    const novel = await detectNovelEvents(userId, {
      prisma: prismaMock,
      calendarClient: calendarClientMock,
    });

    // With whitelist containing only holidays, work events should be ignored.
    const titles2 = novel.map(n => n.event.title);
    expect(titles2).toEqual(expect.arrayContaining(['Holiday Celebration', 'New Project Kickoff']));
  });
});
