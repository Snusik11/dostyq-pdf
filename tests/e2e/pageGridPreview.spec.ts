import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'document.png');

/**
 * The page list: the thumbnail opens a PREVIEW (to check the right page is in
 * the right place), the pencil opens the EDITOR, and nothing animates after a
 * dragged row is dropped.
 */

async function openListWithThreePages(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByTestId('welcome-import-input').setInputFiles([FIXTURE, FIXTURE, FIXTURE]);
  const next = page.getByTestId('capture-next');
  const adjust = page.getByTestId('adjust-screen');
  await Promise.race([next.waitFor({ timeout: 60_000 }), adjust.waitFor({ timeout: 60_000 })]);
  if (await next.isVisible().catch(() => false)) await next.click();
  await adjust.waitFor({ timeout: 120_000 });
  await page.getByTestId('adjust-next').click();
  await expect(page.getByTestId('page-grid')).toBeVisible();
  await expect(page.locator('[data-testid^="page-grid-item-"]')).toHaveCount(3);
}

test('tapping a thumbnail opens the preview on that page, not the editor, and closing returns to the list', async ({ page }) => {
  await openListWithThreePages(page);

  await page.getByTestId(/^page-grid-preview-/).nth(2).click();
  await expect(page.getByTestId('page-viewer')).toBeVisible();
  // Opened on the third page, and it is the viewer, not the corner editor.
  await expect(page.getByTestId('viewer-counter')).toHaveText('3 из 3');
  await expect(page.getByTestId('corner-editor-canvas')).toHaveCount(0);

  await page.getByTestId('viewer-prev').click();
  await expect(page.getByTestId('viewer-counter')).toHaveText('2 из 3');

  await page.getByTestId('viewer-close').click();
  await expect(page.getByTestId('page-viewer')).toHaveCount(0);
  await expect(page.getByTestId('page-grid')).toBeVisible();
});

test('the pencil opens the editor, not the preview', async ({ page }) => {
  await openListWithThreePages(page);

  await page.getByTestId(/^page-grid-edit-/).first().click();
  await expect(page.getByTestId('corner-editor-canvas')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByTestId('page-viewer')).toHaveCount(0);
});

test('nothing animates after a dragged row is dropped', async ({ page }) => {
  await openListWithThreePages(page);
  // Let anything that plays when the list first appears finish.
  await page.waitForTimeout(1500);

  const items = page.locator('[data-testid^="page-grid-item-"]');
  const handleBox = await page.getByTestId(/^page-grid-drag-/).first().boundingBox();
  const targetBox = await items.nth(2).boundingBox();
  if (!handleBox || !targetBox) throw new Error('list rows are not laid out');
  const x = handleBox.x + handleBox.width / 2;
  const fromY = handleBox.y + handleBox.height / 2;
  const toY = targetBox.y + targetBox.height / 2;
  await page.mouse.move(x, fromY);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) await page.mouse.move(x, fromY + ((toY - fromY) * step) / 12);
  await page.mouse.up();

  // The moved row used to fade and slide in again (a CSS animation restarts when
  // React re-inserts the element). Sample right after the drop and a bit later.
  for (const wait of [0, 60, 150]) {
    if (wait) await page.waitForTimeout(wait);
    const running = await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => animation instanceof CSSAnimation && animation.playState === 'running')
        .map((animation) => (animation as CSSAnimation).animationName),
    );
    expect(running, `CSS animations running ${wait} ms after the drop`).toEqual([]);
  }
});
