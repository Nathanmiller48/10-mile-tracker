// Screenshots of every screen on several kinds of day, plus checks on what each must show.
import { test, expect, seed, run, shot, watchErrors, smallTargets } from './helpers.js';

test('run day: Tuesday easy run', async ({ page }, testInfo) => {
  await seed(page, { '2026-11-14': { morning: run(4, 1) }, '2026-11-15': { shinAm: { score: 1 } } });
  await page.goto('./?date=2026-11-17');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Tuesday');
  await expect(page.locator('.meta')).toContainText('Week 2 of 8');
  await expect(page.locator('.meta')).toContainText('Track A');
  await expect(page.locator('.meta')).toContainText('44 days to go');
  await expect(page.locator('#morning-title')).toHaveText('Easy 2.5');
  await expect(page.locator('.session-meta').first()).toContainText('Done by 7:30');
  await expect(page.locator('.cues li')).toHaveText(['Shorter, quicker steps', 'Land with your foot under you, not out in front with toes yanked up', 'Quiet feet']);
  await expect(page.locator('.stop-rule')).toContainText('shin hits 3/10 → walk home');
  await expect(page.getByRole('button', { name: 'Log run' })).toBeVisible();
  await expect(page.getByText('Off.')).toBeVisible();
  await expect(page.locator('.strip-text')).toHaveText('Saturday: first 5-miler. 4 days.');
  await expect(page.locator('.route-caption')).toContainText('4 mi');
  // The answer must be on screen without scrolling.
  for (const sel of ['#morning-title', '.done-by', 'button:has-text("Log run")']) {
    const box = await page.locator(sel).first().boundingBox();
    expect(box.y + box.height, `${sel} above the tab bar`).toBeLessThan(844 - 60);
  }
  await shot(page, testInfo, 'today-run-day');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await shot(page, testInfo, 'today-run-day-bottom');
});

test('strength day: Monday legs with last-time weights and tap-to-expand', async ({ page }, testInfo) => {
  await seed(page, {
    '2026-11-16': { morning: { status: 'done', strength: { checked: [1, 2, 3], lifts: { deadlift: { weight: 185, reps: 5 }, splitSquat: { weight: 30, reps: 6 } } } } },
  });
  await page.goto('./?date=2026-11-23');
  await expect(page.locator('#morning-title')).toHaveText('Legs + Armor');
  await expect(page.locator('.session-meta').first()).toContainText('55–60 min');
  await expect(page.locator('.session-meta').first()).toContainText('Done by 11:15');
  const deadlift = page.locator('details.ex', { hasText: 'Trap-bar deadlift' });
  await expect(deadlift).toContainText('3 × 5');
  await expect(deadlift).toContainText('Last: 185 × 5');
  await expect(deadlift.locator('p')).toBeHidden();
  await deadlift.locator('summary').click();
  await expect(deadlift.locator('p')).toContainText('2–3 min rest');
  await expect(page.locator('#evening-title')).toHaveText('Climb — Hard');
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'today-strength-day');
  await page.evaluate(() => window.scrollTo(0, 500));
  await shot(page, testInfo, 'today-strength-day-scrolled');
});

test('week 2 leg day shows 2 sets', async ({ page }) => {
  await page.goto('./?date=2026-11-16');
  await expect(page.locator('details.ex', { hasText: 'Trap-bar deadlift' })).toContainText('2 × 5');
});

test('morning after a run: shin check comes first and updates status at once', async ({ page }, testInfo) => {
  await seed(page, {
    '2026-11-14': { morning: run(4, 1) },
    '2026-11-15': { shinAm: { score: 1 } },
    '2026-11-17': { morning: run(2.5, 1) },
  });
  await page.goto('./?date=2026-11-18');
  const ask = page.getByRole('group', { name: 'Shin this morning, 0 to 10' });
  await expect(ask).toBeVisible();
  await expect(ask.getByRole('button')).toHaveCount(11);
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'today-morning-after-ask');
  await ask.getByRole('button', { name: 'Shin 1 out of 10' }).click();
  await expect(ask).toBeHidden();
  await expect(page.locator('.banner')).toHaveCount(0); // 1 after 1 is green
  await shot(page, testInfo, 'today-morning-after-green');
});

test('morning after a run: a worse score turns yellow with the plan\'s exact action', async ({ page }, testInfo) => {
  await seed(page, {
    '2026-11-14': { morning: run(4, 1) },
    '2026-11-15': { shinAm: { score: 1 } },
    '2026-11-17': { morning: run(2.5, 1) },
  });
  await page.goto('./?date=2026-11-18');
  await page.getByRole('button', { name: 'Shin 2 out of 10' }).click();
  const banner = page.locator('.banner');
  await expect(banner).toContainText('Shin: Yellow');
  await expect(banner).toContainText('Shin was worse the morning after your last run.');
  await expect(banner).toContainText('Stop the run when it reaches 3 and walk home.');
  await expect(banner).toContainText('No running until Thu, Nov 19 at the earliest');
  await expect(banner).toContainText('Not medical advice.');
  await expect(banner.getByRole('button', { name: 'Switch to Track B' })).toBeVisible();
  await shot(page, testInfo, 'today-yellow');
  // One tap from the banner to Safety.
  await banner.getByRole('link', { name: /Shin rules/ }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Safety');
});

test('yellow: the next run day is cross-training, and running anyway takes two taps', async ({ page }, testInfo) => {
  await seed(page, { '2026-11-17': { morning: run(2.5, 3) } });
  await page.goto('./?date=2026-11-19');
  await expect(page.locator('#morning-title')).toHaveText('Cross-train 30 min');
  await expect(page.getByText('No running today.')).toBeVisible();
  await shot(page, testInfo, 'today-yellow-crosstrain');
  const anyway = page.getByRole('button', { name: 'Run anyway' });
  await anyway.click();
  await expect(page.locator('#morning-title')).toHaveText('Cross-train 30 min'); // one tap does nothing
  await page.getByRole('button', { name: /Tap again to confirm/ }).click();
  await expect(page.locator('#morning-title')).toHaveText('Easy 2.5');
  await expect(page.getByText('You chose to run despite the shin rule. That is recorded.')).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('ten-mile-tracker')));
  expect(state.overrides).toHaveLength(1);
  expect(state.overrides[0]).toMatchObject({ date: '2026-11-19', kind: 'run-anyway', reason: 'yellow' });
});

test('red: running locked, doctor list shown, unlock needs 5 pain-free days and a second tap', async ({ page }, testInfo) => {
  const log = { '2026-11-17': { morning: run(2.5, 6) } };
  for (const d of ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21']) log[d] = { painFree: true };
  await seed(page, log);
  await page.goto('./?date=2026-11-22');
  const banner = page.locator('.banner');
  await expect(banner).toContainText('Shin: Red');
  await expect(banner).toContainText('Running is locked.');
  await expect(banner).toContainText('4 of 5');
  await expect(banner).toContainText('No running. Cross-train only if it\'s pain-free. Book a sports-medicine appointment.');
  await expect(banner.getByRole('button', { name: /cleared/ })).toHaveCount(0);
  await banner.getByText('When to see a doctor', { exact: true }).click();
  await expect(banner).toContainText('Compartment-syndrome pattern');
  await shot(page, testInfo, 'today-red');
  await banner.getByRole('button', { name: 'Today was pain-free' }).click();
  await expect(banner).toContainText('5 of 5');
  await banner.getByRole('button', { name: 'I am cleared to restart' }).click();
  await expect(page.locator('.banner')).toContainText('Shin: Red'); // first tap only arms
  await page.getByRole('button', { name: 'Tap again to confirm you are cleared to run' }).click();
  await expect(page.locator('.banner')).toContainText('Cleared to restart');
  await expect(page.locator('.banner')).toContainText('less than half your previous weekly mileage');
});

test('long run day with the ice switch', async ({ page }, testInfo) => {
  await page.goto('./?date=2026-12-05');
  await expect(page.locator('#morning-title')).toHaveText('Long run 7');
  await expect(page.locator('.day-note')).toContainText('first run over an hour');
  await page.getByRole('button', { name: 'Icy or too cold? Use treadmill instead' }).click();
  await expect(page.locator('.fallback-note')).toContainText('Treadmill, 1% incline, same distance, same easy effort.');
  await shot(page, testInfo, 'today-long-run-treadmill');
  await page.getByRole('button', { name: 'Back to running outside' }).click();
  await expect(page.locator('.fallback-note')).toHaveCount(0);
});

test('before the plan, after the plan, walk day and attempt day are all sensible', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto('./?date=2026-11-11');
  await expect(page.getByText('The plan starts tomorrow')).toBeVisible();
  await expect(page.locator('.session-title')).toHaveText('Thursday: Easy 2 + Armor');
  await shot(page, testInfo, 'today-before-plan');

  await page.goto('./?date=2027-01-02');
  await expect(page.getByText('The plan is done')).toBeVisible();
  await shot(page, testInfo, 'today-after-plan');

  await page.goto('./?date=2026-12-25');
  await expect(page.locator('#morning-title')).toHaveText('Easy walk only');
  await expect(page.locator('.day-note')).toContainText('Christmas');

  await page.goto('./?date=2026-12-31');
  await expect(page.locator('#morning-title')).toHaveText('10 miles nonstop');
  await expect(page.locator('.meta')).toContainText('Attempt day');
  await shot(page, testInfo, 'today-attempt-day');
  expect(errors).toEqual([]);
});

test('week screen: rows, miles, navigation, partial weeks, tap-through', async ({ page }, testInfo) => {
  await seed(page, {
    '2026-11-17': { morning: run(2.5, 1) },
    '2026-11-18': { morning: { status: 'skipped', reason: 'Exams' }, evening: { status: 'done', climb: { grade: 'medium' } } },
  });
  await page.goto('./?date=2026-11-19#/week');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 2');
  await expect(page.locator('.week-miles')).toHaveText('2.5 of 10 mi run');
  const rows = page.locator('.wk-list > li');
  await expect(rows).toHaveCount(7);
  await expect(rows.nth(1)).toContainText('Easy 2.5');
  await expect(rows.nth(1)).toContainText('Done');
  await expect(rows.nth(2)).toContainText('Skipped');
  await expect(rows.nth(3)).toContainText('Today');
  await expect(rows.nth(5)).toContainText('Long run 5');
  await expect(rows.nth(5)).toContainText('Upcoming');
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'week-2');

  await page.getByRole('button', { name: 'Previous week' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 1');
  await expect(page.locator('.wk-list > li').nth(0)).toContainText('Before the plan starts');
  await expect(page.getByRole('button', { name: 'Previous week' })).toBeDisabled();
  await shot(page, testInfo, 'week-1');
  for (let i = 0; i < 7; i++) await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 8');
  await expect(page.locator('.wk-list > li').nth(3)).toContainText('10 miles nonstop');
  await expect(page.locator('.wk-list > li').nth(4)).toContainText('After the attempt');
  await expect(page.getByRole('button', { name: 'Next week' })).toBeDisabled();
  await shot(page, testInfo, 'week-8');

  await page.locator('.wk-list > li').nth(3).getByRole('link').click();
  await expect(page.locator('#morning-title')).toHaveText('10 miles nonstop');
  await expect(page.getByRole('link', { name: '‹ Week' })).toBeVisible();
});

test('library lists every session and exercise, plus the fallback table and attempt day', async ({ page }, testInfo) => {
  await page.goto('./?date=2026-11-17#/library');
  await expect(page.locator('.lib-name')).toHaveText([
    'Easy run', 'Long run', 'Legs + Armor', 'Armor mini-circuit', 'Lock & Pull', 'Climb — Hard',
    'Climb — Medium', 'Climb — Easy', 'Active recovery', 'Low-impact aerobic', 'Easy walk only',
    'Ice and cold fallback', 'Attempt day', 'Weekly template',
  ]);
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'library');
  const legs = page.locator('#lib-STR-A');
  await legs.locator('> summary').click();
  await expect(legs.locator('.ex-name')).toHaveCount(9);
  await expect(legs).toContainText('Backward sled drag');
  await legs.locator('details.ex', { hasText: 'Tibialis raise' }).locator('summary').click();
  await expect(legs).toContainText('Keep the sore spot ≤2/10');
  await shot(page, testInfo, 'library-legs-open');
  await page.locator('details.lib', { hasText: 'Ice and cold fallback' }).locator('> summary').click();
  await expect(page.getByText('Treadmill, 1% incline, same distance, same easy effort.').first()).toBeVisible();
});

test('safety screen has the rules, both self-checks, the full doctor list and the disclaimer', async ({ page }, testInfo) => {
  await page.goto('./?date=2026-11-17#/more/safety');
  await expect(page.getByText('Not medical advice.').first()).toBeVisible();
  await expect(page.locator('.shin-chip')).toHaveText(['Green', 'Yellow', 'Red']);
  await expect(page.getByText('Press test.')).toBeVisible();
  await expect(page.getByText('Hop test.')).toBeVisible();
  await expect(page.locator('.doctor-list > li')).toHaveCount(7);
  await expect(page.locator('.doctor-list')).toContainText('Go to the ER');
  await shot(page, testInfo, 'safety');
  await page.evaluate(() => window.scrollTo(0, 900));
  await shot(page, testInfo, 'safety-scrolled');
});

test('more, history, settings and about', async ({ page }, testInfo) => {
  await seed(page, {
    '2026-11-14': { morning: run(4, 1) },
    '2026-11-15': { shinAm: { score: 1 } },
    '2026-11-16': { morning: { status: 'done', strength: { checked: [1], lifts: { deadlift: { weight: 185, reps: 5 } } } }, evening: { status: 'done', climb: { grade: 'hard', ache: 1 } } },
    '2026-11-17': { morning: { status: 'skipped', reason: 'Exams' } },
  });
  await page.goto('./?date=2026-11-18#/more');
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'more');
  await page.getByRole('link', { name: /History/ }).click();
  await expect(page.locator('.hist-date')).toHaveText(['Tue, Nov 17', 'Mon, Nov 16', 'Sun, Nov 15', 'Sat, Nov 14']);
  await expect(page.locator('.hist-list')).toContainText('Skipped — exams');
  await expect(page.locator('.hist-list')).toContainText('4 mi in 44:00 · 11:00/mi · shin 1');
  await shot(page, testInfo, 'history');
  await page.goto('./?date=2026-11-18#/more/settings');
  await expect(page.getByLabel('Weather location')).toHaveValue('east-lansing');
  await expect(page.getByLabel('Verse of the day')).toBeChecked();
  expect(await smallTargets(page)).toEqual([]);
  await shot(page, testInfo, 'settings');
  await page.goto('./?date=2026-11-18#/more/about');
  await expect(page.locator('.link-list a')).toHaveCount(19);
  await shot(page, testInfo, 'about');
});
