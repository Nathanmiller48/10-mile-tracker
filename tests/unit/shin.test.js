// One test for every row of the shin table in PLAN.md section 7, each yellow trigger on
// its own, the creeping-up rule, the red lock, and the reading in DECISIONS.md item 6.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shinStatus, runsFromLog, evaluateRun } from '../../js/shin.js';

/** Build a log from short run descriptions: [date, during, nextMorning?]. */
function logOf(runs, extra = {}) {
  const log = {};
  const add = (date, slot, value) => (log[date] = { ...(log[date] || {}), [slot]: value });
  for (const [date, shin, nextMorning, more] of runs) {
    add(date, 'morning', {
      status: 'done',
      run: { miles: 3, seconds: 1980, nonstop: true, surface: 'road', effort: 4, shin, ...(more || {}) },
    });
    if (nextMorning !== undefined && nextMorning !== null) {
      const d = new Date(`${date}T00:00:00Z`);
      d.setUTCDate(d.getUTCDate() + 1);
      add(d.toISOString().slice(0, 10), 'shinAm', { score: nextMorning });
    }
  }
  for (const [date, day] of Object.entries(extra)) log[date] = { ...(log[date] || {}), ...day };
  return log;
}
const status = (runs, today, opts = {}) =>
  shinStatus({ log: logOf(runs, opts.extra), clearedOn: opts.clearedOn ?? null }, today);

test('no runs logged yet: green, nothing locked', () => {
  const s = shinStatus({ log: {}, clearedOn: null }, '2026-11-12');
  assert.equal(s.level, 'green');
  assert.equal(s.word, 'Green');
  assert.equal(s.locked, false);
  assert.equal(s.proposeTrackB, false);
  assert.equal(s.runDate, null);
});

// ---- Green row: 0–2 during, next morning no worse than the morning before ----

test('green: 0–2 during the run', () => {
  for (const during of [0, 1, 2]) {
    assert.equal(status([['2026-11-17', during]], '2026-11-17').level, 'green', `during ${during}`);
  }
});

test('green: next morning no higher than the previous morning and 2 or under (DECISIONS item 6)', () => {
  // previous morning 1 (after the Nov 14 run), next morning 1 again
  assert.equal(status([['2026-11-14', 1, 1], ['2026-11-17', 1, 1]], '2026-11-18').level, 'green');
  // lower than before
  assert.equal(status([['2026-11-14', 1, 2], ['2026-11-17', 1, 1]], '2026-11-18').level, 'green');
  // first ever morning score, 2 or under, nothing to compare against
  assert.equal(status([['2026-11-12', 1, 2]], '2026-11-13').level, 'green');
});

// ---- Yellow row: 3–4 during, OR still there next morning, OR creeping up ----

test('yellow: 3 or 4 during the run (boundary 2 vs 3, 4 vs 5)', () => {
  assert.equal(status([['2026-11-17', 2]], '2026-11-17').level, 'green');
  for (const during of [3, 4]) {
    const s = status([['2026-11-17', during]], '2026-11-17');
    assert.equal(s.level, 'yellow', `during ${during}`);
    assert.deepEqual(s.reasons, ['during-3-4']);
    assert.equal(s.word, 'Yellow');
  }
  assert.equal(status([['2026-11-17', 5]], '2026-11-17').level, 'red');
});

test('yellow: next morning higher than the previous morning', () => {
  const s = status([['2026-11-14', 1, 1], ['2026-11-17', 1, 2]], '2026-11-18');
  assert.equal(s.level, 'yellow');
  assert.deepEqual(s.reasons, ['morning-worse']);
});

test('yellow: next morning 3 or more even if it is not higher than before', () => {
  const s = status([['2026-11-14', 2, 3], ['2026-11-17', 2, 3]], '2026-11-18');
  assert.equal(s.level, 'yellow');
  assert.deepEqual(s.reasons, ['morning-3-plus']);
  // and with no earlier morning score at all
  assert.equal(status([['2026-11-12', 1, 3]], '2026-11-13').level, 'yellow');
});

test('the morning score only counts once it is recorded', () => {
  const runs = [['2026-11-14', 1, 1], ['2026-11-17', 1, 2]];
  assert.equal(status(runs, '2026-11-17').level, 'green', 'evening of the run: no morning score yet');
  assert.equal(status(runs, '2026-11-18').level, 'yellow', 'next morning: 2 after 1');
});

test('yellow: creeping up across three runs in a row', () => {
  const s = status([['2026-11-14', 0], ['2026-11-17', 1], ['2026-11-19', 2]], '2026-11-19');
  assert.equal(s.level, 'yellow');
  assert.deepEqual(s.reasons, ['creeping-up']);
});

test('not creeping: flat, only two rising, or a dip in the middle', () => {
  assert.equal(status([['2026-11-14', 1], ['2026-11-17', 1], ['2026-11-19', 2]], '2026-11-19').level, 'green');
  assert.equal(status([['2026-11-17', 1], ['2026-11-19', 2]], '2026-11-19').level, 'green');
  assert.equal(status([['2026-11-14', 2], ['2026-11-17', 1], ['2026-11-19', 2]], '2026-11-19').level, 'green');
  assert.equal(status([['2026-11-14', 2], ['2026-11-17', 2], ['2026-11-19', 2]], '2026-11-19').level, 'green');
});

test('yellow: 48–72 hour no-run window and Track B proposed', () => {
  const s = status([['2026-11-21', 3]], '2026-11-21');
  assert.equal(s.noRunFrom, '2026-11-21');
  assert.equal(s.noRunEarliest, '2026-11-23');
  assert.equal(s.noRunUntil, '2026-11-24');
  assert.equal(s.inNoRunWindow, true);
  assert.equal(s.proposeTrackB, true);
  assert.equal(s.locked, false);
  assert.equal(status([['2026-11-21', 3]], '2026-11-23').inNoRunWindow, true);
  assert.equal(status([['2026-11-21', 3]], '2026-11-24').inNoRunWindow, false);
});

test('yellow clears when a later run comes back green', () => {
  const runs = [['2026-11-21', 3, 1], ['2026-11-26', 1, 1]];
  assert.equal(status(runs, '2026-11-25').level, 'yellow');
  assert.equal(status(runs, '2026-11-27').level, 'green');
});

test('a cross-train session is not a run and does not clear a yellow', () => {
  const log = logOf([['2026-11-21', 3]]);
  log['2026-11-24'] = {
    morning: { status: 'done', run: { miles: 0, seconds: 1800, surface: 'cross-train', shin: 0 } },
  };
  assert.equal(runsFromLog(log).length, 1);
  assert.equal(shinStatus({ log, clearedOn: null }, '2026-11-24').level, 'yellow');
});

// ---- Red row: 5 or more, limping, pain when walking, doctor-list item ----

test('red: 5 or more during the run', () => {
  for (const during of [5, 7, 10]) {
    const s = status([['2026-11-17', during]], '2026-11-17');
    assert.equal(s.level, 'red', `during ${during}`);
    assert.equal(s.word, 'Red');
    assert.equal(s.locked, true);
    assert.equal(s.proposeTrackB, true);
  }
});

test('red: 5 or more the next morning', () => {
  const s = status([['2026-11-17', 2, 5]], '2026-11-18');
  assert.equal(s.level, 'red');
  assert.deepEqual(s.reasons, ['morning-5-plus']);
});

test('red: a reported red flag (limping, pain when walking, doctor-list item)', () => {
  const s = status([['2026-11-17', 1, null, { redFlag: true }]], '2026-11-17');
  assert.equal(s.level, 'red');
  assert.deepEqual(s.reasons, ['red-flag']);
});

test('red wins over yellow reasons on the same run', () => {
  const log = logOf([['2026-11-14', 0], ['2026-11-17', 1], ['2026-11-19', 6]]);
  const runs = runsFromLog(log);
  assert.equal(evaluateRun(runs, 2).level, 'red');
});

const painFree = (...dates) => Object.fromEntries(dates.map((d) => [d, { painFree: true }]));

test('red lock: stays locked with no pain-free days', () => {
  const s = status([['2026-11-17', 6]], '2026-11-30');
  assert.equal(s.locked, true);
  assert.equal(s.painFreeStreak, 0);
  assert.equal(s.canConfirmCleared, false);
  assert.equal(s.painFreeNeeded, 5);
});

test('red lock: 4 pain-free days is not enough, even if he says he is cleared', () => {
  const extra = painFree('2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21');
  const s = status([['2026-11-17', 6]], '2026-11-22', { extra, clearedOn: '2026-11-22' });
  assert.equal(s.locked, true);
  assert.equal(s.painFreeStreak, 4);
  assert.equal(s.canConfirmCleared, false);
});

test('red lock: 5 consecutive pain-free days without confirmation is still locked', () => {
  const extra = painFree('2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22');
  const s = status([['2026-11-17', 6]], '2026-11-23', { extra });
  assert.equal(s.locked, true);
  assert.equal(s.painFreeStreak, 5);
  assert.equal(s.canConfirmCleared, true);
});

test('red lock: a painful day in the middle resets the count', () => {
  const extra = painFree('2026-11-18', '2026-11-19', '2026-11-21', '2026-11-22', '2026-11-23');
  const s = status([['2026-11-17', 6]], '2026-11-24', { extra, clearedOn: '2026-11-24' });
  assert.equal(s.locked, true);
  assert.equal(s.painFreeStreak, 3);
});

test('red lock releases with 5 consecutive pain-free days plus confirmation', () => {
  const extra = painFree('2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22');
  const s = status([['2026-11-17', 6]], '2026-11-23', { extra, clearedOn: '2026-11-23' });
  assert.equal(s.level, 'green');
  assert.equal(s.locked, false);
  assert.equal(s.restartAfterRed, true, 'restart at less than half the previous mileage');
  assert.equal(s.proposeTrackB, true);
});

test('after release, earlier runs no longer count and new runs are judged fresh', () => {
  const extra = painFree('2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22');
  const opts = { extra, clearedOn: '2026-11-23' };
  const green = status([['2026-11-14', 1], ['2026-11-17', 6], ['2026-11-24', 1]], '2026-11-24', opts);
  assert.equal(green.level, 'green');
  assert.equal(green.restartAfterRed, false);
  // 1 then 6 then 7 would be "creeping up" if the old runs still counted; a fresh 3 is simply yellow.
  const yellow = status([['2026-11-14', 1], ['2026-11-17', 6], ['2026-11-24', 3]], '2026-11-24', opts);
  assert.deepEqual(yellow.reasons, ['during-3-4']);
  // A second red after release locks again; the old clearance does not carry over.
  const again = status([['2026-11-17', 6], ['2026-11-24', 5]], '2026-11-24', opts);
  assert.equal(again.locked, true);
  assert.equal(again.painFreeStreak, 0);
});

test('future-dated entries are ignored (looking ahead with ?date=)', () => {
  assert.equal(status([['2026-11-17', 6]], '2026-11-16').level, 'green');
});
