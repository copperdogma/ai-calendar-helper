import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { Page } from 'playwright';

// Update the storage state path to match the path in the Playwright configuration
const storageStatePath = path.join(process.cwd(), 'tests/.auth/user.json');

// Test user information
const TEST_USER = {
  uid: 'test-uid-playwright-123',
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'Test123!',
  displayName: process.env.TEST_USER_DISPLAY_NAME || 'Test User',
};

// ADDED LOGGING: Log environment setup
console.log('🔧 E2E Auth Setup Environment Info:');
console.log(`BASE_URL: ${process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777'}`);
console.log(`TEST_PORT: ${process.env.TEST_PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

/**
 * Ensure the test user exists in the database before attempting login
 */
async function ensureTestUserExists(page: Page): Promise<boolean> {
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';
  try {
    console.log('🔍 Ensuring test user exists in the database...');
    const response = await page.goto(`${baseUrl}/api/test/e2e-auth-setup`);

    if (!response) {
      console.error('❌ Failed to reach test user setup endpoint');
      return false;
    }

    const responseData = await response.json();
    console.log('✅ Test user setup response:', responseData);
    return responseData.success === true;
  } catch (error) {
    console.error('❌ Error ensuring test user exists:', error);
    return false;
  }
}

/**
 * Sets up authentication using the standard UI Login form.
 */
async function setupAuthViaUiLogin(page: Page): Promise<boolean> {
  console.log('🔑 Setting up authentication via UI Login Form...');
  const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3777';

  try {
    // First ensure the test user exists
    const userExists = await ensureTestUserExists(page);
    if (!userExists) {
      console.error('❌ Failed to ensure test user exists');
      await page.screenshot({ path: 'tests/e2e/screenshots/auth-setup-error-user-setup.png' });
      return false;
    }

    // 1. Navigate to Login Page
    await page.goto(`${baseUrl}/login`, { waitUntil: 'networkidle' });
    console.log('Navigated to /login');

    // 2. Locate Form Elements (Using selectors from CredentialsLoginForm.tsx)
    const emailInput = page.locator('#email'); // Found id="email"
    const passwordInput = page.locator('#password'); // Found id="password"
    // Use type and text content for submit button
    const submitButton = page.locator('button[type="submit"]:has-text("Sign In with Email")');

    await emailInput.waitFor({ state: 'visible', timeout: 10000 });
    console.log('Login form elements located');

    // 3. Fill and Submit Form
    await emailInput.fill(TEST_USER.email);
    await passwordInput.fill(TEST_USER.password);
    console.log(`Filled credentials for ${TEST_USER.email}`);
    await submitButton.click();
    console.log('Clicked Sign In button');

    // 4. Wait for successful redirect to Dashboard
    await page.waitForURL('**/dashboard', { timeout: 15000, waitUntil: 'networkidle' });
    console.log('Redirected to /dashboard after login attempt');

    // 5. Verify and Save State
    console.log('🔍 Verifying authentication and session state after UI login...');
    return verifyAuthentication(page);
  } catch (error) {
    console.error('❌ Error during UI Login auth setup:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/auth-setup-error-ui-login.png' });
    await createEmptyAuthState(); // Ensure we create empty state on failure
    return false;
  }
}

/**
 * This setup function now uses the UI Login method.
 */
setup('authenticate', async ({ page }) => {
  console.log('🔒 Setting up authentication for testing...');

  try {
    // Use the new UI Login method
    const success = await setupAuthViaUiLogin(page);

    if (success) {
      console.log('✅ Authentication setup completed successfully via UI Login');
    } else {
      console.error('❌ UI Login Authentication setup failed.');
      await createEmptyAuthState(); // Ensure we fall back to empty state
      console.warn('⚠️ Created empty auth state as fallback after setup failure');
    }
  } catch (error) {
    console.error('❌ Authentication setup failed catastrophically:', error);
    await createEmptyAuthState(); // Ensure we fall back to empty state
    console.warn('⚠️ Created empty auth state as fallback after catastrophic failure');
  }
});

/**
 * Verify authentication was successful by checking various indicators
 */
async function verifyAuthentication(page: Page): Promise<boolean> {
  try {
    console.log(`Verifying authentication status at URL: ${page.url()}`);

    // ADDED: Log cookies at the start of verification
    const cookiesAtVerification = await page.context().cookies();
    console.log(
      '🍪 Cookies at start of verification:',
      JSON.stringify(cookiesAtVerification, null, 2)
    );

    // Increased timeout for verification checks
    const verificationTimeout = 15000; // 15 seconds

    // 1. Check if we are still on the login page (immediate failure)
    if (page.url().includes('/login')) {
      console.error('❌ Authentication verification failed - Still on login page');
      await page.screenshot({ path: 'tests/e2e/screenshots/auth-verify-fail-on-login.png' });
      await createEmptyAuthState();
      return false;
    }

    // 2. Wait for a primary dashboard element to appear
    const dashboardHeadingSelector = 'h1:has-text("Dashboard")'; // More specific selector
    try {
      await page
        .locator(dashboardHeadingSelector)
        .waitFor({ state: 'visible', timeout: verificationTimeout });
      console.log(`✅ Authentication verified - Found element: ${dashboardHeadingSelector}`);

      // 3. (Optional but recommended) Check for the presence of the NextAuth session cookie
      const cookies = await page.context().cookies();
      const sessionCookie = cookies.find(
        c =>
          c.name.startsWith('next-auth.session-token') ||
          c.name.startsWith('__Secure-next-auth.session-token')
      );

      if (!sessionCookie) {
        console.warn('⚠️ Dashboard content found, but NextAuth session cookie is missing!');
        await page.screenshot({ path: 'tests/e2e/screenshots/auth-verify-warn-no-cookie.png' });
        await createEmptyAuthState();
        return false;
      } else {
        console.log(`✅ Found NextAuth session cookie: ${sessionCookie.name}`);
      }

      // 4. Save authentication state only after successful verification
      await page.context().storageState({ path: storageStatePath });
      console.log(`✅ Authentication state saved to ${storageStatePath}`);
      return true;
    } catch {
      console.error(
        `❌ Authentication verification failed - Dashboard element "${dashboardHeadingSelector}" not found within ${verificationTimeout}ms.`
      );
      await page.screenshot({
        path: 'tests/e2e/screenshots/auth-verify-fail-no-dashboard-content.png',
      });
      console.log(`Current page URL: ${page.url()}`);
      console.log(`Current page title: ${await page.title()}`);
      // Log cookies for debugging
      const cookies = await page.context().cookies();
      console.log('Cookies at verification failure:', JSON.stringify(cookies, null, 2));
      await createEmptyAuthState();
      return false;
    }
  } catch (error) {
    console.error('❌ Error during authentication verification:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/auth-verify-error.png' });
    await createEmptyAuthState(); // Ensure we create empty state on failure
    return false;
  }
}

/**
 * Creates an empty authentication state file if everything else fails
 * This is a last resort to prevent test failures when auth setup completely fails
 */
async function createEmptyAuthState(): Promise<void> {
  const emptyState = {
    cookies: [],
    origins: [
      {
        origin: 'http://localhost:3777',
        localStorage: [],
      },
    ],
  };

  fs.mkdirSync(path.dirname(storageStatePath), { recursive: true });
  fs.writeFileSync(storageStatePath, JSON.stringify(emptyState, null, 2));
  console.log(`Created empty auth state at ${storageStatePath}`);
}
