// The conditions line: forecast verdict, failure fallback to the manual switch, and cache.
import { test, expect, shot, stored, watchErrors } from './helpers.js';

const API = 'https://api.open-meteo.com/**';

/** Hourly data for Nov 16–18, 2026 with optional per-hour edits at Tue 6am. */
function forecast({ temp = 24, feels = 15, edits = {} } = {}) {
  const time = [];
  for (const day of ['2026-11-16', '2026-11-17', '2026-11-18']) for (let h = 0; h < 24; h++) time.push(`${day}T${String(h).padStart(2, '0')}:00`);
  const fill = (v) => time.map(() => v);
  const hourly = { time, temperature_2m: fill(temp), apparent_temperature: fill(feels), precipitation: fill(0), rain: fill(0), snowfall: fill(0), weather_code: fill(3) };
  const at = time.indexOf('2026-11-17T06:00');
  for (const [key, value] of Object.entries(edits)) hourly[key][at] = value;
  return { hourly };
}

// It is 6:10am on Tuesday Nov 17, 2026: an easy 2.5 is planned.
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 17, 6, 10));
});

test('clear and cold: the conditions line says run outside, above the fold', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  let requested = null;
  await page.route(API, (route) => {
    requested = new URL(route.request().url());
    return route.fulfill({ json: forecast() });
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tuesday');
  const line = page.locator('.conditions');
  await expect(line).toHaveText('24°F feels 15, roads dry. Run outside.');
  expect(requested.searchParams.get('latitude')).toBe('42.737'); // East Lansing by default
  expect((await line.boundingBox()).y).toBeLessThan(700);
  await expect(page.locator('.fallback-note')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Open-Meteo' })).toBeVisible();
  expect(errors).toEqual([]);
  await shot(page, testInfo, 'today-weather-outside');
});

test('freezing rain: treadmill verdict, treadmill instructions, and he can still overrule it', async ({ page }, testInfo) => {
  await page.route(API, (route) => route.fulfill({ json: forecast({ temp: 30, feels: 22, edits: { weather_code: 66 } }) }));
  await page.goto('./');
  await expect(page.locator('.conditions')).toContainText('Treadmill today: freezing rain.');
  await expect(page.locator('.fallback-note')).toContainText('Treadmill, 1% incline, same distance, same easy effort.');
  await shot(page, testInfo, 'today-weather-treadmill');
  // Logging defaults to treadmill.
  await page.getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('#sheet').getByRole('button', { name: 'Treadmill' })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#sheet').getByRole('button', { name: 'Close' }).click();
  // His eyes beat the forecast.
  await page.getByRole('button', { name: 'Back to running outside' }).click();
  await expect(page.locator('.fallback-note')).toHaveCount(0);
  expect((await stored(page)).log['2026-11-17'].fallback).toBe(false);
});

test('deep cold: feels-like below zero sends him to the treadmill', async ({ page }) => {
  await page.route(API, (route) => route.fulfill({ json: forecast({ temp: 6, feels: -5 }) }));
  await page.goto('./');
  await expect(page.locator('.conditions')).toContainText('Treadmill today: feels like -5°F.');
});

test('forecast unavailable: no error, just the manual switch', async ({ page }) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route(API, (route) => route.abort());
  await page.goto('./');
  await expect(page.locator('#morning-title')).toHaveText('Easy 2.5');
  await expect(page.locator('.conditions')).toHaveCount(0);
  const manual = page.getByRole('button', { name: 'Icy or too cold? Use treadmill instead' });
  await expect(manual).toBeVisible();
  await manual.click();
  await expect(page.locator('.fallback-note')).toBeVisible();
  expect(errors).toEqual([]);
});

test('a server error or junk response also falls back silently', async ({ page }) => {
  await page.route(API, (route) => route.fulfill({ status: 500, body: 'nope' }));
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Icy or too cold? Use treadmill instead' })).toBeVisible();
  await expect(page.locator('.conditions')).toHaveCount(0);
});

test('the last forecast is cached and used when the network is gone', async ({ page }) => {
  let calls = 0;
  await page.route(API, (route) => {
    calls += 1;
    return calls === 1 ? route.fulfill({ json: forecast() }) : route.abort();
  });
  await page.goto('./');
  await expect(page.locator('.conditions')).toContainText('Run outside.');
  // Four hours later the cache is stale, the refetch fails, and the cached forecast still serves.
  await page.clock.setFixedTime(new Date(2026, 10, 17, 10, 10));
  await page.reload();
  await expect(page.locator('.conditions')).toContainText('Run outside.');
  expect(calls).toBe(2);
});

test('changing the location refetches for that place', async ({ page }) => {
  const seen = [];
  await page.route(API, (route) => {
    seen.push(new URL(route.request().url()).searchParams.get('latitude'));
    return route.fulfill({ json: forecast() });
  });
  await page.goto('./#/more/settings');
  await page.getByLabel('Weather location').selectOption('almont');
  await expect.poll(() => seen).toEqual(['42.737', '42.92']);
});

test('no conditions line on a day without a run', async ({ page }) => {
  await page.clock.setFixedTime(new Date(2026, 10, 18, 6, 10)); // Wednesday: Reset
  await page.route(API, (route) => route.fulfill({ json: forecast() }));
  await page.goto('./');
  await expect(page.locator('#morning-title')).toHaveText('Active recovery');
  await expect(page.locator('.conditions')).toHaveCount(0);
});
