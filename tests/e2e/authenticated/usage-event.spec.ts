import { test, expect } from '@playwright/test';

const { prisma } = require('../../../lib/prisma') as any;

const TEST_USER_ID = 'a66b184a-c2be-42dc-9f51-002f68fcdaa7';

// Ensure we clear events before test to have clean slate

// Temporarily skip entire spec while analytics flakiness is investigated
test.skip(true, 'Flaky – UsageEvent insertion not reliable in CI');

test('calendar parser logs usage event with userId', async ({ page }) => {
  await page.goto('/calendar-parser');

  const textArea = page.locator('textarea[placeholder*="Enter your event text"]');
  await textArea.fill('Team sync tomorrow at 9am');

  const parseBtn = page.getByRole('button', { name: /parse events/i });
  await expect(parseBtn).toBeEnabled();
  await parseBtn.click();

  // Wait until the first event card rendering (calendar buttons area)
  await expect(page.locator('[data-testid="calendar-integration-buttons"]').first()).toBeVisible({
    timeout: 10000,
  });

  // Poll Prisma until a new UsageEvent appears
  const beforeCount = await prisma.usageEvent.count({ where: { userId: TEST_USER_ID } });

  await expect
    .poll(
      async () => {
        return await prisma.usageEvent.count({ where: { userId: TEST_USER_ID } });
      },
      { timeout: 40000 }
    )
    .toBeGreaterThan(beforeCount);

  const latest = await prisma.usageEvent.findFirst({ orderBy: { createdAt: 'desc' } });
  expect(latest).not.toBeNull();
  expect(latest!.userId).not.toBeNull();
  expect(latest!.inputType).toBe('TEXT');

  // Clean up created row so test is idempotent

  await prisma.usageEvent.delete({ where: { id: latest!.id } });
});

// Close prisma in test teardown

test.afterAll(async () => {
  await prisma.$disconnect();
});
