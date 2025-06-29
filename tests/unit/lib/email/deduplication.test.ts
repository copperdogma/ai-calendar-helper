import { sendNovelEventsReport } from '../../../../lib/email';
import nodemailer from 'nodemailer';

// Mock nodemailer
jest.mock(
  'nodemailer',
  () => ({
    createTransport: jest.fn(),
  }),
  { virtual: true }
);

type MockTransporter = {
  sendMail: jest.Mock;
};

describe('Novel Events Email Deduplication', () => {
  const mockSendMail = jest.fn().mockResolvedValue({});
  const mockCreateTransport = nodemailer.createTransport as jest.Mock;

  beforeEach(() => {
    mockSendMail.mockClear();
    mockCreateTransport.mockReturnValue({
      sendMail: mockSendMail,
    } as unknown as MockTransporter);

    process.env.EMAIL_SMTP_USER = 'test@example.com';
    process.env.EMAIL_SMTP_PASS = 'test-password';
  });

  const calendarNames = {
    primary: 'primary',
    'family@example.com': 'Family',
    'work@example.com': 'Work',
  };

  it('should deduplicate events across multiple calendars', async () => {
    const events = [
      {
        summary: 'Parkhill Annual Stampede Breakfast',
        start: '2025-07-12T15:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: 'Parkhill Annual Stampede Breakfast',
        start: '2025-07-12T15:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'family@example.com',
      },
      {
        summary: "Dave Coppens' 50th Birthday!",
        start: '2025-07-13T01:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: "Dave Coppens' 50th Birthday!",
        start: '2025-07-13T01:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: "Dave Coppens' 50th Birthday!",
        start: '2025-07-13T01:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'family@example.com',
      },
      {
        summary: 'Unique Event',
        start: '2025-07-14T10:00:00Z',
        noveltyScore: 0.8,
        calendarId: 'work@example.com',
      },
    ];

    await sendNovelEventsReport({
      to: 'user@example.com',
      events,
      calendarNames,
    });

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const emailData = mockSendMail.mock.calls[0][0];

    // Verify the subject reflects the deduplicated count
    expect(emailData.subject).toContain('3 events');

    // Verify the text content has combined calendar names
    expect(emailData.text).toContain('Parkhill Annual Stampede Breakfast [primary, Family]');
    expect(emailData.text).toContain("Dave Coppens' 50th Birthday! [primary, Family]");
    expect(emailData.text).toContain('Unique Event [Work]');

    // Verify the HTML content has combined calendar names
    expect(emailData.html).toContain(
      'Parkhill Annual Stampede Breakfast</strong> [primary, Family]'
    );
    expect(emailData.html).toContain("Dave Coppens' 50th Birthday!</strong> [primary, Family]");
    expect(emailData.html).toContain('Unique Event</strong> [Work]');

    // Count the number of events in the email (should be 3, not 6)
    const eventLines = emailData.text.split('\n').filter((line: string) => line.match(/^\d+\./));
    expect(eventLines).toHaveLength(3);
  });

  it('should maintain chronological order after deduplication', async () => {
    const events = [
      {
        summary: 'Later Event',
        start: '2025-07-15T10:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: 'Earlier Event',
        start: '2025-07-12T09:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: 'Earlier Event',
        start: '2025-07-12T09:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'family@example.com',
      },
    ];

    await sendNovelEventsReport({
      to: 'user@example.com',
      events,
      calendarNames,
    });

    const emailData = mockSendMail.mock.calls[0][0];
    const eventLines = emailData.text.split('\n').filter((line: string) => line.match(/^\d+\./));

    // Earlier Event should be first (1.), Later Event should be second (2.)
    expect(eventLines[0]).toContain('Earlier Event [primary, Family]');
    expect(eventLines[1]).toContain('Later Event [primary]');
  });

  it('should keep the highest novelty score when deduplicating', async () => {
    const events = [
      {
        summary: 'Same Event',
        start: '2025-07-12T10:00:00Z',
        noveltyScore: 0.8,
        calendarId: 'primary',
      },
      {
        summary: 'Same Event',
        start: '2025-07-12T10:00:00Z',
        noveltyScore: 0.9,
        calendarId: 'family@example.com',
      },
    ];

    await sendNovelEventsReport({
      to: 'user@example.com',
      events,
      calendarNames,
    });

    const emailData = mockSendMail.mock.calls[0][0];

    // Should show the higher novelty score (90%, not 80%)
    expect(emailData.text).toContain('(novelty 90%)');
    expect(emailData.text).not.toContain('(novelty 80%)');
  });

  it('should handle events with missing or null titles', async () => {
    const events = [
      {
        summary: null,
        start: '2025-07-12T10:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: null,
        start: '2025-07-12T10:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'family@example.com',
      },
    ];

    await sendNovelEventsReport({
      to: 'user@example.com',
      events,
      calendarNames,
    });

    const emailData = mockSendMail.mock.calls[0][0];

    // Should combine into one "Untitled event" with multiple calendars
    expect(emailData.text).toContain('Untitled event [primary, Family]');

    // Should only have one event line
    const eventLines = emailData.text.split('\n').filter((line: string) => line.match(/^\d+\./));
    expect(eventLines).toHaveLength(1);
  });

  it('should deduplicate events with same title but different times', async () => {
    const events = [
      {
        summary: "Dave Coppens' 50th Birthday!",
        start: '2025-07-13T01:00:00Z',
        noveltyScore: 1.0,
        calendarId: 'primary',
      },
      {
        summary: "Dave Coppens' 50th Birthday!",
        start: '2025-07-13T02:00:00Z', // Different time
        noveltyScore: 1.0,
        calendarId: 'family@example.com',
      },
    ];

    await sendNovelEventsReport({
      to: 'user@example.com',
      events,
      calendarNames,
    });

    const emailData = mockSendMail.mock.calls[0][0];

    // Should combine into one event with multiple calendars, despite different times
    expect(emailData.text).toContain("Dave Coppens' 50th Birthday! [primary, Family]");

    // Should only have one event line
    const eventLines = emailData.text.split('\n').filter((line: string) => line.match(/^\d+\./));
    expect(eventLines).toHaveLength(1);
  });
});
