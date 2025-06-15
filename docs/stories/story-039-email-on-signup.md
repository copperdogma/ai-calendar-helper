# Story: Email Notification on New User Sign-Up

**Status**: Planning

---

## Related Requirement

_To be linked during detailed planning phase._

## Alignment with Design

Will integrate with existing user registration flow (`auth.actions.ts`) and notification preferences design (to be defined).

## Objective

Notify the project owner via email whenever a new user successfully registers an account.

## Acceptance Criteria (Draft)

1. An email is sent immediately after a successful user sign-up event.
2. The email contains the new user's ID, email, sign-up timestamp, and referral source (if available).
3. Email is delivered using a 100 % free-forever service (no credit card required).
4. The recipient email address is read from environment variable `NOTIFICATIONS_EMAIL_TO`.
5. Implementation includes unit tests and e2e tests to verify email dispatch and content.
6. All linting, type-checking, and test suites pass.

## Tasks (Initial Draft)

- [ ] Finalize research on email service/provider
- [ ] Integrate chosen provider SDK or SMTP via `lib/email/` helper
- [ ] Hook into user registration flow to enqueue email
- [ ] Build email template (plain text or HTML)
- [ ] Write Jest unit tests for helper
- [ ] Write Playwright test to stub provider and verify call
- [ ] Update documentation and `.env.example`

## Implementation Notes

_To be completed after research phase._
