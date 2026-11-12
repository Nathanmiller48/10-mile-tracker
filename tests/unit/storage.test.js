import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY, VERSION, defaultState, load, save, validate, migrate,
  exportText, importText, setDaySlot,
} from '../../js/storage.js';

function fakeStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
    data,
  };
}

const sample = () => {
  let s = defaultState();
  s = setDaySlot(s, '2026-11-12', 'morning', {
    status: 'done',
    run: { miles: 2, seconds: 1380, nonstop: true, surface: 'road', effort: 4, shin: 1 },
  });
  s = setDaySlot(s, '2026-11-13', 'shinAm', { score: 1 });
  return s;
};

test('fresh phone: default state, East Lansing, verse on, Track A', () => {
  const s = load(fakeStorage());
  assert.equal(s.v, VERSION);
  assert.deepEqual(s.log, {});
  assert.deepEqual(s.settings, { location: 'east-lansing', theme: 'system', verse: true, track: 'A' });
});

test('round trip through one key', () => {
  const storage = fakeStorage();
  assert.equal(save(storage, sample()), true);
  assert.deepEqual([...storage.data.keys()], [STORAGE_KEY]);
  assert.deepEqual(load(storage), sample());
});

test('corrupt JSON falls back without throwing and keeps a copy', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '{"v":1,"log":{' });
  const s = load(storage);
  assert.deepEqual(s, defaultState());
  assert.equal(storage.data.get(`${STORAGE_KEY}.corrupt`), '{"v":1,"log":{');
});

test('valid JSON of the wrong shape also falls back and keeps a copy', () => {
  const storage = fakeStorage({ [STORAGE_KEY]: '[1,2,3]' });
  assert.deepEqual(load(storage), defaultState());
  assert.equal(storage.data.get(`${STORAGE_KEY}.corrupt`), '[1,2,3]');
});

test('a storage that throws does not break loading or saving', () => {
  const broken = {
    getItem() { throw new Error('denied'); },
    setItem() { throw new Error('full'); },
  };
  assert.deepEqual(load(broken), defaultState());
  assert.equal(save(broken, defaultState()), false);
});

test('older data missing newer fields is filled in, and his log is kept', () => {
  const old = { v: 1, log: sample().log, settings: { theme: 'dark' } };
  const s = load(fakeStorage({ [STORAGE_KEY]: JSON.stringify(old) }));
  assert.deepEqual(s.log, sample().log);
  assert.equal(s.settings.theme, 'dark');
  assert.equal(s.settings.location, 'east-lansing');
  assert.deepEqual(s.overrides, []);
  assert.equal(s.clearedOn, null);
});

test('data from a newer version is refused rather than mangled', () => {
  assert.equal(validate({ v: VERSION + 1, log: {} }).ok, false);
  assert.throws(() => migrate({ v: 0, log: {} }));
});

test('export then import gives back the same state', () => {
  const result = importText(exportText(sample()));
  assert.equal(result.ok, true);
  assert.equal(result.days, 2);
  assert.deepEqual(result.state, sample());
});

test('import rejects junk with a plain message', () => {
  assert.equal(importText('not json').ok, false);
  assert.equal(importText('{"hello":1}').ok, false);
  assert.equal(importText('{"v":1,"log":{"yesterday":{}}}').ok, false);
  assert.match(importText('{"v":99,"log":{}}').error, /newer version/);
});

test('setDaySlot does not mutate, and removing the last slot removes the day', () => {
  const a = sample();
  const b = setDaySlot(a, '2026-11-13', 'shinAm', null);
  assert.ok(a.log['2026-11-13']);
  assert.equal(b.log['2026-11-13'], undefined);
  assert.ok(b.log['2026-11-12'].morning);
});

// ---- Data saved by the Phase 2 build must keep working after every later deploy ----

test('a log saved by the Phase 2 version loads completely and drives every later feature', async () => {
  const { readFile } = await import('node:fs/promises');
  const { shinStatus } = await import('../../js/shin.js');
  const { reachedMilestones, runTotals } = await import('../../js/milestones.js');
  const { dayModel } = await import('../../js/day.js');
  const { getPlan } = await import('../../js/plan.js');
  const { allGates } = await import('../../js/gates.js');
  const raw = await readFile(new URL('../fixtures/phase2-state.json', import.meta.url), 'utf8');
  const saved = JSON.parse(raw);
  const s = load(fakeStorage({ [STORAGE_KEY]: raw }));

  assert.equal(s.v, VERSION, 'no version bump was needed: every later field is optional');
  assert.deepEqual(s.log, saved.log, 'every entry is still there, untouched');
  assert.deepEqual(s.settings, saved.settings);
  assert.equal(s.trackB, undefined);

  const today = '2026-11-16';
  assert.equal(shinStatus(s, today).level, 'green');
  assert.deepEqual(runTotals(s.log, today), { longestNonstop: 4, totalMiles: 6, weekMiles: { 1: 6 }, runCount: 2 });
  assert.deepEqual(reachedMilestones(s, today), { m4: '2026-11-14' });
  assert.equal(getPlan(s).track, 'A');
  assert.equal(allGates(s, getPlan(s), today)[0].pass, true);
  assert.equal(dayModel(s, '2026-11-14', today).morning.fallback, true);
  assert.equal(dayModel(s, '2026-11-16', today).morning.title, 'Legs + Armor');
  // Round trip: saving it again changes nothing he logged.
  const storage = fakeStorage();
  save(storage, s);
  assert.deepEqual(load(storage).log, saved.log);
});
