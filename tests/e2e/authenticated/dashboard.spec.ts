import { test, expect } from '../utils/test-base';

/**
 * Calendar Parser page tests with diagnostic logging
 *
 * These tests assume authentication is handled via the auth.setup.ts file
 */

test('authenticated user can access Calendar Parser page', async ({ page }) => {
  console.log('🧪 Starting Calendar Parser page test...');

  try {
    // Go to Calendar Parser page with extended timeout
    console.log('📄 Navigating to Calendar Parser page...');
    await page.goto('/calendar-parser', { timeout: 30000 });

    // Take screenshot for debugging
    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-parser.png' });

    // Log the current state
    const url = page.url();
    console.log(`📊 Current URL: ${url}`);

    // Check if we're actually on the Calendar Parser page (not redirected to login)
    if (url.includes('/login')) {
      console.log('⚠️ Redirected to login - authentication may have failed');
      // Take detailed info to diagnose what went wrong
      await page.screenshot({ path: 'tests/e2e/screenshots/calendar-parser-auth-failed.png' });

      // Show auth-related localStorage items
      const storage = await page.evaluate(() => {
        const items: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key !== null) {
            const value = localStorage.getItem(key);
            items[key] = value !== null ? value : '';
          }
        }
        return items;
      });
      console.log('📊 LocalStorage state:', storage);

      // This will fail and correctly show the test as failed
      expect(url).not.toContain('/login');
    }

    // Log page content for debugging
    const content = await page.content();
    console.log(`📊 Page content length: ${content.length} characters`);

    // Basic visual check - find any header that might indicate we're on Calendar Parser page
    const dashboardHeader = page.locator('h1,h2,h3,h4').first();
    if (await dashboardHeader.isVisible()) {
      const headerText = await dashboardHeader.textContent();
      console.log(`📊 Found header: "${headerText}"`);
    } else {
      console.log('⚠️ No header found on page');
    }

    // Simple assertion - make sure we can at least find some content
    const body = page.locator('body');
    expect(await body.isVisible()).toBeTruthy();

    console.log('✅ Calendar Parser page test completed successfully');
  } catch (error) {
    console.error('❌ Calendar Parser page test failed:', error);
    await page.screenshot({ path: 'tests/e2e/screenshots/calendar-parser-error.png' });
    throw error;
  }
});
