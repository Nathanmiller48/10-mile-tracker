import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildEntry } from '../../js/sheet.js';

const NOW = '2026-11-17T12:00:00.000Z';

test('a plain run', () => {
  const r = buildEntry('run', 'log', { miles: '3', minutes: '33', seconds: '05', nonstop: 'yes', surface: 'road', effort: '', shin: '1', redFlag: false, notes: '' }, NOW);
  assert.deepEqual(r, {
    ok: true,
    entry: { status: 'done', at: NOW, run: { miles: 3, seconds: 1985, nonstop: true, surface: 'road', shin: 1 } },
  });
});

test('a run needs a distance and a shin score; shin 0 is a real answer', () => {
  const base = { miles: '3', minutes: '33', seconds: '0', nonstop: 'yes', surface: 'road', shin: '' };
  assert.equal(buildEntry('run', 'log', base, NOW).ok, false);
  assert.match(buildEntry('run', 'log', base, NOW).error, /shin score/);
  assert.equal(buildEntry('run', 'log', { ...base, shin: '0' }, NOW).entry.run.shin, 0);
  assert.match(buildEntry('run', 'log', { ...base, shin: '1', miles: '0' }, NOW).error, /distance/);
  assert.equal(buildEntry('run', 'log', { ...base, shin: '1', miles: '300' }, NOW).ok, false);
});

test('walk breaks, treadmill, effort, red flag, armor and notes are kept', () => {
  const r = buildEntry('run', 'log', {
    miles: '2.5', minutes: '30', seconds: '0', nonstop: 'no', surface: 'treadmill', effort: '6', shin: '2',
    redFlag: true, armor: true, notes: 'Slow',
  }, NOW);
  assert.deepEqual(r.entry.run, { miles: 2.5, seconds: 1800, nonstop: false, surface: 'treadmill', effort: 6, shin: 2, redFlag: true });
  assert.equal(r.entry.armor, true);
  assert.equal(r.entry.notes, 'Slow');
});

test('cross-training records minutes, no miles, never nonstop, shin optional', () => {
  const r = buildEntry('run', 'log', { miles: '3', minutes: '35', seconds: '0', nonstop: 'yes', surface: 'cross-train', shin: '' }, NOW);
  assert.deepEqual(r.entry.run, { miles: 0, seconds: 2100, nonstop: false, surface: 'cross-train' });
});

test('strength: ticked exercises, lifts and lock-off rounds', () => {
  const r = buildEntry('strength', 'log', {
    ex_1: true, ex_2: true, ex_3: false, lift_deadlift_weight: '185', lift_deadlift_reps: '5',
    lift_splitSquat_weight: '', lift_splitSquat_reps: '', lockoffRounds: '3', notes: '',
  }, NOW);
  assert.deepEqual(r.entry.strength, { checked: [1, 2], lifts: { deadlift: { weight: 185, reps: 5 } }, lockoffRounds: 3 });
});

test('climb and simple sessions', () => {
  assert.deepEqual(buildEntry('climb', 'log', { grade: 'hard', ache: '' }, NOW).entry, { status: 'done', at: NOW, climb: { grade: 'hard' } });
  assert.deepEqual(buildEntry('climb', 'log', { grade: 'easy', ache: '0' }, NOW).entry.climb, { grade: 'easy', ache: 0 });
  assert.deepEqual(buildEntry('simple', 'log', { notes: '' }, NOW).entry, { status: 'done', at: NOW });
});

test('benchmarks are stored only when filled in', () => {
  const r = buildEntry('simple', 'log', { talk2Min: '23', talk2Sec: '15', calfLeft: '18', calfRight: '', notes: '' }, NOW);
  assert.deepEqual(r.entry.benchmarks, { talk2Seconds: 1395, calfLeft: 18 });
  assert.equal(buildEntry('simple', 'log', { talk2Min: '', talk2Sec: '' }, NOW).entry.benchmarks, undefined);
});

test('a skip is stored as its own state, distinct from "not logged"', () => {
  assert.deepEqual(buildEntry('run', 'skip', { reason: 'Exams', notes: '' }, NOW).entry, { status: 'skipped', reason: 'Exams', at: NOW });
  assert.deepEqual(buildEntry('run', 'skip', { reason: '', notes: 'Flight' }, NOW).entry, { status: 'skipped', notes: 'Flight', at: NOW });
});
