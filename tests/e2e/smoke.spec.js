import { test, expect } from '@playwright/test';

test('loads on a phone with no errors and no sideways scroll', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  const failed = [];
  page.on('requestfailed', (req) => failed.push(req.url()));
  page.on('response', (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });

  await page.goto('./');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('10 miles nonstop');
  await expect(page.locator('#route-markers text')).toHaveCount(11);
  await expect(page.locator('#route-markers text').last()).toHaveText('10');

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);

  const bodyFontPx = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  expect(bodyFontPx).toBeGreaterThanOrEqual(16);

  expect(errors).toEqual([]);
  expect(failed).toEqual([]);

  await page.screenshot({ path: testInfo.outputPath('home-390x844.png') });
});
