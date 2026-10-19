import { expect, test } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'document.png');

/**
 * Regression for a bug found on a real phone: the handle used to reorder pages
 * could not be seen, a grey icon on a pale page. Its background was declared as
 * `bg-bg/70`, and Tailwind silently drops an opacity modifier on a colour that is
 * a `var(--color-*)`, so the pill had no background at all.
 */

async function openGridWithThreePages(page: import('@playwright/test').Page): Promise<void> {
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

test('the drag handle has a solid background and a thumb-sized target, so it shows on pale pages', async ({ page }) => {
  await openGridWithThreePages(page);

  const handle = page.getByTestId(/^page-grid-drag-/).first();
  await expect(handle).toBeVisible();

  const style = await handle.evaluate((element) => {
    const computed = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return { background: computed.backgroundColor, width: rect.width, height: rect.height };
  });
  // Not transparent: that was the bug.
  expect(style.background).not.toBe('rgba(0, 0, 0, 0)');
  expect(style.width).toBeGreaterThanOrEqual(48);
  expect(style.height).toBeGreaterThanOrEqual(36);
});

test('dragging the first page by its handle onto the last one reorders the pages', async ({ page }) => {
  await openGridWithThreePages(page);

  const items = page.locator('[data-testid^="page-grid-item-"]');
  const order = (): Promise<(string | null)[]> => items.evaluateAll((elements) => elements.map((el) => el.getAttribute('data-testid')));
  const before = await order();

  const handleBox = await page.getByTestId(/^page-grid-drag-/).first().boundingBox();
  const targetBox = await items.nth(2).boundingBox();
  if (!handleBox || !targetBox) throw new Error('grid tiles are not laid out');

  const fromX = handleBox.x + handleBox.width / 2;
  const fromY = handleBox.y + handleBox.height / 2;
  const toX = targetBox.x + targetBox.width / 2;
  const toY = targetBox.y + targetBox.height / 2;
  await page.mouse.move(fromX, fromY);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(fromX + ((toX - fromX) * step) / 12, fromY + ((toY - fromY) * step) / 12);
  }
  await page.mouse.up();

  await expect.poll(order).toEqual([before[1], before[2], before[0]]);
  // A drag must not open the page editor.
  await expect(page.getByTestId('page-grid')).toBeVisible();
});
