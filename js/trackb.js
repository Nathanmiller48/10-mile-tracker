// Track B: the backup timeline from PLAN.md section 8. Pure: no DOM.
//
// Rules as implemented (numbers match section 8):
//  1. The Saturday after the trigger repeats the longest long run completed green in the
//     last 3 weeks, rounded down to a whole mile. After a red, start at half of it.
//  2. Each Saturday after that adds 1 mile at most, never past 8.5 before the attempt.
//  3. Every 4th week after the switch is a cutback: 25% shorter than the week before,
//     to the nearest half mile. The week after resumes at the pre-cutback distance plus 1.
//  4. Two weekday runs, each 40–45% of that week's long run, to the nearest half mile,
//     minimum 2, maximum 4.
//  5. After a clean 8.5, the next Saturday is 6 and the one after is 10.
//  6. Strength, pull day, climbing and recovery days stay as in the weekly template.
//  7. Finals and holiday adjustments from section 4 still apply on their dates.
//
// Two things section 8 does not spell out, decided here and recorded in PROGRESS.md:
//  - Once 8.5 is done, rule 5 wins over rule 3: the "6 then 10" weeks are never cut back.
//  - With no green run to repeat, or after halving, the first long run is at least 2 miles.
import { PLAN_DAYS } from './data/plan.js';
import { addDays, weekday, weekNumber } from './dates.js';

export const HARD_CAP = '2027-01-30';
export const PEAK = 8.5;
const MIN_RUN = 2;
const MAX_WEEKDAY_RUN = 4;

const roundHalf = (n) => Math.round(n * 2) / 2;

/** Rule 4: one weekday run for a week whose long run is `longMiles`. */
export const weekdayMiles = (longMiles) =>
  Math.min(MAX_WEEKDAY_RUN, Math.max(MIN_RUN, roundHalf(longMiles * 0.425)));

/** Rule 1: the first Track B long run. */
export function startDistance(lastGreen, red = false) {
  const repeat = Math.min(PEAK, Math.floor(lastGreen || 0));
  return Math.max(MIN_RUN, red ? roundHalf(repeat / 2) : repeat);
}

/** Rules 1–3 and 5: the Saturday long runs, in order. Each: { miles, kind }. */
export function longRunSequence(start) {
  const runs = [];
  let lastBuild = null;
  for (let week = 1; week < 60; week++) {
    if (lastBuild === PEAK) {
      runs.push({ miles: 6, kind: 'taper' }, { miles: 10, kind: 'attempt' });
      return runs;
    }
    if (week % 4 === 0) {
      runs.push({ miles: roundHalf(runs.at(-1).miles * 0.75), kind: 'cutback' });
    } else {
      lastBuild = lastBuild === null ? Math.min(PEAK, start) : Math.min(PEAK, lastBuild + 1);
      runs.push({ miles: lastBuild, kind: week === 1 ? 'repeat' : 'build' });
    }
  }
  throw new Error('Track B did not reach 8.5');
}

/** The first Saturday strictly after a date. */
export function saturdayAfter(iso) {
  let d = addDays(iso, 1);
  while (weekday(d) !== 'Sat') d = addDays(d, 1);
  return d;
}

// Rule 6: the weekly template from PLAN.md section 3, for weeks after Track A's dates.
const TEMPLATE = {
  Mon: { morning: ['STR-A'], evening: 'CLIMB-H' },
  Tue: { morning: ['RUN-E'], evening: null },
  Wed: { morning: ['RESET'], evening: 'CLIMB-M' },
  Thu: { morning: ['RUN-E', 'ARM-B'], evening: null },
  Fri: { morning: ['PULL'], evening: 'CLIMB-E' },
  Sat: { morning: ['RUN-L'], evening: null },
  Sun: { morning: ['AER'], evening: null },
};

const LONG_NOTES = {
  repeat: 'Track B: repeat your last green distance.',
  build: 'Track B.',
  cutback: 'Track B cutback week.',
  taper: 'Track B: relaxed. Nothing to prove today.',
  attempt: '10 MILES NONSTOP.',
};

// Track A's last week (Dec 28–31) is its own taper into Dec 31, so it does not carry over.
const A_CARRY_END = '2026-12-27';
const A_BY_DATE = new Map(PLAN_DAYS.map((d) => [d.date, d]));

/** Keep fixed-date notes (exams, holidays, benchmarks); drop Track A milestone and Dec 31 talk. */
function carryNotes(notes) {
  return notes
    .split(/(?<=\.)\s+/)
    .filter((s) => !/Milestone:|Dec 31|10-mile week/.test(s))
    .join(' ')
    .trim();
}

/**
 * Build Track B.
 * params: { trigger: 'YYYY-MM-DD', lastGreen: miles, red: boolean, from?: first date allowed
 *           for a long run (used when he switches some days after the trigger) }
 * Returns { start, longRuns: [{ date, miles, kind }], days: [...same shape as PLAN_DAYS],
 *           attemptDate, pastCap }
 */
export function buildTrackB({ trigger, lastGreen, red = false, from = null }) {
  const start = startDistance(lastGreen, red);
  let firstSat = saturdayAfter(trigger);
  while (from && firstSat < from) firstSat = addDays(firstSat, 7);
  const longRuns = longRunSequence(start).map((run, i) => ({ ...run, date: addDays(firstSat, i * 7) }));
  const attemptDate = longRuns.at(-1).date;
  const longBySat = new Map(longRuns.map((r) => [r.date, r]));

  const days = [];
  for (let date = addDays(trigger, 1); date <= attemptDate; date = addDays(date, 1)) {
    const dow = weekday(date);
    const sat = dow === 'Sat' ? date : saturdayAfter(date);
    const long = longBySat.get(sat) || longRuns[0];
    const a = date <= A_CARRY_END ? A_BY_DATE.get(date) : null;
    const base = a
      ? { morning: a.morning.sessions, modifier: a.morning.modifier, evening: a.evening, notes: carryNotes(a.notes), benchmarks: a.benchmarks }
      : {
          morning: TEMPLATE[dow].morning, modifier: null,
          evening: TEMPLATE[dow].evening ? { session: TEMPLATE[dow].evening, optional: dow === 'Fri' } : null,
          notes: '', benchmarks: [],
        };
    const isLong = base.morning.includes('RUN-L');
    const isEasy = base.morning.includes('RUN-E');
    // A long run is only planned on a Track B Saturday that exists (not before the first one).
    const longToday = isLong && longBySat.has(date) ? longBySat.get(date) : null;
    let morning = base.morning;
    let runMiles = 0;
    let notes = base.notes;
    if (isLong) {
      if (longToday) {
        runMiles = longToday.miles;
        notes = [LONG_NOTES[longToday.kind], a && longToday.kind !== 'attempt' ? carryNotesLong(a.notes) : ''].filter(Boolean).join(' ');
      } else {
        morning = ['AER'];
        notes = 'Track B starts with next Saturday\'s long run.';
      }
    } else if (isEasy) {
      runMiles = weekdayMiles(long.miles);
    }
    days.push({
      date, dow, week: weekNumber(date),
      morning: { sessions: morning, modifier: base.modifier },
      runMiles,
      evening: base.evening,
      notes,
      benchmarks: base.benchmarks,
      milestones: [],
      attempt: longToday?.kind === 'attempt',
    });
  }
  return { start, longRuns, days, attemptDate, pastCap: attemptDate > HARD_CAP };
}

/** From a Track A long-run note keep only what is about the date, not the distance. */
function carryNotesLong(notes) {
  const kept = notes.split(/(?<=\.)\s+/).filter((s) => /Thanksgiving|Christmas|exam|Finals/i.test(s));
  return kept.join(' ');
}
