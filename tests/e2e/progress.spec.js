// Progress screen, milestones, gates and the Track B switch.
import { test, expect, seed, run, shot, stored, sampleLog, watchErrors, smallTargets } from './helpers.js';

const sheet = (page) => page.locator('#sheet');

test('progress with a seeded log: route, milestones, charts, shin trend, benchmarks, gates', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await seed(page, sampleLog());
  await page.goto('./?date=2026-12-06#/progress');
  await expect(page.locator('.hero-num')).toHaveText('7 of 10 mi');
  // Route stops at each milestone distance.
  await expect(page.locator('.route-hero .route-label')).toHaveText(['4', '5', '6.2', '7', '8.5', '10']);
  await expect(page.locator('.route-hero .stop.is-done')).toHaveCount(4);
  // Milestones: reached ones dated, the next one tagged.
  await expect(page.locator('#ms-title')).toContainText('7 of 13 reached');
  const ms = page.locator('.ms');
  await expect(ms).toHaveCount(13);
  await expect(ms.filter({ hasText: 'First 4-miler' })).toContainText('Reached Nov 14');
  await expect(ms.filter({ hasText: 'First 10K' })).toContainText('Reached Nov 28');
  await expect(ms.filter({ hasText: '25 total miles' })).toContainText('Reached Nov 28');
  await expect(ms.filter({ hasText: 'Four straight green weeks' })).toContainText('Reached Dec 6');
  await expect(page.locator('.ms.is-next')).toContainText('50 total miles');
  await expect(page.locator('.ms.is-next')).toContainText('Next');
  // Charts
  await expect(page.locator('.bar-plan')).toHaveCount(8);
  await expect(page.locator('.bar-actual')).toHaveCount(4);
  await expect(page.locator('.big-line')).toContainText('41.7 run');
  await expect(page.locator('.big-line')).toContainText('plan has 41.7 by today, 93.2 in all');
  await expect(page.locator('.dot-during')).toHaveCount(11);
  await expect(page.locator('.dot-morning')).toHaveCount(11);
  // Benchmarks first → latest
  const bm = page.locator('.bm');
  await expect(bm.filter({ hasText: 'Talk-test 2-mile' })).toContainText('23:15 → 22:10');
  await expect(bm.filter({ hasText: 'Single-leg calf raise' })).toContainText('18 L / 16 R');
  await expect(bm.filter({ hasText: 'Weighted pull-up' })).toContainText('+25 lb');
  await expect(bm.filter({ hasText: 'Longest nonstop run' })).toContainText('7 mi');
  // Gates
  await expect(page.locator('.gate-week')).toHaveCount(4);
  await expect(page.locator('.gate-overall')).toHaveText(['All passed', 'All passed', 'All passed', 'All passed']);
  expect(await smallTargets(page)).toEqual([]);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  expect(errors).toEqual([]);

  await shot(page, testInfo, 'progress-1-top');
  for (const [i, y] of [[2, 700], [3, 1400], [4, 2100], [5, 2800]]) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await shot(page, testInfo, `progress-${i}`);
  }
});

test('progress with nothing logged is calm, not broken', async ({ page }, testInfo) => {
  const errors = watchErrors(page);
  await page.goto('./?date=2026-11-12#/progress');
  await expect(page.locator('.hero-num')).toHaveText('0 of 10 mi');
  await expect(page.locator('#ms-title')).toContainText('0 of 13 reached');
  await expect(page.locator('.ms.is-next')).toContainText('First 4-miler');
  await expect(page.getByText('Your shin score during each run and the next morning will plot here.')).toBeVisible();
  expect(errors).toEqual([]);
  await shot(page, testInfo, 'progress-empty');
});

test('a new longest run unlocks its milestone with one calm moment', async ({ page }, testInfo) => {
  await seed(page, { '2026-11-14': { morning: run(4, 1) } });
  await page.goto('./?date=2026-11-21');
  await page.getByRole('button', { name: 'Log run' }).click();
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '1', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  const unlock = page.locator('.unlock');
  await expect(unlock).toContainText('Milestone reached');
  await expect(unlock.locator('.unlock-name')).toHaveText(['First 5-miler']);
  await expect(page.locator('body')).not.toContainText('!');
  await shot(page, testInfo, 'today-milestone-unlocked');
  // It shows once: gone after moving on.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Week' }).click();
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Today' }).click();
  await expect(page.locator('.unlock')).toHaveCount(0);
});

test('a walk-break long run does not unlock the distance milestone', async ({ page }) => {
  await seed(page, { '2026-11-14': { morning: run(4, 1) } });
  await page.goto('./?date=2026-11-21');
  await page.getByRole('button', { name: 'Log run' }).click();
  await sheet(page).getByRole('button', { name: 'Took walk breaks' }).click();
  await sheet(page).getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '1', exact: true }).click();
  await sheet(page).getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.unlock')).toHaveCount(0);
});

test('failed gate: says which one, offers Track B, one tap switches, Settings switches back', async ({ page }, testInfo) => {
  // Week 2: the Saturday 5-miler was done with walk breaks, shin fine.
  await seed(page, {
    '2026-11-14': { morning: run(4, 1) }, '2026-11-15': { shinAm: { score: 1 } },
    '2026-11-17': { morning: run(2.5, 1) }, '2026-11-18': { shinAm: { score: 1 } },
    '2026-11-19': { morning: run(2.5, 1) }, '2026-11-20': { shinAm: { score: 1 } },
    '2026-11-21': { morning: run(5, 1, { nonstop: false }) }, '2026-11-22': { shinAm: { score: 1 } },
  });
  await page.goto('./?date=2026-11-22');
  const card = page.locator('.banner', { hasText: 'gate not passed' });
  await expect(card).toContainText('Week 2 gate not passed');
  await expect(card).toContainText('Long run completed nonstop at the planned distance');
  await expect(page.locator('.meta')).toContainText('39 days to go');
  await shot(page, testInfo, 'today-gate-failed');
  // He may also decline: the card goes away and does not come back for that week.
  await card.getByRole('button', { name: 'Stay on Track A for now' }).click();
  await expect(page.locator('.banner', { hasText: 'gate not passed' })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('.banner', { hasText: 'gate not passed' })).toHaveCount(0);
  await page.goto('./?date=2026-11-22#/progress');
  await expect(page.locator('.gate-overall.is-fail')).toHaveText('Not passed');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('ten-mile-tracker')); delete s.gateAnswered; localStorage.setItem('ten-mile-tracker', JSON.stringify(s)); });
  await page.goto('./?date=2026-11-22');
  await card.getByRole('button', { name: 'Switch to Track B' }).click();
  await expect(page.locator('.meta')).toContainText('Track B');
  await expect(page.locator('.meta')).toContainText('62 days to go'); // Jan 23
  await expect(page.locator('.banner', { hasText: 'gate not passed' })).toHaveCount(0);
  const s = await stored(page);
  expect(s.trackB).toEqual({ trigger: '2026-11-22', lastGreen: 4, red: false, from: '2026-11-22' });

  // Week shows the Track B schedule and now runs past December.
  await page.goto('./?date=2026-11-24#/week');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 3 of 11');
  await expect(page.locator('.wk-list > li').nth(5)).toContainText('Long run 4');
  await expect(page.locator('.wk-list > li').nth(3)).toContainText('Easy 2 + Armor');
  await shot(page, testInfo, 'week-track-b');
  for (let i = 0; i < 8; i++) await page.getByRole('button', { name: 'Next week' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week 11');
  await expect(page.locator('.wk-list > li').nth(5)).toContainText('10 miles nonstop');
  await expect(page.locator('.wk-list > li').nth(5)).toContainText('23');

  // Progress follows the active track.
  await page.goto('./?date=2026-11-24#/progress');
  await expect(page.locator('#gt-title')).toContainText('Track B');
  await expect(page.getByText('The 10-miler is planned for Sat, Jan 23')).toBeVisible();
  await expect(page.locator('.bar-plan')).toHaveCount(11);
  await expect(page.locator('.ms').filter({ hasText: '10 miles nonstop' })).toContainText('Planned Jan 23');
  await page.evaluate(() => document.querySelector('#lr-title').scrollIntoView());
  await shot(page, testInfo, 'progress-track-b');

  // Reversible in Settings.
  await page.goto('./?date=2026-11-24#/more/settings');
  await page.getByLabel('Track').selectOption('A');
  expect((await stored(page)).trackB).toBeUndefined();
  await page.goto('./?date=2026-11-24');
  await expect(page.locator('.meta')).toContainText('Track A');
  await expect(page.locator('.meta')).toContainText('37 days to go');
});

test('yellow then Track B: the switch uses the last green long run', async ({ page }) => {
  await seed(page, {
    '2026-11-14': { morning: run(4, 1) }, '2026-11-15': { shinAm: { score: 1 } },
    '2026-11-21': { morning: run(5, 3) },
  });
  await page.goto('./?date=2026-11-21');
  await page.locator('.banner').getByRole('button', { name: 'Switch to Track B' }).click();
  expect((await stored(page)).trackB).toMatchObject({ trigger: '2026-11-21', lastGreen: 4, red: false });
  await page.goto('./?date=2026-11-21#/day/2026-11-28');
  await expect(page.locator('#morning-title')).toHaveText('Long run 4');
  await expect(page.locator('.day-note')).toContainText('repeat your last green distance');
  await page.goto('./?date=2026-11-21#/day/2026-12-14');
  await expect(page.locator('#morning-title')).toHaveText('Easy walk only');
  await expect(page.locator('.day-note')).toContainText('MKT 313 final');
});

test('Track B past the hard cap shows the plan\'s own warning', async ({ page }) => {
  const log = { '2026-11-14': { morning: run(4, 1) }, '2026-11-21': { morning: run(5, 6) } };
  await seed(page, log, {
    settings: { location: 'east-lansing', theme: 'system', verse: true, track: 'B' },
    trackB: { trigger: '2026-11-21', lastGreen: 4, red: true },
  });
  await page.goto('./?date=2026-11-22#/progress');
  await expect(page.getByText('if the 10-miler isn\'t done by Sat Jan 30, stop chasing the date')).toBeVisible();
});
