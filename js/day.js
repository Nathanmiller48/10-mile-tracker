// What a given day actually asks of him: the plan for that date, adjusted by shin status
// (yellow/red convert runs to cross-training), the ice/cold switch, and what he has logged.
// Pure: no DOM.
import { SESSIONS, WEEKLY_TEMPLATE, SHIN_RULES } from './data/content.js';
import { weekday } from './dates.js';
import { getPlan } from './plan.js';
import { shinStatus } from './shin.js';

export const DEFAULT_PACE = 660; // 11:00 per mile until he has logged a timed run
export const WARMUP_COOLDOWN_MIN = 10; // 5 min walk before, 5 after (PLAN.md RUN-E)

// PLAN.md log fields: weight × reps is tracked for these lifts (exercise number -> id).
export const TRACKED_LIFTS = {
  'STR-A': { 1: 'deadlift', 2: 'splitSquat', 3: 'calfRaise' },
  PULL: { 1: 'pullup' },
};
export const LIFT_NAMES = {
  deadlift: 'Trap-bar deadlift',
  splitSquat: 'Split squat',
  calfRaise: 'Single-leg calf raise',
  pullup: 'Weighted pull-up',
};

// The sentence in PLAN.md that sets the per-week leg-day volume. A unit test checks it is
// still there word for word, so a plan change cannot silently leave this logic behind.
export const STR_SETS_SENTENCE =
  'Weeks 1–2: 2 sets on lifts 1–5. Week 5: 2 sets, 35 min. Week 6: skipped. Week 7: 2 sets. Week 8: none.';
const TWO_SET_WEEKS = new Set([1, 2, 5, 7]);

/** Exercises for a session on a plan day, with leg-day sets adjusted for the week. */
export function exercisesFor(sessionId, plan) {
  const list = SESSIONS[sessionId]?.exercises || [];
  if (sessionId !== 'STR-A' || !plan || !TWO_SET_WEEKS.has(plan.week)) return list;
  return list.map((e) => (e.n >= 1 && e.n <= 5 ? { ...e, dose: e.dose.replace(/^3 ×/, '2 ×') } : e));
}

/** His most recent logged pace in seconds per mile before `date`, else the default. */
export function paceSeconds(log, date) {
  const dates = Object.keys(log).filter((d) => d < date).sort().reverse();
  for (const d of dates) {
    const run = log[d].morning?.run;
    if (log[d].morning?.status === 'done' && run && run.surface !== 'cross-train' && run.miles > 0 && run.seconds > 0) {
      return Math.round(run.seconds / run.miles);
    }
  }
  return DEFAULT_PACE;
}

/** Running minutes for a distance at a pace, rounded to the nearest 5. */
export const runMinutes = (miles, pace) => Math.max(5, Math.round((miles * pace) / 60 / 5) * 5);

/**
 * Should the run planned on `date` be cross-training instead, as seen from `today`?
 * Returns null, 'yellow' or 'red'.
 *   yellow: the next scheduled run after the yellow run, and any run inside the 72 h window
 *   red:    every run while running is locked
 * A recorded "run anyway" override for that date cancels the conversion.
 */
export function runConversion(state, date, today) {
  const active = getPlan(state);
  const plan = active.day(date);
  if (!plan || plan.runMiles <= 0 || date < today) return null;
  if ((state.overrides || []).some((o) => o.date === date && o.kind === 'run-anyway')) return null;
  const status = shinStatus(state, today);
  if (status.locked) return date > status.runDate ? 'red' : null;
  if (status.level === 'yellow') {
    const next = active.days.find((d) => d.runMiles > 0 && d.date > status.runDate);
    if ((next && next.date === date) || (date > status.runDate && date < status.noRunUntil)) return 'yellow';
  }
  return null;
}

/** The exact "what you do" text for a status from the PLAN.md section 7 table. */
export function shinAction(level) {
  const table = SHIN_RULES.blocks.find((b) => b.t === 'table');
  const row = table.rows.find((r) => r[0].replace(/\*\*/g, '').toLowerCase() === level);
  return row ? row[2] : '';
}

const fmtMiles = (n) => String(n);

/**
 * Everything the Today layout needs for one date. Returns null outside the plan.
 * opts.weatherTreadmill: the forecast says treadmill (used until he flips the switch himself).
 */
export function dayModel(state, date, today, opts = {}) {
  const plan = getPlan(state).day(date);
  if (!plan) return null;
  const dayLog = state.log[date] || {};
  const ids = plan.morning.sessions;
  const runId = ids.find((id) => id.startsWith('RUN-')) || null;
  const strengthId = ids.find((id) => id === 'STR-A' || id === 'PULL') || null;
  const hasArmor = ids.includes('ARM-B');
  const kind = runId ? 'run' : strengthId ? 'strength' : 'simple';
  const main = SESSIONS[runId || strengthId || ids[0]];

  const morning = {
    ids, kind, runId, strengthId, hasArmor,
    modifier: plan.morning.modifier,
    doneBy: WEEKLY_TEMPLATE[weekday(date)].doneBy,
    notes: plan.notes,
    benchmarks: plan.benchmarks,
    attempt: plan.attempt,
    entry: dayLog.morning || null,
    miles: plan.runMiles,
    converted: null,
    fallback: false,
    crossMinutes: null,
  };

  if (kind === 'run') {
    const running = runMinutes(plan.runMiles, paceSeconds(state.log, date));
    morning.converted = runConversion(state, date, today);
    // The manual switch, once touched, wins over the forecast.
    morning.fallback = (dayLog.fallback ?? opts.weatherTreadmill ?? false) === true && !morning.converted;
    morning.crossMinutes = running;
    const armor = hasArmor ? SESSIONS['ARM-B'].minutes[1] : 0;
    if (morning.converted) {
      morning.title = `Cross-train ${running} min`;
      morning.sub = 'Bike or elliptical, same easy effort. No running today.';
      morning.minutesText = `About ${running + armor} min`;
    } else {
      morning.title = plan.attempt
        ? '10 miles nonstop'
        : `${runId === 'RUN-L' ? 'Long run' : 'Easy'} ${fmtMiles(plan.runMiles)}`;
      morning.sub = runId === 'RUN-L'
        ? 'Start the first mile slower than feels necessary.'
        : 'Full sentences the whole way.';
      morning.minutesText = `About ${running + WARMUP_COOLDOWN_MIN + armor} min`;
    }
    if (hasArmor) morning.sub += ` Then the Armor circuit${plan.morning.modifier === 'light' ? ' (light)' : ''}.`;
  } else {
    const lite = plan.morning.modifier === 'lite';
    morning.title = main.name + (lite ? ' (lite)' : '');
    morning.sub = '';
    let [lo, hi] = main.minutes || [null, null];
    if (strengthId === 'STR-A' && lite) [lo, hi] = [null, 35];
    morning.minutesText = lo ? `${lo}–${hi} min` : hi ? `${hi} min` : '';
  }

  const evening = plan.evening
    ? {
        id: plan.evening.session,
        optional: plan.evening.optional,
        session: SESSIONS[plan.evening.session],
        entry: dayLog.evening || null,
      }
    : null;

  return { date, plan, log: dayLog, morning, evening };
}

/** Short label for week rows and history: "Easy 2.5 + Armor", "Legs + Armor", "Reset". */
export function shortLabel(plan) {
  const short = {
    'STR-A': 'Legs + Armor', PULL: 'Lock & Pull', RESET: 'Reset', AER: 'Aerobic', WALK: 'Walk', 'ARM-B': 'Armor',
  };
  const parts = plan.morning.sessions.map((id) => {
    if (id === 'RUN-E') return `Easy ${fmtMiles(plan.runMiles)}`;
    if (id === 'RUN-L') return plan.attempt ? '10 miles nonstop' : `Long run ${fmtMiles(plan.runMiles)}`;
    return short[id];
  });
  return parts.join(' + ') + (plan.morning.modifier ? ` (${plan.morning.modifier})` : '');
}

/** Most recent logged weight × reps for a tracked lift before `date`, or null. */
export function lastLift(log, liftId, date) {
  const dates = Object.keys(log).filter((d) => d < date).sort().reverse();
  for (const d of dates) {
    const lift = log[d].morning?.strength?.lifts?.[liftId];
    if (lift && (lift.weight || lift.reps)) return { ...lift, date: d };
  }
  return null;
}

export function fmtTime(seconds) {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
}

/** Pace as "11:00" per mile, or null when it cannot be calculated. */
export function fmtPace(miles, seconds) {
  if (!(miles > 0) || !(seconds > 0)) return null;
  return fmtTime(Math.round(seconds / miles));
}

/** One-line summary of a logged entry. */
export function entrySummary(entry) {
  if (!entry) return '';
  if (entry.status === 'skipped') return entry.reason ? `Skipped — ${entry.reason.toLowerCase()}` : 'Skipped';
  const bits = [];
  if (entry.run) {
    const r = entry.run;
    if (r.surface === 'cross-train') {
      bits.push(r.seconds ? `Cross-train ${fmtTime(r.seconds)}` : 'Cross-train');
    } else {
      bits.push(r.seconds ? `${fmtMiles(r.miles)} mi in ${fmtTime(r.seconds)}` : `${fmtMiles(r.miles)} mi`);
      const pace = fmtPace(r.miles, r.seconds);
      if (pace) bits.push(`${pace}/mi`);
      if (r.surface === 'treadmill') bits.push('treadmill');
      if (r.nonstop === false) bits.push('walk breaks');
    }
    if (Number.isFinite(r.shin)) bits.push(`shin ${r.shin}`);
  } else if (entry.strength) {
    const lifts = Object.entries(entry.strength.lifts || {})
      .filter(([, l]) => l.weight || l.reps)
      .map(([id, l]) => `${LIFT_NAMES[id].split(' ').at(-1)} ${l.weight || 0} × ${l.reps || 0}`);
    bits.push('Done', ...lifts);
  } else if (entry.climb) {
    bits.push('Done', entry.climb.grade);
    if (Number.isFinite(entry.climb.ache)) bits.push(`ache ${entry.climb.ache}`);
  } else {
    bits.push('Done');
  }
  return bits.filter(Boolean).join(' · ');
}
