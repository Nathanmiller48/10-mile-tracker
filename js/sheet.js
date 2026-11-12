// The logging bottom sheet: its HTML, and turning what he tapped into a log entry.
// buildEntry is pure so it can be unit tested.
import { SESSIONS } from './data/content.js';
import { shortDate } from './dates.js';
import { exercisesFor, lastLift, paceSeconds, runMinutes, TRACKED_LIFTS, LIFT_NAMES } from './day.js';
import { esc } from './html.js';

export const SKIP_REASONS = ['Exams', 'Travel', 'Sick', 'Shin', 'Weather', 'Other'];

const num = (v) => {
  if (v === '' || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** A group of tap targets where one is selected. Value lives in data-value. */
function chips(name, options, selected, { label, grid = false } = {}) {
  const buttons = options
    .map(([value, text]) => {
      const on = String(value) === String(selected ?? '');
      return `<button type="button" class="${grid ? 'num' : 'chip-btn'}" data-action="chip" data-value="${esc(value)}" aria-pressed="${on}">${esc(text)}</button>`;
    })
    .join('');
  return `<div class="${grid ? 'num-grid' : 'chip-row'}" role="group" aria-label="${esc(label || name)}" data-chips="${esc(name)}" data-value="${esc(selected ?? '')}">${buttons}</div>`;
}

const scale = (name, from, selected, label) =>
  chips(name, Array.from({ length: 11 - from }, (_, i) => [i + from, String(i + from)]), selected, { label, grid: true });

function stepper(name, value, step, label, { min = 0, decimals = 0 } = {}) {
  return `<div class="stepper">
    <button type="button" class="step" data-action="step" data-target="${name}" data-delta="${-step}" aria-label="Less ${esc(label)}">−</button>
    <input name="${name}" inputmode="decimal" value="${esc(value ?? '')}" aria-label="${esc(label)}" data-min="${min}" data-decimals="${decimals}">
    <button type="button" class="step" data-action="step" data-target="${name}" data-delta="${step}" aria-label="More ${esc(label)}">+</button>
  </div>`;
}

const field = (label, body, hint = '') =>
  `<div class="f"><p class="f-label">${esc(label)}${hint ? `<span class="f-hint">${esc(hint)}</span>` : ''}</p>${body}</div>`;

function benchmarkFields(benchmarks, existing = {}) {
  return benchmarks
    .map(({ id, round }) => {
      const tag = `Benchmark #${round}`;
      if (id === 'talk2') {
        const s = existing.talk2Seconds;
        return field(`${tag}: talk-test 2-mile time`, `<div class="pair">
          <label><input name="talk2Min" inputmode="numeric" value="${s ? Math.floor(s / 60) : ''}" aria-label="2-mile minutes"><span>min</span></label>
          <label><input name="talk2Sec" inputmode="numeric" value="${s ? s % 60 : ''}" aria-label="2-mile seconds"><span>sec</span></label></div>`, 'easy effort, same flat route');
      }
      if (id === 'calf') {
        return field(`${tag}: single-leg calf raise`, `<div class="pair">
          <label><input name="calfLeft" inputmode="numeric" value="${esc(existing.calfLeft ?? '')}" aria-label="Calf raises left"><span>left</span></label>
          <label><input name="calfRight" inputmode="numeric" value="${esc(existing.calfRight ?? '')}" aria-label="Calf raises right"><span>right</span></label></div>`, 'max reps, full range');
      }
      if (id === 'pullup') {
        return field(`${tag}: weighted pull-up`, `<div class="pair">
          <label><input name="pullupLb" inputmode="decimal" value="${esc(existing.pullupLb ?? '')}" aria-label="Pull-up added weight in pounds"><span>lb added</span></label></div>`, 'heaviest clean set of 4');
      }
      if (id === 'lockoff') {
        return field(`${tag}: one-arm lock-off`, `<div class="pair">
          <label><input name="lockoffLeft" inputmode="numeric" value="${esc(existing.lockoffLeft ?? '')}" aria-label="Lock-off seconds left"><span>sec left</span></label>
          <label><input name="lockoffRight" inputmode="numeric" value="${esc(existing.lockoffRight ?? '')}" aria-label="Lock-off seconds right"><span>sec right</span></label></div>`, 'chin over bar');
      }
      return '';
    })
    .join('');
}

function runFields(state, model) {
  const m = model.morning;
  const e = m.entry?.run;
  const cross = m.converted !== null;
  const estMinutes = runMinutes(m.miles, paceSeconds(state.log, model.date));
  const seconds = e?.seconds ?? (cross ? m.crossMinutes : estMinutes) * 60;
  const surface = e?.surface ?? (cross ? 'cross-train' : m.fallback ? 'treadmill' : 'road');
  const miles = e?.miles ?? (cross ? 0 : m.miles);
  return `
    ${field('Distance', stepper('miles', miles, 0.5, 'miles', { decimals: 2 }), 'miles')}
    ${field('Time', `<div class="time-row">${stepper('minutes', Math.floor(seconds / 60), 1, 'minutes')}
        <label class="sec"><input name="seconds" inputmode="numeric" value="${String(seconds % 60).padStart(2, '0')}" aria-label="seconds"><span>sec</span></label></div>
        <p class="pace" data-pace aria-live="polite"></p>`, 'adjust to your watch')}
    ${field('Shin during the run', scale('shin', 0, e?.shin, 'Shin during the run, 0 to 10'), 'worst point, 0–10')}
    ${field('Nonstop', chips('nonstop', [['yes', 'Yes, no walk breaks'], ['no', 'Took walk breaks']], e ? (e.nonstop === false ? 'no' : 'yes') : 'yes', { label: 'Nonstop' }))}
    ${field('Surface', chips('surface', [['road', 'Road'], ['treadmill', 'Treadmill'], ['cross-train', 'Cross-train']], surface, { label: 'Surface' }))}
    ${field('Effort', scale('effort', 1, e?.effort, 'Effort, 1 to 10'), 'optional, 1–10')}
    <label class="check"><input type="checkbox" name="redFlag"${e?.redFlag ? ' checked' : ''}><span>Limping, pain when walking, or something on the doctor list</span></label>
    ${m.hasArmor ? `<label class="check"><input type="checkbox" name="armor"${m.entry ? (m.entry.armor ? ' checked' : '') : ' checked'}><span>Armor circuit done</span></label>` : ''}
    ${benchmarkFields(m.benchmarks, m.entry?.benchmarks)}`;
}

function strengthFields(state, model) {
  const m = model.morning;
  const id = m.strengthId;
  const e = m.entry?.strength;
  const tracked = TRACKED_LIFTS[id] || {};
  const rows = exercisesFor(id, model.plan)
    .filter((x) => x.n !== null)
    .map((x) => {
      const checked = e ? (e.checked || []).includes(x.n) : true;
      const liftId = tracked[x.n];
      let inputs = '';
      if (liftId) {
        const prev = e?.lifts?.[liftId] || lastLift(state.log, liftId, model.date) || {};
        inputs = `<div class="pair lift">
          <label><input name="lift_${liftId}_weight" inputmode="decimal" value="${esc(prev.weight ?? '')}" aria-label="${esc(LIFT_NAMES[liftId])} weight"><span>lb</span></label>
          <label><input name="lift_${liftId}_reps" inputmode="numeric" value="${esc(prev.reps ?? '')}" aria-label="${esc(LIFT_NAMES[liftId])} reps"><span>reps</span></label></div>`;
      }
      if (id === 'PULL' && x.n === 2) {
        const rounds = e?.lockoffRounds ?? (model.plan.week >= 3 ? 4 : 3);
        inputs = `<div class="lift"><p class="f-hint">rounds</p>${stepper('lockoffRounds', rounds, 1, 'lock-off rounds')}</div>`;
      }
      return `<div class="ex-check"><label class="check"><input type="checkbox" name="ex_${x.n}"${checked ? ' checked' : ''}><span>${esc(x.name)} <span class="ex-dose">${esc(x.dose)}</span></span></label>${inputs}</div>`;
    })
    .join('');
  return `${field('Exercises', rows, 'untick anything you skipped')}${benchmarkFields(m.benchmarks, m.entry?.benchmarks)}`;
}

function climbFields(model) {
  const e = model.evening.entry?.climb;
  const planned = { 'CLIMB-H': 'hard', 'CLIMB-M': 'medium', 'CLIMB-E': 'easy' }[model.evening.id];
  return `${field('How hard', chips('grade', [['hard', 'Hard'], ['medium', 'Medium'], ['easy', 'Easy']], e?.grade ?? planned, { label: 'Climb intensity' }))}
    ${field('Elbow or finger ache', scale('ache', 0, e?.ache, 'Elbow or finger ache, 0 to 10'), 'optional, 0–10')}`;
}

/** HTML for the sheet. mode: 'log' or 'skip'. */
export function sheetHTML(state, model, slot, mode) {
  const morning = slot === 'morning';
  const entry = morning ? model.morning.entry : model.evening.entry;
  const title = morning ? model.morning.title : model.evening.session.name;
  const kind = morning ? model.morning.kind : 'climb';
  const notes = `<div class="f"><label class="f-label" for="notes">Notes<span class="f-hint">optional</span></label><textarea id="notes" name="notes" rows="2">${esc(entry?.notes ?? '')}</textarea></div>`;

  let body;
  let saveLabel;
  if (mode === 'skip') {
    body = `${field('Reason', chips('reason', SKIP_REASONS.map((r) => [r, r]), entry?.status === 'skipped' ? entry.reason : '', { label: 'Reason for skipping' }), 'optional')}${notes}`;
    saveLabel = 'Mark skipped';
  } else if (kind === 'run') {
    body = runFields(state, model) + notes;
    saveLabel = model.morning.converted ? 'Log session' : 'Log run';
  } else if (kind === 'strength') {
    body = strengthFields(state, model) + notes;
    saveLabel = 'Log session';
  } else if (kind === 'climb') {
    body = climbFields(model) + notes;
    saveLabel = 'Log climb';
  } else {
    body = `${benchmarkFields(model.morning.benchmarks, entry?.benchmarks)}${notes}`;
    saveLabel = 'Mark done';
  }

  return `<form method="dialog" class="sheet-form" data-date="${model.date}" data-slot="${slot}" data-mode="${mode}" data-kind="${kind}" novalidate>
    <div class="sheet-head">
      <div><p class="eyebrow">${esc(shortDate(model.date))}</p><h2 id="sheet-title">${mode === 'skip' ? 'Skip: ' : ''}${esc(title)}</h2></div>
      <button type="button" class="btn btn-quiet sheet-close" data-action="close-sheet" aria-label="Close">Close</button>
    </div>
    <div class="sheet-body">${body}</div>
    <div class="sheet-actions">
      ${mode === 'skip'
        ? '<button type="button" class="btn btn-quiet" data-action="sheet-mode" data-mode="log">Log it instead</button>'
        : '<button type="button" class="btn btn-quiet" data-action="sheet-mode" data-mode="skip">Skip this session</button>'}
      ${entry ? '<button type="button" class="btn btn-quiet" data-action="delete-entry">Remove this log</button>' : ''}
    </div>
    <div class="sheet-save">
      <p class="error" data-sheet-error role="alert" hidden></p>
      <button type="button" class="btn btn-primary" data-action="save-entry">${saveLabel}</button>
    </div>
  </form>`;
}

/** Collect inputs and chip selections from the sheet. */
export function readSheet(root) {
  const values = {};
  for (const input of root.querySelectorAll('input[name], textarea[name]')) {
    values[input.name] = input.type === 'checkbox' ? input.checked : input.value.trim();
  }
  for (const group of root.querySelectorAll('[data-chips]')) values[group.dataset.chips] = group.dataset.value;
  return values;
}

function benchmarkValues(v) {
  const out = {};
  const talk = (num(v.talk2Min) ?? 0) * 60 + (num(v.talk2Sec) ?? 0);
  if (talk > 0) out.talk2Seconds = talk;
  for (const key of ['calfLeft', 'calfRight', 'pullupLb', 'lockoffLeft', 'lockoffRight']) {
    if (num(v[key]) !== null) out[key] = num(v[key]);
  }
  return Object.keys(out).length ? out : null;
}

/**
 * Turn sheet values into a log entry.
 * Returns { ok: true, entry } or { ok: false, error }.
 */
export function buildEntry(kind, mode, v, now = new Date().toISOString()) {
  const notes = v.notes ? { notes: v.notes } : {};
  if (mode === 'skip') {
    return { ok: true, entry: { status: 'skipped', ...(v.reason ? { reason: v.reason } : {}), ...notes, at: now } };
  }
  const entry = { status: 'done', ...notes, at: now };
  const benchmarks = benchmarkValues(v);
  if (benchmarks) entry.benchmarks = benchmarks;

  if (kind === 'run') {
    const surface = v.surface || 'road';
    const miles = num(v.miles) ?? 0;
    const seconds = (num(v.minutes) ?? 0) * 60 + (num(v.seconds) ?? 0);
    const shin = num(v.shin);
    if (surface !== 'cross-train' && !(miles > 0)) return { ok: false, error: 'Enter the distance you ran.' };
    if (surface !== 'cross-train' && shin === null) return { ok: false, error: 'Tap your shin score for this run, 0 to 10.' };
    if (miles < 0 || miles > 30) return { ok: false, error: 'That distance does not look right.' };
    entry.run = {
      miles: surface === 'cross-train' ? 0 : Math.round(miles * 100) / 100,
      seconds,
      nonstop: surface === 'cross-train' ? false : v.nonstop !== 'no',
      surface,
      ...(num(v.effort) !== null ? { effort: num(v.effort) } : {}),
      ...(shin !== null ? { shin } : {}),
      ...(v.redFlag ? { redFlag: true } : {}),
    };
    if ('armor' in v) entry.armor = v.armor === true;
  } else if (kind === 'strength') {
    const checked = Object.keys(v).filter((k) => /^ex_\d+$/.test(k) && v[k]).map((k) => Number(k.slice(3)));
    const lifts = {};
    for (const key of Object.keys(v)) {
      const m = key.match(/^lift_(\w+)_(weight|reps)$/);
      if (m && num(v[key]) !== null) (lifts[m[1]] ||= {})[m[2]] = num(v[key]);
    }
    entry.strength = { checked, lifts, ...(num(v.lockoffRounds) !== null ? { lockoffRounds: num(v.lockoffRounds) } : {}) };
  } else if (kind === 'climb') {
    entry.climb = { grade: v.grade || 'medium', ...(num(v.ache) !== null ? { ache: num(v.ache) } : {}) };
  }
  return { ok: true, entry };
}

/** Session name for a sheet opened on a simple recovery day (used by tests). */
export const sessionName = (id) => SESSIONS[id].name;
