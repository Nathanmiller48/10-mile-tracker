// The four Track A gates from PLAN.md section 4, checked for each finished week. Pure.
//
//  1. Saturday's long run was completed nonstop at the planned distance.
//  2. Shin pain never went above 2/10 during any run.
//  3. Shin pain the morning after each run was no higher than the morning before it.
//  4. No run was skipped for shin reasons.
//
// Missing a short weekday run for exams or travel does not fail a gate; missing the long run does.
import { runsFromLog, evaluateRun } from './shin.js';
import { weekNumber, addDays } from './dates.js';
import { weekDates } from './plan.js';

export const GATE_TEXT = [
  'Long run completed nonstop at the planned distance',
  'Shin never above 2 during a run',
  'Shin no higher the morning after each run',
  'No run skipped for shin reasons',
];

const MORNING_FAILS = ['morning-worse', 'morning-3-plus', 'morning-5-plus'];

/**
 * Gates for one plan week as of `today`.
 * Returns { week, due, decided, pass, gates: [{ n, text, pass: true | false | null }] }
 *   due:     the long run day has passed (the week can be judged)
 *   decided: every gate has an answer
 *   pass:    all four passed (false as soon as any one fails, even before the week is over)
 */
export function weekGates(state, plan, week, today) {
  const dates = weekDates(week).filter((d) => plan.day(d));
  // Only what has happened by `today` counts.
  const log = Object.fromEntries(Object.entries(state.log || {}).filter(([date]) => date <= today));
  const allRuns = runsFromLog(log);
  const runs = allRuns.map((r, i) => ({ ...r, i })).filter((r) => weekNumber(r.date) === week && r.date <= today);
  const longDay = dates.map((d) => plan.day(d)).find((d) => d.morning.sessions.includes('RUN-L')) || null;
  const due = longDay ? today > longDay.date || (today === longDay.date && !!log[longDay.date]?.morning) : dates.length > 0 && today > dates.at(-1);

  // Gate 1
  let g1 = null;
  if (longDay) {
    const entry = log[longDay.date]?.morning;
    const run = entry?.status === 'done' ? entry.run : null;
    if (run && run.surface !== 'cross-train') g1 = run.nonstop !== false && run.miles >= longDay.runMiles - 0.05;
    else if (entry || today > longDay.date) g1 = false;
  } else if (due) g1 = true;

  // Gate 2
  const scored = runs.filter((r) => r.during !== null);
  let g2 = scored.some((r) => r.during > 2) ? false : due ? true : null;

  // Gate 3: needs the next-morning score for each run; the last one arrives the day after.
  let g3 = null;
  const morningFail = runs.some((r) => evaluateRun(allRuns, r.i).reasons.some((x) => MORNING_FAILS.includes(x)));
  if (morningFail) g3 = false;
  else if (due) {
    const waiting = runs.some((r) => r.nextMorning === null && addDays(r.date, 1) >= today);
    g3 = waiting ? null : true;
  }

  // Gate 4
  const shinSkip = dates.some((d) => {
    const entry = d <= today ? log[d]?.morning : null;
    return plan.day(d).runMiles > 0 && entry?.status === 'skipped' && entry.reason === 'Shin';
  });
  const g4 = shinSkip ? false : due ? true : null;

  const results = [g1, g2, g3, g4];
  const gates = results.map((pass, i) => ({ n: i + 1, text: GATE_TEXT[i], pass }));
  const failed = results.includes(false);
  return { week, due, decided: failed || results.every((r) => r !== null), pass: !failed && results.every((r) => r === true), failed, gates };
}

/** Gates for every week of the plan that has started. */
export function allGates(state, plan, today) {
  const out = [];
  for (let week = 1; week <= plan.weeks; week++) {
    if (weekDates(week).some((d) => plan.day(d) && d <= today)) out.push(weekGates(state, plan, week, today));
  }
  return out;
}

/** The most recent week with a failed gate, if he is still on Track A. */
export function failedGate(state, plan, today) {
  if (plan.track !== 'A') return null;
  return allGates(state, plan, today).reverse().find((w) => w.failed) || null;
}

/** Date he completed N straight green weeks (the Sunday of the last one), or null. */
export function greenWeeksReached(state, plan, today, needed) {
  let streak = 0;
  for (const w of allGates(state, plan, today)) {
    streak = w.decided && w.pass ? streak + 1 : 0;
    if (streak >= needed) return weekDates(w.week)[6] <= today ? weekDates(w.week)[6] : today;
  }
  return null;
}
