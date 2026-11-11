// The plan data must match PLAN.md exactly. Expected numbers are read from the text
// PLAN.md prints (weekly totals, total, long-run sequence), not retyped here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PLAN_DAYS, PLAN_START, PLAN_END, PLAN_WEEKS } from '../../js/data/plan.js';
import { parsePlan, renderPlanModule, PLAN_MD, PLAN_JS } from '../../scripts/build-plan.mjs';

const planMd = (await readFile(PLAN_MD, 'utf8')).replace(/\r\n/g, '\n');
const round1 = (n) => Math.round(n * 10) / 10;

function utc(date) {
  const [y, m, d] = date.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

test('plan.js is up to date with PLAN.md', async () => {
  const committed = (await readFile(PLAN_JS, 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(
    committed,
    renderPlanModule(parsePlan(planMd)),
    'js/data/plan.js is stale: run node scripts/build-plan.mjs',
  );
});

test('50 days, Nov 12 to Dec 31, 2026, with no gaps or duplicates', () => {
  assert.equal(PLAN_DAYS.length, 50);
  assert.equal(PLAN_START, '2026-11-12');
  assert.equal(PLAN_END, '2026-12-31');
  assert.equal(PLAN_DAYS[0].date, PLAN_START);
  assert.equal(PLAN_DAYS.at(-1).date, PLAN_END);
  for (let i = 1; i < PLAN_DAYS.length; i++) {
    assert.equal(
      utc(PLAN_DAYS[i].date) - utc(PLAN_DAYS[i - 1].date),
      86_400_000,
      `gap or duplicate before ${PLAN_DAYS[i].date}`,
    );
  }
});

test('weekdays match the calendar and weeks run Monday to Sunday', () => {
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  assert.equal(PLAN_WEEKS, 8);
  for (const [i, day] of PLAN_DAYS.entries()) {
    assert.equal(day.dow, names[new Date(utc(day.date)).getUTCDay()], day.date);
    if (i > 0) {
      const expected = day.dow === 'Mon' ? PLAN_DAYS[i - 1].week + 1 : PLAN_DAYS[i - 1].week;
      assert.equal(day.week, expected, `week number on ${day.date}`);
    }
  }
  assert.equal(PLAN_DAYS[0].week, 1);
  assert.equal(PLAN_DAYS.at(-1).week, 8);
});

test('weekly running totals match the line printed in PLAN.md', () => {
  const line = planMd.match(/\*\*Weekly running totals:\*\*(.+)/)[1];
  const printed = [...line.matchAll(/W(\d) ([\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])]);
  assert.equal(printed.length, 8);
  for (const [week, miles] of printed) {
    const actual = round1(
      PLAN_DAYS.filter((d) => d.week === week).reduce((sum, d) => sum + d.runMiles, 0),
    );
    assert.equal(actual, miles, `week ${week}`);
  }
  const printedTotal = Number(line.match(/Total ([\d.]+) miles/)[1]);
  assert.equal(printedTotal, 93.2);
  assert.equal(round1(PLAN_DAYS.reduce((sum, d) => sum + d.runMiles, 0)), printedTotal);
});

test('long-run sequence matches the line printed in PLAN.md', () => {
  const line = planMd.match(/\*\*Saturday long runs:\*\*(.+)/)[1];
  const printed = [...line.matchAll(/(\d+(?:\.\d+)?)\s*(?:→|\(Thu Dec 31\))/g)].map((m) => Number(m[1]));
  assert.deepEqual(printed, [4, 5, 6.2, 7, 5, 8.5, 6, 10]);

  const longRuns = PLAN_DAYS.filter((d) => d.morning.sessions.includes('RUN-L'));
  assert.deepEqual(longRuns.map((d) => d.runMiles), printed);
  assert.deepEqual(
    longRuns.map((d) => d.dow),
    ['Sat', 'Sat', 'Sat', 'Sat', 'Sat', 'Sat', 'Sat', 'Thu'],
  );
  assert.equal(longRuns.at(-1).date, '2026-12-31');
  assert.equal(longRuns.at(-1).attempt, true);
  assert.equal(PLAN_DAYS.filter((d) => d.attempt).length, 1);
});

test('three runs a week at most, never on back-to-back days', () => {
  for (let i = 1; i < PLAN_DAYS.length; i++) {
    assert.ok(
      !(PLAN_DAYS[i].runMiles > 0 && PLAN_DAYS[i - 1].runMiles > 0),
      `runs on consecutive days at ${PLAN_DAYS[i].date}`,
    );
  }
  for (let week = 1; week <= 8; week++) {
    const runs = PLAN_DAYS.filter((d) => d.week === week && d.runMiles > 0).length;
    assert.ok(runs <= 3, `week ${week} has ${runs} runs`);
  }
});

test('session cells are parsed, including modifiers and optional climbs', () => {
  const byDate = Object.fromEntries(PLAN_DAYS.map((d) => [d.date, d]));
  assert.deepEqual(byDate['2026-11-12'].morning, { sessions: ['RUN-E', 'ARM-B'], modifier: null });
  assert.equal(byDate['2026-11-12'].evening, null);
  assert.deepEqual(byDate['2026-11-16'].evening, { session: 'CLIMB-H', optional: false });
  assert.deepEqual(byDate['2026-12-07'].morning, { sessions: ['STR-A'], modifier: 'lite' });
  assert.deepEqual(byDate['2026-12-07'].evening, { session: 'CLIMB-M', optional: true });
  assert.deepEqual(byDate['2026-12-11'].morning, { sessions: ['PULL'], modifier: 'lite' });
  assert.deepEqual(byDate['2026-12-28'].morning, { sessions: ['RUN-E', 'ARM-B'], modifier: 'light' });
  assert.deepEqual(byDate['2026-12-14'].morning, { sessions: ['WALK'], modifier: null });
  assert.deepEqual(byDate['2026-12-23'].morning, { sessions: ['PULL'], modifier: null });
  assert.equal(byDate['2026-12-18'].evening, null);
  // Every day with run miles has a run session and vice versa.
  for (const day of PLAN_DAYS) {
    assert.equal(day.morning.sessions.some((s) => s.startsWith('RUN-')), day.runMiles > 0, day.date);
  }
});

test('benchmark days are tagged on the dates PLAN.md section 10 lists', () => {
  const dates = (id) =>
    PLAN_DAYS.filter((d) => d.benchmarks.some((b) => b.id === id)).map((d) => d.date);
  assert.deepEqual(dates('talk2'), ['2026-11-12', '2026-12-03', '2026-12-24']);
  assert.deepEqual(dates('calf'), ['2026-11-16', '2026-12-21']);
  assert.deepEqual(dates('pullup'), ['2026-11-13', '2026-12-18']);
  assert.deepEqual(dates('lockoff'), ['2026-11-13', '2026-12-18']);
  const rounds = PLAN_DAYS.flatMap((d) => d.benchmarks.filter((b) => b.id === 'talk2')).map((b) => b.round);
  assert.deepEqual(rounds, [1, 2, 3]);
});

test('notes keep their text with the bold markers removed', () => {
  const byDate = Object.fromEntries(PLAN_DAYS.map((d) => [d.date, d]));
  assert.equal(byDate['2026-11-17'].notes, '');
  assert.equal(byDate['2026-11-26'].notes, 'Thanksgiving. Solo turkey trot before the meal.');
  assert.equal(byDate['2026-11-14'].notes, 'Capped at 4. Milestone: first 4-miler.');
  assert.deepEqual(byDate['2026-11-21'].milestones, ['first 5-miler', 'First 10-mile week']);
  assert.ok(PLAN_DAYS.every((d) => !d.notes.includes('**')));
});
