# Story: Add ICS File Generation & Download

**Status**: Done

---

## Related Requirement

[Requirement TBD: Calendar Integration UX](/docs/requirements.md)

## Alignment with Design

[Design Section: Event Cards & Actions](/docs/design.md#event-cards)

## Acceptance Criteria

- An ICS file can be generated client-side that includes proper VCALENDAR headers and VEVENT fields.
- Apple Calendar users can click a button to download the `.ics` file and import it into their calendar.
- The ICS download is available on every `EventPreviewCard` next to the Google & Outlook buttons.
- The ICS content contains UTC start/end times, summary, description (including original text), and location.
- The download filename is derived from the event title (spaces replaced with underscores).
- Accessibility: the download button has an `aria-label`, tooltip, is keyboard-focusable, and is ≥44 px.
- Unit tests validate that the generated ICS content matches expected format.
- All linting, type-checking, and unit/E2E tests pass.

## Tasks (All Completed)

- [x] Implement `generateAddToCalendarLinks` utility returning `.ics` content along with provider URLs.
- [x] Encode `.ics` content as `data:text/calendar` URI for download.
- [x] Add Apple Calendar icon button in `EventPreviewCard` that links to data-URI with `download` attribute.
- [x] Create custom `AppleCalendarIcon` component to avoid external dependency bloat.
- [x] Write unit tests in `tests/unit/utils/calendarLinks.test.ts` covering ICS generation.
- [x] Add E2E assertion ensuring the Apple Calendar button is visible (`data-testid="apple-calendar-button"`).
- [x] Pass all validation checks (`npm run validate`).
- [x] Update documentation and mark Story 008 as **Done**.

## Implementation Notes

The `generateAddToCalendarLinks` helper constructs provider URLs and builds an ICS string:

```ts
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//AI Calendar Helper//EN
BEGIN:VEVENT
DTSTART:20250510T200000Z
DTEND:20250510T210000Z
SUMMARY:Team Meeting
DESCRIPTION:Team Meeting — Original Text:\nTeam meeting tomorrow at 4pm in the conference room
LOCATION:Conference room
END:VEVENT
END:VCALENDAR
```

This string is URI-encoded and assigned to a `data:text/calendar;charset=utf-8,` prefix so no server endpoint is needed. The Apple Calendar button:

```tsx
<IconButton
  component="a"
  href={icsDataUri}
  download={`${event.title.replace(/\s+/g, '_')}.ics`}
  aria-label="Download ICS file for Apple Calendar"
  data-testid="apple-calendar-button"
>
  <AppleCalendarIcon width={24} height={24} />
</IconButton>
```

### Testing

Unit tests verify:

1. All VCALENDAR/VEVENT headers exist.
2. DTSTART/DTEND use UTC or include `Z` suffix.
3. Summary, description, and location are correctly interpolated.

E2E tests confirm the presence of the Apple Calendar button and successful file download trigger.

---

## Sign-Off

Implementation reviewed and confirmed by the user on 2025-05-??. Story 008 is **Done**.
