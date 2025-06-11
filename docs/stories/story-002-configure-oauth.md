# Story: Configure Google OAuth & Calendar API

**Status**: To Do

---

## Related Requirement

[Technical Requirements](../requirements.md#technical-requirements) - Secure Google Calendar API integration, OAuth 2.0 implementation with secure credential storage

## Alignment with Design

[Authentication Design](../design.md#authentication-design) - NextAuth.js v5 with Google provider for OAuth 2.0, Google Calendar Integration

## Acceptance Criteria

- Google Cloud Console project is set up with proper APIs enabled
- OAuth 2.0 credentials are configured for web application
- NextAuth.js Google provider includes Calendar API scope
- Users can sign in with Google and grant Calendar permissions
- Access tokens for Calendar API are properly stored and managed
- Token refresh mechanism works automatically
- Calendar API access is verified through test API calls

## Tasks

- [ ] Create new project in Google Cloud Console
- [ ] Enable Google Calendar API for the project
- [ ] Enable Google+ API (required for NextAuth.js Google provider)
- [ ] Create OAuth 2.0 credentials (Web application type)
- [ ] Configure authorized redirect URIs (`http://localhost:3000/api/auth/callback/google` for dev)
- [ ] Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in environment variables
- [ ] Update NextAuth.js configuration to include Google provider
- [ ] Add Calendar API scope to Google provider configuration (`https://www.googleapis.com/auth/calendar`)
- [ ] Configure Prisma adapter to store access tokens and refresh tokens securely
- [ ] Test Google sign-in flow end-to-end
- [ ] Verify that Calendar scope permissions are granted
- [ ] Create test API call to Google Calendar API using stored tokens
- [ ] Test token refresh mechanism
- [ ] User must sign off on functionality before story can be marked complete

## Notes

- Calendar API scope requires sensitive scope verification in Google Cloud Console
- Refresh tokens are essential for background novel events processing
- Access tokens expire after 1 hour, so refresh token handling is critical
- The template's NextAuth.js setup should handle most token management automatically
- Consider implementing error handling for expired or revoked tokens
