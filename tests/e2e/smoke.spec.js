import { test, expect, watchErrors, shot, smallTargets } from './helpers.js';

test('loads on a phone with no errors and no sideways scroll', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto('./?date=2026-11-17');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tuesday');
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText([
    'Today', 'Week', 'Progress', 'Library', 'More',
  ]);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBe(0);
  const bodyFontPx = await page.evaluate(() => parseFloat(getComputedStyle(document.body).fontSize));
  expect(bodyFontPx).toBeGreaterThanOrEqual(16);
  expect(await smallTargets(page)).toEqual([]);
  expect(errors).toEqual([]);
  await shot(page, testInfo, 'home-390x844');
});

test('every tab opens its screen', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('./?date=2026-11-17');
  const nav = page.getByRole('navigation', { name: 'Main' });
  for (const [tab, heading] of [['Week', 'Week 2'], ['Progress', 'Progress'], ['Library', 'Library'], ['More', 'More'], ['Today', 'Tuesday']]) {
    await nav.getByRole('link', { name: tab }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
    await expect(nav.getByRole('link', { name: tab })).toHaveAttribute('aria-current', 'page');
    expect(await smallTargets(page), `small targets on ${tab}`).toEqual([]);
  }
  expect(errors).toEqual([]);
});
