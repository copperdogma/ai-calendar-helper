import { PatternDetector } from '../../../../lib/novelEvents/PatternDetector';
import { NoveltyAnalyzer } from '../../../../lib/novelEvents/NoveltyAnalyzer';
import { CalendarEventLike } from '../../../../lib/novelEvents/EventPattern';

describe('NoveltyAnalyzer', () => {
  const historical: CalendarEventLike[] = [
    {
      title: 'Daily Sync',
      start: new Date('2025-01-06T09:00:00Z'),
      calendarId: 'work',
    },
    {
      title: 'Daily Sync',
      start: new Date('2025-01-07T09:00:00Z'),
      calendarId: 'work',
    },
    {
      title: 'Daily Sync',
      start: new Date('2025-01-08T09:00:00Z'),
      calendarId: 'work',
    },
    {
      title: 'Daily Sync',
      start: new Date('2025-01-09T09:00:00Z'),
      calendarId: 'work',
    },
    {
      title: 'Daily Sync',
      start: new Date('2025-01-10T09:00:00Z'),
      calendarId: 'work',
    },
  ];

  const upcoming: CalendarEventLike[] = [
    {
      title: 'Daily Sync',
      start: new Date('2025-01-17T09:00:00Z'),
      calendarId: 'work',
    }, // frequent -> not novel
    {
      title: 'Quarterly Planning',
      start: new Date('2025-01-15T13:00:00Z'),
      calendarId: 'work',
    }, // rare -> novel
  ];

  it('flags infrequent events as novel', () => {
    const detector = new PatternDetector();
    detector.analyzeEvents(historical);
    const analyzer = new NoveltyAnalyzer(detector, 0.08);
    const novel = analyzer.findNovelEvents(upcoming);
    expect(novel).toHaveLength(1);
    expect(novel[0].event.title).toBe('Quarterly Planning');
    expect(novel[0].noveltyScore).toBeCloseTo(1, 5);
  });
});
