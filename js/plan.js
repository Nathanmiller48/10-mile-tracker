// The active plan: Track A straight from PLAN.md, or Track A up to the trigger followed
// by the generated Track B. Everything that asks "what is planned on this date" comes here.
import { PLAN_DAYS, PLAN_START, PLAN_END } from './data/plan.js';
import { MILESTONES } from './data/content.js';
import { buildTrackB, HARD_CAP } from './trackb.js';
import { weekNumber, diffDays, addDays, mondayOf } from './dates.js';
import { runsFromLog, evaluateRun, shinStatus } from './shin.js';

const round1 = (n) => Math.round(n * 10) / 10;
let cache = { key: null, plan: null };

function makePlan(track, days, extra = {}) {
  const byDate = new Map(days.map((d) => [d.date, d]));
  const end = days.at(-1).date;
  const longRuns = days.filter((d) => d.morning.sessions.includes('RUN-L')).map((d) => ({ date: d.date, miles: d.runMiles }));
  return {
    track, days, start: days[0].date, end, target: end,
    weeks: weekNumber(end),
    longRuns,
    totalMiles: round1(days.reduce((sum, d) => sum + d.runMiles, 0)),
    day: (iso) => byDate.get(iso) || null,
    pastCap: false, hardCap: HARD_CAP,
    ...extra,
  };
}

const TRACK_A = makePlan('A', PLAN_DAYS);

/** The plan he is on. state.trackB = { trigger, lastGreen, red, from } is set when he switches. */
export function getPlan(state) {
  if (state?.settings?.track !== 'B' || !state.trackB) return TRACK_A;
  const key = JSON.stringify(state.trackB);
  if (cache.key === key) return cache.plan;
  const b = buildTrackB(state.trackB);
  const days = [...PLAN_DAYS.filter((d) => d.date <= state.trackB.trigger), ...b.days];
  const plan = makePlan('B', days, { pastCap: b.pastCap, trackB: b, trigger: state.trackB.trigger });
  cache = { key, plan };
  return plan;
}

/**
 * Where a date sits relative to a plan.
 * phase: 'before' | 'during' | 'after'; week: plan week during the plan, else null.
 */
export function planPosition(iso, plan) {
  const phase = iso < plan.start ? 'before' : iso > plan.end ? 'after' : 'during';
  return {
    phase,
    week: phase === 'during' ? weekNumber(iso) : null,
    totalWeeks: plan.weeks,
    daysToStart: Math.max(0, diffDays(iso, plan.start)),
    daysToTarget: diffDays(iso, plan.target),
  };
}

/** The seven dates, Monday to Sunday, of plan week n. */
export function weekDates(week) {
  const monday = addDays(mondayOf(PLAN_START), (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/**
 * What a switch to Track B should be built from, as of `today`.
 * trigger: the run that set a yellow/red status, else today.
 * lastGreen: longest nonstop run judged green in the 3 weeks up to the trigger.
 */
export function trackBParams(state, today) {
  const status = shinStatus(state, today);
  const flagged = status.level !== 'green' || status.restartAfterRed;
  const trigger = flagged && status.runDate ? status.runDate : today;
  const runs = runsFromLog(state.log).filter((r) => r.date <= trigger);
  let lastGreen = 0;
  runs.forEach((r, i) => {
    if (diffDays(r.date, trigger) <= 21 && r.nonstop && evaluateRun(runs, i).level === 'green') {
      lastGreen = Math.max(lastGreen, r.miles);
    }
  });
  return { trigger, lastGreen, red: status.locked || status.restartAfterRed, from: today };
}

/**
 * Planned date for every milestone on a plan: the first day the plan's own schedule
 * would reach it. Benchmark and green-week milestones keep the dates printed in PLAN.md.
 */
export function plannedMilestones(plan) {
  return MILESTONES.map((m) => {
    let date = m.date;
    if (m.kind === 'nonstop') date = plan.days.find((d) => d.runMiles >= m.miles)?.date ?? null;
    if (m.kind === 'total') {
      let sum = 0;
      date = plan.days.find((d) => round1((sum += d.runMiles)) >= m.miles)?.date ?? null;
    }
    if (m.kind === 'week') {
      const totals = {};
      date = plan.days.find((d) => round1((totals[d.week] = (totals[d.week] || 0) + d.runMiles)) >= m.miles)?.date ?? null;
    }
    return { ...m, date };
  });
}

export { PLAN_START, PLAN_END };
