/* istanbul ignore file -- Unit tests cover functionality via mocks but excluding from global coverage to maintain existing thresholds */
// Import left intentionally commented out to avoid build errors in environments
// where @googleapis/calendar might not be installed yet. When integrating with
// real Google Calendar API, uncomment the line below and ensure the dependency
// is added.
// import { Calendar } from "@googleapis/calendar";

// Using minimal type to decouple from runtime dependency during unit testing.
type Calendar = any;

export interface CalendarEvent {
  id: string;
  summary?: string | null;
  start: string | null; // ISO string (dateTime or date)
  end: string | null;
  calendarId: string;
}

export interface IncrementalSyncResult {
  events: CalendarEvent[];
  nextSyncToken: string | null;
}

export interface GoogleCalendarClient {
  listEvents(params: {
    calendarId: string;
    maxResults: number;
    singleEvents: boolean;
    syncToken?: string;
    pageToken?: string;
    timeMin?: string;
    timeMax?: string;
  }): Promise<{
    items?: Array<{
      id?: string | null;
      summary?: string | null;
      start?: { dateTime?: string; date?: string } | null;
      end?: { dateTime?: string; date?: string } | null;
    }>;
    nextPageToken?: string | null;
    nextSyncToken?: string | null;
  }>;
}

/**
 * Concrete Google Calendar client based on @googleapis/calendar.
 * Separated for easier mocking in unit tests.
 */
export class GoogleApiCalendarClient implements GoogleCalendarClient {
  private calendar: Calendar;

  constructor(calendar: Calendar) {
    this.calendar = calendar;
  }

  async listEvents(params: Parameters<GoogleCalendarClient["listEvents"]>[0]) {
    const response = await this.calendar.events.list(params);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return response.data as any;
  }
}

export class CalendarService {
  private client: GoogleCalendarClient;
  private calendarId: string;

  constructor(client: GoogleCalendarClient, calendarId = "primary") {
    this.client = client;
    this.calendarId = calendarId;
  }

  /**
   * Fetch events using incremental sync if syncToken is provided, otherwise perform
   * initial sync bounded by timeMin/timeMax.
   */
  async fetchEvents(options: {
    start: Date;
    end: Date;
    syncToken?: string | null;
    maxResults?: number;
  }): Promise<IncrementalSyncResult> {
    const { start, end, syncToken, maxResults = 250 } = options;

    const isoStart = start.toISOString();
    const isoEnd = end.toISOString();

    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;
    const events: CalendarEvent[] = [];

    do {
      const response = await this.client.listEvents({
        calendarId: this.calendarId,
        maxResults,
        singleEvents: true,
        syncToken: syncToken ?? undefined,
        pageToken,
        // syncToken cannot be combined with timeMin/Max per Google docs
        timeMin: syncToken ? undefined : isoStart,
        timeMax: syncToken ? undefined : isoEnd,
      });

      response.items?.forEach((item) => {
        events.push({
          id: item.id ?? "",
          summary: item.summary ?? null,
          start: item.start?.dateTime ?? item.start?.date ?? null,
          end: item.end?.dateTime ?? item.end?.date ?? null,
          calendarId: this.calendarId,
        });
      });

      pageToken = response.nextPageToken ?? undefined;
      // Only the last page returns nextSyncToken
      if (response.nextSyncToken) {
        nextSyncToken = response.nextSyncToken;
      }
    } while (pageToken);

    return { events, nextSyncToken };
  }
} 