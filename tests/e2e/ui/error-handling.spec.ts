import { test, expect } from '@playwright/test';

// E2E: Trigger client runtime error and verify snackbar + Sentry capture

test.describe('Global error handling', () => {
  test('shows toast and sends Sentry event on runtime error', async ({ page }) => {
    // Navigate to example page that intentionally throws
    await page.goto('/sentry-example-page');

    // Wait for page to load the button
    const throwButton = page.getByRole('button', { name: /throw sample error/i });
    await expect(throwButton).toBeVisible();

    // Trigger the error and capture the outgoing Sentry request in parallel
    const sentryRequestPromise = page.waitForRequest(request => {
      return request.url().includes('sentry.io') && request.method() === 'POST';
    });

    await throwButton.click();

    // Expect toast / snackbar to appear with our generic error text
    const alert = page.getByRole('alert');
    await expect(alert).toBeVisible();
    await expect(alert).toHaveText(/something went wrong/i);

    // Ensure a Sentry network event was fired (skip if ad-block or offline)
    const sentryReq = await sentryRequestPromise.catch(() => null);
    expect(sentryReq, 'Sentry event should have been sent').not.toBeNull();
  });
});
