// Installable and offline: manifest, icons, the service worker, and updates after a deploy.
import { test, expect, stored, shot } from './helpers.js';

test.use({ serviceWorkers: 'allow' });

const controlled = (page) =>
  page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true }));
    }
    return true;
  });

test('manifest and every icon load, with relative paths', async ({ page, request, baseURL }) => {
  await page.goto('./?date=2026-11-17');
  const href = await page.locator('link[rel=manifest]').getAttribute('href');
  expect(href).toBe('manifest.webmanifest');
  const res = await request.get(new URL(href, baseURL).href);
  expect(res.ok()).toBe(true);
  const manifest = await res.json();
  expect(manifest.name).toBe('10 Miles');
  expect(manifest.display).toBe('standalone');
  expect(manifest.start_url).toBe('./');
  expect(manifest.scope).toBe('./');
  expect(manifest.icons.map((i) => `${i.sizes} ${i.purpose}`)).toEqual(['192x192 any', '512x512 any', '512x512 maskable']);
  const icons = [...manifest.icons.map((i) => i.src), await page.locator('link[rel=apple-touch-icon]').getAttribute('href')];
  for (const src of icons) {
    expect(src.startsWith('/') || src.includes('://'), `${src} is relative`).toBe(false);
    const icon = await request.get(new URL(src, baseURL).href);
    expect(icon.ok(), src).toBe(true);
    expect(icon.headers()['content-type']).toBe('image/png');
  }
});

test('opens with no signal, on any route, and a log entry saves offline', async ({ page, context }, testInfo) => {
  await page.goto('./?date=2026-11-17');
  await expect(page.locator('#morning-title')).toHaveText('Easy 2.5');
  await controlled(page);

  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#morning-title')).toHaveText('Easy 2.5');
  await expect(page.locator('.route')).toBeVisible();
  await shot(page, testInfo, 'offline-today');

  await page.getByRole('button', { name: 'Log run' }).click();
  await page.locator('#sheet').getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '1', exact: true }).click();
  await page.locator('#sheet').getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.logged').first()).toContainText('2.5 mi in');
  expect((await stored(page)).log['2026-11-17'].morning.run.shin).toBe(1);

  // Still offline: reload again, the entry is there, and other screens open.
  await page.reload();
  await expect(page.locator('.logged').first()).toContainText('2.5 mi in');
  for (const [tab, heading] of [['Week', 'Week 2'], ['Progress', 'Progress'], ['Library', 'Library'], ['More', 'More']]) {
    await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: tab }).click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText(heading);
  }
  // A cold open of a different date and route, still with no network.
  await page.goto('./?date=2026-12-05#/week');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 4');
});

test('a new deploy is picked up on the next open without clearing anything, and the log survives', async ({ page, request, baseURL }) => {
  const hook = (name) => request.get(new URL(`/__test/${name}`, baseURL).href);
  await hook('reset');
  try {
    await page.goto('./?date=2026-11-17');
    await controlled(page);
    await page.getByRole('button', { name: 'Log run' }).click();
    await page.locator('#sheet').getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '2', exact: true }).click();
    await page.locator('#sheet').getByRole('button', { name: 'Log run' }).click();
    await expect(page.locator('body')).not.toHaveAttribute('data-deploy', '2');

    await hook('deploy'); // the server now serves a new version
    await page.reload(); // "the next open": the old shell shows at once, then updates itself
    await expect(page.locator('body')).toHaveAttribute('data-deploy', '2', { timeout: 15_000 });
    await expect(page.locator('.logged').first()).toContainText('shin 2');
    expect((await stored(page)).log['2026-11-17'].morning.run.shin).toBe(2);
    // Old caches are cleaned up.
    const caches = await page.evaluate(() => window.caches.keys());
    expect(caches).toEqual(['ten-mile-shell-test-deploy-2']);
  } finally {
    await hook('reset');
  }
});
