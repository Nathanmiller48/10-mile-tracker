// Screens. Each function returns an HTML string; app.js owns state and events.
import {
  SESSIONS, FALLBACK, SHIN_RULES, DOCTOR_LIST, ATTEMPT_DAY, SOURCES, WEEKLY_TEMPLATE,
} from './data/content.js';
import { weekdayName, weekday, monthDay, shortDate, addDays } from './dates.js';
import { getPlan, planPosition, weekDates } from './plan.js';
import { shinStatus, runsFromLog } from './shin.js';
import {
  dayModel, exercisesFor, shinAction, shortLabel, lastLift, entrySummary, TRACKED_LIFTS,
} from './day.js';
import { runTotals, nextMilestone } from './milestones.js';
import { failedGate } from './gates.js';
import { esc, inline, renderBlocks, shinChip } from './html.js';
import { mileMarkers, mileToX, ROUTE_MILES } from './route.js';
import { verdictFor, sessionHour } from './weather.js';
import { verseFor, esvUrl } from './verse.js';

export const NOT_MEDICAL = 'Not medical advice.';

const REASON_TEXT = {
  'during-3-4': 'Shin reached 3–4 during your last run.',
  'morning-worse': 'Shin was worse the morning after your last run.',
  'morning-3-plus': 'Shin was 3 or more the morning after your last run.',
  'creeping-up': 'Shin has crept up three runs in a row.',
  'during-5-plus': 'Shin reached 5 or more during your last run.',
  'morning-5-plus': 'Shin was 5 or more the morning after your last run.',
  'red-flag': 'You reported limping, pain when walking, or a doctor-list sign.',
};


// ---------- shared pieces ----------

/** The 10-mile line, filled to his longest nonstop run. */
export function routeStrip(longest, { big = false } = {}) {
  const [x0, x1, y] = [10, 330, 16];
  const fillX = mileToX(longest, x0, x1);
  const marks = mileMarkers(x0, x1)
    .map(({ mile, x }) => {
      const done = mile <= longest && mile > 0;
      const goal = mile === ROUTE_MILES;
      return `<line class="route-tick${done ? ' is-done' : ''}" x1="${x}" y1="${y - 6}" x2="${x}" y2="${y + 6}"/>
        <text class="route-label${goal ? ' is-goal' : ''}" x="${x}" y="${y + 24}">${mile}</text>`;
    })
    .join('');
  const label = longest > 0
    ? `Longest nonstop run: ${longest} of 10 miles`
    : 'Ten miles. No runs logged yet';
  return `<section class="route${big ? ' route-big' : ''}" aria-label="The route">
    <svg viewBox="0 0 340 46" role="img" aria-label="${esc(label)}">
      <line class="route-line" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>
      ${longest > 0 ? `<line class="route-fill" x1="${x0}" y1="${y}" x2="${fillX}" y2="${y}"/>` : ''}
      ${marks}
      <circle class="route-dot" cx="${fillX}" cy="${y}" r="6"/>
    </svg>
    <p class="route-caption">${longest > 0 ? `Longest nonstop: <strong>${longest} mi</strong>` : 'Your longest nonstop run fills this line.'}</p>
  </section>`;
}

/** Verse of the day: small, at the bottom of Today. Off in Settings. */
function verseBlock(state, today) {
  if (!state.settings.verse) return '';
  const v = verseFor(today);
  return `<figure class="verse">
    <blockquote>${esc(v.text)}</blockquote>
    <figcaption><a href="${esc(esvUrl(v.ref))}" rel="noopener" target="_blank" aria-label="${esc(v.ref)}, open in the ESV">${esc(v.ref)}</a> <span class="quiet">BSB</span></figcaption>
  </figure>`;
}

function statusPill(entry, date, today) {
  if (entry?.status === 'done') return '<span class="pill pill-done">Done</span>';
  if (entry?.status === 'skipped') return '<span class="pill">Skipped</span>';
  if (date === today) return '<span class="pill pill-today">Today</span>';
  return date > today ? '<span class="pill pill-quiet">Upcoming</span>' : '<span class="pill pill-quiet">Not logged</span>';
}

function loggedLine(entry) {
  if (!entry) return '';
  const notes = entry.notes ? `<p class="logged-notes">${esc(entry.notes)}</p>` : '';
  return `<p class="logged"><span class="logged-mark" aria-hidden="true">${entry.status === 'done' ? '✓' : '–'}</span> ${esc(entrySummary(entry))}</p>${notes}`;
}

function exerciseRows(sessionId, plan, log, date) {
  const tracked = TRACKED_LIFTS[sessionId] || {};
  return exercisesFor(sessionId, plan)
    .map((e) => {
      const liftId = tracked[e.n];
      const last = liftId ? lastLift(log, liftId, date) : null;
      const lastText = last ? `<span class="last-time">Last: ${esc(last.weight || 0)} × ${esc(last.reps || 0)}</span>` : '';
      const body = e.notes ? `<p>${inline(e.notes)}</p>` : '';
      const head = `<span class="ex-name">${esc(e.name)}</span><span class="ex-dose">${esc(e.dose)}</span>${lastText}`;
      return e.notes
        ? `<details class="ex"><summary>${head}</summary>${body}</details>`
        : `<div class="ex ex-flat">${head}</div>`;
    })
    .join('');
}

// ---------- Today / any single day ----------

function shinCheck(today) {
  const buttons = Array.from({ length: 11 }, (_, n) =>
    `<button type="button" class="num" data-action="shin-am" data-score="${n}" aria-label="Shin ${n} out of 10">${n}</button>`,
  ).join('');
  return `<section class="card card-ask" aria-labelledby="shin-am-title">
    <h2 id="shin-am-title">How is your shin this morning?</h2>
    <p class="quiet">0 is nothing, 10 is the worst. Walk a few steps and press along the shin first.</p>
    <div class="num-grid" role="group" aria-label="Shin this morning, 0 to 10">${buttons}</div>
  </section>`;
}

function shinBanner(status, state, ui, today) {
  if (status.level === 'green' && !status.restartAfterRed) return '';
  if (status.restartAfterRed) {
    return `<section class="card banner shin-border-yellow" role="status">
      <h2>Cleared to restart</h2>
      <p>Restart at less than half your previous weekly mileage. That means Track B.</p>
      ${trackButton(state)}
      <p class="fine">${NOT_MEDICAL} <a href="#/more/safety">Shin rules</a></p>
    </section>`;
  }
  const reasons = status.reasons.map((r) => `<li>${esc(REASON_TEXT[r] || r)}</li>`).join('');
  let extra = '';
  if (status.level === 'yellow') {
    extra = status.inNoRunWindow
      ? `<p><strong>No running until ${esc(shortDate(status.noRunEarliest))} at the earliest</strong> (48–72 hours). Your next scheduled run is cross-training.</p>`
      : '<p>Your next scheduled run is cross-training. After that, restart by repeating the previous week.</p>';
  } else {
    const today_ok = state.log[today]?.painFree === true;
    extra = `<div class="lock">
      <p><strong>Running is locked.</strong> Pain-free days in a row: <strong>${status.painFreeStreak} of ${status.painFreeNeeded}</strong>.</p>
      <button type="button" class="btn ${today_ok ? 'btn-quiet' : 'btn-secondary'}" data-action="pain-free" aria-pressed="${today_ok}">
        ${today_ok ? 'Today marked pain-free. Undo' : 'Today was pain-free'}
      </button>
      ${status.canConfirmCleared
        ? `<button type="button" class="btn btn-secondary" data-action="confirm-cleared">
            ${ui.armed === 'confirm-cleared' ? 'Tap again to confirm you are cleared to run' : 'I am cleared to restart'}
          </button>`
        : ''}
      <details class="doctor"><summary>When to see a doctor</summary>
        <ul class="prose-list">${DOCTOR_LIST.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>
      </details>
    </div>`;
  }
  return `<section class="card banner shin-border-${status.level}" role="status">
    <h2>Shin: ${shinChip(status.level)}</h2>
    <ul class="prose-list reasons">${reasons}</ul>
    ${extra}
    <p class="action">${inline(shinAction(status.level))}</p>
    ${trackButton(state)}
    <p class="fine">${NOT_MEDICAL} <a href="#/more/safety">Shin rules and when to see a doctor</a></p>
  </section>`;
}

function gateCard(state, today) {
  const failed = failedGate(state, getPlan(state), today);
  // Once he has answered for a week (switched, or chosen to stay), do not ask again.
  if (!failed || failed.week <= (state.gateAnswered || 0)) return '';
  const which = failed.gates.filter((g) => g.pass === false).map((g) => `<li>${esc(g.text)}</li>`).join('');
  return `<section class="card banner" role="status">
    <h2>Week ${failed.week} gate not passed</h2>
    <ul class="prose-list reasons">${which}</ul>
    <p>The plan's answer is Track B: the 10-miler moves to January. Switching is not failing.</p>
    ${trackButton(state)}
    <button type="button" class="btn btn-quiet" data-action="stay-track" data-week="${failed.week}">Stay on Track A for now</button>
    <p class="fine"><a href="#/progress">See all gates</a></p>
  </section>`;
}

function unlockCard(ui) {
  if (!ui.unlocked?.length) return '';
  return `<section class="card unlock" role="status" aria-live="polite">
    <span class="unlock-dot" aria-hidden="true"></span>
    <div><p class="eyebrow">Milestone reached</p>${ui.unlocked.map((n) => `<p class="unlock-name">${esc(n)}</p>`).join('')}</div>
    <a class="btn btn-quiet unlock-link" href="#/progress">See the route</a>
  </section>`;
}

function trackButton(state) {
  if (state.settings.track === 'B') return '<p class="quiet">You are on Track B.</p>';
  return `<button type="button" class="btn btn-secondary" data-action="switch-track" data-track="B">Switch to Track B</button>
    <p class="quiet">Your call. You can switch back in Settings.</p>`;
}

function runDetails(m) {
  const easy = SESSIONS['RUN-E'].blocks[0].items;
  const form = easy.find((i) => i.text.startsWith('Form'));
  const cues = form.children.slice(0, 3).map((c) => {
    // The cue is the bold lead-in, or failing that the first sentence.
    const text = c.text.match(/^\*\*(.+?)\*\*/)?.[1] || c.text.split(/\.\s/)[0];
    return `<li>${esc(text.replace(/\.$/, ''))}</li>`;
  });
  const stop = SESSIONS['RUN-L'].blocks[0].items.find((i) => i.text.startsWith('Stop rule'));
  const stopText = stop.text.replace(/\s*See section 7\.$/, '');
  const fallback = m.fallback
    ? `<p class="fallback-note"><strong>Treadmill, 1% incline, same distance, same easy effort.</strong> Counts fully, including milestones. No treadmill: same minutes on a bike or elliptical.</p>`
    : '';
  const armor = m.hasArmor
    ? `<details class="more"><summary>Armor circuit, ${SESSIONS['ARM-B'].minutes.join('–')} min</summary>
        <div class="ex-list">${SESSIONS['ARM-B'].exercises.map((e) => `<div class="ex ex-flat"><span class="ex-name">${esc(e.name)}</span><span class="ex-dose">${esc(e.dose)}</span></div>`).join('')}</div>
      </details>`
    : '';
  return `${fallback}
    <ul class="cues">${cues.join('')}</ul>
    <p class="stop-rule">${inline(stopText)} <a href="#/more/safety">Shin rules</a></p>
    <details class="more"><summary>Full session</summary>${renderBlocks(SESSIONS[m.runId].blocks)}${m.runId === 'RUN-L' ? renderBlocks(SESSIONS['RUN-E'].blocks) : ''}</details>
    ${armor}`;
}

function crossTrainDetails(m) {
  const armor = m.hasArmor ? '<p>Then the Armor circuit, with calf and tibialis work at bodyweight.</p>' : '';
  return `<p><strong>${m.crossMinutes} minutes</strong> on a bike or elliptical at conversational effort. Stop if the shin hurts.</p>${armor}`;
}

function morningCard(model, state, ui, today, isToday) {
  const m = model.morning;
  const date = model.date;
  let body;
  if (m.kind === 'run') body = m.converted ? crossTrainDetails(m) : runDetails(m);
  else if (m.kind === 'strength') {
    const session = SESSIONS[m.strengthId];
    const after = session.blocks.filter((b) => b.t !== 'table').slice(0, 1);
    body = `${renderBlocks(after)}<div class="ex-list">${exerciseRows(m.strengthId, model.plan, state.log, date)}</div>`;
  } else body = renderBlocks(SESSIONS[m.ids[0]].blocks);

  const meta = [m.minutesText, m.doneBy ? `<strong class="done-by">Done by ${esc(m.doneBy)}</strong>` : '']
    .filter(Boolean)
    .join('<span class="dot" aria-hidden="true"> · </span>');

  let switches = '';
  if (m.kind === 'run' && !m.entry && date >= today) {
    if (m.converted) {
      const key = `run-anyway:${date}`;
      switches = `<button type="button" class="btn btn-quiet" data-action="run-anyway" data-date="${date}">
        ${ui.armed === key ? 'This overrides the shin rule. Tap again to confirm' : 'Run anyway'}</button>`;
    } else {
      switches = `<button type="button" class="btn btn-quiet" data-action="toggle-fallback" data-date="${date}" aria-pressed="${m.fallback}">
        ${m.fallback ? 'Back to running outside' : 'Icy or too cold? Use treadmill instead'}</button>`;
    }
  }
  const overridden = (state.overrides || []).some((o) => o.date === date && o.kind === 'run-anyway');
  const logLabel = m.kind === 'run' ? (m.converted ? 'Log session' : 'Log run') : 'Log it';
  const primary = m.entry
    ? `<button type="button" class="btn btn-secondary" data-action="open-sheet" data-date="${date}" data-slot="morning">Edit log</button>`
    : `<button type="button" class="btn btn-primary" data-action="open-sheet" data-date="${date}" data-slot="morning">${logLabel}</button>`;

  return `<section class="card session" aria-labelledby="morning-title">
    <p class="eyebrow">${isToday ? 'This morning' : 'Morning'}${m.converted ? ` · shin ${m.converted}` : ''}</p>
    <h2 id="morning-title" class="session-title">${esc(m.title)}</h2>
    ${meta ? `<p class="session-meta">${meta}</p>` : ''}
    ${model.weather && !m.entry ? `<p class="conditions">${model.weather.verdict === 'outside' ? `${esc(model.weather.conditions)}. <strong>Run outside.</strong>` : `<strong>${esc(model.weather.text)}</strong> <span class="quiet">${esc(model.weather.conditions)}.</span>`}</p>` : ''}
    ${m.sub ? `<p class="session-sub">${esc(m.sub)}</p>` : ''}
    ${m.notes ? `<p class="day-note">${esc(m.notes)}</p>` : ''}
    ${overridden ? '<p class="quiet">You chose to run despite the shin rule. That is recorded.</p>' : ''}
    ${loggedLine(m.entry)}
    <div class="session-actions">${primary}${switches}</div>
    <div class="session-body">${body}${model.weather ? '<p class="fine credit">Forecast: <a href="https://open-meteo.com/" rel="noopener" target="_blank">Open-Meteo</a></p>' : ''}</div>
  </section>`;
}

function eveningCard(model, isToday) {
  const e = model.evening;
  if (!e) {
    return `<section class="card card-quiet"><p class="eyebrow">${isToday ? 'This evening' : 'Evening'}</p><p class="off">Off.</p></section>`;
  }
  const button = e.entry
    ? `<button type="button" class="btn btn-secondary" data-action="open-sheet" data-date="${model.date}" data-slot="evening">Edit log</button>`
    : `<button type="button" class="btn btn-secondary" data-action="open-sheet" data-date="${model.date}" data-slot="evening">Log climb</button>`;
  return `<section class="card session" aria-labelledby="evening-title">
    <p class="eyebrow">${isToday ? 'This evening' : 'Evening'}${e.optional ? ' · optional' : ''}</p>
    <h2 id="evening-title" class="session-title session-title-small">${esc(e.session.name)}</h2>
    ${renderBlocks(e.session.blocks)}
    ${loggedLine(e.entry)}
    <div class="session-actions">${button}</div>
  </section>`;
}

function header(date, state, isToday) {
  const pos = planPosition(date, getPlan(state));
  const days = pos.daysToTarget;
  const countdown = days > 1 ? `${days} days to go` : days === 1 ? '1 day to go' : days === 0 ? 'Attempt day' : '';
  const week = pos.week ? `Week ${pos.week} of ${pos.totalWeeks}` : '';
  return `<header class="top">
    ${isToday ? '' : '<a class="back" href="#/week">‹ Week</a>'}
    <h1 class="date">${esc(weekdayName(date))} <span class="date-sub">${esc(monthDay(date))}</span></h1>
    <p class="meta">
      ${week ? `<span>${week}</span>` : ''}
      <span class="chip">Track ${esc(state.settings.track)}</span>
      ${countdown ? `<span>${countdown}</span>` : ''}
    </p>
  </header>`;
}

/**
 * The slim strip under the date: the route line filled to his longest nonstop run, and
 * the next milestone. SITE_SPEC section 6 wants both visible at 6:10am without scrolling,
 * so they sit above the session card rather than below it.
 */
function milestoneStrip(state, today) {
  const next = nextMilestone(state, today);
  const longest = runTotals(state.log, today).longestNonstop;
  const [x0, x1, y] = [4, 336, 6];
  const fillX = mileToX(longest, x0, x1);
  const caption = longest > 0 ? `Longest ${longest} mi` : 'Your longest nonstop run fills this line.';
  return `<a class="strip strip-slim" href="#/progress">
    <span class="route"><svg viewBox="0 0 340 12" role="img" aria-label="${longest > 0 ? `Longest nonstop run: ${longest} of 10 miles` : 'Ten miles. No runs logged yet'}">
      <line class="route-line" x1="${x0}" y1="${y}" x2="${x1}" y2="${y}"/>
      ${longest > 0 ? `<line class="route-fill" x1="${x0}" y1="${y}" x2="${fillX}" y2="${y}"/>` : ''}
      <circle class="route-dot" cx="${fillX}" cy="${y}" r="5"/>
      <circle class="route-end" cx="${x1}" cy="${y}" r="4"/>
    </svg></span>
    <span class="strip-row">${next ? `<span class="strip-text">${esc(next.text)}</span>` : ''}<span class="route-caption">${caption}</span></span>
  </a>`;
}

function outsidePlan(state, today, ctx) {
  const plan = getPlan(state);
  const PLAN_START = plan.start;
  const pos = planPosition(today, plan);
  const totals = runTotals(state.log, today);
  if (pos.phase === 'before') {
    const first = plan.day(PLAN_START);
    const days = pos.daysToStart;
    return `<header class="top"><h1 class="date">${esc(weekdayName(today))} <span class="date-sub">${esc(monthDay(today))}</span></h1></header>
      <section class="card session">
        <p class="eyebrow">The plan starts ${days === 1 ? 'tomorrow' : `in ${days} days`}</p>
        <h2 class="session-title">${esc(weekdayName(PLAN_START))}: ${esc(shortLabel(first))}</h2>
        <p class="day-note">${esc(first.notes)}</p>
        <p class="quiet">Nothing to log today. Lay out your kit.</p>
        <div class="session-actions"><a class="btn btn-secondary" href="#/day/${PLAN_START}">See the first day</a></div>
      </section>
      ${routeStrip(totals.longestNonstop)}
      ${verseBlock(state, today)}`;
  }
  return `<header class="top"><h1 class="date">${esc(weekdayName(today))} <span class="date-sub">${esc(monthDay(today))}</span></h1></header>
    <section class="card session">
      <p class="eyebrow">The plan is done</p>
      <h2 class="session-title">${totals.longestNonstop >= 10 ? '10 miles nonstop. Done.' : `Longest nonstop run: ${totals.longestNonstop} mi`}</h2>
      <p>${totals.totalMiles} miles logged across ${totals.runCount} runs.</p>
      <div class="session-actions"><a class="btn btn-secondary" href="#/more/history">See your history</a></div>
    </section>
    ${routeStrip(totals.longestNonstop)}`;
}

/** Today (isToday) or any other plan day opened from Week. */
export function dayView(state, ui, ctx, date) {
  const today = ctx.today;
  const isToday = date === today;
  const testNote = ctx.overridden && isToday
    ? `<p class="test-note">Showing ${esc(shortDate(today))} (test date). <a href="./">Back to the real today</a></p>`
    : '';
  // Forecast verdict for today's run, if a forecast is loaded and covers the hour.
  const weather = isToday && ui.forecast ? verdictFor(ui.forecast, date, sessionHour(weekday(date))) : null;
  const model = dayModel(state, date, today, { weatherTreadmill: weather ? weather.verdict === 'treadmill' : undefined });
  if (model) model.weather = model.morning.kind === 'run' && !model.morning.converted ? weather : null;
  if (!model) {
    if (isToday) return testNote + outsidePlan(state, today, ctx);
    return `<header class="top"><a class="back" href="#/week">‹ Week</a><h1 class="date">${esc(shortDate(date))}</h1></header>
      <section class="card"><p>No session planned on this day.</p></section>`;
  }
  const status = shinStatus(state, today);
  const totals = runTotals(state.log, today);
  const yesterday = addDays(today, -1);
  const ranYesterday = runsFromLog(state.log).some((r) => r.date === yesterday);
  const needsShin = isToday && ranYesterday && !state.log[today]?.shinAm;

  return `${testNote}
    ${header(date, state, isToday)}
    ${isToday ? milestoneStrip(state, today) : ''}
    ${needsShin ? shinCheck(today) : ''}
    ${isToday ? unlockCard(ui) : ''}
    ${isToday ? shinBanner(status, state, ui, today) : ''}
    ${isToday && status.level === 'green' && !status.restartAfterRed ? gateCard(state, today) : ''}
    ${morningCard(model, state, ui, today, isToday)}
    ${eveningCard(model, isToday)}
    ${isToday ? verseBlock(state, today) : ''}`;
}

// ---------- Week ----------

export function weekView(state, ui, ctx) {
  const today = ctx.today;
  const plan = getPlan(state);
  const planDay = (d) => plan.day(d);
  const [PLAN_START, PLAN_END, PLAN_WEEKS] = [plan.start, plan.end, plan.weeks];
  const current = planPosition(today, plan).week || (today < PLAN_START ? 1 : PLAN_WEEKS);
  const week = Math.min(PLAN_WEEKS, Math.max(1, ui.week ?? current));
  const dates = weekDates(week);
  const totals = runTotals(state.log, PLAN_END > today ? today : '9999-12-31');
  const planned = Math.round(dates.reduce((sum, d) => sum + (planDay(d)?.runMiles || 0), 0) * 10) / 10;
  const actual = totals.weekMiles[week] || 0;

  const rows = dates
    .map((date) => {
      const plan = planDay(date);
      const day = `<span class="wk-day"><span class="wk-dow">${weekday(date)}</span><span class="wk-date">${esc(monthDay(date).split(' ')[1])}</span></span>`;
      if (!plan) {
        return `<li class="wk-row wk-empty">${day}<span class="wk-main"><span class="wk-label">${date < PLAN_START ? 'Before the plan starts' : 'After the attempt'}</span></span></li>`;
      }
      const entry = state.log[date]?.morning;
      const evening = plan.evening
        ? `<span class="wk-evening">${esc(SESSIONS[plan.evening.session].name)}${plan.evening.optional ? ' (optional)' : ''}${state.log[date]?.evening?.status === 'done' ? ' ✓' : ''}</span>`
        : '';
      return `<li><a class="wk-row${date === today ? ' is-today' : ''}" href="#/day/${date}">
        ${day}
        <span class="wk-main"><span class="wk-label">${esc(shortLabel(plan))}</span>${evening}</span>
        <span class="wk-side">${plan.runMiles ? `<span class="wk-miles">${plan.runMiles} mi</span>` : ''}${statusPill(entry, date, today)}</span>
      </a></li>`;
    })
    .join('');

  return `<header class="top">
      <h1 class="date">Week ${week} <span class="date-sub">of ${PLAN_WEEKS}</span></h1>
      <p class="meta"><span>${esc(monthDay(dates[0]))} – ${esc(monthDay(dates[6]))}</span></p>
    </header>
    <div class="week-nav">
      <button type="button" class="btn btn-secondary" data-action="week" data-week="${week - 1}" ${week <= 1 ? 'disabled' : ''} aria-label="Previous week">‹ Earlier</button>
      <p class="week-miles"><strong>${actual}</strong> of ${planned} mi run</p>
      <button type="button" class="btn btn-secondary" data-action="week" data-week="${week + 1}" ${week >= PLAN_WEEKS ? 'disabled' : ''} aria-label="Next week">Later ›</button>
    </div>
    <ul class="wk-list" data-swipe="week" data-week="${week}">${rows}</ul>`;
}

// ---------- Library ----------

function librarySession(id) {
  const s = SESSIONS[id];
  const meta = s.when ? `<span class="lib-meta">${esc(s.when)}</span>` : s.minutes?.[1] ? `<span class="lib-meta">up to ${s.minutes[1]} min</span>` : '';
  const blocks = s.blocks.filter((b) => !(b.t === 'table' && b.head.includes('Exercise')) && !(id === 'ARM-B' && b.t === 'ul'));
  const exercises = s.exercises
    ? `<div class="ex-list">${s.exercises
        .map((e) => {
          const head = `<span class="ex-name">${esc(e.name)}</span><span class="ex-dose">${esc(e.dose)}</span>`;
          return e.notes ? `<details class="ex"><summary>${head}</summary><p>${inline(e.notes)}</p></details>` : `<div class="ex ex-flat">${head}</div>`;
        })
        .join('')}</div>`
    : '';
  const [before, after] = s.exercises ? [blocks.slice(0, 1), blocks.slice(1)] : [blocks, []];
  return `<details class="lib" id="lib-${id}">
    <summary><span class="lib-name">${esc(s.name)}</span>${meta}</summary>
    <div class="lib-body">${renderBlocks(before)}${exercises}${renderBlocks(after)}${s.sharedNote ? `<p>${inline(s.sharedNote)}</p>` : ''}</div>
  </details>`;
}

export function libraryView() {
  const order = ['RUN-E', 'RUN-L', 'STR-A', 'ARM-B', 'PULL', 'CLIMB-H', 'CLIMB-M', 'CLIMB-E', 'RESET', 'AER', 'WALK'];
  const template = Object.entries(WEEKLY_TEMPLATE)
    .map(([d, v]) => `<div class="stack-row"><p class="stack-head"><strong>${d}</strong>${v.doneBy ? ` · done by ${esc(v.doneBy)}` : ''}</p><p>${esc(v.morning)}</p><p class="quiet">Evening: ${esc(v.evening)}</p></div>`)
    .join('');
  return `<header class="top"><h1 class="date">Library</h1></header>
    <h2 class="section-title">Sessions</h2>
    <div class="lib-list">${order.map(librarySession).join('')}</div>
    <h2 class="section-title">Reference</h2>
    <div class="lib-list">
      <details class="lib"><summary><span class="lib-name">Ice and cold fallback</span><span class="lib-meta">applies to every run</span></summary><div class="lib-body">${renderBlocks(FALLBACK.blocks)}</div></details>
      <details class="lib"><summary><span class="lib-name">Attempt day</span><span class="lib-meta">Dec 31</span></summary><div class="lib-body">${renderBlocks(ATTEMPT_DAY.blocks)}</div></details>
      <details class="lib"><summary><span class="lib-name">Weekly template</span></summary><div class="lib-body"><div class="stack-table">${template}</div></div></details>
    </div>`;
}

// ---------- More ----------

export function moreView() {
  const link = (href, title, sub) => `<li><a class="nav-row" href="${href}"><span><span class="nav-title">${title}</span><span class="nav-sub">${sub}</span></span><span aria-hidden="true">›</span></a></li>`;
  return `<header class="top"><h1 class="date">More</h1></header>
    <ul class="nav-list">
      ${link('#/more/safety', 'Safety', 'Shin rules, self-checks, when to see a doctor')}
      ${link('#/more/history', 'History', 'Everything you have logged')}
      ${link('#/more/settings', 'Settings', 'Location, theme, backup, track')}
      ${link('#/more/about', 'About', 'Sources behind the plan')}
    </ul>`;
}

const subHeader = (title) => `<header class="top"><a class="back" href="#/more">‹ More</a><h1 class="date">${title}</h1></header>`;

export function safetyView() {
  return `${subHeader('Safety')}
    <p class="notice">${NOT_MEDICAL} These rules come from your plan and override everything else in it.</p>
    <section class="card prose"><h2>Shin rules</h2>${renderBlocks(SHIN_RULES.blocks)}</section>
    <section class="card prose"><h2>How this site reads the next-morning score</h2>
      <p>Your call, recorded Nov 11: the morning after a run is <strong>green</strong> if the score is no higher than your previous morning score and is 2 or under. It is <strong>yellow</strong> if it is higher than the previous morning, or 3 or more. A morning score of 5 or more is <strong>red</strong>.</p>
      <p>A during-run score that rises on each of three runs in a row is yellow, even if every score is 2 or under.</p>
    </section>
    <section class="card prose"><h2>${esc(DOCTOR_LIST.title)}</h2>
      <ul class="prose-list doctor-list">${DOCTOR_LIST.items.map((i) => `<li>${inline(i)}</li>`).join('')}</ul>
    </section>
    <p class="fine pad">${NOT_MEDICAL}</p>`;
}

export function historyView(state) {
  const active = getPlan(state);
  const dates = Object.keys(state.log).sort().reverse();
  const rows = dates
    .map((date) => {
      const day = state.log[date];
      const plan = active.day(date);
      const lines = [];
      if (day.shinAm) lines.push(`<p class="hist-line"><span class="hist-what">Morning shin</span> ${esc(day.shinAm.score)}</p>`);
      if (day.morning) lines.push(`<p class="hist-line"><span class="hist-what">${esc(plan ? shortLabel(plan) : 'Morning')}</span> ${esc(entrySummary(day.morning))}</p>`);
      if (day.evening) lines.push(`<p class="hist-line"><span class="hist-what">${esc(plan?.evening ? SESSIONS[plan.evening.session].name : 'Climb')}</span> ${esc(entrySummary(day.evening))}</p>`);
      if (day.painFree) lines.push('<p class="hist-line"><span class="hist-what">Shin</span> Pain-free day</p>');
      if (!lines.length) return '';
      return `<li><a class="hist-row" href="#/day/${date}"><span class="hist-date">${esc(shortDate(date))}</span>${lines.join('')}</a></li>`;
    })
    .join('');
  const overrides = (state.overrides || [])
    .map((o) => `<li class="hist-row"><span class="hist-date">${esc(shortDate(o.date))}</span><p class="hist-line">Ran despite a shin ${esc(o.reason)} rule (your override).</p></li>`)
    .join('');
  return `${subHeader('History')}
    ${rows ? `<ul class="hist-list">${rows}</ul>` : '<section class="card"><p>Nothing logged yet. Your sessions will list here, newest first.</p></section>'}
    ${overrides ? `<h2 class="section-title">Overrides</h2><ul class="hist-list">${overrides}</ul>` : ''}`;
}

export function settingsView(state, ui) {
  const s = state.settings;
  const opt = (value, label, current) => `<option value="${value}"${value === current ? ' selected' : ''}>${label}</option>`;
  const days = Object.keys(state.log).length;
  const pending = ui.importPending;
  return `${subHeader('Settings')}
    <section class="card form">
      <label class="field"><span>Weather location</span>
        <select data-setting="location">
          ${opt('east-lansing', 'East Lansing', s.location)}${opt('almont', 'Almont', s.location)}${opt('shelby-township', 'Shelby Township', s.location)}
        </select></label>
      <label class="field"><span>Theme</span>
        <select data-setting="theme">${opt('system', 'Match my phone', s.theme)}${opt('dark', 'Dark', s.theme)}${opt('light', 'Light', s.theme)}</select></label>
      <label class="field"><span>Track</span>
        <select data-setting="track">${opt('A', 'Track A: 10 miles on Dec 31', s.track)}${opt('B', 'Track B: 10 miles in January', s.track)}</select></label>
      <label class="check"><input type="checkbox" data-setting="verse"${s.verse ? ' checked' : ''}><span>Verse of the day</span></label>
    </section>
    <section class="card form">
      <h2>Backup</h2>
      <p class="quiet">Your log lives only on this phone. ${days} day${days === 1 ? '' : 's'} logged.</p>
      <button type="button" class="btn btn-secondary" data-action="export">Export log to a file</button>
      <label class="btn btn-secondary file-btn">Import log from a file<input type="file" accept="application/json,.json" data-action-change="import-file" class="visually-hidden"></label>
      ${ui.importError ? `<p class="error" role="alert">${esc(ui.importError)}</p>` : ''}
      ${pending
        ? `<div class="confirm" role="alert"><p>Replace the ${days} day${days === 1 ? '' : 's'} on this phone with the ${pending.days} day${pending.days === 1 ? '' : 's'} in that file?</p>
            <button type="button" class="btn btn-primary" data-action="import-confirm">Replace my log</button>
            <button type="button" class="btn btn-quiet" data-action="import-cancel">Cancel</button></div>`
        : ''}
      ${ui.notice ? `<p class="notice" role="status">${esc(ui.notice)}</p>` : ''}
    </section>
    <section class="card form">
      <h2>Reset</h2>
      <p class="quiet">Erases everything logged on this phone. Export first if you might want it back.</p>
      <button type="button" class="btn btn-quiet" data-action="reset">${ui.armed === 'reset' ? 'Tap again to erase everything' : 'Erase my log'}</button>
    </section>`;
}

export function aboutView() {
  const groups = SOURCES.map((g) => `<section class="card prose"><h2>${esc(g.title)}</h2>
      <ul class="link-list">${g.links.map((l) => `<li><a href="${esc(l.url)}" rel="noopener" target="_blank">${esc(l.label)}</a></li>`).join('')}</ul></section>`).join('');
  return `${subHeader('About')}
    <p class="notice">A personal tracker for one training plan. ${NOT_MEDICAL}</p>
    <p class="quiet pad">Verse text: Berean Standard Bible, public domain. References link to the ESV on esv.org.</p>
    <p class="quiet pad">Weather data by <a href="https://open-meteo.com/" rel="noopener" target="_blank">Open-Meteo.com</a> (CC BY 4.0).</p>
    <h2 class="section-title">Sources behind the plan</h2>${groups}`;
}
