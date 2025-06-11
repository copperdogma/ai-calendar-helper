# Project Development Log

## 2025-06-11: Story 032 Complete - Calendar Parser Page & Default Routing

**Major Feature Implementation**: Calendar Parser page now serves as the primary authenticated landing page

### Core Changes:

- **New Calendar Parser Page**: Created `/calendar-parser` route with AI event-parsing functionality
- **Routing Migration**: All authentication redirects now point to `/calendar-parser` instead of `/dashboard`
- **Navigation Updates**: Header navigation updated to show "Calendar Parser" with CalendarMonth icon
- **Home Page Simplification**: Root path (`/`) now uses server-side redirect only, removing client-side UI

### Technical Implementation:

- **32 files modified**: Comprehensive routing update across app, components, and tests
- **New Route Constants**: Added `CALENDAR_PARSER` to centralized route definitions
- **Authentication Flow**: Updated all auth components (SignInButton, CombinedLoginOptions, CredentialsLoginForm) to use new callback URLs
- **Test Suite Updates**: All unit and E2E tests updated for new routing structure

### Quality Assurance:

- **Test Coverage**: Achieved >90% coverage for modified files (87.57% overall)
- **Validation**: All linting, formatting, and type-checking passes
- **Accessibility**: Fixed CircularProgress aria-label for WCAG compliance
- **E2E Testing**: Updated selectors and expectations for new page structure

### User Experience:

- **Simplified Flow**: Users now land directly on the main feature after authentication
- **Consistent Navigation**: Clear "Calendar Parser" branding throughout the application
- **Maintained Functionality**: All existing text-to-calendar features preserved and relocated

This milestone represents the successful completion of Story 032, establishing the Calendar Parser as the primary user destination and simplifying the application's navigation structure.

## 2025-05-01: Project Setup Complete

Initial project setup completed:

- Next.js 15 application scaffolding
- PostgreSQL database setup
- Material UI components
- Unit tests (Jest)
- E2E tests (Playwright)
- CI/CD configuration

See the [project-structure.md](./project-structure.md) for details on the architecture and file organization.
