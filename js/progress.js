// The Progress screen: the route, milestones, charts, shin trend, benchmarks and gates.
// Charts are plain inline SVG. Every chart has its numbers in text beside it.
import { BENCHMARKS, TRACK_B } from './data/content.js';
import { getPlan, plannedMilestones } from './plan.js';
import { runsFromLog } from './shin.js';
import { runTotals, reachedMilestones, nextMilestone } from './milestones.js';
import { allGates } from './gates.js';
import { fmtTime } from './day.js';
import { monthDay, shortDate } from './dates.js';
import { esc, inline } from './html.js';
import { mileToX } from './route.js';

const round1 = (n) => Math.round(n * 10) / 10;
const md = (iso) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8))}`;

// ---------- 1. the route ----------

/** Ten miles with a marker at each milestone distance, filled to the longest nonstop run. */
export function routeHero(longest, plannedSoFar, plan) {
  const [x0, x1, y] = [14, 326, 44];
  const stops = [...new Set(plannedMilestones(plan).filter((m) => m.kind === 'nonstop').map((m) => m.miles))].sort((a, b) => a - b);
  const fillX = mileToX(longest, x0, x1);
  const marks = stops
    .map((miles, i) => {
      const x = mileToX(miles, x0, x1);
      const done = longest >= miles;
      const up = i % 2 === 1; // alternate labels above and below so 4, 5, 6.2, 7 do not collide
      return `<circle class="stop${done ? ' is-done' : ''}" cx="${x}" cy="${y}" r="${miles === 10 ? 7 : 5}"/>
        <text class="route-label${done ? ' is-reached' : ''}${miles === 10 ? ' is-goal' : ''}" x="${x}" y="${up ? y - 14 : y + 24}">${miles}</text>`;
    })
    .join('');
  const planX = mileToX(plannedSoFar, x0, x1);
  const planMark = plannedSoFar > 0
    ? `<line class="plan-mark" x1="${planX}" y1="${y - 9}" x2="${planX}" y2="${y + 9}"/>`
    : '';
  const label = `Longest nonstop run ${longest} of 10 miles. The plan has you at ${plannedSoFar} by today.`;
  return `<section class="card route-hero" aria-label="The route">
    <p class="eyebrow">Longest nonstop run</p>
    <p class="hero-num">${longest}<span class="hero-unit"> of 10 mi</span></p>
    <svg viewBox="0 0 340 78" role="img" aria-label="${esc(label)}">
      <line class="route-line" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>
      ${longest > 0 ? `<line class="route-fill" x1="${x0}" y1="${y}" x2="${fillX}" y2="${y}"/>` : ''}
      ${planMark}
      <circle class="route-start" cx="${x0}" cy="${y}" r="3"/>
      ${marks}
      ${longest > 0 && !stops.includes(longest) ? `<circle class="route-dot" cx="${fillX}" cy="${y}" r="5"/>` : ''}
    </svg>
    <p class="quiet">${plannedSoFar > 0 ? `The plan has you at <strong>${plannedSoFar} mi</strong> by today (the upright mark).` : 'The line fills as your long runs grow.'}</p>
  </section>`;
}

// ---------- 2. milestones ----------

function milestonesCard(state, plan, today) {
  const reached = reachedMilestones(state, today);
  const next = nextMilestone(state, today);
  const rows = plannedMilestones(plan)
    .slice()
    .sort((a, b) => (a.date || '9').localeCompare(b.date || '9'))
    .map((m) => {
      const done = reached[m.id];
      const isNext = next && next.milestone.id === m.id;
      const when = done
        ? `Reached ${esc(monthDay(done))}`
        : m.date
          ? `${m.by ? 'By ' : 'Planned '}${esc(monthDay(m.date))}`
          : '';
      return `<li class="ms${done ? ' is-done' : ''}${isNext ? ' is-next' : ''}">
        <span class="ms-dot" aria-hidden="true"></span>
        <span class="ms-name">${esc(m.name)}${isNext ? '<span class="ms-tag">Next</span>' : ''}</span>
        <span class="ms-when">${when}</span>
      </li>`;
    })
    .join('');
  const count = Object.keys(reached).length;
  return `<section class="card" aria-labelledby="ms-title">
    <h2 id="ms-title">Milestones <span class="h-sub">${count} of 13 reached</span></h2>
    <ol class="ms-list">${rows}</ol>
  </section>`;
}

// ---------- 3. long-run chart ----------

function longRunChart(state, plan, today) {
  const runs = Object.fromEntries(runsFromLog(state.log).map((r) => [r.date, r]));
  const data = plan.longRuns.map((p) => ({ ...p, actual: p.date <= today ? runs[p.date] || null : null }));
  const [w, h, left, bottom, top] = [340, 170, 22, 24, 8];
  const slot = (w - left) / data.length;
  const bar = Math.min(26, slot - 6);
  const yOf = (miles) => top + (h - top - bottom) * (1 - miles / 10);
  const grid = [0, 5, 10]
    .map((m) => `<line class="grid" x1="${left}" y1="${yOf(m)}" x2="${w}" y2="${yOf(m)}"/><text class="axis" x="${left - 5}" y="${yOf(m) + 4}" text-anchor="end">${m}</text>`)
    .join('');
  const bars = data
    .map((d, i) => {
      const x = left + slot * i + (slot - bar) / 2;
      const planned = `<rect class="bar-plan" x="${x}" y="${yOf(d.miles)}" width="${bar}" height="${yOf(0) - yOf(d.miles)}" rx="3"/>`;
      const a = d.actual;
      const actual = a
        ? `<rect class="bar-actual${a.nonstop ? '' : ' is-partial'}" x="${x}" y="${yOf(Math.min(10, a.miles))}" width="${bar}" height="${yOf(0) - yOf(Math.min(10, a.miles))}" rx="3"/>`
        : '';
      return `${planned}${actual}<text class="axis${data.length > 9 ? ' axis-small' : ''}" x="${x + bar / 2}" y="${h - 7}" text-anchor="middle">${md(d.date)}</text>`;
    })
    .join('');
  const list = data
    .map((d) => {
      const a = d.actual;
      const got = a ? `${a.miles} mi${a.nonstop ? '' : ' with walk breaks'}` : d.date <= today ? 'not logged' : 'ahead';
      return `<li><span>${esc(monthDay(d.date))}</span><span>planned ${d.miles}</span><span>${got}</span></li>`;
    })
    .join('');
  return `<section class="card" aria-labelledby="lr-title">
    <h2 id="lr-title">Long runs <span class="h-sub">planned and done, miles</span></h2>
    <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Bar chart of each long run, planned and done">${grid}${bars}</svg>
    <p class="legend"><span class="legend-item"><span class="key key-plan"></span>Planned</span><span class="legend-item"><span class="key key-actual"></span>Done nonstop</span><span class="legend-item"><span class="key key-partial"></span>Done with walk breaks</span></p>
    <details class="more"><summary>As a list</summary><ul class="data-list">${list}</ul></details>
  </section>`;
}

// ---------- 4. total miles ----------

function totalChart(state, plan, today) {
  const runs = runsFromLog(state.log).filter((r) => r.date <= today);
  const totals = runTotals(state.log, today);
  const days = plan.days;
  const [w, h, left, bottom, top] = [340, 150, 26, 22, 8];
  const max = Math.max(plan.totalMiles, totals.totalMiles, 1);
  const xOf = (i) => left + ((w - left - 4) * i) / (days.length - 1);
  const yOf = (miles) => top + (h - top - bottom) * (1 - miles / max);
  let sum = 0;
  let plannedToday = 0;
  const planned = days.map((d, i) => {
    sum = round1(sum + d.runMiles);
    if (d.date <= today) plannedToday = sum;
    return `${xOf(i)},${yOf(sum)}`;
  });
  const byDate = Object.fromEntries(runs.map((r) => [r.date, r.miles]));
  let actualSum = 0;
  const actual = [];
  days.forEach((d, i) => {
    if (d.date > today) return;
    actualSum = round1(actualSum + (byDate[d.date] || 0));
    actual.push(`${xOf(i)},${yOf(actualSum)}`);
  });
  const ticks = [0, Math.round(max / 2), Math.round(max)]
    .map((m) => `<line class="grid" x1="${left}" y1="${yOf(m)}" x2="${w}" y2="${yOf(m)}"/><text class="axis" x="${left - 5}" y="${yOf(m) + 4}" text-anchor="end">${m}</text>`)
    .join('');
  const ends = `<text class="axis" x="${left}" y="${h - 5}">${esc(monthDay(days[0].date))}</text><text class="axis" x="${w - 4}" y="${h - 5}" text-anchor="end">${esc(monthDay(days.at(-1).date))}</text>`;
  return `<section class="card" aria-labelledby="tm-title">
    <h2 id="tm-title">Total miles</h2>
    <p class="big-line"><strong>${totals.totalMiles}</strong> run <span class="quiet">· plan has ${plannedToday} by today, ${plan.totalMiles} in all</span></p>
    <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Running total of miles: ${totals.totalMiles} done against ${plannedToday} planned by today">
      ${ticks}${ends}
      <polyline class="line-plan" points="${planned.join(' ')}"/>
      ${actual.length > 1 ? `<polyline class="line-actual" points="${actual.join(' ')}"/>` : ''}
    </svg>
    <p class="legend"><span class="legend-item"><span class="key key-line-plan"></span>Planned</span><span class="legend-item"><span class="key key-line-actual"></span>Done</span></p>
  </section>`;
}

// ---------- 5. shin trend ----------

function shinTrend(state, today) {
  const runs = runsFromLog(state.log).filter((r) => r.date <= today && (r.during !== null || r.nextMorning !== null));
  if (runs.length === 0) {
    return `<section class="card" aria-labelledby="st-title"><h2 id="st-title">Shin trend</h2>
      <p class="quiet">Your shin score during each run and the next morning will plot here. It is the record to show a doctor.</p></section>`;
  }
  const [w, h, left, bottom, top] = [340, 170, 22, 24, 10];
  const shown = runs.slice(-24);
  const slot = (w - left - 8) / Math.max(1, shown.length - 1 || 1);
  const xOf = (i) => (shown.length === 1 ? (left + w) / 2 : left + 4 + slot * i);
  const yOf = (score) => top + (h - top - bottom) * (1 - score / 10);
  const bands = `
    <rect class="band band-yellow" x="${left}" y="${yOf(5)}" width="${w - left}" height="${yOf(3) - yOf(5)}"/>
    <rect class="band band-red" x="${left}" y="${yOf(10)}" width="${w - left}" height="${yOf(5) - yOf(10)}"/>
    <text class="band-label" x="${w - 4}" y="${yOf(3) - 5}" text-anchor="end">Yellow from 3</text>
    <text class="band-label" x="${w - 4}" y="${yOf(5) - 5}" text-anchor="end">Red from 5</text>`;
  const grid = [0, 5, 10]
    .map((m) => `<line class="grid" x1="${left}" y1="${yOf(m)}" x2="${w}" y2="${yOf(m)}"/><text class="axis" x="${left - 5}" y="${yOf(m) + 4}" text-anchor="end">${m}</text>`)
    .join('');
  const during = shown.filter((r) => r.during !== null);
  const line = during.length > 1 ? `<polyline class="line-actual" points="${shown.map((r, i) => (r.during === null ? null : `${xOf(i)},${yOf(r.during)}`)).filter(Boolean).join(' ')}"/>` : '';
  const dots = shown
    .map((r, i) => {
      const d = r.during !== null ? `<circle class="dot-during" cx="${xOf(i)}" cy="${yOf(r.during)}" r="4"/>` : '';
      const m = r.nextMorning !== null ? `<rect class="dot-morning" x="${xOf(i) + 3}" y="${yOf(r.nextMorning) - 4}" width="8" height="8"/>` : '';
      return d + m;
    })
    .join('');
  const labels = `<text class="axis" x="${xOf(0)}" y="${h - 7}" text-anchor="${shown.length === 1 ? 'middle' : 'start'}">${md(shown[0].date)}</text>${shown.length > 1 ? `<text class="axis" x="${xOf(shown.length - 1)}" y="${h - 7}" text-anchor="end">${md(shown.at(-1).date)}</text>` : ''}`;
  const list = runs
    .slice()
    .reverse()
    .map((r) => `<li><span>${esc(shortDate(r.date))}</span><span>${r.miles} mi</span><span>during ${r.during ?? '–'}</span><span>next morning ${r.nextMorning ?? '–'}</span></li>`)
    .join('');
  return `<section class="card" aria-labelledby="st-title">
    <h2 id="st-title">Shin trend <span class="h-sub">0–10 per run</span></h2>
    <svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="Shin score during each run and the next morning">${bands}${grid}${line}${dots}${labels}</svg>
    <p class="legend"><span class="legend-item"><span class="key key-dot"></span>During the run</span><span class="legend-item"><span class="key key-square"></span>Next morning</span></p>
    <details class="more"><summary>Scores as a list</summary><ul class="data-list data-list-4">${list}</ul></details>
    <p class="fine">Not medical advice. <a href="#/more/safety">Shin rules</a></p>
  </section>`;
}

// ---------- 6. benchmarks ----------

function benchmarkValues(state, today) {
  const out = { talk2: [], calf: [], pullup: [], lockoff: [] };
  for (const date of Object.keys(state.log).filter((d) => d <= today).sort()) {
    const b = state.log[date].morning?.benchmarks;
    if (!b) continue;
    if (b.talk2Seconds) out.talk2.push({ date, text: fmtTime(b.talk2Seconds) });
    if (b.calfLeft !== undefined || b.calfRight !== undefined) out.calf.push({ date, text: `${b.calfLeft ?? '–'} L / ${b.calfRight ?? '–'} R` });
    if (b.pullupLb !== undefined) out.pullup.push({ date, text: `+${b.pullupLb} lb`, n: b.pullupLb });
    if (b.lockoffLeft !== undefined || b.lockoffRight !== undefined) out.lockoff.push({ date, text: `${b.lockoffLeft ?? '–'} s L / ${b.lockoffRight ?? '–'} s R` });
  }
  return out;
}

function benchmarksCard(state, today) {
  const values = benchmarkValues(state, today);
  const longest = runTotals(state.log, today).longestNonstop;
  const rows = BENCHMARKS.map((b) => {
    let line;
    if (b.id === 'longest') line = longest > 0 ? `<strong>${longest} mi</strong>` : 'No runs yet';
    else {
      const v = values[b.id];
      if (v.length === 0) line = `First test ${esc(monthDay(b.dates[0]))}`;
      else if (v.length === 1) line = `<strong>${esc(v[0].text)}</strong> <span class="quiet">${esc(monthDay(v[0].date))}</span>`;
      else {
        const gain = b.id === 'pullup' ? ` <span class="quiet">(${v.at(-1).n - v[0].n >= 0 ? '+' : ''}${round1(v.at(-1).n - v[0].n)} lb)</span>` : '';
        line = `${esc(v[0].text)} → <strong>${esc(v.at(-1).text)}</strong>${gain}`;
      }
    }
    return `<li class="bm"><span class="bm-name">${esc(b.name)}</span><span class="bm-line">${line}</span><span class="bm-target">Target: ${esc(b.target)}${b.id === 'longest' ? ' mi' : ''}</span></li>`;
  }).join('');
  return `<section class="card" aria-labelledby="bm-title"><h2 id="bm-title">Benchmarks <span class="h-sub">first → latest</span></h2><ul class="bm-list">${rows}</ul></section>`;
}

// ---------- 7. track status ----------

function gatesCard(state, plan, today) {
  const weeks = allGates(state, plan, today);
  const word = (pass) => (pass === true ? 'Passed' : pass === false ? 'Not passed' : 'Pending');
  const rows = weeks
    .map((w) => {
      const overall = w.failed ? 'Not passed' : w.decided && w.pass ? 'All passed' : 'In progress';
      const gates = w.gates
        .map((g) => `<li class="gate gate-${g.pass === true ? 'pass' : g.pass === false ? 'fail' : 'wait'}"><span class="gate-mark" aria-hidden="true">${g.pass === true ? '✓' : g.pass === false ? '✕' : '·'}</span><span>${esc(g.text)}</span><span class="gate-word">${word(g.pass)}</span></li>`)
        .join('');
      return `<details class="more gate-week"${w.failed ? ' open' : ''}><summary><span>Week ${w.week}</span><span class="gate-overall${w.failed ? ' is-fail' : ''}">${overall}</span></summary><ul class="gate-list">${gates}</ul></details>`;
    })
    .join('');
  const trackLine = plan.track === 'A'
    ? 'You stay on Track A while every week passes all four gates.'
    : `You are on Track B. The 10-miler is planned for <strong>${esc(shortDate(plan.target))}</strong>.`;
  const cap = plan.pastCap ? `<p class="notice">${inline(TRACK_B.blocks.at(-1).text)}</p>` : '';
  return `<section class="card" aria-labelledby="gt-title">
    <h2 id="gt-title">Track ${esc(plan.track)} <span class="h-sub">weekly gates</span></h2>
    <p class="quiet">${trackLine}</p>${cap}
    ${rows || '<p class="quiet">Gates are checked each Sunday once the plan starts.</p>'}
  </section>`;
}

export function progressView(state, ui, ctx) {
  const today = ctx.today;
  const plan = getPlan(state);
  const totals = runTotals(state.log, today);
  const plannedSoFar = Math.max(0, ...plan.longRuns.filter((r) => r.date <= today).map((r) => r.miles));
  return `<header class="top"><h1 class="date">Progress</h1></header>
    ${routeHero(totals.longestNonstop, plannedSoFar, plan)}
    ${milestonesCard(state, plan, today)}
    ${longRunChart(state, plan, today)}
    ${totalChart(state, plan, today)}
    ${shinTrend(state, today)}
    ${benchmarksCard(state, today)}
    ${gatesCard(state, plan, today)}`;
}
