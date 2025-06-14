# Story 037: Fix Production Profile Auth/Session Issue

**Status**: Planning

## Context

After deploying to Fly, users can sign in via Google OAuth, but `/profile` and the sign-out button fail with error:

```
Error Loading Profile
Session not authenticated. Please log in again.
```

Yet protected pages load, indicating the session cookie exists. Hypothesis: the `User` row is not created on first login in prod due to Prisma uniqueness error, causing `/api/user/me` (which hits DB) to return 401.

## Acceptance Criteria

1. Production sign-in flow always creates or finds the corresponding `User` record.
2. `/api/user/me` returns the user JSON after first login.
3. Profile page renders without error; sign-out button visible.
4. Regression tests pass locally; deploy verified on Fly.

## Tasks

- [ ] Reproduce issue by calling `/api/user/me` in prod logs.
- [ ] Inspect `signIn` callback in `lib/auth-shared.ts` (or similar) for `prisma.user.create`.
- [ ] Change to `prisma.user.upsert({ where: { email }, update: {}, create: {...}})`.
- [ ] Add fallback Sign-out button in global header (UX safety net).
- [ ] Write unit test for sign-in callback upsert logic.
- [ ] Deploy fix, verify profile works.

## Notes

Bug surfaced only in prod; local DB already contained the user. Upsert prevents race & duplicate errors.
