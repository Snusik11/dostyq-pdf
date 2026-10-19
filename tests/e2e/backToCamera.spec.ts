import { expect, test, type Page } from '@playwright/test';

/**
 * Regression for a bug found on a real phone: after taking a photo and pressing
 * "Далее", going back with the arrow to the camera left NO "Далее" button until
 * another photo was taken, because the button was tied to the number of photos
 * not yet processed. A document that already has pages must always be able to
 * continue.
 *
 * The default chromium project runs with a fake camera, so these go through the
 * real camera screen.
 */

async function openCameraAndCaptureOne(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('open-scanner').click();
  const video = page.getByTestId('camera-view-video');
  await expect.poll(async () => video.evaluate((el: HTMLVideoElement) => el.readyState)).toBeGreaterThanOrEqual(2);
  await page.getByTestId('capture-button').click();
  await expect(page.getByTestId('capture-next')).toBeVisible();
}

test('after "Далее" and back to the camera, "Далее" is still offered and returns to the same page', async ({ page }) => {
  await openCameraAndCaptureOne(page);

  await page.getByTestId('capture-next').click();
  await expect(page.getByTestId('adjust-screen')).toBeVisible({ timeout: 60_000 });

  // The arrow at the top of the adjust screen leads back to the camera.
  await page.getByTestId('adjust-back').click();
  await expect(page.getByTestId('capture-screen')).toBeVisible();

  // Nothing new was shot, but the document has a page, so "Далее" must be there.
  await expect(page.getByTestId('capture-next')).toBeVisible();

  await page.getByTestId('capture-next').click();
  await expect(page.getByTestId('adjust-screen')).toBeVisible();
  // Straight back, no second processing run.
  await expect(page.getByTestId('adjust-loading')).toHaveCount(0);
});

test('from the grid, "Снять ещё" then "Далее" without a new photo returns to the grid', async ({ page }) => {
  await openCameraAndCaptureOne(page);
  await page.getByTestId('capture-next').click();
  await expect(page.getByTestId('adjust-screen')).toBeVisible({ timeout: 60_000 });
  await page.getByTestId('adjust-next').click();
  await expect(page.getByTestId('page-grid')).toBeVisible();

  await page.getByTestId('grid-capture-more').click();
  await expect(page.getByTestId('capture-screen')).toBeVisible();
  await expect(page.getByTestId('capture-next')).toBeVisible();

  await page.getByTestId('capture-next').click();
  await expect(page.getByTestId('page-grid')).toBeVisible();
  await expect(page.locator('[data-testid^="page-grid-item-"]')).toHaveCount(1);
});
