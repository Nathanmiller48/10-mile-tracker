// Logging every session type, editing, skipping, benchmarks, backup and reset.
import { readFile } from 'node:fs/promises';
import { test, expect, seed, run, shot, stored, watchErrors, smallTargets } from './helpers.js';

const sheet = (page) => page.locator('#sheet');

test('log a run in a few taps, with pace calculated, and it survives a reload', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto('./?date=2026-11-17');
  await page.getByRole('button', { name: 'Log run' }).click();
  await expect(sheet(page).getByRole('heading', { name: 'Easy 2.5' })).toBeVisible();
  // Prefilled from the plan: distance 2.5, time estimated, nonstop yes, road.
  await expect(sheet(page).getByLabel('miles', { exact: true })).toHaveValue('2.5');
  await expect(sheet(page).getByLabel('minutes', { exact: true })).toHaveValue('30');
  await expect(sheet(page).locator('[data-pace]')).toHaveText('Pace 12:00 per mile');
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'sheet-run');

  // Saving without a shin score is refused: it is the number the whole plan hangs on.
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(sheet(page).getByRole('alert')).toHaveText('Tap your shin score for this run, 0 to 10.');

  // The common case: one tap for shin, one to save.
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '1', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Less minutes' }).click();
  await sheet(page).getByRole('button', { name: 'Less minutes' }).click();
  await expect(sheet(page).locator('[data-pace]')).toHaveText('Pace 11:12 per mile');
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(sheet(page)).toBeHidden();
  await expect(page.locator('.logged').first()).toHaveText('✓ 2.5 mi in 28:00 · 11:12/mi · shin 1');
  await shot(page, testInfo, 'today-run-logged');

  await page.reload();
  await expect(page.locator('.logged').first()).toContainText('2.5 mi in 28:00');
  const entry = (await stored(page)).log['2026-11-17'].morning;
  expect(entry.run).toEqual({ miles: 2.5, seconds: 1680, nonstop: true, surface: 'road', shin: 1 });
  expect(errors).toEqual([]);
});

test('a run with walk breaks on the treadmill, edited later', async ({ page }) => {
  await page.goto('./?date=2026-11-21');
  await page.getByRole('button', { name: 'Log run' }).click();
  await sheet(page).getByRole('button', { name: 'Took walk breaks' }).click();
  await sheet(page).getByRole('button', { name: 'Treadmill' }).click();
  await sheet(page).getByRole('group', { name: 'Effort, 1 to 10' }).getByRole('button', { name: '6', exact: true }).click();
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '2', exact: true }).click();
  await sheet(page).getByLabel('Notes').fill('Legs heavy after mile 3');
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.logged').first()).toContainText('treadmill · walk breaks · shin 2');
  await expect(page.locator('.logged-notes')).toHaveText('Legs heavy after mile 3');
  // Longest nonstop must not move: walk breaks do not count.
  await expect(page.locator('.route-caption')).toHaveText('Your longest nonstop run fills this line.');

  await page.getByRole('button', { name: 'Edit log' }).first().click();
  await expect(sheet(page).getByRole('button', { name: 'Took walk breaks' })).toHaveAttribute('aria-pressed', 'true');
  await expect(sheet(page).getByLabel('Notes')).toHaveValue('Legs heavy after mile 3');
  await sheet(page).getByRole('button', { name: 'Yes, no walk breaks' }).click();
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.route-caption')).toHaveText('Longest 5 mi');
  expect((await stored(page)).log['2026-11-21'].morning.run).toMatchObject({ surface: 'treadmill', nonstop: true, effort: 6, shin: 2 });
});

test('a run that hits 3 turns the status yellow straight away', async ({ page }) => {
  await page.goto('./?date=2026-11-17');
  await page.getByRole('button', { name: 'Log run' }).click();
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '3', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.banner')).toContainText('Shin: Yellow');
  await expect(page.locator('.banner')).toContainText('Shin reached 3–4 during your last run.');
});

test('benchmark day: the 2-mile time field appears and is saved', async ({ page }, testInfo) => {
  await page.goto('./?date=2026-11-12');
  await expect(page.locator('.day-note')).toContainText('Benchmark: talk-test 2-mile #1');
  await page.getByRole('button', { name: 'Log run' }).click();
  await expect(sheet(page).getByText('Benchmark #1: talk-test 2-mile time')).toBeVisible();
  await expect(sheet(page).getByLabel('Armor circuit done')).toBeChecked();
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '1', exact: true }).click();
  await sheet(page).getByLabel('2-mile minutes').fill('23');
  await sheet(page).getByLabel('2-mile seconds').fill('15');
  await page.evaluate(() => document.querySelector('#sheet').scrollTo(0, 9999));
  await shot(page, testInfo, 'sheet-run-benchmark');
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  const entry = (await stored(page)).log['2026-11-12'].morning;
  expect(entry.benchmarks).toEqual({ talk2Seconds: 1395 });
  expect(entry.armor).toBe(true);
});

test('strength: tick exercises, weights prefilled from last time, calf benchmark', async ({ page }, testInfo) => {
  await seed(page, {
    '2026-11-16': { morning: { status: 'done', strength: { checked: [1, 2, 3], lifts: { deadlift: { weight: 185, reps: 5 } } } } },
  });
  await page.goto('./?date=2026-11-23');
  await page.getByRole('button', { name: 'Log it' }).click();
  await expect(sheet(page).getByLabel('Trap-bar deadlift weight')).toHaveValue('185');
  await expect(sheet(page).getByLabel('Trap-bar deadlift reps')).toHaveValue('5');
  await expect(sheet(page).getByRole('checkbox')).toHaveCount(8);
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'sheet-strength');
  await sheet(page).getByLabel('Trap-bar deadlift weight').fill('195');
  await sheet(page).getByLabel('Split squat weight').fill('30');
  await sheet(page).getByLabel('Split squat reps').fill('6');
  await sheet(page).getByRole('checkbox', { name: /Backward sled drag/ }).uncheck();
  await sheet(page).getByRole('button', { name: 'Log session' }).click();
  await expect(page.locator('.logged').first()).toContainText('Done · deadlift 195 × 5 · squat 30 × 6');
  const entry = (await stored(page)).log['2026-11-23'].morning;
  expect(entry.strength.checked).toEqual([1, 2, 3, 4, 5, 6, 8]);
  expect(entry.strength.lifts).toEqual({ deadlift: { weight: 195, reps: 5 }, splitSquat: { weight: 30, reps: 6 } });

  // Nov 16 is a calf-raise benchmark day.
  await page.goto('./?date=2026-11-16');
  await page.getByRole('button', { name: 'Edit log' }).first().click();
  await expect(sheet(page).getByText('Benchmark #1: single-leg calf raise')).toBeVisible();
  await sheet(page).getByLabel('Calf raises left').fill('18');
  await sheet(page).getByLabel('Calf raises right').fill('16');
  await sheet(page).getByRole('button', { name: 'Log session' }).click();
  expect((await stored(page)).log['2026-11-16'].morning.benchmarks).toEqual({ calfLeft: 18, calfRight: 16 });
});

test('pull day: pull-up weight, lock-off rounds and both benchmarks', async ({ page }) => {
  await page.goto('./?date=2026-11-13');
  await page.getByRole('button', { name: 'Log it' }).click();
  await expect(sheet(page).getByLabel('lock-off rounds', { exact: true })).toHaveValue('3');
  await sheet(page).getByLabel('Weighted pull-up weight').fill('25');
  await sheet(page).getByLabel('Weighted pull-up reps').fill('4');
  await sheet(page).getByLabel('Pull-up added weight in pounds').fill('25');
  await sheet(page).getByLabel('Lock-off seconds left').fill('2');
  await sheet(page).getByLabel('Lock-off seconds right').fill('3');
  await sheet(page).getByRole('button', { name: 'Log session' }).click();
  const entry = (await stored(page)).log['2026-11-13'].morning;
  expect(entry.strength.lifts.pullup).toEqual({ weight: 25, reps: 4 });
  expect(entry.strength.lockoffRounds).toBe(3);
  expect(entry.benchmarks).toEqual({ pullupLb: 25, lockoffLeft: 2, lockoffRight: 3 });
  // From week 3 the ladder is 4 rounds.
  await page.goto('./?date=2026-11-27');
  await page.getByRole('button', { name: 'Log it' }).click();
  await expect(sheet(page).getByLabel('lock-off rounds', { exact: true })).toHaveValue('4');
});

test('climb, recovery and walk logs', async ({ page }, testInfo) => {
  await page.goto('./?date=2026-11-18');
  await page.getByRole('button', { name: 'Log climb' }).click();
  await expect(sheet(page).getByRole('button', { name: 'Medium' })).toHaveAttribute('aria-pressed', 'true');
  await sheet(page).getByRole('group', { name: 'Elbow or finger ache, 0 to 10' }).getByRole('button', { name: '2', exact: true }).click();
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'sheet-climb');
  await sheet(page).getByRole('button', { name: 'Log climb' }).click();
  await expect(page.locator('.logged')).toHaveText('✓ Done · medium · ache 2');

  await page.getByRole('button', { name: 'Log it' }).click();
  await sheet(page).getByRole('button', { name: 'Mark done' }).click();
  await expect(page.locator('.logged').first()).toHaveText('✓ Done');
  const day = (await stored(page)).log['2026-11-18'];
  expect(day.morning.status).toBe('done');
  expect(day.evening.climb).toEqual({ grade: 'medium', ache: 2 });

  await page.goto('./?date=2026-12-25');
  await page.getByRole('button', { name: 'Log it' }).click();
  await sheet(page).getByRole('button', { name: 'Mark done' }).click();
  expect((await stored(page)).log['2026-12-25'].morning.status).toBe('done');
});

test('skipping is a plain state, can be logged late, edited and removed', async ({ page }, testInfo) => {
  await page.goto('./?date=2026-12-10#/day/2026-12-08'); // two days late
  await page.getByRole('button', { name: 'Log run' }).click();
  await sheet(page).getByRole('button', { name: 'Skip this session' }).click();
  await expect(sheet(page).getByRole('heading', { name: 'Skip: Easy 3' })).toBeVisible();
  await sheet(page).getByRole('button', { name: 'Exams' }).click();
  await shot(page, testInfo, 'sheet-skip');
  await sheet(page).getByRole('button', { name: 'Mark skipped' }).click();
  await expect(page.locator('.logged').first()).toHaveText('– Skipped — exams');
  expect((await stored(page)).log['2026-12-08'].morning).toMatchObject({ status: 'skipped', reason: 'Exams' });
  await expect(page.locator('body')).not.toContainText(/missed|failed|behind/i);

  // Change of mind: it was actually done.
  await page.getByRole('button', { name: 'Edit log' }).first().click();
  await sheet(page).getByRole('button', { name: 'Log it instead' }).click();
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '0', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.logged').first()).toContainText('3 mi in');

  await page.getByRole('button', { name: 'Edit log' }).first().click();
  await sheet(page).getByRole('button', { name: 'Remove this log' }).click();
  expect((await stored(page)).log['2026-12-08']).toBeUndefined();
});

test('export, erase with two taps, then import brings the same log back', async ({ page }, testInfo) => {
  const log = {
    '2026-11-14': { morning: run(4, 1) },
    '2026-11-15': { shinAm: { score: 1, at: '2026-11-15T11:00:00.000Z' } },
  };
  await seed(page, log);
  await page.goto('./?date=2026-11-18#/more/settings');
  await expect(page.getByText('2 days logged.')).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export log to a file' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('10-mile-log-2026-11-18.json');
  const file = testInfo.outputPath('backup.json');
  await download.saveAs(file);
  expect(JSON.parse(await readFile(file, 'utf8')).log).toEqual(log);

  await page.getByRole('button', { name: 'Erase my log' }).click();
  expect(Object.keys((await stored(page)).log)).toHaveLength(2); // one tap erases nothing
  await page.getByRole('button', { name: 'Tap again to erase everything' }).click();
  expect((await stored(page)).log).toEqual({});
  await expect(page.getByText('0 days logged.')).toBeVisible();

  await page.locator('input[type=file]').setInputFiles(file);
  await expect(page.getByText('Replace the 0 days on this phone with the 2 days in that file?')).toBeVisible();
  await shot(page, testInfo, 'settings-import-confirm');
  await page.getByRole('button', { name: 'Replace my log' }).click();
  expect((await stored(page)).log).toEqual(log);
  await expect(page.getByText('2 days logged.')).toBeVisible();

  // A junk file is refused with a plain message and changes nothing.
  await page.locator('input[type=file]').setInputFiles({ name: 'x.json', mimeType: 'application/json', buffer: Buffer.from('{"nope":1}') });
  await expect(page.getByRole('alert')).toHaveText('Missing version number.');
  expect((await stored(page)).log).toEqual(log);
});

test('settings: track switch shows on Today and is reversible; theme override applies', async ({ page }) => {
  await page.goto('./?date=2026-11-18#/more/settings');
  await page.getByLabel('Track').selectOption('B');
  await page.getByLabel('Theme').selectOption('light');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click();
  await expect(page.locator('.meta')).toContainText('Track B');
  await page.reload();
  await expect(page.locator('.meta')).toContainText('Track B');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('./?date=2026-11-18#/more/settings');
  await page.getByLabel('Track').selectOption('A');
  expect((await stored(page)).settings.track).toBe('A');
});

test('a log saved by an earlier deploy is still read (no data loss on redeploy)', async ({ page }) => {
  // Minimal version-1 data without fields added later.
  await page.addInitScript(() => {
    localStorage.setItem('ten-mile-tracker', JSON.stringify({ v: 1, log: { '2026-11-14': { morning: { status: 'done', run: { miles: 4, seconds: 2640, nonstop: true, surface: 'road', shin: 1 } } } } }));
  });
  await page.goto('./?date=2026-11-17');
  await expect(page.locator('.route-caption')).toContainText('4 mi');
});
