import { test, expect } from '../utils/test-base';

test.describe('Visual Regression Tests', () => {
  test('Login page should match the approved snapshot', async ({ page }) => {
    await page.goto('/login');
    // Ensure the page is stable and key elements are visible before taking a screenshot
    await expect(page.locator('[data-testid="google-signin-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="credentials-form"]')).toBeVisible();

    // Assert that the page matches the saved snapshot.
    await expect(page).toHaveScreenshot('login-page.png', {
      maxDiffPixels: 1500, // Allow minor layout tweaks (header timezone selector)
    });
  });
}); 