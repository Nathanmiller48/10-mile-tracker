// The session library, benchmarks, milestones and safety text must match PLAN.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as content from '../../js/data/content.js';
import { PLAN_DAYS } from '../../js/data/plan.js';
import { buildContent, renderContentModule, PLAN_MD, CONTENT_JS } from '../../scripts/build-content.mjs';

const planMd = (await readFile(PLAN_MD, 'utf8')).replace(/\r\n/g, '\n');
const { SESSIONS, WEEKLY_TEMPLATE, BENCHMARKS, MILESTONES, DOCTOR_LIST, SHIN_RULES, FALLBACK, GATES, SOURCES } = content;

test('content.js is up to date with PLAN.md', async () => {
  const committed = (await readFile(CONTENT_JS, 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(
    committed,
    renderContentModule(buildContent(planMd)),
    'js/data/content.js is stale: run npm run build:data',
  );
});

test('every session id used in the schedule has a workout', () => {
  const used = new Set();
  for (const day of PLAN_DAYS) {
    day.morning.sessions.forEach((id) => used.add(id));
    if (day.evening) used.add(day.evening.session);
  }
  assert.equal(used.size, 11);
  for (const id of used) {
    assert.ok(SESSIONS[id], `no workout for ${id}`);
    assert.ok(SESSIONS[id].name && SESSIONS[id].blocks.length > 0, `${id} is empty`);
  }
});

test('exercise tables have the same rows as PLAN.md', () => {
  const numbered = (id) => SESSIONS[id].exercises.filter((e) => e.n !== null);
  assert.equal(numbered('STR-A').length, 8);
  assert.equal(numbered('PULL').length, 6);
  assert.equal(numbered('ARM-B').length, 5);
  assert.equal(SESSIONS['STR-A'].exercises[0].name, 'Warm-up');
  assert.deepEqual(numbered('STR-A').map((e) => e.n), [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.deepEqual(
    { name: numbered('STR-A')[0].name, dose: numbered('STR-A')[0].dose },
    { name: 'Trap-bar deadlift', dose: '3 × 5' },
  );
  assert.deepEqual(
    { name: numbered('PULL')[0].name, dose: numbered('PULL')[0].dose },
    { name: 'Weighted pull-up', dose: '4 × 4' },
  );
  // Every exercise name and dose appears verbatim in PLAN.md.
  for (const id of ['STR-A', 'PULL', 'ARM-B']) {
    for (const e of SESSIONS[id].exercises) {
      assert.ok(planMd.includes(e.name), `${id}: "${e.name}" not in PLAN.md`);
      assert.ok(planMd.includes(e.dose), `${id}: "${e.dose}" not in PLAN.md`);
      if (e.notes) assert.ok(planMd.includes(e.notes), `${id}: notes for "${e.name}" not in PLAN.md`);
    }
  }
});

test('session durations come from the headings and climb caps', () => {
  assert.deepEqual(SESSIONS['STR-A'].minutes, [55, 60]);
  assert.deepEqual(SESSIONS['ARM-B'].minutes, [12, 15]);
  assert.deepEqual(SESSIONS['PULL'].minutes, [45, 50]);
  assert.deepEqual(SESSIONS['RESET'].minutes, [20, 30]);
  assert.deepEqual(SESSIONS['AER'].minutes, [30, 45]);
  assert.deepEqual(SESSIONS['WALK'].minutes, [15, 30]);
  assert.deepEqual(SESSIONS['CLIMB-H'].minutes, [null, 90]);
  assert.deepEqual(SESSIONS['CLIMB-M'].minutes, [null, 75]);
  assert.deepEqual(SESSIONS['CLIMB-E'].minutes, [null, 60]);
  assert.equal(SESSIONS['RUN-E'].minutes, null); // depends on the day's distance
  assert.match(SESSIONS['CLIMB-H'].sharedNote, /No hangboard/);
});

test('run sessions keep the form cues and the stop rule', () => {
  const easy = JSON.stringify(SESSIONS['RUN-E'].blocks);
  assert.match(easy, /Shorter, quicker steps/);
  assert.match(easy, /Land with your foot under you/);
  assert.match(easy, /Quiet feet/);
  const form = SESSIONS['RUN-E'].blocks[0].items.find((i) => i.text.startsWith('Form'));
  assert.equal(form.children.length, 4);
  assert.match(JSON.stringify(SESSIONS['RUN-L'].blocks), /Stop rule: shin hits 3\/10 → walk home/);
});

test('"done by" times match the weekly template', () => {
  const doneBy = Object.fromEntries(Object.entries(WEEKLY_TEMPLATE).map(([d, v]) => [d, v.doneBy]));
  assert.deepEqual(doneBy, {
    Mon: '11:15', Tue: '7:30', Wed: '7:00', Thu: null, Fri: '7:30', Sat: null, Sun: null,
  });
});

test('benchmarks: five, with the dates printed in section 10 and tagged in the schedule', () => {
  assert.deepEqual(BENCHMARKS.map((b) => b.id), ['talk2', 'longest', 'calf', 'pullup', 'lockoff']);
  const byId = Object.fromEntries(BENCHMARKS.map((b) => [b.id, b]));
  assert.deepEqual(byId.talk2.dates, ['2026-11-12', '2026-12-03', '2026-12-24']);
  assert.deepEqual(byId.calf.dates, ['2026-11-16', '2026-12-21']);
  assert.deepEqual(byId.pullup.dates, ['2026-11-13', '2026-12-18']);
  assert.deepEqual(byId.lockoff.dates, ['2026-11-13', '2026-12-18']);
  assert.equal(byId.calf.target, '25 per side');
  assert.equal(byId.longest.target, '10.0');
  // Section 10's dates and section 4's schedule tags must agree.
  for (const b of BENCHMARKS.filter((x) => x.dates.length)) {
    const tagged = PLAN_DAYS.filter((d) => d.benchmarks.some((t) => t.id === b.id)).map((d) => d.date);
    assert.deepEqual(tagged, b.dates, `${b.id}: schedule and section 10 disagree`);
  }
});

test('milestones: thirteen, with planned dates from section 10', () => {
  assert.equal(MILESTONES.length, 13);
  assert.equal(new Set(MILESTONES.map((m) => m.id)).size, 13);
  const dates = Object.fromEntries(MILESTONES.map((m) => [m.id, m.date]));
  assert.deepEqual(dates, {
    m4: '2026-11-14', m5: '2026-11-21', week10: '2026-11-21', m10k: '2026-11-28',
    total25: '2026-11-28', m7: '2026-12-05', total50: '2026-12-12', m8_5: '2026-12-19',
    total75: '2026-12-24', green4: '2026-12-06', calf25: '2026-12-21', lockoff5: '2026-12-18',
    m10: '2026-12-31',
  });
  assert.deepEqual(MILESTONES.filter((m) => m.by).map((m) => m.id), ['calf25', 'lockoff5']);
});

test('planned milestone dates are consistent with the schedule', () => {
  const round1 = (n) => Math.round(n * 10) / 10;
  for (const m of MILESTONES) {
    if (m.kind === 'nonstop') {
      const first = PLAN_DAYS.find((d) => d.runMiles >= m.miles);
      assert.equal(first.date, m.date, m.name);
    } else if (m.kind === 'total') {
      let sum = 0;
      const first = PLAN_DAYS.find((d) => round1((sum += d.runMiles)) >= m.miles);
      assert.equal(first.date, m.date, m.name);
    } else if (m.kind === 'week') {
      const totals = {};
      const first = PLAN_DAYS.find((d) => round1((totals[d.week] = (totals[d.week] || 0) + d.runMiles)) >= m.miles);
      assert.equal(first.date, m.date, m.name);
    }
  }
});

test('safety text is complete', () => {
  assert.equal(DOCTOR_LIST.items.length, 7);
  assert.match(DOCTOR_LIST.items[5], /Compartment-syndrome pattern/);
  assert.match(DOCTOR_LIST.items[6], /Go to the ER/);
  const table = SHIN_RULES.blocks.find((b) => b.t === 'table');
  assert.deepEqual(table.rows.map((r) => r[0]), ['**Green**', '**Yellow**', '**Red**']);
  assert.equal(SHIN_RULES.blocks.find((b) => b.t === 'ol').items.length, 2);
  assert.equal(FALLBACK.blocks.find((b) => b.t === 'table').rows.length, 5);
  assert.equal(GATES.blocks.find((b) => b.t === 'ol').items.length, 4);
});

test('sources are links', () => {
  const links = SOURCES.flatMap((g) => g.links);
  assert.equal(SOURCES.length, 4);
  assert.equal(links.length, 19);
  for (const link of links) assert.match(link.url, /^https:\/\//);
});
