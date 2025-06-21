### Current Story

Story 041: Implement Image-based Event Extraction

### Current Task

Implement AIProcessingService.parseEventImage with TDD (unit tests + minimal implementation)

### Plan Checklist

- [ ] Write failing unit tests for parseEventImage (parse event extraction success, invalid JSON handling, buffer to base64 conversion)
- [ ] Implement parseEventImage method in lib/ai.ts to use OpenAI vision model
- [ ] Run unit tests and ensure they pass
- [ ] Ensure lint and type checks pass
- [ ] Update documentation as needed

## Future ToDo Items

- Apparently gpt-4.1-nano can ALSO do image processing. We should try that.
- Run evals for image processing, optimize prompt, try gpt-4.1-nano as the model

## Advanced Usage Stats Research & Planning Checklist

- [ ] Initial research questions identified
- [ ] Web research completed
- [ ] Codebase analysis completed
- [ ] Best practices identified
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [ ] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

### Initial Research Questions

1. What level of granularity do we need for usage data (raw per-event logs vs. aggregated summaries)?
2. Should we store detailed usage events in our PostgreSQL database, or integrate an analytics platform (e.g., self-hosted PostHog) to avoid vendor lock-in/costs?
3. How long should we retain raw usage data, and do we need GDPR-style deletion controls?
4. Are there privacy constraints around storing user agent / IP information?
5. Do we want to capture additional device/browser details beyond mobile vs. desktop (e.g., OS, browser name/version, locale)?
6. What reporting cadence is expected (daily, weekly dashboards, real-time)?

### Other Potentially Helpful Stats (Brainstorm)

- Parsing success vs. failure rates and associated error types
- Time taken to parse text or image inputs
- Number of calendar events extracted per request
- User conversion funnel (uploaded ➔ parsed ➔ clicked calendar button)
- Repeat vs. first-time users
- Geographic distribution (coarse, country-level)
- Session duration and pages/screens visited
- Accessibility of features on small vs large screens (screen size buckets)

### Tracking Approaches (Preliminary)

- **Database Event Log**: Create a `UsageEvent` table capturing the requested fields + extras (timestamp, userAgent, deviceType). Use existing Prisma setup.
- **Client Instrumentation**: Emit a POST to `/api/log/client` when a calendar button is clicked with device info (use existing API logger pattern).
- **Server Middleware**: Augment existing `incrementUsage` flow to also write a detailed event record.
- **Self-Hosted Analytics**: Consider PostHog (OSS) if we need advanced funnels/heatmaps; integrates well, remains free/self-hosted.

### User Preferences (2025-06-20)

- Storage: **PostgreSQL UsageEvent table** (no external analytics platform)
- Privacy constraints: **None** (no special retention policy requested)
- Granularity: **Raw per-event rows**
- Device details: capture full user-agent (OS, browser, locale) along with mobile/desktop flag
- Reporting cadence: **Daily email**
- Additional stats to log:
  - Parsing success vs. failure (+ error reason)
  - Time taken per parse request
  - Number of events extracted per request

### Checklist Updates

- [x] User preference questions identified and asked
- [x] Plan reviewed and approved by user (initial preferences confirmed)

### Implementation Progress (Advanced Usage Stats)

- [x] Define `UsageEvent` model in `prisma/schema.prisma`
- [x] Add `usageEvents` relation to `User` model
- [x] Implement `logUsageEvent` service in `lib/services/usage-event.service.ts`
- [x] Write Jest unit tests with ≥80 % coverage for the service
- [x] Generate and apply Prisma migration (`npx prisma migrate dev --name add_usage_event`)
- [x] Create `/api/log/client` route + Zod validation
- [x] Emit client events from export buttons
- [~] Instrument parse endpoints to log events & timings (parse-events done; image endpoint pending)
- [x] Update daily report job to include new metrics
- [ ] Additional unit & E2E tests
