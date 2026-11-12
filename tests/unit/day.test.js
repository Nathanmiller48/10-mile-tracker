import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  dayModel, runConversion, exercisesFor, paceSeconds, runMinutes, shinAction, shortLabel,
  lastLift, fmtTime, fmtPace, entrySummary, STR_SETS_SENTENCE, DEFAULT_PACE,
} from '../../js/day.js';
import { reachedMilestones, runTotals, nextMilestone } from '../../js/milestones.js';
import { defaultState, setDaySlot } from '../../js/storage.js';
import { planDay } from '../../js/dates.js';
import { PLAN_MD } from '../../scripts/build-plan.mjs';

const planMd = await readFile(PLAN_MD, 'utf8');

const run = (miles, shin, more = {}) => ({
  status: 'done',
  run: { miles, seconds: miles * 660, nonstop: true, surface: 'road', effort: 4, shin, ...more },
});
function stateWith(entries, extra = {}) {
  let s = defaultState();
  for (const [date, slot, value] of entries) s = setDaySlot(s, date, slot, value);
  return { ...s, ...extra };
}

// ---- Session cards ----

test('a Tuesday easy run: title, done-by, minutes', () => {
  const m = dayModel(defaultState(), '2026-11-17', '2026-11-17').morning;
  assert.equal(m.kind, 'run');
  assert.equal(m.title, 'Easy 2.5');
  assert.equal(m.doneBy, '7:30');
  assert.equal(m.sub, 'Full sentences the whole way.');
  assert.equal(m.minutesText, 'About 40 min'); // 2.5 mi at 11:00 ≈ 30, plus 5 + 5 walking
  assert.equal(m.converted, null);
});

test('Thursday adds the Armor circuit and has no done-by time', () => {
  const m = dayModel(defaultState(), '2026-11-19', '2026-11-19').morning;
  assert.equal(m.hasArmor, true);
  assert.equal(m.doneBy, null);
  assert.match(m.sub, /Then the Armor circuit\.$/);
  assert.equal(m.minutesText, 'About 55 min');
});

test('long run, attempt day, strength, lite, recovery and walk days', () => {
  const title = (d) => dayModel(defaultState(), d, d).morning.title;
  assert.equal(title('2026-12-05'), 'Long run 7');
  assert.equal(title('2026-12-31'), '10 miles nonstop');
  assert.equal(title('2026-11-16'), 'Legs + Armor');
  assert.equal(title('2026-12-07'), 'Legs + Armor (lite)');
  assert.equal(title('2026-11-13'), 'Lock & Pull');
  assert.equal(title('2026-11-18'), 'Active recovery');
  assert.equal(title('2026-11-15'), 'Low-impact aerobic');
  assert.equal(title('2026-12-25'), 'Easy walk only');
  assert.equal(dayModel(defaultState(), '2026-11-16', '2026-11-16').morning.doneBy, '11:15');
  assert.equal(dayModel(defaultState(), '2026-11-18', '2026-11-18').morning.doneBy, '7:00');
  assert.equal(dayModel(defaultState(), '2026-11-16', '2026-11-16').morning.minutesText, '55–60 min');
  assert.equal(dayModel(defaultState(), '2026-12-07', '2026-12-07').morning.minutesText, '35 min');
  assert.equal(dayModel(defaultState(), '2026-11-11', '2026-11-11'), null);
});

test('evening: climb with optional flag, or nothing', () => {
  assert.equal(dayModel(defaultState(), '2026-11-16', '2026-11-16').evening.id, 'CLIMB-H');
  assert.equal(dayModel(defaultState(), '2026-12-07', '2026-12-07').evening.optional, true);
  assert.equal(dayModel(defaultState(), '2026-11-17', '2026-11-17').evening, null);
});

test('leg-day sets follow the sentence printed in PLAN.md', () => {
  assert.ok(planMd.includes(STR_SETS_SENTENCE), 'PLAN.md changed its leg-day volume sentence');
  const dose = (date, n) => exercisesFor('STR-A', planDay(date)).find((e) => e.n === n).dose;
  assert.equal(dose('2026-11-16', 1), '2 × 5'); // week 2
  assert.equal(dose('2026-11-16', 2), '2 × 6/side');
  assert.equal(dose('2026-11-16', 5), '2 × 15–25');
  assert.equal(dose('2026-11-16', 6), '2 × 12/side each'); // lift 6 is unchanged
  assert.equal(dose('2026-11-16', 7), '4 × 20–30 m (or 5 min)');
  assert.equal(dose('2026-11-23', 1), '3 × 5'); // week 3: "3 sets from here"
  assert.equal(dose('2026-11-30', 1), '3 × 5');
  assert.equal(dose('2026-12-07', 1), '2 × 5'); // week 5 lite
  assert.equal(dose('2026-12-21', 1), '2 × 5'); // week 7
  // Weeks 6 and 8 have no leg day at all.
  for (const d of ['2026-12-14', '2026-12-28']) assert.ok(!planDay(d).morning.sessions.includes('STR-A'));
});

test('estimated minutes use his own pace once he has logged a timed run', () => {
  assert.equal(paceSeconds({}, '2026-11-17'), DEFAULT_PACE);
  const s = stateWith([['2026-11-14', 'morning', run(4, 1, { seconds: 4 * 600 })]]);
  assert.equal(paceSeconds(s.log, '2026-11-17'), 600);
  assert.equal(runMinutes(3, 600), 30);
  assert.equal(dayModel(s, '2026-11-17', '2026-11-17').morning.minutesText, 'About 35 min');
});

// ---- Shin consequences (PLAN.md section 7) ----

test('yellow: the next scheduled run becomes cross-training of the same minutes', () => {
  const s = stateWith([['2026-11-21', 'morning', run(5, 3)]]); // Saturday long run hits 3
  const today = '2026-11-22';
  assert.equal(runConversion(s, '2026-11-24', today), 'yellow'); // Tuesday
  assert.equal(runConversion(s, '2026-11-26', today), null); // Thursday is a run again
  const m = dayModel(s, '2026-11-24', today).morning;
  assert.equal(m.title, 'Cross-train 35 min'); // 3 mi at his 11:00 pace = 33, to the nearest 5
  assert.match(m.sub, /No running today/);
});

test('yellow from a Thursday run converts Saturday (inside 72 hours and next scheduled)', () => {
  const s = stateWith([['2026-11-19', 'morning', run(2.5, 4)]]);
  assert.equal(runConversion(s, '2026-11-21', '2026-11-20'), 'yellow');
  assert.equal(runConversion(s, '2026-11-24', '2026-11-20'), null);
});

test('green: nothing is converted', () => {
  const s = stateWith([['2026-11-21', 'morning', run(5, 2)]]);
  assert.equal(runConversion(s, '2026-11-24', '2026-11-22'), null);
});

test('red: every run becomes cross-training while locked, and runs again after release', () => {
  let s = stateWith([['2026-11-21', 'morning', run(5, 6)]]);
  for (const d of ['2026-11-24', '2026-11-26', '2026-11-28', '2026-12-05']) {
    assert.equal(runConversion(s, d, '2026-11-22'), 'red', d);
  }
  for (const d of ['2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26']) {
    s = setDaySlot(s, d, 'painFree', true);
  }
  assert.equal(runConversion(s, '2026-11-28', '2026-11-27'), 'red', 'not yet confirmed');
  s = { ...s, clearedOn: '2026-11-27' };
  assert.equal(runConversion(s, '2026-11-28', '2026-11-27'), null);
});

test('override: a recorded "run anyway" cancels the conversion for that day only', () => {
  const s = stateWith([['2026-11-21', 'morning', run(5, 6)]], {
    overrides: [{ date: '2026-11-24', kind: 'run-anyway', reason: 'red', at: '2026-11-24T06:00:00Z' }],
  });
  assert.equal(runConversion(s, '2026-11-24', '2026-11-24'), null);
  assert.equal(runConversion(s, '2026-11-26', '2026-11-24'), 'red');
  assert.equal(dayModel(s, '2026-11-24', '2026-11-24').morning.title, 'Easy 3');
});

test('banner action text is the exact wording from the PLAN.md table', () => {
  assert.ok(planMd.includes(shinAction('yellow')));
  assert.ok(planMd.includes(shinAction('red')));
  assert.match(shinAction('yellow'), /^Stop the run when it reaches 3 and walk home/);
  assert.match(shinAction('red'), /^No running\./);
});

test('the ice/cold switch is stored per day and ignored when the run is converted', () => {
  let s = stateWith([['2026-11-24', 'fallback', true]]);
  assert.equal(dayModel(s, '2026-11-24', '2026-11-24').morning.fallback, true);
  s = setDaySlot(s, '2026-11-21', 'morning', run(5, 3));
  assert.equal(dayModel(s, '2026-11-24', '2026-11-24').morning.fallback, false);
});

// ---- Small helpers ----

test('pace and time formatting', () => {
  assert.equal(fmtTime(1980), '33:00');
  assert.equal(fmtTime(6305), '1:45:05');
  assert.equal(fmtPace(3, 1980), '11:00');
  assert.equal(fmtPace(6.2, 4092), '11:00');
  assert.equal(fmtPace(0, 600), null);
  assert.equal(fmtPace(3, 0), null);
});

test('entry summaries are plain and never shame a skip', () => {
  assert.equal(entrySummary(run(3, 1)), '3 mi in 33:00 · 11:00/mi · shin 1');
  assert.equal(
    entrySummary(run(3, 2, { surface: 'treadmill', nonstop: false })),
    '3 mi in 33:00 · 11:00/mi · treadmill · walk breaks · shin 2',
  );
  assert.equal(entrySummary({ status: 'skipped', reason: 'Exams' }), 'Skipped — exams');
  assert.equal(entrySummary({ status: 'skipped' }), 'Skipped');
  assert.equal(entrySummary({ status: 'done' }), 'Done');
  assert.equal(entrySummary({ status: 'done', climb: { grade: 'medium', ache: 2 } }), 'Done · medium · ache 2');
});

test('short labels and last-time lifts', () => {
  assert.equal(shortLabel(planDay('2026-11-19')), 'Easy 2.5 + Armor');
  assert.equal(shortLabel(planDay('2026-12-07')), 'Legs + Armor (lite)');
  assert.equal(shortLabel(planDay('2026-12-31')), '10 miles nonstop');
  const s = stateWith([
    ['2026-11-16', 'morning', { status: 'done', strength: { lifts: { deadlift: { weight: 185, reps: 5 } } } }],
    ['2026-11-23', 'morning', { status: 'done', strength: { lifts: { deadlift: { weight: 195, reps: 5 } } } }],
  ]);
  assert.deepEqual(lastLift(s.log, 'deadlift', '2026-11-23'), { weight: 185, reps: 5, date: '2026-11-16' });
  assert.equal(lastLift(s.log, 'deadlift', '2026-11-30').weight, 195);
  assert.equal(lastLift(s.log, 'pullup', '2026-11-30'), null);
});

// ---- Milestones and the route ----

test('longest nonstop: treadmill counts, walk breaks and cross-training do not', () => {
  const s = stateWith([
    ['2026-11-14', 'morning', run(4, 1)],
    ['2026-11-21', 'morning', run(5, 1, { surface: 'treadmill' })],
    ['2026-11-28', 'morning', run(6.2, 1, { nonstop: false })],
    ['2026-12-05', 'morning', run(0, 0, { surface: 'cross-train', seconds: 4200 })],
  ]);
  const t = runTotals(s.log, '2026-12-06');
  assert.equal(t.longestNonstop, 5);
  assert.equal(t.totalMiles, 15.2); // walk-break miles still count toward the total
  const reached = reachedMilestones(s, '2026-12-06');
  assert.equal(reached.m4, '2026-11-14');
  assert.equal(reached.m5, '2026-11-21');
  assert.equal(reached.m10k, undefined);
  assert.equal(runTotals(s.log, '2026-11-20').longestNonstop, 4, 'only what has happened by that day');
});

test('weekly and total-mile milestones come from the log', () => {
  const s = stateWith([
    ['2026-11-17', 'morning', run(2.5, 1)],
    ['2026-11-19', 'morning', run(2.5, 1)],
    ['2026-11-21', 'morning', run(5, 1)],
  ]);
  const reached = reachedMilestones(s, '2026-11-22');
  assert.equal(reached.week10, '2026-11-21');
  assert.equal(reached.total25, undefined);
});

test('benchmark milestones need both sides', () => {
  const entry = (b) => ({ status: 'done', benchmarks: b });
  let s = stateWith([['2026-11-16', 'morning', entry({ calfLeft: 25, calfRight: 22 })]]);
  assert.equal(reachedMilestones(s, '2026-12-22').calf25, undefined);
  s = setDaySlot(s, '2026-12-21', 'morning', entry({ calfLeft: 26, calfRight: 25 }));
  assert.equal(reachedMilestones(s, '2026-12-22').calf25, '2026-12-21');
});

test('next milestone strip reads like the spec', () => {
  const s = stateWith([['2026-11-14', 'morning', run(4, 1)]]);
  assert.equal(nextMilestone(s, '2026-11-19').text, 'Saturday: first 5-miler. 2 days.');
  assert.equal(nextMilestone({ log: {} }, '2026-11-12').text, 'Saturday: first 4-miler. 2 days.');
  assert.equal(nextMilestone({ log: {} }, '2026-11-13').text, 'Saturday: first 4-miler. 1 day.');
  assert.equal(nextMilestone({ log: {} }, '2026-11-14').text, 'Today: first 4-miler.');
  assert.equal(nextMilestone({ log: {} }, '2026-12-25').text, 'Thursday: 10 miles nonstop. 6 days.');
  assert.match(nextMilestone({ log: {} }, '2027-01-05').text, /^Still ahead: first 4-miler\.$/);
});
