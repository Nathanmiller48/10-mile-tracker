// Generates js/data/plan.js from the schedule table in PLAN.md section 4.
// PLAN.md is the only source of training content; nothing here is retyped by hand.
//
//   node scripts/build-plan.mjs          write js/data/plan.js
//
// The generated file is committed, because GitHub Pages runs no build.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const PLAN_MD = join(ROOT, 'PLAN.md');
export const PLAN_JS = join(ROOT, 'js', 'data', 'plan.js');

const SESSION_IDS = new Set([
  'RUN-E', 'RUN-L', 'STR-A', 'ARM-B', 'PULL', 'RESET', 'AER', 'WALK',
  'CLIMB-H', 'CLIMB-M', 'CLIMB-E',
]);
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Benchmark phrases as they appear in the Notes column -> benchmark ids.
const BENCHMARK_IDS = [
  [/talk-test 2-mile/i, ['talk2']],
  [/weighted pull-up \+ lock-off/i, ['pullup', 'lockoff']],
  [/single-leg calf raise/i, ['calf']],
];

function fail(message) {
  throw new Error(`build-plan: ${message}`);
}

/** "RUN-E + ARM-B (light)" -> { sessions: ['RUN-E','ARM-B'], modifier: 'light' } */
function parseMorning(cell, date) {
  const match = cell.match(/^(.*?)(?:\s*\(([^)]+)\))?$/);
  const sessions = match[1].split('+').map((s) => s.trim());
  for (const id of sessions) {
    if (!SESSION_IDS.has(id)) fail(`${date}: unknown morning session "${id}"`);
  }
  return { sessions, modifier: match[2] ? match[2].trim() : null };
}

/** "CLIMB-M (optional)" -> { session: 'CLIMB-M', optional: true }; "—" -> null */
function parseEvening(cell, date) {
  if (cell === '—') return null;
  const match = cell.match(/^(\S+)(?:\s*\(([^)]+)\))?$/);
  if (!match || !SESSION_IDS.has(match[1])) fail(`${date}: unknown evening session "${cell}"`);
  if (match[2] && match[2] !== 'optional') fail(`${date}: unknown evening modifier "${match[2]}"`);
  return { session: match[1], optional: match[2] === 'optional' };
}

function parseNotes(cell, date) {
  const benchmarks = [];
  const milestones = [];
  let attempt = false;
  for (const [, bold] of cell.matchAll(/\*\*(.+?)\*\*/g)) {
    const text = bold.trim().replace(/\.$/, '');
    if (/^Benchmark:/i.test(text)) {
      const body = text.replace(/^Benchmark:\s*/i, '');
      const round = body.match(/#(\d+)/);
      const entry = BENCHMARK_IDS.find(([pattern]) => pattern.test(body));
      if (!entry || !round) fail(`${date}: unrecognised benchmark "${text}"`);
      for (const id of entry[1]) benchmarks.push({ id, round: Number(round[1]) });
    } else if (/^Milestone:/i.test(text)) {
      milestones.push(
        ...text.replace(/^Milestone:\s*/i, '').split(/\.\s+/).map((s) => s.trim()).filter(Boolean),
      );
    } else if (/^10 MILES NONSTOP$/i.test(text)) {
      attempt = true;
    } else {
      fail(`${date}: unrecognised bold note "${text}"`);
    }
  }
  return { notes: cell.replace(/\*\*/g, '').trim(), benchmarks, milestones, attempt };
}

/** Parse the section 4 schedule table out of the PLAN.md text. */
export function parsePlan(markdown) {
  const text = markdown.replace(/\r\n/g, '\n');
  const start = text.indexOf('\n## 4. ');
  const end = text.indexOf('\n## 5. ');
  if (start < 0 || end < 0) fail('could not find section 4 in PLAN.md');
  const section = text.slice(start, end);

  const days = [];
  for (const line of section.split('\n')) {
    if (!/^\| \d{4}-\d{2}-\d{2} \|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.length !== 7) fail(`expected 7 columns, got ${cells.length}: ${line}`);
    const [date, dow, week, morning, miles, evening, notes] = cells;

    const [y, m, d] = date.split('-').map(Number);
    const actualDow = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
    if (actualDow !== dow) fail(`${date} is a ${actualDow}, but PLAN.md says ${dow}`);
    if (!/^\d+$/.test(week)) fail(`${date}: bad week "${week}"`);
    if (!/^\d+(\.\d+)?$/.test(miles)) fail(`${date}: bad run miles "${miles}"`);

    const parsedMorning = parseMorning(morning, date);
    const runMiles = Number(miles);
    const hasRun = parsedMorning.sessions.some((s) => s.startsWith('RUN-'));
    if (hasRun !== runMiles > 0) fail(`${date}: run session and run miles disagree`);

    days.push({
      date,
      dow,
      week: Number(week),
      morning: parsedMorning,
      runMiles,
      evening: parseEvening(evening, date),
      ...parseNotes(notes, date),
    });
  }
  if (days.length === 0) fail('no schedule rows found in section 4');
  return days;
}

/** Render the generated module source. Deterministic, so a test can detect a stale file. */
export function renderPlanModule(days) {
  const rows = days.map((day) => `  ${JSON.stringify(day)},`).join('\n');
  return `// GENERATED from PLAN.md section 4 by scripts/build-plan.mjs. Do not edit by hand.
// To change the plan: edit PLAN.md (with Nate's say-so), then run: node scripts/build-plan.mjs

export const PLAN_START = ${JSON.stringify(days[0].date)};
export const PLAN_END = ${JSON.stringify(days[days.length - 1].date)};
export const PLAN_WEEKS = ${Math.max(...days.map((d) => d.week))};

/**
 * One entry per plan day, in date order.
 * morning: { sessions: session ids, modifier: 'lite' | 'light' | null }
 * evening: { session, optional } or null for nothing planned
 * benchmarks: [{ id: 'talk2' | 'pullup' | 'lockoff' | 'calf', round }]
 */
export const PLAN_DAYS = [
${rows}
];
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const days = parsePlan(await readFile(PLAN_MD, 'utf8'));
  await mkdir(dirname(PLAN_JS), { recursive: true });
  await writeFile(PLAN_JS, renderPlanModule(days));
  console.log(`Wrote ${days.length} days to js/data/plan.js`);
}
