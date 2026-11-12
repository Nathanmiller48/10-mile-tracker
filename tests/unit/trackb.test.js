// Track B must reproduce the worked example in PLAN.md section 8 exactly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildTrackB, longRunSequence, startDistance, weekdayMiles, saturdayAfter, HARD_CAP } from '../../js/trackb.js';
import { getPlan, trackBParams, plannedMilestones, planPosition } from '../../js/plan.js';
import { weekGates, allGates, failedGate, greenWeeksReached } from '../../js/gates.js';
import { defaultState, setDaySlot } from '../../js/storage.js';
import { MILESTONES } from '../../js/data/content.js';
import { PLAN_MD } from '../../scripts/build-plan.mjs';

const planMd = (await readFile(PLAN_MD, 'utf8')).replace(/\r\n/g, '\n');
const MONTH = { Nov: '2026-11', Dec: '2026-12', Jan: '2027-01' };

/** The worked-example table as printed in PLAN.md: [{ date, miles }]. */
function printedExample() {
  const section = planMd.slice(planMd.indexOf('**Worked example'), planMd.indexOf('On this example'));
  return [...section.matchAll(/^\| \**(Nov|Dec|Jan) (\d+)\** \| \**([\d.]+)\** \|/gm)].map((m) => ({
    date: `${MONTH[m[1]]}-${m[2].padStart(2, '0')}`,
    miles: Number(m[3]),
  }));
}

const run = (miles, shin, more = {}) => ({
  status: 'done',
  run: { miles, seconds: miles * 660, nonstop: true, surface: 'road', shin, ...more },
});
function stateWith(entries, extra = {}) {
  let s = defaultState();
  for (const [date, slot, value] of entries) s = setDaySlot(s, date, slot, value);
  return { ...s, ...extra };
}

test('the worked example: yellow on Nov 21 lands the 10 on Jan 23', () => {
  const printed = printedExample();
  assert.equal(printed.length, 9);
  assert.deepEqual(printed.at(-1), { date: '2027-01-23', miles: 10 });
  const b = buildTrackB({ trigger: '2026-11-21', lastGreen: 4, red: false });
  assert.deepEqual(b.longRuns.map(({ date, miles }) => ({ date, miles })), printed);
  assert.deepEqual(b.longRuns.map((r) => r.kind), ['repeat', 'build', 'build', 'cutback', 'build', 'build', 'build', 'taper', 'attempt']);
  assert.equal(b.attemptDate, '2027-01-23');
  assert.equal(b.pastCap, false);
});

test('the same example from the log: yellow on the Nov 21 long run', () => {
  const s = stateWith([
    ['2026-11-12', 'morning', run(2, 1)],
    ['2026-11-14', 'morning', run(4, 1)],
    ['2026-11-17', 'morning', run(2.5, 1)],
    ['2026-11-19', 'morning', run(2.5, 2)],
    ['2026-11-21', 'morning', run(5, 3)],
  ]);
  const params = trackBParams(s, '2026-11-22');
  assert.deepEqual(params, { trigger: '2026-11-21', lastGreen: 4, red: false, from: '2026-11-22' });
  const plan = getPlan({ ...s, settings: { ...s.settings, track: 'B' }, trackB: params });
  assert.equal(plan.track, 'B');
  assert.equal(plan.target, '2027-01-23');
  assert.deepEqual(plan.longRuns.slice(2).map((r) => r.miles), [4, 5, 6, 4.5, 7, 8, 8.5, 6, 10]);
  // The past is untouched: Track A days up to the trigger are still there.
  assert.equal(plan.day('2026-11-14').runMiles, 4);
  assert.equal(plan.day('2026-11-21').runMiles, 5);
  // "You'd finish 2026 with a longest run of 7 miles."
  assert.equal(Math.max(...plan.days.filter((d) => d.date <= '2026-12-31').map((d) => d.runMiles)), 7);
});

test('rule 1: repeat the last green distance rounded down; after a red, half of it', () => {
  assert.equal(startDistance(4), 4);
  assert.equal(startDistance(6.2), 6);
  assert.equal(startDistance(8.5), 8);
  assert.equal(startDistance(6.2, true), 3);
  assert.equal(startDistance(5, true), 2.5);
  assert.equal(startDistance(2, true), 2, 'never below the 2-mile minimum');
  assert.equal(startDistance(0), 2);
});

test('rules 2, 3 and 5: +1 a week, cutback every 4th week, 8.5 then 6 then 10', () => {
  const miles = (start) => longRunSequence(start).map((r) => r.miles);
  assert.deepEqual(miles(4), [4, 5, 6, 4.5, 7, 8, 8.5, 6, 10]);
  assert.deepEqual(miles(8), [8, 8.5, 6, 10]);
  assert.deepEqual(miles(6), [6, 7, 8, 6, 8.5, 6, 10]);
  assert.deepEqual(miles(2), [2, 3, 4, 3, 5, 6, 7, 5.5, 8, 8.5, 6, 10]);
  for (const start of [2, 2.5, 3, 4, 5, 6, 7, 8]) {
    const seq = longRunSequence(start);
    assert.deepEqual(seq.slice(-3).map((r) => r.miles), [8.5, 6, 10], `start ${start} ends 8.5, 6, 10`);
    assert.ok(seq.slice(0, -1).every((r) => r.miles <= 8.5), 'never past 8.5 before the attempt');
    seq.forEach((r, i) => {
      if (i > 0 && r.kind === 'build') {
        const prevBuild = seq.slice(0, i).filter((x) => x.kind !== 'cutback').at(-1).miles;
        assert.ok(r.miles - prevBuild <= 1, 'adds 1 mile at most');
      }
    });
  }
});

test('rule 4: weekday runs are 40–45% of the long run, to the half mile, between 2 and 4', () => {
  const expected = { 2: 2, 3: 2, 4: 2, 4.5: 2, 5: 2, 5.5: 2.5, 6: 2.5, 7: 3, 8: 3.5, 8.5: 3.5, 10: 4 };
  for (const [long, miles] of Object.entries(expected)) {
    assert.equal(weekdayMiles(Number(long)), miles, `long run ${long}`);
    if (miles > 2 && miles < 4) {
      assert.ok(miles >= Number(long) * 0.4 - 0.25 && miles <= Number(long) * 0.45 + 0.25);
    }
  }
});

test('a December trigger lands on about the same date', () => {
  // Yellow on Dec 26 after a green 8.5 on Dec 19.
  const b = buildTrackB({ trigger: '2026-12-26', lastGreen: 8.5 });
  assert.deepEqual(b.longRuns.map(({ date, miles }) => [date, miles]), [
    ['2027-01-02', 8], ['2027-01-09', 8.5], ['2027-01-16', 6], ['2027-01-23', 10],
  ]);
  assert.equal(b.pastCap, false);
  // Yellow on Dec 5 (the 7) after a green 6.2: repeat 6.
  const c = buildTrackB({ trigger: '2026-12-05', lastGreen: 6.2 });
  assert.deepEqual(c.longRuns.map((r) => r.miles), [6, 7, 8, 6, 8.5, 6, 10]);
  assert.equal(c.attemptDate, '2027-01-23');
});

test('a red trigger starts at half and can run past the hard cap, which is flagged', () => {
  const b = buildTrackB({ trigger: '2026-11-21', lastGreen: 4, red: true });
  assert.equal(b.start, 2);
  assert.deepEqual(b.longRuns.map((r) => r.miles), [2, 3, 4, 3, 5, 6, 7, 5.5, 8, 8.5, 6, 10]);
  assert.equal(b.attemptDate, '2027-02-13');
  assert.equal(HARD_CAP, '2027-01-30');
  assert.equal(b.pastCap, true);
  assert.ok(planMd.includes('Hard cap:** if the 10-miler isn\'t done by Sat Jan 30'));
  // A late red: Dec 19's 8.5 goes red after a green 7 on Dec 5.
  const c = buildTrackB({ trigger: '2026-12-19', lastGreen: 7, red: true });
  assert.equal(c.start, 3.5);
  assert.equal(c.pastCap, true);
});

test('switching a few days after the trigger still starts on a Saturday that is ahead', () => {
  assert.equal(saturdayAfter('2026-11-21'), '2026-11-28');
  assert.equal(saturdayAfter('2026-11-22'), '2026-11-28');
  const b = buildTrackB({ trigger: '2026-11-21', lastGreen: 4, from: '2026-11-30' });
  assert.equal(b.longRuns[0].date, '2026-12-05');
});

test('rules 6 and 7: other sessions and fixed-date adjustments carry over', () => {
  const b = buildTrackB({ trigger: '2026-11-21', lastGreen: 4 });
  const day = Object.fromEntries(b.days.map((d) => [d.date, d]));
  assert.equal(b.days[0].date, '2026-11-22');
  assert.equal(b.days.at(-1).date, '2027-01-23');
  // Week of Nov 28: weekday runs 2 and 2, long run 4.
  assert.equal(day['2026-11-24'].runMiles, 2);
  assert.equal(day['2026-11-26'].runMiles, 2);
  assert.match(day['2026-11-26'].notes, /Thanksgiving/);
  assert.equal(day['2026-11-28'].runMiles, 4);
  assert.doesNotMatch(day['2026-11-28'].notes, /10K/);
  // Finals: Dec 7 lite legs, Dec 14 walk only, hard climb moved to Wed Dec 16.
  assert.deepEqual(day['2026-12-07'].morning, { sessions: ['STR-A'], modifier: 'lite' });
  assert.deepEqual(day['2026-12-14'].morning.sessions, ['WALK']);
  assert.match(day['2026-12-14'].notes, /MKT 313 final/);
  assert.equal(day['2026-12-16'].evening.session, 'CLIMB-H');
  assert.equal(day['2026-12-12'].runMiles, 6);
  assert.equal(day['2026-12-19'].runMiles, 4.5);
  // Christmas: pull day moved to Wed Dec 23, walk on the 25th.
  assert.deepEqual(day['2026-12-23'].morning.sessions, ['PULL']);
  assert.deepEqual(day['2026-12-25'].morning.sessions, ['WALK']);
  assert.equal(day['2026-12-26'].runMiles, 7);
  // Benchmarks stay on their dates.
  assert.deepEqual(day['2026-12-03'].benchmarks, [{ id: 'talk2', round: 2 }]);
  // Track A's Dec 28–31 taper does not carry over: it is a normal template week.
  assert.deepEqual(day['2026-12-28'].morning.sessions, ['STR-A']);
  assert.equal(day['2026-12-28'].runMiles, 0);
  assert.deepEqual(day['2026-12-31'].morning.sessions, ['RUN-E', 'ARM-B']);
  assert.equal(day['2026-12-31'].runMiles, 3.5);
  assert.equal(day['2026-12-31'].attempt, false);
  assert.equal(day['2027-01-02'].runMiles, 8);
  assert.equal(day['2027-01-04'].evening.session, 'CLIMB-H');
  assert.equal(day['2027-01-23'].attempt, true);
  assert.equal(day['2027-01-23'].runMiles, 10);
  assert.ok(b.days.every((d) => !/Dec 31/.test(d.notes) || d.attempt === false && !/forecast/.test(d.notes)));
  // No day runs on back-to-back days.
  b.days.forEach((d, i) => assert.ok(!(i && d.runMiles && b.days[i - 1].runMiles), d.date));
});

test('Track A plan: position, weeks and planned milestone dates match PLAN.md', () => {
  const plan = getPlan(defaultState());
  assert.equal(plan.track, 'A');
  assert.equal(plan.target, '2026-12-31');
  assert.equal(plan.weeks, 8);
  assert.equal(plan.totalMiles, 93.2);
  assert.deepEqual(planPosition('2026-11-24', plan), { phase: 'during', week: 3, totalWeeks: 8, daysToStart: 0, daysToTarget: 37 });
  assert.equal(planPosition('2026-11-11', plan).phase, 'before');
  assert.equal(planPosition('2027-01-02', plan).phase, 'after');
  assert.deepEqual(plannedMilestones(plan).map((m) => m.date), MILESTONES.map((m) => m.date));
});

test('Track B plan: countdown and milestone dates move to the new schedule', () => {
  const s = { ...defaultState(), trackB: { trigger: '2026-11-21', lastGreen: 4, red: false } };
  s.settings.track = 'B';
  const plan = getPlan(s);
  assert.equal(planPosition('2026-12-10', plan).daysToTarget, 44);
  assert.equal(planPosition('2027-01-05', plan).phase, 'during');
  assert.equal(plan.weeks, 11);
  const dates = Object.fromEntries(plannedMilestones(plan).map((m) => [m.id, m.date]));
  assert.equal(dates.m10, '2027-01-23');
  assert.equal(dates.m8_5, '2027-01-09');
  assert.equal(dates.m7, '2026-12-26');
  assert.equal(dates.m5, '2026-11-21');
  // Switching back restores Track A.
  assert.equal(getPlan({ ...s, settings: { ...s.settings, track: 'A' } }).target, '2026-12-31');
});

// ---- Gates (PLAN.md section 4) ----

const greenWeek2 = [
  ['2026-11-17', 'morning', run(2.5, 1)], ['2026-11-18', 'shinAm', { score: 1 }],
  ['2026-11-19', 'morning', run(2.5, 1)], ['2026-11-20', 'shinAm', { score: 1 }],
  ['2026-11-21', 'morning', run(5, 2)], ['2026-11-22', 'shinAm', { score: 1 }],
];
const gates = (entries, week, today) => {
  const s = stateWith(entries);
  return weekGates(s, getPlan(s), week, today);
};
const passes = (g) => g.gates.map((x) => x.pass);

test('gates: a clean week passes all four on Sunday', () => {
  const g = gates(greenWeek2, 2, '2026-11-22');
  assert.deepEqual(passes(g), [true, true, true, true]);
  assert.equal(g.pass, true);
  assert.equal(g.decided, true);
});

test('gates: nothing is judged before the long run', () => {
  const g = gates(greenWeek2.slice(0, 4), 2, '2026-11-20');
  assert.deepEqual(passes(g), [null, null, null, null]);
  assert.equal(g.pass, false);
  assert.equal(g.failed, false);
});

test('gates: gate 3 waits for Sunday morning\'s score', () => {
  const g = gates(greenWeek2.slice(0, 5), 2, '2026-11-22');
  assert.deepEqual(passes(g), [true, true, null, true]);
  assert.equal(g.decided, false);
});

test('gate 1: walk breaks, a short long run, cross-training or a missed Saturday all fail', () => {
  const swap = (entry) => greenWeek2.map((e) => (e[0] === '2026-11-21' && e[1] === 'morning' ? ['2026-11-21', 'morning', entry] : e));
  assert.equal(gates(swap(run(5, 1, { nonstop: false })), 2, '2026-11-22').gates[0].pass, false);
  assert.equal(gates(swap(run(4, 1)), 2, '2026-11-22').gates[0].pass, false);
  assert.equal(gates(swap(run(0, 0, { surface: 'cross-train' })), 2, '2026-11-22').gates[0].pass, false);
  assert.equal(gates(swap({ status: 'skipped', reason: 'Travel' }), 2, '2026-11-22').gates[0].pass, false);
  const unlogged = gates(greenWeek2.slice(0, 4), 2, '2026-11-22');
  assert.equal(unlogged.gates[0].pass, null, 'a forgotten log is not a missed run');
  assert.equal(unlogged.failed, false);
  assert.equal(unlogged.pass, false);
  // A treadmill long run at full distance passes.
  assert.equal(gates(swap(run(5, 1, { surface: 'treadmill' })), 2, '2026-11-22').gates[0].pass, true);
});

test('gate 2: any run above 2 fails, straight away', () => {
  const entries = [['2026-11-17', 'morning', run(2.5, 3)]];
  const g = gates(entries, 2, '2026-11-17');
  assert.equal(g.gates[1].pass, false);
  assert.equal(g.failed, true);
});

test('gate 3: a worse next morning fails', () => {
  const entries = greenWeek2.map((e) => (e[0] === '2026-11-20' ? ['2026-11-20', 'shinAm', { score: 2 }] : e));
  assert.equal(gates(entries, 2, '2026-11-22').gates[2].pass, false);
});

test('gate 4: a weekday run skipped for exams does not fail; one skipped for the shin does', () => {
  const skip = (reason) => greenWeek2.map((e) => (e[0] === '2026-11-19' && e[1] === 'morning' ? ['2026-11-19', 'morning', { status: 'skipped', reason }] : e));
  const exams = gates(skip('Exams'), 2, '2026-11-22');
  assert.deepEqual(passes(exams), [true, true, true, true]);
  const shin = gates(skip('Shin'), 2, '2026-11-22');
  assert.equal(shin.gates[3].pass, false);
  assert.equal(shin.pass, false);
});

test('a failed gate is offered only on Track A, and four green weeks is a milestone', () => {
  const week1 = [
    ['2026-11-12', 'morning', run(2, 1)], ['2026-11-13', 'shinAm', { score: 1 }],
    ['2026-11-14', 'morning', run(4, 1)], ['2026-11-15', 'shinAm', { score: 1 }],
  ];
  const week3 = [
    ['2026-11-24', 'morning', run(3, 1)], ['2026-11-25', 'shinAm', { score: 1 }],
    ['2026-11-26', 'morning', run(3, 1)], ['2026-11-27', 'shinAm', { score: 1 }],
    ['2026-11-28', 'morning', run(6.2, 1)], ['2026-11-29', 'shinAm', { score: 1 }],
  ];
  const week4 = [
    ['2026-12-01', 'morning', run(3, 1)], ['2026-12-02', 'shinAm', { score: 1 }],
    ['2026-12-03', 'morning', run(3.5, 1)], ['2026-12-04', 'shinAm', { score: 1 }],
    ['2026-12-05', 'morning', run(7, 1)], ['2026-12-06', 'shinAm', { score: 1 }],
  ];
  const s = stateWith([...week1, ...greenWeek2, ...week3, ...week4]);
  const plan = getPlan(s);
  assert.equal(allGates(s, plan, '2026-12-06').length, 4);
  assert.equal(failedGate(s, plan, '2026-12-06'), null);
  assert.equal(greenWeeksReached(s, plan, '2026-12-06', 4), '2026-12-06');
  assert.equal(greenWeeksReached(s, plan, '2026-12-05', 4), null);

  const bad = setDaySlot(s, '2026-11-28', 'morning', run(6.2, 3));
  assert.equal(failedGate(bad, getPlan(bad), '2026-12-06').week, 3);
  assert.equal(greenWeeksReached(bad, getPlan(bad), '2026-12-06', 4), null);
  const onB = { ...bad, settings: { ...bad.settings, track: 'B' }, trackB: { trigger: '2026-11-28', lastGreen: 5, red: false } };
  assert.equal(failedGate(onB, getPlan(onB), '2026-12-06'), null);
});
