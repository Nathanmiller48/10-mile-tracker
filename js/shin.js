// Shin status engine. A pure function of the log, implementing PLAN.md section 7,
// with the next-morning reading Nate chose (DECISIONS.md item 6).
//
// Not medical advice. The rules, in the order they are checked for the latest run:
//
//   RED     shin during the run is 5 or more, or the next-morning score is 5 or more,
//           or he reported a red flag (limping, pain when walking, a doctor-list item).
//   YELLOW  shin during the run is 3–4,
//           or the next-morning score is higher than the previous morning score,
//           or the next-morning score is 3 or more,
//           or the during score rose across three runs in a row.
//   GREEN   otherwise (0–2 during; next morning no higher than the previous morning and 2 or under).
//
// Red locks running until 5 consecutive pain-free days are recorded after the trigger
// AND he confirms he is cleared to restart. Yellow lasts until a later run comes back green.
import { addDays, diffDays } from './dates.js';

export const LEVELS = { green: 'Green', yellow: 'Yellow', red: 'Red' };
export const PAIN_FREE_DAYS_NEEDED = 5;

/**
 * Runs from the log, oldest first. Cross-train sessions are not runs.
 * Each: { date, miles, seconds, nonstop, surface, during, nextMorning, prevMorning }
 */
export function runsFromLog(log) {
  const dates = Object.keys(log).sort();
  const mornings = dates.filter((d) => Number.isFinite(log[d].shinAm?.score));
  const runs = [];
  for (const date of dates) {
    const entry = log[date].morning;
    if (!entry || entry.status !== 'done' || !entry.run || entry.run.surface === 'cross-train') continue;
    const prev = mornings.filter((d) => d <= date).at(-1);
    const next = log[addDays(date, 1)]?.shinAm?.score;
    runs.push({
      date,
      miles: entry.run.miles,
      seconds: entry.run.seconds ?? null,
      nonstop: entry.run.nonstop !== false,
      surface: entry.run.surface || 'road',
      during: Number.isFinite(entry.run.shin) ? entry.run.shin : null,
      nextMorning: Number.isFinite(next) ? next : null,
      prevMorning: prev ? log[prev].shinAm.score : null,
      redFlag: entry.run.redFlag === true,
    });
  }
  return runs;
}

/** Level and reasons for run i of a list of runs. */
export function evaluateRun(runs, i) {
  const run = runs[i];
  const reasons = [];
  let level = 'green';
  const raise = (to, reason) => {
    reasons.push(reason);
    if (to === 'red' || level === 'green') level = to;
  };

  if (run.redFlag) raise('red', 'red-flag');
  if (run.during !== null && run.during >= 5) raise('red', 'during-5-plus');
  if (run.nextMorning !== null && run.nextMorning >= 5) raise('red', 'morning-5-plus');

  if (run.during !== null && run.during >= 3 && run.during <= 4) raise('yellow', 'during-3-4');
  if (run.nextMorning !== null && run.nextMorning < 5) {
    if (run.prevMorning !== null && run.nextMorning > run.prevMorning) raise('yellow', 'morning-worse');
    else if (run.nextMorning >= 3) raise('yellow', 'morning-3-plus');
  }
  if (i >= 2) {
    const [a, b, c] = [runs[i - 2].during, runs[i - 1].during, run.during];
    if (a !== null && b !== null && c !== null && a < b && b < c) raise('yellow', 'creeping-up');
  }
  return { level, reasons };
}

/** Consecutive pain-free days recorded, counting back from `today` (or yesterday if today is unanswered). */
function painFreeStreak(log, after, today) {
  let day = log[today]?.painFree ? today : addDays(today, -1);
  let streak = 0;
  while (day > after && log[day]?.painFree) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** Longest run of consecutive pain-free days strictly after `after` and up to `until`. */
function bestPainFreeRun(log, after, until) {
  let best = 0;
  let current = 0;
  for (let day = addDays(after, 1); day <= until; day = addDays(day, 1)) {
    current = log[day]?.painFree ? current + 1 : 0;
    best = Math.max(best, current);
  }
  return best;
}

/**
 * Current shin status.
 * state: { log, clearedOn }   today: 'YYYY-MM-DD'
 *
 * Returns {
 *   level: 'green' | 'yellow' | 'red', word, reasons: [codes],
 *   runDate,                 // the run that set the status (null if no runs yet)
 *   noRunFrom, noRunUntil,   // yellow: no running through noRunUntil (72 h after the run); earliest is 48 h
 *   noRunEarliest,
 *   inNoRunWindow,           // yellow and today is inside the 72 h window
 *   locked,                  // red and not yet released
 *   painFreeStreak, painFreeNeeded, canConfirmCleared,
 *   restartAfterRed,         // released from a red and no run logged since: restart under half mileage
 *   proposeTrackB,           // yellow or red
 * }
 */
export function shinStatus(state, today) {
  // Only what has happened by `today` counts (matters when looking back or ahead with ?date=).
  const log = Object.fromEntries(Object.entries(state.log || {}).filter(([date]) => date <= today));
  const all = runsFromLog(log);
  const base = {
    level: 'green', word: LEVELS.green, reasons: [], runDate: null,
    noRunFrom: null, noRunUntil: null, noRunEarliest: null, inNoRunWindow: false,
    locked: false, painFreeStreak: 0, painFreeNeeded: PAIN_FREE_DAYS_NEEDED,
    canConfirmCleared: false, restartAfterRed: false, proposeTrackB: false,
  };

  // Most recent red trigger, and whether it has been released.
  let redIndex = -1;
  for (let i = all.length - 1; i >= 0; i--) {
    if (evaluateRun(all, i).level === 'red') {
      redIndex = i;
      break;
    }
  }
  let runs = all;
  if (redIndex >= 0) {
    const trigger = all[redIndex];
    const cleared = state.clearedOn && state.clearedOn > trigger.date && state.clearedOn <= today
      ? state.clearedOn
      : null;
    const released = cleared !== null && bestPainFreeRun(log, trigger.date, cleared) >= PAIN_FREE_DAYS_NEEDED;
    if (!released) {
      const streak = painFreeStreak(log, trigger.date, today);
      return {
        ...base,
        level: 'red', word: LEVELS.red, reasons: evaluateRun(all, redIndex).reasons,
        runDate: trigger.date, locked: true, painFreeStreak: streak,
        canConfirmCleared: streak >= PAIN_FREE_DAYS_NEEDED, proposeTrackB: true,
      };
    }
    // Released: only runs after he was cleared count from here on.
    runs = all.filter((r) => r.date >= cleared);
    if (runs.length === 0) return { ...base, runDate: trigger.date, restartAfterRed: true, proposeTrackB: true };
  }

  if (runs.length === 0) return base;
  const i = runs.length - 1;
  const { level, reasons } = evaluateRun(runs, i);
  const run = runs[i];
  if (level !== 'yellow') return { ...base, runDate: run.date };
  const noRunUntil = addDays(run.date, 3);
  return {
    ...base,
    level, word: LEVELS.yellow, reasons, runDate: run.date,
    noRunFrom: run.date, noRunEarliest: addDays(run.date, 2), noRunUntil,
    inNoRunWindow: diffDays(today, noRunUntil) > 0,
    proposeTrackB: true,
  };
}
