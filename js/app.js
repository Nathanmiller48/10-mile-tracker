// App glue: state, routing, rendering and events. Logic lives in the pure modules.
import { load, save, setDaySlot, defaultState, exportText, importText } from './storage.js';
import { resolveToday, isISODate } from './dates.js';
import { dayModel, fmtPace } from './day.js';
import { shinStatus } from './shin.js';
import {
  dayView, weekView, progressView, libraryView, moreView, safetyView, historyView, settingsView, aboutView,
} from './views.js';
import { sheetHTML, readSheet, buildEntry } from './sheet.js';

const app = document.getElementById('app');
const sheet = document.getElementById('sheet');
const tabs = document.getElementById('tabs');

let state = load(localStorage);
const ctx = (() => {
  const { date, overridden } = resolveToday(location.search);
  return { today: date, overridden };
})();
// Transient UI state: never saved.
const ui = { armed: null, week: null, sheet: null, importPending: null, importError: null, notice: null };

function applyTheme() {
  const theme = state.settings.theme;
  if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

function commit(next) {
  state = next;
  if (!save(localStorage, state)) ui.notice = 'Could not save on this phone. Check that storage is not full or blocked.';
  applyTheme();
  render();
}

function route() {
  const parts = (location.hash.replace(/^#\/?/, '') || 'today').split('/');
  return { tab: parts[0], arg: parts[1] || null };
}

let lastRouteKey = null;
function render() {
  const { tab, arg } = route();
  let html;
  let active = tab;
  if (tab === 'day' && isISODate(arg)) {
    html = dayView(state, ui, ctx, arg);
    active = arg === ctx.today ? 'today' : 'week';
  } else if (tab === 'week') html = weekView(state, ui, ctx);
  else if (tab === 'progress') html = progressView(state, ui, ctx);
  else if (tab === 'library') html = libraryView();
  else if (tab === 'more') {
    if (arg === 'safety') html = safetyView();
    else if (arg === 'history') html = historyView(state);
    else if (arg === 'settings') html = settingsView(state, ui);
    else if (arg === 'about') html = aboutView();
    else html = moreView();
  } else {
    html = dayView(state, ui, ctx, ctx.today);
    active = 'today';
  }
  const key = `${tab}/${arg}`;
  const scroll = key === lastRouteKey ? window.scrollY : 0;
  // Keep open <details> open across re-renders of the same screen.
  const open = key === lastRouteKey
    ? [...app.querySelectorAll('details[open]')].map((d) => d.querySelector('summary')?.textContent)
    : [];
  app.innerHTML = html;
  for (const d of app.querySelectorAll('details')) {
    if (open.includes(d.querySelector('summary')?.textContent)) d.open = true;
  }
  window.scrollTo(0, scroll);
  if (key !== lastRouteKey) app.querySelector('h1')?.focus?.();
  lastRouteKey = key;
  for (const a of tabs.querySelectorAll('a')) {
    if (a.dataset.tab === active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
}

// ---------- the logging sheet ----------

function openSheet(date, slot, mode = null) {
  const model = dayModel(state, date, ctx.today);
  if (!model) return;
  const entry = slot === 'morning' ? model.morning.entry : model.evening?.entry;
  ui.sheet = { date, slot, mode: mode || (entry?.status === 'skipped' ? 'skip' : 'log') };
  sheet.innerHTML = sheetHTML(state, model, slot, ui.sheet.mode);
  if (!sheet.open) sheet.showModal();
  sheet.scrollTop = 0;
  updatePace();
}

function closeSheet() {
  ui.sheet = null;
  if (sheet.open) sheet.close();
  sheet.innerHTML = '';
}

function updatePace() {
  const out = sheet.querySelector('[data-pace]');
  if (!out) return;
  const v = readSheet(sheet);
  const seconds = (Number(v.minutes) || 0) * 60 + (Number(v.seconds) || 0);
  const pace = v.surface === 'cross-train' ? null : fmtPace(Number(v.miles), seconds);
  out.textContent = pace ? `Pace ${pace} per mile` : '';
}

function saveSheet() {
  const form = sheet.querySelector('form');
  const { date, slot, mode, kind } = form.dataset;
  const result = buildEntry(kind, mode, readSheet(sheet));
  if (!result.ok) {
    const error = sheet.querySelector('[data-sheet-error]');
    error.textContent = result.error;
    error.hidden = false;
    error.scrollIntoView({ block: 'nearest' });
    return;
  }
  closeSheet();
  commit(setDaySlot(state, date, slot, result.entry));
}

// ---------- actions ----------

/** Two-tap confirmation: the first tap arms, the second runs. */
function twoTap(key, run) {
  if (ui.armed === key) {
    ui.armed = null;
    run();
  } else {
    ui.armed = key;
    render();
  }
}

const actions = {
  'open-sheet': (el) => openSheet(el.dataset.date, el.dataset.slot),
  'close-sheet': () => closeSheet(),
  'sheet-mode': (el) => openSheet(ui.sheet.date, ui.sheet.slot, el.dataset.mode),
  'save-entry': () => saveSheet(),
  'delete-entry': () => {
    const { date, slot } = ui.sheet;
    closeSheet();
    commit(setDaySlot(state, date, slot, null));
  },
  chip: (el) => {
    const group = el.closest('[data-chips]');
    const already = el.getAttribute('aria-pressed') === 'true';
    const optional = ['effort', 'ache', 'reason'].includes(group.dataset.chips);
    for (const b of group.querySelectorAll('button')) b.setAttribute('aria-pressed', 'false');
    if (already && optional) group.dataset.value = '';
    else {
      el.setAttribute('aria-pressed', 'true');
      group.dataset.value = el.dataset.value;
    }
    updatePace();
  },
  step: (el) => {
    const input = sheet.querySelector(`input[name="${el.dataset.target}"]`);
    const decimals = Number(input.dataset.decimals) || 0;
    const next = Math.max(Number(input.dataset.min) || 0, (Number(input.value) || 0) + Number(el.dataset.delta));
    input.value = String(Math.round(next * 10 ** decimals) / 10 ** decimals);
    updatePace();
  },
  'shin-am': (el) =>
    commit(setDaySlot(state, ctx.today, 'shinAm', { score: Number(el.dataset.score), at: new Date().toISOString() })),
  'pain-free': () => commit(setDaySlot(state, ctx.today, 'painFree', state.log[ctx.today]?.painFree ? null : true)),
  'confirm-cleared': () => twoTap('confirm-cleared', () => commit({ ...state, clearedOn: ctx.today })),
  'toggle-fallback': (el) =>
    commit(setDaySlot(state, el.dataset.date, 'fallback', state.log[el.dataset.date]?.fallback ? null : true)),
  'run-anyway': (el) =>
    twoTap(`run-anyway:${el.dataset.date}`, () => {
      const level = shinStatus(state, ctx.today).level;
      commit({
        ...state,
        overrides: [...state.overrides, { date: el.dataset.date, kind: 'run-anyway', reason: level, at: new Date().toISOString() }],
      });
    }),
  'switch-track': (el) => commit({ ...state, settings: { ...state.settings, track: el.dataset.track } }),
  week: (el) => {
    ui.week = Number(el.dataset.week);
    render();
  },
  export: () => {
    const blob = new Blob([exportText(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `10-mile-log-${ctx.today}.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    ui.notice = 'Backup file saved to your downloads.';
    render();
  },
  'import-confirm': () => {
    const next = ui.importPending.state;
    ui.importPending = null;
    ui.notice = 'Log replaced from the backup file.';
    commit(next);
  },
  'import-cancel': () => {
    ui.importPending = null;
    render();
  },
  reset: () =>
    twoTap('reset', () => {
      ui.notice = 'Log erased.';
      commit({ ...defaultState(), settings: state.settings });
    }),
};

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-action]');
  if (!el || el.disabled) {
    if (ui.armed && !event.target.closest('[data-action]')) {
      ui.armed = null;
      render();
    }
    return;
  }
  const action = actions[el.dataset.action];
  if (!action) return;
  // Tapping anything else disarms a pending two-tap confirmation.
  const armable = ['confirm-cleared', 'run-anyway', 'reset'].includes(el.dataset.action);
  if (!armable && ui.armed) ui.armed = null;
  if (el.dataset.action !== 'export') ui.notice = null;
  action(el);
});

document.addEventListener('change', async (event) => {
  const el = event.target;
  if (el.dataset.setting) {
    const value = el.type === 'checkbox' ? el.checked : el.value;
    commit({ ...state, settings: { ...state.settings, [el.dataset.setting]: value } });
  } else if (el.dataset.actionChange === 'import-file' && el.files[0]) {
    const result = importText(await el.files[0].text());
    ui.importError = result.ok ? null : result.error;
    ui.importPending = result.ok ? { state: result.state, days: result.days } : null;
    ui.notice = null;
    render();
  }
});

sheet.addEventListener('input', updatePace);
sheet.addEventListener('close', () => {
  ui.sheet = null;
  sheet.innerHTML = '';
});
sheet.addEventListener('click', (event) => {
  if (event.target === sheet) closeSheet(); // tap on the backdrop
});

// Swipe between weeks.
let touchStart = null;
document.addEventListener('touchstart', (e) => {
  const list = e.target.closest('[data-swipe="week"]');
  touchStart = list ? { x: e.touches[0].clientX, y: e.touches[0].clientY, week: Number(list.dataset.week) } : null;
}, { passive: true });
document.addEventListener('touchend', (e) => {
  if (!touchStart) return;
  const dx = e.changedTouches[0].clientX - touchStart.x;
  const dy = e.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
    ui.week = Math.min(8, Math.max(1, touchStart.week + (dx < 0 ? 1 : -1)));
    render();
  }
  touchStart = null;
}, { passive: true });

window.addEventListener('hashchange', () => {
  ui.armed = null;
  ui.importPending = null;
  ui.importError = null;
  ui.notice = null;
  if (route().tab !== 'week' && route().tab !== 'day') ui.week = null;
  closeSheet();
  render();
});

applyTheme();
render();
