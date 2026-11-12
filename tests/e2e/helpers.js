// Shared helpers for the Playwright tests.

export const KEY = 'ten-mile-tracker';

export const run = (miles, shin, more = {}) => ({
  status: 'done',
  at: '2026-11-01T12:00:00.000Z',
  run: { miles, seconds: Math.round(miles * 660), nonstop: true, surface: 'road', effort: 4, shin, ...more },
});

/** Seed the log before the app loads. `log` is { date: { morning, evening, shinAm, ... } }. */
export async function seed(page, log = {}, extra = {}) {
  const state = {
    v: 1,
    log,
    settings: { location: 'east-lansing', theme: 'system', verse: true, track: 'A' },
    overrides: [],
    clearedOn: null,
    ...extra,
  };
  await page.addInitScript(([key, value]) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem(key, value);
      sessionStorage.setItem('seeded', '1');
    }
  }, [KEY, JSON.stringify(state)]);
}

export const stored = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key)), KEY);

export async function shot(page, testInfo, name) {
  await page.screenshot({ path: testInfo.outputPath(`${name}.png`) });
}

/** Fail the test on any console error, page error or failed request. */
export function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('response', (res) => {
    if (res.status() >= 400) errors.push(`${res.status()} ${res.url()}`);
  });
  return errors;
}

/** Every visible button, link, summary and input must be at least 48 px tall (or 44 wide for inline links). */
export async function smallTargets(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('button, a.btn, .tabs a, summary, select, .wk-row, .nav-row, input:not([type=checkbox]):not([type=file]), textarea, label.check')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && r.height < 47.5;
      })
      .map((el) => `${el.tagName} "${(el.textContent || el.name || '').trim().slice(0, 30)}" ${Math.round(el.getBoundingClientRect().height)}px`),
  );
}
