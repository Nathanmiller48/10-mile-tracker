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

/** A realistic log through Sat Dec 5: four green weeks, benchmarks, climbs, lifts. */
export function sampleLog() {
  const log = {};
  const put = (date, slot, value) => (log[date] = { ...(log[date] || {}), [slot]: value });
  const runs = [
    ['2026-11-12', 2, 1], ['2026-11-14', 4, 1], ['2026-11-17', 2.5, 1], ['2026-11-19', 2.5, 2],
    ['2026-11-21', 5, 1], ['2026-11-24', 3, 1], ['2026-11-26', 3, 0], ['2026-11-28', 6.2, 2],
    ['2026-12-01', 3, 1], ['2026-12-03', 3.5, 1], ['2026-12-05', 7, 1],
  ];
  for (const [date, miles, shin] of runs) {
    put(date, 'morning', { status: 'done', at: `${date}T12:00:00.000Z`, run: { miles, seconds: Math.round(miles * 645), nonstop: true, surface: 'road', effort: 4, shin } });
    const next = new Date(`${date}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    put(next.toISOString().slice(0, 10), 'shinAm', { score: 1 });
  }
  log['2026-11-12'].morning.benchmarks = { talk2Seconds: 1395 };
  log['2026-12-03'].morning.benchmarks = { talk2Seconds: 1330 };
  put('2026-11-13', 'morning', { status: 'done', strength: { checked: [1, 2, 3, 4, 5, 6], lifts: { pullup: { weight: 25, reps: 4 } }, lockoffRounds: 3 }, benchmarks: { pullupLb: 25, lockoffLeft: 2, lockoffRight: 3 } });
  put('2026-11-16', 'morning', { status: 'done', strength: { checked: [1, 2, 3, 4, 5, 6, 7, 8], lifts: { deadlift: { weight: 185, reps: 5 }, splitSquat: { weight: 30, reps: 6 }, calfRaise: { weight: 20, reps: 10 } } }, benchmarks: { calfLeft: 18, calfRight: 16 } });
  put('2026-11-16', 'evening', { status: 'done', climb: { grade: 'hard', ache: 1 } });
  put('2026-11-18', 'morning', { status: 'done' });
  put('2026-11-25', 'morning', { status: 'skipped', reason: 'Exams' });
  return log;
}
