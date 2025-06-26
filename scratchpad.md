## Future ToDo Items
- I keep getting four status emails every morning. I suspect there are multiple cron jobs running. I think I should expect two emails: one from prod, one from dev. Can we manually check the cron jobs to confirm? And can we change the code to check if a cron job is already running before scheduling a new one?



### Current Story

## Story 019 Novel Events Filtering Logic Research & Planning Checklist
- [x] Initial research questions identified
- [x] Web research completed
- [x] Codebase analysis completed
- [x] Best practices identified
- [x] Implementation strategy developed
- [x] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [x] Plan reviewed and approved by user

### Initial Research Questions
1. How to efficiently fetch and cache historical Google Calendar events per user to avoid quota issues?
2. What data model will store calendar blacklist/whitelist and novelty threshold preferences?
3. Where should pattern model be persisted – database table vs in-memory/Redis cache?
4. Should novelty detection run on-demand or scheduled background job (Story 020)?

### Best Practices (Google Calendar Integration)
- Use **incremental sync** with `syncToken`; store token per user to reduce API cost [[Google Docs](https://developers.google.com/workspace/calendar/api/guides/sync)].
- Set `singleEvents=true` to expand recurring events for accurate frequency counts.
- Handle `410 Gone` errors: reset sync state & perform full resync.
- Paginate using `pageToken`; only last page returns new `nextSyncToken`.
- Prefer **watch channels** (push notifications) to refresh sync token instead of polling (future enhancement).
- Batch requests when possible and respect quota; exponential back-off on `429/5xx`.
- Cache historical events/results (DB or Redis) to avoid recomputation in same window.

### Detailed Implementation Checklist (Story 019)
- [x] Build `calendarService` with incremental sync + tests
- [x] DB migration: `calendar_sync_state`, `user_settings`
- [x] Create `EventPattern` interface & tests
- [x] Port `PatternDetector` logic to TS + tests
- [x] Port `NoveltyAnalyzer` logic to TS + tests
- [ ] Implement `detectNovelEvents` service + tests
- [ ] Documentation updates

### User Preference Questions
1. Default look-ahead window (14 days OK?)
2. Novelty threshold default (0.2?)
3. Should commonly noisy calendars (e.g., Holidays) be auto-blacklisted by default?
4. Persist patterns for faster analysis or compute fresh each run?

### User Preferences (confirmed)
- Look-ahead window default: **14 days**, editable via UI setting.
- Novelty threshold default: **0.20**.
- Pre-populated auto-blacklist: **Google Holidays & Birthdays** calendars (user can modify).
- Store computed pattern model per user (DB/Redis) for faster analysis.

### Additional UI Requirement
Add a new tab/page in dashboard for **Novel Events Settings**:
- Form fields: look-ahead days (number), novelty threshold (slider/number), blacklist/whitelist multiselect (pre-populated), toggle cache pattern.
- Schedule preference (daily, weekly etc.) – ties into Story 020 background jobs.
- "Calculate Now & Send Test Email" button to trigger novelty detection + email dispatch.

- [x] Create helper util `hasCalendarScope(account)`.
