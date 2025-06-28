# Story: Design Novel Events Filtering Logic (019)

**Status**: Planning – 2025-06-25. Gathering requirements and designing implementation.

---

## Related Requirements

- Relies on prior Text-to-Calendar feature (Stories 004–008) to populate historical events.
- Will feed follow-on stories:
  - Story 020 – Background Jobs
  - Story 021 – Email Service
  - Story 022 – Configuration UI

## Overview

Implement logic to detect **novel (unusual) events** in a user's calendar by analysing historical patterns. The core algorithm will be ported from the Swift tool [Novel Events Extractor](https://github.com/copperdogma/novel-events-extractor) and adapted to our **TypeScript/Node** stack with Google Calendar data.

Key concepts copied/modified from the reference implementation:

1. **Pattern Detection** – build frequency-weighted patterns keyed by title, weekday, time-bucket and calendar.
2. **Pattern Score** – frequency normalised to 0–1 (≥ 12 occurrences ⇒ 1.0).
3. **Similarity Rules** – same calendar, ±1 h start time, same weekday (except "teaching" events), title matching rules dependent on frequency.
4. **Novelty Analysis** – an upcoming event is novel if its max pattern score < THRESHOLD (default 0.2).
5. **Calendar Filtering** – allow blacklist and optional whitelist to include/exclude specific calendars.
6. **Outputs** – ordered list of novel events with reason/explanation (later emailed or shown in UI).

## Acceptance Criteria (draft)

- Novelty detection runs against the authenticated user's Google calendars.
- Historical window: ≥ 1 year back; Look-ahead window: user-configurable (default **14 days**, editable in settings UI).
- Supports `blacklist` and `whitelist` calendar settings (persisted per user). Pre-populate blacklist with Google "Holidays" and "Birthdays" calendars.
- Identifies novel events using adapted scoring algorithm; novelty threshold configurable per user (default **0.20**).
- Returns structured `NovelEvent[]` (event, noveltyScore, reason) sorted chronologically.
- Stores computed pattern model per user (DB/Redis) for faster subsequent analysis.
- Covered by unit tests (pattern detection, similarity matching, novelty analysis) with ≥90 % coverage of new code.
- Integrates with existing logging & error handling libraries.
- No regressions in existing test suite; linter, type-check pass.

## Research Notes (from Swift reference)

- **EventPattern** keys → `type|weekday?|HH:mm|title|calendar`.
- **Teaching** events ignore weekday in key.
- Title match: exact for low-freq (<12) else contains/partial.
- Novelty threshold default 0.2 (score scale invert via `1 – patternScore`).

## Open Technical Questions (to answer during planning)

1. Source of historical events – use Google Calendar API (already authorised via OAuth).
2. Where to run analysis – serverless function vs. background job (likely Story 020).
3. Persistence – store computed patterns per user? recompute each run?
4. Config storage – how/where to save blacklist/whitelist & threshold.

## Risks & Mitigations (initial)

| Risk                                            | Mitigation                                       |
| ----------------------------------------------- | ------------------------------------------------ |
| Large calendars cause slow analysis             | Stream pagination, cache pattern model per user  |
| Google API quota limits                         | Batch requests, incremental sync                 |
| False positives/negatives from simplistic rules | Iterate threshold, add additional features later |

## Best Practices (Google Calendar & Novelty Detection)

- **Incremental Sync**: Use `syncToken` to avoid full fetch after initial sync; handle `410` invalid token.
- **Expand Recurring Events**: `singleEvents=true` to evaluate each instance when counting frequency.
- **Push Notifications**: Register `watch` channels per calendar to refresh sync token and trigger analysis (future Story 020).
- **Quota Management**: Batch requests, respect `maxResults`, handle `429`.
- **Caching & Storage**: Keep sync token & optional pattern model in DB; consider Redis for short-term cache.
- **Time-Zone Awareness**: Use user's primary time-zone for comparing times.
- **Title Normalisation**: Lower-case, trim whitespace, remove emojis for robust matching.

## Implementation Strategy

1. **Data Fetch Layer** (`lib/google/calendarService.ts`)

   - `fetchEvents({ userId, start, end }): Promise<GoogleEvent[]>`
   - Maintains syncToken per user in `calendar_sync_state` table; performs incremental sync.

2. **Domain Models** (`lib/novelEvents`)

   - `EventPattern` (TS equivalent) and `NovelEvent` interfaces.
   - `PatternDetector` class mirroring Swift logic (frequency counts, similarity rules).
   - `NoveltyAnalyzer` class (threshold, returns NovelEvent[]).

3. **Facade Function** (`services/novelEventsService.ts`)

   - `detectNovelEvents(userId, lookAheadDays = 14): Promise<NovelEvent[]>`
   - Steps: fetch historical, build patterns, fetch upcoming, analyze.

4. **Config Storage**

   - User preferences (`calendar_blacklist`, `calendar_whitelist`, `novelty_threshold`) stored in `user_settings` table (JSON column). Pattern models are cached automatically in Redis; no user toggle.

5. **Unit Tests**

   - Cover pattern similarity matrix, threshold detection, blacklist/whitelist logic.

6. **Future Integration Points**

   - Expose `GET /api/novel-events` route (Story 022 UI & Story 021 email).
   - Background cron job (Story 020) to call service daily.

7. **Settings UI** (Dashboard → "Novel Events" tab)
   - React page with form fields: look-ahead days (number), novelty threshold (slider/number), blacklist/whitelist multiselect (pre-populated).
   - Button "Calculate Now & Send Test Email" triggers API route to run detection immediately.
   - Uses existing design system components.

## Updated Task Checklist

- [ ] Implement Google Calendar `calendarService` with incremental sync
- [ ] Create DB migration for `calendar_sync_state` & `user_settings`
- [ ] Port `EventPattern`, `PatternDetector`, `NoveltyAnalyzer` to TypeScript
- [ ] Integrate blacklist/whitelist & threshold from `user_settings`
- [ ] Implement `detectNovelEvents` service
- [ ] Add unit tests (pattern, novelty, service) ≥90 % coverage
- [ ] Update Docs & Story file with progress
- [ ] Create Novel Events Settings page in dashboard with form & test email button

## User Preferences (TBD)

Questions to be confirmed once preliminary plan is ready (blacklist UI, threshold default, etc.).

## OAuth & Permissions Update

- Extend Google provider `authorization.params.scope` to include `https://www.googleapis.com/auth/calendar.readonly` in addition to `openid email profile`.
- Implement **lazy re-consent** flow:
  1. Novel Events Settings tab checks if calendar scope is present (`/oauth2/v1/tokeninfo` or cached flag).
  2. If missing, display ❌ "Calendar access not granted" and a "Grant Calendar Access" button.
  3. Button triggers `signIn('google', { scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly', prompt: 'consent' })` so Google shows the incremental consent screen.
  4. After successful re-auth, UI shows ✅ and enables detection.
- This handles:
  a) Existing users who signed up before calendar scope was requested.
  b) Users who prefer to skip calendar features – they simply ignore the prompt and can still use text/image parsing.

### Task Checklist additions

- [ ] Update `lib/auth-shared.ts` to add calendar scope.
- [ ] Create helper util `hasCalendarScope(account)`.
- [ ] In Novel Events page, query session + account to determine scope and render UI state (❌/✅ + grant button).
