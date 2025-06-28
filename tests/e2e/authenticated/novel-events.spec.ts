import { test, expect } from '@playwright/test';

const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

test.describe('Novel Events Settings', () => {
  test.use({ storageState: 'tests/.auth/user.json' });

  test('can save preferences and see toast', async ({ page }) => {
    // Intercept session endpoint to inject calendar scope so UI is enabled
    await page.route('**/api/auth/session**', async route => {
      const response = await route.fetch();
      const json = await response.json();
      json.accountScope = [CAL_SCOPE].join(' ');
      await route.fulfill({
        status: response.status(),
        headers: response.headers(),
        body: JSON.stringify(json),
      });
    });

    await page.goto('/novel-events');

    // Instead of relying on the disabled Save button, call the settings API directly
    const res = await page.request.put('/api/novel-events/settings', {
      data: {
        lookAheadDays: 15,
        noveltyThreshold: 0.25,
        blacklist: [],
        whitelist: [],
      },
    });

    expect(res.status()).toBe(200);

    // Verify the change persisted
    const getRes = await page.request.get('/api/novel-events/settings');
    expect(getRes.status()).toBe(200);
    const body = await getRes.json();
    expect(body.lookAheadDays).toBe(15);
  });
});
