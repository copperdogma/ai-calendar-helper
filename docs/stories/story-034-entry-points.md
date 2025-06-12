# Story: Easier Service Entry Points (Browser Plugin, Shortcut, Phone Service)

**Status**: To Do

---

## Related Requirement

<!-- AI: Link to the specific requirement in requirements.md -->

[Requirement: Improve Accessibility and Availability of Calendar Helper](../requirements.md#accessibility-availability)

## Alignment with Design

<!-- AI: Link to the relevant section in design.md -->

[Design Section: Entry Point Integrations](../design.md#entry-point-integrations)

## Acceptance Criteria

- A comparative analysis of at least three potential entry points (e.g., browser extension, bookmarklet/shortcut, phone/SMS service) is documented, including pros, cons, and implementation effort.
- The team selects **one** entry point as the initial target based on the analysis and documents the rationale.
- A proof-of-concept (PoC) is implemented for the chosen entry point and can trigger the existing Text-to-Calendar flow.
- Documentation is updated to explain how users can install/use the new entry point.
- Automated or manual tests verify that the new entry point can submit text and receive calendar suggestions.
- User must sign off on functionality before story can be marked complete.

## Tasks

- [ ] Research candidate entry points: browser extension, bookmarklet/shortcut, phone/SMS service, others.
- [ ] Evaluate feasibility, development effort, user reach, and maintenance overhead for each.
- [ ] Document findings and recommend the best option.
- [ ] Get stakeholder approval on selected entry point.
- [ ] Implement PoC for selected entry point that sends text to `/api/ai/parse-events` and displays results.
- [ ] Add docs in `/docs/examples/` (or README) for installation/usage.
- [ ] Write tests or manual QA checklist for the new entry point.
- [ ] User sign-off.

## Notes

Possible quick wins:

- **Bookmarklet / Web Shortcut**: Easiest, cross-browser, no store approvals.
- **Browser Extension**: Better UX, persistent icon, but requires submission to Chrome/Firefox stores.
- **Phone/SMS Bot**: Higher barrier (Twilio costs, number management) but great for on-the-go use.

Initial suspicion: A bookmarklet or minimal browser extension could be the fastest path to deliver value while laying groundwork for richer integrations later.
