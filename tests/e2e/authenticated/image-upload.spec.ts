import { test, expect } from '@playwright/test';
import path from 'path';

const sampleImage = path.resolve(__dirname, '../fixtures/sample.jpg');

test.describe('Image Upload Event Extraction (Authenticated)', () => {
  test('uploads flyer image and displays parsed event', async ({ page }) => {
    // Mock backend response to avoid model latency/cost
    await page.route('**/api/ai/parse-image-event', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          events: [
            {
              title: 'Flyer Event',
              description: '',
              startDate: '2025-08-01T09:00:00Z',
              endDate: '2025-08-01T10:00:00Z',
              location: 'Hall A',
              timezone: 'UTC',
              summary: 'Flyer',
              confidence: 0.9,
            },
          ],
        }),
      });
    });

    await page.goto('/calendar-parser');

    // Set file directly on hidden input element
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleImage);

    // Click parse button
    await page.getByRole('button', { name: /parse events/i }).click();

    // Verify result appears
    await expect(page.getByText('Flyer Event')).toBeVisible();
  });
});
