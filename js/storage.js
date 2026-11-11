// Everything Nate logs lives in localStorage under ONE key, with a schema version inside.
// A redeploy never touches it. If the shape changes, bump VERSION and add a migration.
//
// State shape (version 1):
// {
//   v: 1,
//   log: {
//     'YYYY-MM-DD': {
//       morning?: Entry,            // the morning session
//       evening?: Entry,            // the climb
//       shinAm?: { score, at },     // 0–10 on waking
//       painFree?: true,            // daily check while running is locked (red)
//       fallback?: true,            // "icy or too cold" switch for that day's run
//     }
//   },
//   settings: { location, theme, verse, track },
//   overrides: [{ date, kind, reason, at }],   // deliberate overrides of a shin lock
//   clearedOn: 'YYYY-MM-DD' | null,            // he confirmed he is cleared to run after a red
// }
//
// Entry: { status: 'done' | 'skipped', reason?, notes?, at,
//          run?: { miles, seconds, nonstop, surface, effort, shin },
//          strength?: { checked: [exercise numbers], lifts: { id: { weight, reps } }, lockoffRounds },
//          climb?: { grade, ache },
//          benchmarks?: { talk2Seconds, calfLeft, calfRight, pullupLb, lockoffLeft, lockoffRight } }

export const STORAGE_KEY = 'ten-mile-tracker';
export const VERSION = 1;

export function defaultState() {
  return {
    v: VERSION,
    log: {},
    settings: { location: 'east-lansing', theme: 'system', verse: true, track: 'A' },
    overrides: [],
    clearedOn: null,
  };
}

// migrations[n] upgrades a version-n state to version n + 1.
const migrations = {};

const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

/** Check that a parsed value is a usable state. Returns { ok, error }. */
export function validate(data) {
  if (!isObject(data)) return { ok: false, error: 'Not a tracker backup file.' };
  if (!Number.isInteger(data.v) || data.v < 1) return { ok: false, error: 'Missing version number.' };
  if (data.v > VERSION) return { ok: false, error: 'This backup is from a newer version of the site.' };
  if (!isObject(data.log)) return { ok: false, error: 'Missing log.' };
  for (const [date, day] of Object.entries(data.log)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isObject(day)) {
      return { ok: false, error: `Bad log entry: ${date}` };
    }
  }
  return { ok: true, error: null };
}

/** Bring any valid older state up to the current version and fill in missing fields. */
export function migrate(data) {
  let state = structuredClone(data);
  while (state.v < VERSION) {
    const step = migrations[state.v];
    if (!step) throw new Error(`No migration from version ${state.v}`);
    state = step(state);
    state.v += 1;
  }
  const base = defaultState();
  return {
    ...base,
    ...state,
    settings: { ...base.settings, ...(isObject(state.settings) ? state.settings : {}) },
    overrides: Array.isArray(state.overrides) ? state.overrides : [],
  };
}

/**
 * Load state. Never throws: missing data gives a fresh state; unreadable data is copied
 * to a ".corrupt" key (so nothing is silently destroyed) and a fresh state is returned.
 */
export function load(storage) {
  let raw = null;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return defaultState();
  }
  if (raw === null || raw === undefined) return defaultState();
  try {
    const data = JSON.parse(raw);
    if (!validate(data).ok) throw new Error('invalid');
    return migrate(data);
  } catch {
    try {
      storage.setItem(`${STORAGE_KEY}.corrupt`, raw);
    } catch {
      /* nothing more we can do */
    }
    return defaultState();
  }
}

/** Save state. Returns false if the browser refused (private mode, full disk). */
export function save(storage, state) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

/** The text of a backup file. */
export function exportText(state) {
  return JSON.stringify({ ...state, exportedAt: new Date().toISOString() }, null, 2);
}

/** Parse a backup file. Returns { ok, state, error, days }. */
export function importText(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, state: null, error: 'That file is not valid JSON.', days: 0 };
  }
  const check = validate(data);
  if (!check.ok) return { ok: false, state: null, error: check.error, days: 0 };
  delete data.exportedAt;
  const state = migrate(data);
  return { ok: true, state, error: null, days: Object.keys(state.log).length };
}

/** Return a new state with one slot of one day replaced (or removed when value is null). */
export function setDaySlot(state, date, slot, value) {
  const day = { ...(state.log[date] || {}) };
  if (value === null || value === undefined) delete day[slot];
  else day[slot] = value;
  const log = { ...state.log };
  if (Object.keys(day).length) log[date] = day;
  else delete log[date];
  return { ...state, log };
}
