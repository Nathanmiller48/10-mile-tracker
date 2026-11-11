// Generates js/data/content.js from PLAN.md sections 3–11: the workouts, the weekly
// template, the fallback table, the shin rules, Track B text, attempt day, benchmarks,
// milestones and sources. Text is carried over verbatim as "blocks"; nothing is retyped.
//
//   node scripts/build-content.mjs
//
// Block shapes:  { t: 'p', text }
//                { t: 'ul' | 'ol', items: [{ text, children?: [{ text }] }] }
//                { t: 'table', head: [..], rows: [[..]] }
// Text keeps PLAN.md's **bold** markers; the site renders them.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
export const PLAN_MD = join(ROOT, 'PLAN.md');
export const CONTENT_JS = join(ROOT, 'js', 'data', 'content.js');

const MONTHS = { Nov: 11, Dec: 12, Jan: 1 };

function fail(message) {
  throw new Error(`build-content: ${message}`);
}

const strip = (s) => s.replace(/\*\*/g, '').trim();

/** "Nov 14" -> "2026-11-14" (Jan belongs to 2027). */
function isoDate(text) {
  const m = text.match(/\b(Nov|Dec|Jan) (\d{1,2})\b/);
  if (!m) fail(`no date in "${text}"`);
  const year = m[1] === 'Jan' ? 2027 : 2026;
  return `${year}-${String(MONTHS[m[1]]).padStart(2, '0')}-${m[2].padStart(2, '0')}`;
}

/** Turn a run of markdown lines into blocks. */
export function parseBlocks(lines) {
  const blocks = [];
  let para = [];
  const flush = () => {
    if (para.length) blocks.push({ t: 'p', text: para.join(' ') });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '' || line.trim() === '---') {
      flush();
      continue;
    }
    if (line.startsWith('|')) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim()));
        i++;
      }
      i--;
      if (rows.length < 2 || !rows[1].every((c) => /^:?-+:?$/.test(c))) fail(`bad table near "${line}"`);
      blocks.push({ t: 'table', head: rows[0], rows: rows.slice(2) });
      continue;
    }
    const item = line.match(/^(\s*)(-|\d+\.) (.*)$/);
    if (item) {
      flush();
      const type = item[2] === '-' ? 'ul' : 'ol';
      const nested = item[1].length >= 2;
      const last = blocks.at(-1);
      if (nested) {
        if (!last || !last.items) fail(`nested item with no parent: "${line}"`);
        const parent = last.items.at(-1);
        (parent.children ||= []).push({ text: item[3].trim() });
      } else if (last && last.t === type && lines[i - 1].trim() !== '') {
        last.items.push({ text: item[3].trim() });
      } else {
        blocks.push({ t: type, items: [{ text: item[3].trim() }] });
      }
      continue;
    }
    para.push(line.trim());
  }
  flush();
  return blocks;
}

/** Split PLAN.md into numbered sections, each with intro blocks and ### subsections. */
export function parseSections(markdown) {
  const text = markdown.replace(/\r\n/g, '\n');
  const sections = {};
  const parts = text.split(/\n(?=## \d+\. )/).slice(1);
  for (const part of parts) {
    const lines = part.split('\n');
    const head = lines[0].match(/^## (\d+)\. (.+)$/);
    const subs = [];
    let current = { title: null, lines: [] };
    const all = [current];
    for (const line of lines.slice(1)) {
      const sub = line.match(/^### (.+)$/);
      if (sub) {
        current = { title: sub[1].trim(), lines: [] };
        all.push(current);
      } else {
        current.lines.push(line);
      }
    }
    for (const s of all.slice(1)) subs.push({ title: s.title, blocks: parseBlocks(s.lines) });
    sections[head[1]] = { title: head[2].trim(), blocks: parseBlocks(all[0].lines), subs };
  }
  return sections;
}

const findTable = (blocks, headCell) =>
  blocks.find((b) => b.t === 'table' && b.head.some((h) => strip(h) === headCell)) ||
  fail(`no table with a "${headCell}" column`);

function minutesFrom(text) {
  // A "≤90 min" cap wins over ranges, which in climb text are rest times ("3–5 min rest").
  const cap = text.match(/≤(\d+) min/);
  if (cap) return [null, Number(cap[1])];
  const range = text.match(/(\d+)–(\d+) min/);
  if (range) return [Number(range[1]), Number(range[2])];
  return null;
}

/** "`RUN-E` easy run · `RUN-L` long run · ..." -> { 'RUN-E': 'easy run', ... } */
function sessionLabels(section4) {
  const legend = section4.blocks.find((b) => b.t === 'p' && b.text.startsWith('Session IDs:'));
  if (!legend) fail('no "Session IDs:" legend in section 4');
  const labels = {};
  for (const part of legend.text.replace(/^Session IDs:\s*/, '').replace(/\.$/, '').split(' · ')) {
    const m = part.match(/^`([^`]+)`\s+(.+)$/);
    if (!m) fail(`bad legend entry "${part}"`);
    if (m[1] === '—') continue;
    if (m[1] === 'CLIMB-H/M/E') {
      const [h, mid, e] = m[2].replace(/ climb$/, '').split('/');
      Object.assign(labels, { 'CLIMB-H': `${h} climb`, 'CLIMB-M': `${mid} climb`, 'CLIMB-E': `${e} climb` });
    } else {
      labels[m[1]] = m[2];
    }
  }
  return labels;
}

function buildSessions(section5, labels) {
  const sessions = {};
  let climbNote = null;
  for (const sub of section5.subs) {
    if (sub.title === 'Climbing sessions') {
      for (const item of sub.blocks.flatMap((b) => (b.items ? b.items : []))) {
        const m = item.text.match(/^\*\*(CLIMB-[HME]) \((\w+)\):\*\* (.+)$/);
        if (m) {
          sessions[m[1]] = {
            id: m[1],
            name: `Climb — ${m[2][0].toUpperCase()}${m[2].slice(1)}`,
            label: labels[m[1]],
            when: null,
            minutes: minutesFrom(m[3]),
            blocks: [{ t: 'p', text: m[3] }],
          };
        } else {
          climbNote = item.text;
        }
      }
      continue;
    }
    const head = sub.title.match(/^([A-Z]+(?:-[A-Z])?)(?: — (.+?))?(?: \((.+)\))?$/);
    if (!head) fail(`unrecognised workout heading "${sub.title}"`);
    const [, id, name, meta] = head;
    const session = {
      id,
      name: name || `${labels[id][0].toUpperCase()}${labels[id].slice(1)}`,
      label: labels[id],
      when: meta || null,
      minutes: minutesFrom(meta || '') || minutesFrom(sub.blocks.map((b) => b.text || '').join(' ')),
      blocks: sub.blocks,
    };
    const table = sub.blocks.find((b) => b.t === 'table' && b.head.includes('Exercise'));
    if (table) {
      session.exercises = table.rows.map(([n, exercise, dose, notes]) => ({
        n: n === '—' ? null : Number(n),
        name: exercise,
        dose,
        notes,
      }));
    } else if (id === 'ARM-B') {
      session.exercises = sub.blocks
        .find((b) => b.t === 'ul')
        .items.map((item, i) => {
          const [exercise, dose] = item.text.split(/:\s+/);
          if (!dose) fail(`ARM-B item without a dose: "${item.text}"`);
          return { n: i + 1, name: exercise, dose, notes: '' };
        });
    }
    sessions[id] = session;
  }
  for (const id of Object.keys(labels)) if (!sessions[id]) fail(`no workout found for ${id}`);
  for (const id of ['CLIMB-H', 'CLIMB-M', 'CLIMB-E']) sessions[id].sharedNote = climbNote;
  return sessions;
}

function buildWeeklyTemplate(section3) {
  const table = findTable(section3.blocks, 'Finish by');
  const template = {};
  for (const [day, morning, finishBy, evening] of table.rows) {
    template[day] = {
      morning: strip(morning),
      doneBy: /^\d{1,2}:\d{2}$/.test(finishBy) ? finishBy : null,
      evening: strip(evening),
    };
  }
  return template;
}

const BENCHMARK_IDS = [
  [/^Talk-test 2-mile$/, 'talk2'],
  [/^Longest nonstop run$/, 'longest'],
  [/^Single-leg calf raise$/, 'calf'],
  [/^Weighted pull-up$/, 'pullup'],
  [/^One-arm lock-off$/, 'lockoff'],
];

function buildBenchmarks(section10) {
  return findTable(section10.blocks, 'Benchmark').rows.map(([name, how, dates, target]) => {
    const entry = BENCHMARK_IDS.find(([p]) => p.test(name)) || fail(`unknown benchmark "${name}"`);
    return {
      id: entry[1],
      name,
      how,
      dates: /^Every /.test(dates) ? [] : dates.split(',').map((d) => isoDate(d)),
      datesText: dates,
      target,
    };
  });
}

// How each milestone in section 10 is recognised and what the log must show to reach it.
const MILESTONE_RULES = [
  [/^10 miles nonstop$/, { id: 'm10', kind: 'nonstop', miles: 10 }],
  [/^First 4-miler$/, { id: 'm4', kind: 'nonstop', miles: 4 }],
  [/^First 5-miler$/, { id: 'm5', kind: 'nonstop', miles: 5 }],
  [/^First 10-mile week$/, { id: 'week10', kind: 'week', miles: 10 }],
  [/^First 10K$/, { id: 'm10k', kind: 'nonstop', miles: 6.2 }],
  [/^25 total miles$/, { id: 'total25', kind: 'total', miles: 25 }],
  [/^First run over an hour \/ 7 miles$/, { id: 'm7', kind: 'nonstop', miles: 7 }],
  [/^50 total miles$/, { id: 'total50', kind: 'total', miles: 50 }],
  [/^8\.5 miles$/, { id: 'm8_5', kind: 'nonstop', miles: 8.5 }],
  [/^75 total miles$/, { id: 'total75', kind: 'total', miles: 75 }],
  [/^Four straight green weeks$/, { id: 'green4', kind: 'greenWeeks', weeks: 4 }],
  [/^25 single-leg calf raises per side$/, { id: 'calf25', kind: 'benchmark', benchmark: 'calf', value: 25 }],
  [/^5-second one-arm lock-off$/, { id: 'lockoff5', kind: 'benchmark', benchmark: 'lockoff', value: 5 }],
];

function buildMilestones(section10) {
  return findTable(section10.blocks, 'Milestone').rows.map(([rawName, rawDate]) => {
    const name = strip(rawName);
    const entry = MILESTONE_RULES.find(([p]) => p.test(name)) || fail(`unknown milestone "${name}"`);
    return { ...entry[1], name, date: isoDate(rawDate), by: /^by /.test(strip(rawDate)) };
  });
}

function buildSources(section11) {
  const groups = [];
  for (const block of section11.blocks) {
    if (block.t === 'p') groups.push({ title: strip(block.text), links: [] });
    else if (block.t === 'ul') {
      for (const item of block.items) {
        const m = item.text.match(/^(.*) — (https?:\/\/\S+)$/);
        if (!m) fail(`source without a URL: "${item.text}"`);
        groups.at(-1).links.push({ label: m[1], url: m[2] });
      }
    }
  }
  return groups;
}

export function buildContent(markdown) {
  const s = parseSections(markdown);
  for (const n of ['3', '4', '5', '6', '7', '8', '9', '10', '11']) if (!s[n]) fail(`section ${n} missing`);
  const labels = sessionLabels(s['4']);
  const gates = s['4'].subs.find((x) => x.title.startsWith('Gates')) || fail('no Gates subsection');
  const doctor = s['7'].subs.find((x) => x.title.startsWith('See a doctor')) || fail('no doctor list');
  const logFields = s['10'].blocks.filter((b) => b.t === 'ul').at(-1);
  return {
    WEEKLY_TEMPLATE: buildWeeklyTemplate(s['3']),
    SESSION_LABELS: labels,
    SESSIONS: buildSessions(s['5'], labels),
    GATES: { title: gates.title, blocks: gates.blocks },
    FALLBACK: { title: s['6'].title, blocks: s['6'].blocks },
    SHIN_RULES: { title: s['7'].title, blocks: s['7'].blocks },
    DOCTOR_LIST: { title: doctor.title, items: doctor.blocks.find((b) => b.t === 'ul').items.map((i) => i.text) },
    TRACK_B: { title: s['8'].title, blocks: s['8'].blocks },
    ATTEMPT_DAY: { title: s['9'].title, blocks: s['9'].blocks },
    BENCHMARKS: buildBenchmarks(s['10']),
    MILESTONES: buildMilestones(s['10']),
    LOG_FIELDS: logFields.items.map((i) => i.text),
    SOURCES: buildSources(s['11']),
  };
}

export function renderContentModule(content) {
  const body = Object.entries(content)
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 1)};`)
    .join('\n\n');
  return `// GENERATED from PLAN.md sections 3–11 by scripts/build-content.mjs. Do not edit by hand.
// To change training content: edit PLAN.md (with Nate's say-so), then run: npm run build:data

${body}
`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const content = buildContent(await readFile(PLAN_MD, 'utf8'));
  await mkdir(dirname(CONTENT_JS), { recursive: true });
  await writeFile(CONTENT_JS, renderContentModule(content));
  console.log(`Wrote ${Object.keys(content.SESSIONS).length} sessions to js/data/content.js`);
}
