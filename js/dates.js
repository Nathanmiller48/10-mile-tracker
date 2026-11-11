// Date helpers. Dates are 'YYYY-MM-DD' strings everywhere; math is done in UTC so
// daylight-saving changes can never shift a day. Pure: no DOM, no clock unless passed in.
import { PLAN_DAYS, PLAN_START, PLAN_END, PLAN_WEEKS } from './data/plan.js';

const DAY_MS = 86_400_000;
export const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const toUTC = (iso) => {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const fromUTC = (ms) => new Date(ms).toISOString().slice(0, 10);

/** True for a real calendar date written as YYYY-MM-DD. */
export function isISODate(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && fromUTC(toUTC(value)) === value;
}

export const addDays = (iso, n) => fromUTC(toUTC(iso) + n * DAY_MS);
/** Whole days from a to b (positive when b is later). */
export const diffDays = (a, b) => Math.round((toUTC(b) - toUTC(a)) / DAY_MS);
export const weekdayIndex = (iso) => new Date(toUTC(iso)).getUTCDay();
export const weekday = (iso) => WEEKDAYS[weekdayIndex(iso)];
export const weekdayName = (iso) => WEEKDAY_NAMES[weekdayIndex(iso)];

/** "Tue, Nov 17" */
export function shortDate(iso) {
  const d = new Date(toUTC(iso));
  return `${WEEKDAYS[d.getUTCDay()]}, ${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}
/** "Nov 17" */
export function monthDay(iso) {
  const d = new Date(toUTC(iso));
  return `${MONTH_NAMES[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

/** The phone's local calendar date. */
export function localISO(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/**
 * Today's date: the ?date=YYYY-MM-DD override if present and valid, else the local date.
 * Returns { date, overridden }.
 */
export function resolveToday(search = '', now = new Date()) {
  const override = new URLSearchParams(search).get('date');
  if (isISODate(override)) return { date: override, overridden: true };
  return { date: localISO(now), overridden: false };
}

const BY_DATE = new Map(PLAN_DAYS.map((day) => [day.date, day]));
/** The plan entry for a date, or null outside the plan. */
export const planDay = (iso) => BY_DATE.get(iso) || null;

/** Monday of the week containing the date. */
export const mondayOf = (iso) => addDays(iso, -((weekdayIndex(iso) + 6) % 7));

const WEEK1_MONDAY = mondayOf(PLAN_START);

/**
 * Where a date sits relative to the plan.
 * phase: 'before' | 'during' | 'after'
 * week: 1..8 during the plan, else null
 * daysToStart: days until the plan starts (0 once started)
 * daysToTarget: days until the target date (0 on the day, negative after)
 */
export function planPosition(iso, targetDate = PLAN_END) {
  const phase = iso < PLAN_START ? 'before' : iso > PLAN_END ? 'after' : 'during';
  return {
    phase,
    week: phase === 'during' ? planDay(iso).week : null,
    totalWeeks: PLAN_WEEKS,
    daysToStart: Math.max(0, diffDays(iso, PLAN_START)),
    daysToTarget: diffDays(iso, targetDate),
  };
}

/** The seven dates, Monday to Sunday, of plan week n (week 1 starts Mon Nov 9). */
export function weekDates(week) {
  const monday = addDays(WEEK1_MONDAY, (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Plan week number for any date (can be < 1 or > 8 outside the plan). */
export const weekNumber = (iso) => Math.floor(diffDays(WEEK1_MONDAY, iso) / 7) + 1;
