// Milestones are derived from the log, never toggled by hand. Pure: no DOM.
// A treadmill run counts. A run with walk breaks or a cross-train session does not count
// toward nonstop-distance milestones.
import { MILESTONES } from './data/content.js';
import { runsFromLog } from './shin.js';
import { weekNumber, diffDays, weekdayName, monthDay } from './dates.js';
import { getPlan, plannedMilestones } from './plan.js';
import { greenWeeksReached } from './gates.js';

const round1 = (n) => Math.round(n * 10) / 10;

/** Longest nonstop run, total miles and miles per plan week, up to and including `today`. */
export function runTotals(log, today) {
  const runs = runsFromLog(log).filter((r) => r.date <= today);
  const weekMiles = {};
  let longestNonstop = 0;
  let totalMiles = 0;
  for (const r of runs) {
    totalMiles = round1(totalMiles + r.miles);
    const week = weekNumber(r.date);
    weekMiles[week] = round1((weekMiles[week] || 0) + r.miles);
    if (r.nonstop && r.miles > longestNonstop) longestNonstop = r.miles;
  }
  return { longestNonstop, totalMiles, weekMiles, runCount: runs.length };
}

/** { milestoneId: date reached } for every milestone reached by `today`. */
export function reachedMilestones(state, today) {
  const log = state.log || {};
  const reached = {};
  const mark = (id, date) => {
    if (!(id in reached)) reached[id] = date;
  };
  const runs = runsFromLog(log).filter((r) => r.date <= today);
  const weekMiles = {};
  let total = 0;
  for (const r of runs) {
    total = round1(total + r.miles);
    const week = weekNumber(r.date);
    weekMiles[week] = round1((weekMiles[week] || 0) + r.miles);
    for (const m of MILESTONES) {
      if (m.kind === 'nonstop' && r.nonstop && r.miles >= m.miles) mark(m.id, r.date);
      if (m.kind === 'total' && total >= m.miles) mark(m.id, r.date);
      if (m.kind === 'week' && weekMiles[week] >= m.miles) mark(m.id, r.date);
    }
  }
  for (const date of Object.keys(log).filter((d) => d <= today).sort()) {
    const b = log[date].morning?.benchmarks;
    if (!b) continue;
    for (const m of MILESTONES.filter((x) => x.kind === 'benchmark')) {
      const [left, right] = m.benchmark === 'calf' ? [b.calfLeft, b.calfRight] : [b.lockoffLeft, b.lockoffRight];
      if (left >= m.value && right >= m.value) mark(m.id, date);
    }
  }
  for (const m of MILESTONES.filter((x) => x.kind === 'greenWeeks')) {
    const date = greenWeeksReached(state, getPlan(state), today, m.weeks);
    if (date) mark(m.id, date);
  }
  return reached;
}

/**
 * The next milestone still ahead: the unreached one with the earliest planned date on or
 * after `today`; if every planned date has passed, the earliest unreached one.
 * Returns { milestone, days, text } or null when all are reached.
 */
export function nextMilestone(state, today) {
  const reached = reachedMilestones(state, today);
  const open = plannedMilestones(getPlan(state))
    .filter((m) => !(m.id in reached) && m.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (open.length === 0) return null;
  const milestone = open.find((m) => m.date >= today) || open[0];
  const days = diffDays(today, milestone.date);
  const name = /^\d/.test(milestone.name) ? milestone.name : milestone.name[0].toLowerCase() + milestone.name.slice(1);
  let text;
  if (days < 0) text = `Still ahead: ${name}.`;
  else {
    const when = days === 0 ? 'Today' : days < 7 ? weekdayName(milestone.date) : monthDay(milestone.date);
    const count = days === 0 ? '' : days === 1 ? ' 1 day.' : ` ${days} days.`;
    text = `${milestone.by && days > 0 ? `By ${when}` : when}: ${name}.${count}`;
  }
  return { milestone, days, text };
}
