// UI element selectors in a centralized object - enhanced with more data-testid attributes
export const UI_ELEMENTS = {
  AUTH: {
    // Primary selectors
    BUTTON: '[data-testid="auth-button"]',
    PLACEHOLDER: '[data-testid="auth-button-placeholder"]',
    GOOGLE_SIGNIN: '[data-testid="google-signin-button"]',
    EMAIL_INPUT: '#email', // Standard ID for email
    PASSWORD_INPUT: '#password', // Standard ID for password
    CREDENTIALS_SUBMIT: '[data-testid="credentials-submit-button"]', // Updated selector
    SIGNUP_LINK: 'a:has-text("Sign Up")',
    LOGOUT_BUTTON: '[data-testid="logout-button"]', // General logout button
  },
  USER_PROFILE: {
    // Primary data-testid selector (most reliable)
    TESTID: '[data-testid="user-profile"]',
    // Fallbacks with various selection strategies
    CONTAINER: '[data-testid="profile-container"]',
    NAV_PROFILE: 'header [data-testid="user-profile"]',
    IMAGE: '[data-testid="profile-image"]',
    NAME: '[data-testid="profile-name"]',
  },
  NAVIGATION: {
    NAV: '[data-testid="navbar"]',
    DESKTOP_MENU: '[data-testid="desktop-menu"]',
    MOBILE_MENU: '[data-testid="mobile-menu"]',
    HEADER: 'header',
  },
  CONTENT: {
    DASHBOARD: '[data-testid="dashboard-content"]',
    DASHBOARD_HEADING: 'h1:has-text("Dashboard"), [data-testid="dashboard-heading"]',
    PAGE_HEADING: 'h1',
    MAIN_CONTENT: '[data-testid="main-content-wrapper"], main',
  },
  CALENDAR: {
    INTEGRATION_BUTTONS: '[data-testid="calendar-integration-buttons"]',
    GOOGLE_BUTTON: '[data-testid="google-calendar-button"]',
    OUTLOOK_BUTTON: '[data-testid="outlook-calendar-button"]',
    APPLE_BUTTON: '[data-testid="apple-calendar-button"]',
    EVENT_CARD: '[aria-label="event-preview-card"]',
    EVENT_TIME: 'p:has-text("📅")',
    EVENT_CONFIDENCE: 'p:has-text("Confidence:")',
  },
  ERROR_MESSAGES: {
    INVALID_CREDENTIALS: 'p:has-text("Invalid email or password")', // Selector for the specific error message
  },
};
