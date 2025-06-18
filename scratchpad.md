### Legacy Issues (from previous scratchpad)

- Write an environment check command we can run that tests the env vars are working. Connect to redis? db? smtp? Maybe this is part of the health check? npm run report:daily:now
- footer has "Your Website Name 2025"
  - \*\* external todo: update the template repo to replace this with the actual website name

## Configure Monitoring & Error Tracking (Story 029) Research & Planning Checklist

- [x] Initial research questions identified
- [x] Web research completed
- [ ] Codebase analysis completed (in-progress)
- [ ] Best practices identified ⬅ partially satisfied, will tick after codebase review
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

### User Preferences

- Email delivery: Gmail SMTP
- Email format: Plain text
- Recipients: Same `NOTIFICATIONS_EMAIL_TO` value (allow multiple in env)
- Branding: Generic/plain subject lines and body; AI to decide wording
- Scheduler: Lightweight node scheduler (`node-cron`)

### Best Practices & Findings

1. Nodemailer + Gmail SMTP:
   - Requires Gmail App Password (2FA enabled) since less secure apps are deprecated (Sept 2024).
   - Use STARTTLS (host smtp.gmail.com, port 587, secure=false).
   - Keep creds in env vars (`EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS`).
   - Batch sending allowed but Gmail limits (≈100-150 msgs/day personal, 2k for Workspace). Our volume is tiny.
2. Plain-text emails: keep message concise; include fallback subject/body.
3. Multiple recipients: supply comma-separated list in `to` field.
4. node-cron best-practice:
   - Import/schedule once at server boot (e.g., within a `server/cron.ts` file imported by PM2 entry point).
   - Use specific TZ to avoid DST surprises (`TZ` env or `cron.schedule(expr, fn, { timezone })`).
   - Expression for 7 AM daily: `0 7 * * *`.
5. NextAuth events:
   - `events.createUser` is triggered after successful signup; ideal hook for notification email.
6. Usage tracking options:
   - Add Prisma model `ServiceUsage` (userId, service enum, count).
   - Increment count inside each service route (parse-events etc.).
   - Daily job pulls top 20 `ORDER BY count DESC` (Calendar Parser), default 0 for Novel Events Extractor.

Checklist updates:

- [x] Web research completed
- [ ] Codebase analysis completed (in-progress)
- [ ] Best practices identified ⬅ partially satisfied, will tick after codebase review

### Proposed Implementation Strategy

1. **Dependencies**
   - Add `nodemailer` and `node-cron`.
2. **Environment Variables**
   - `EMAIL_SMTP_USER`, `EMAIL_SMTP_PASS` (Gmail app-password creds)
   - (existing) `NOTIFICATIONS_EMAIL_TO` – allow comma-separated list.
   - `DAILY_REPORT_TIME` – time string `HH:mm <IANA-TZ>` e.g., `07:00 America/Denver`.
3. **Prisma Schema**
   - Add `enum Service { CALENDAR_PARSER NOVEL_EVENTS_EXTRACTOR }`
   - Add `model ServiceUsage { id String @id @default(uuid()) userId String service Service count Int @default(0) createdAt DateTime @default(now()) updatedAt DateTime @updatedAt user User @relation(fields: [userId], references: [id], onDelete: Cascade) @@unique([userId, service]) }`
   - Generate migration & push.
4. **Email Layer** (`lib/email`)
   - Reusable transporter using env vars.
   - `sendSignupNotification(user)` – plain-text message.
   - `sendDailyUsageReport(reportLines)`.
5. **Usage Tracking Helper** (`lib/services/usage.service.ts`)
   - `increment(userId, service)` – upsert/ increment.
   - `getTopUsers(limit)` – return aggregated counts.
6. **Hook into Routes / Events**
   - **Signup**: extend `authConfigNode.events.createUser` to call `sendSignupNotification`.
   - **Calendar Parser Route**: after successful extraction, get session user, call `increment(userId, 'CALENDAR_PARSER')`.
7. **Scheduler** (`lib/scheduler/dailyReportScheduler.ts`)
   - `cron.schedule('0 7 * * *', async () => { ... })` (TZ from env).
   - Build table text: `rank | userEmail | calendarParserCount | novelExtractorCount` (zeros for latter).
   - Call `sendDailyUsageReport`.
8. **Bootstrap Scheduler**
   - Import the scheduler in a side-effect module `lib/bootstrap.ts`. Ensure PM2 entry script (`dev:test`) runs `require('@/lib/bootstrap')` early.
9. **Tests**
   - Unit tests for email service (mock Nodemailer).
   - Unit tests for usage service upsert logic.

### Implementation Checklist

- [x] Update `.env.example` & docs
- [x] Install new dependencies & types
- [x] Modify `prisma/schema.prisma`, run migration (schema updated; migration pending in CI)
- [x] Add email client & helper functions
- [x] Add usage tracking service
- [x] Wire createUser event in `auth-node.ts`
- [x] Track usage in `parse-events/route.ts`
- [x] Implement daily report scheduler
- [x] Bootstrap scheduler on server start
- [x] Write/adjust unit tests (email & usage services)
- [ ] Update story docs & README (added manual trigger script)

### Risks & Mitigations

| Risk                                        | Mitigation                                                                             |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| Gmail SMTP quota limits / auth errors       | Use App Password; low volume; fallback log-only mode in dev                            |
| Cron task not running in serverless deploys | PM2 local dev context only; Flag to disable in prod until proper job runner configured |
| Extra Prisma migration                      | Coordinate migration file; run `npm run prisma:migrate` in CI                          |
| App crashes on missing env vars             | Guard `emailClient` with runtime checks & fallback logger                              |

## Image Event Extraction Research & Planning Checklist

- [x] Initial research questions identified
- [ ] Web research completed
- [ ] Codebase analysis completed
- [ ] Best practices identified
- [ ] Implementation strategy developed
- [ ] Detailed implementation checklist created
- [x] User preference questions identified and asked
- [ ] Plan reviewed and approved by user

### User Preferences (Image Event Extraction)

- Vision model: Use OpenAI vision models (evaluate GPT-4o Vision vs. other OpenAI offerings via new eval harness)
- Image size limit: 5 MB max; accept only formats supported by OpenAI (PNG, JPEG, WEBP, HEIC as permitted)
- UI placement: Image upload sits alongside existing text input; user may supply both text and image for one combined event
- Low-confidence handling: Display flagged result and allow manual edits instead of blocking
- Storage policy: Process images in-memory only; no persistent storage required

### Web Research Findings (OpenAI Vision)

- Supported image formats: PNG, JPEG/JPG, WEBP, non-animated GIF (OpenAI community thread Oct 2024).
- Max recommended base64 size: ~20 MB; smaller is better for latency/cost. 5 MB cap aligns well.
- Two input methods: (1) Public URL; (2) Base64 data URI. In-memory upload → encode to base64 for API call simplifies privacy.
- Typical request pattern (Node SDK):
  ```ts
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } },
        ],
      },
    ],
  });
  ```
- For OCR & extraction tasks, setting `image_url.detail = 'high'` improves accuracy on small text.
- Pricing: Vision requests are token-based; images expand to ~30–60k "vision tokens" depending on resolution. Keep resolution reasonable (≤1024px).
- Prompt engineering tip: give explicit schema + examples for JSON event output, then ask model to parse image text and map into schema.
- Eval harness: Use 20–30 sample flyers/photos; measure JSON accuracy vs. ground truth.

### Codebase Analysis

- Current text parsing endpoint: `app/api/ai/parse-events/route.ts` uses `AIProcessingService` and returns `ExtractedEvent[]`.
- No existing multipart/image upload endpoints; no components named `ImageUpload*`.
- AI layer: `lib/ai.ts` provides `AIProcessingService` with helpers like `segmentText`, `parseEventChunk`. Vision support should be added here (`parseEventFromImage`).
- File upload handling elsewhere limited to `FormData` for profile name etc.; we need new API route with `POST req.formData()` and buffer→base64 logic.
- Event preview components are modality-agnostic; they accept `ExtractedEvent[]`, so combining text & image results is straightforward.

**Checklist updates:**
- [x] Web research completed
- [x] Codebase analysis completed

### Best Practices Identified

1. Encode images to base64 data URIs to avoid temporary files/URLs.
2. Limit upload size (5 MB) and resize client-side (e.g., `canvas` downscale) for huge images.
3. Use explicit JSON schema in prompt with `json_schema` system message to improve extraction reliability.
4. Treat low confidence (<0.7) as "needs review" – flag UI element instead of blocking.
5. Reuse existing `ExtractedEvent` shape to keep frontend changes minimal.
6. Add jest unit tests mocking OpenAI vision responses.
7. Protect API route with auth optional but rate-limit to prevent abuse.

### Proposed Implementation Strategy

1. **AI Layer**
   - Extend `AIProcessingService` with `parseEventImage(imageBase64: string, text?: string, opts)`.
   - Build prompt: include optional user text + OCR instructions; output strict JSON.
2. **API Route**
   - `POST /api/ai/parse-image-event` (Next.js App Router).
   - Accept `multipart/form-data`: field `image` + optional `text` + `options` JSON.
   - Validate size/type; read buffer → base64; call service; return `ExtractedEvent`.
3. **Frontend**
   - Create `ImageUploadForm` component alongside `TextInputForm` (tabless horizontal layout).
   - Accept file drop or click; show thumbnail; on submit, combine with text field content.
   - Append returned event to existing events state.
4. **Eval Harness**
   - Add new eval YAML under `evals/` with ~30 flyer images + expected events.
   - Use existing scorer or write new image-event scorer.
5. **Testing**
   - Unit tests: service returns mocked event on base64 input.
   - E2E: Playwright uploads sample image, verifies preview list contains parsed event.
6. **Docs & Storybook**
   - Update README, story docs; add Storybook entry if applicable.

### Detailed Implementation Checklist

- [ ] Extend `lib/ai.ts` with `parseEventImage` using OpenAI vision model.
- [ ] Implement `/app/api/ai/parse-image-event/route.ts` with validation & OpenAI call.
- [ ] Add Zod schema for request (`ImageParseRequestSchema`).
- [ ] Create `components/calendar/ImageUploadForm.tsx` with drag-and-drop & preview.
- [ ] Integrate form into `calendar-parser` page (alongside text input).
- [ ] Update global events context/reducer to merge image event.
- [ ] Handle low-confidence flag in `EventPreviewCard` (e.g., yellow badge).
- [ ] Unit tests for AI service (mocked), API route, and utility functions.
- [ ] Playwright E2E test uploading a sample image.
- [ ] Add new eval harness (`evals/extract-events-from-image.yaml`).
- [ ] Documentation updates (story + README + API docs).
- [ ] Lint/type/test pipeline passes.

### Risks & Mitigations

| Risk | Mitigation |
| ---- | ---------- |
| Large image uploads slow/expensive | Enforce 5 MB limit & client-side resize; warn user if >2 MB |
| Vision model inaccurate on varied layouts | Build eval harness; iterate prompt; consider cropping text-heavy region client-side |
| API cost spike | Add env flag `ENABLE_IMAGE_PARSING` & guard route; monitor usage |
| Security of file uploads | Validate MIME type & size; process in memory; discard after base64 conversion |
