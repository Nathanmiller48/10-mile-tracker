// The verdict must follow the table in PLAN.md section 6, row by row.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verdictFor, loadForecast, forecastUrl, sessionHour, LOCATIONS, WEATHER_KEY } from '../../js/weather.js';
import { FALLBACK } from '../../js/data/content.js';
import { PLAN_MD } from '../../scripts/build-plan.mjs';

const DATE = '2026-11-17';

/** 48 hours of hourly data ending the evening of DATE; override hours by index offset from 6am. */
function hourly(base = {}, edits = {}) {
  const time = [];
  for (const day of ['2026-11-16', DATE]) for (let h = 0; h < 24; h++) time.push(`${day}T${String(h).padStart(2, '0')}:00`);
  const fill = (v) => time.map(() => v);
  const data = {
    time,
    temperature_2m: fill(base.temp ?? 28),
    apparent_temperature: fill(base.feels ?? 20),
    precipitation: fill(0),
    rain: fill(0),
    snowfall: fill(0),
    weather_code: fill(base.code ?? 3),
  };
  const at6 = time.indexOf(`${DATE}T06:00`);
  for (const [key, changes] of Object.entries(edits)) {
    for (const [offset, value] of Object.entries(changes)) data[key][at6 + Number(offset)] = value;
  }
  return data;
}
const v = (base, edits) => verdictFor(hourly(base, edits), DATE, 6);

test('the table in PLAN.md still has the rows this logic was written against', async () => {
  const rows = FALLBACK.blocks.find((b) => b.t === 'table').rows.map((r) => r[0]);
  assert.deepEqual(rows, [
    'Clear roads, feels-like above 0°F',
    'Ice, unplowed snow, or freezing rain',
    'Feels-like below 0°F',
    'No treadmill available',
    'Dark morning',
  ]);
  assert.ok((await readFile(PLAN_MD, 'utf8')).includes('**Treadmill, 1% incline, same distance, same easy effort.**'));
});

test('row 1: clear roads, feels-like above 0°F → run outside', () => {
  const r = v({ temp: 24, feels: 15 });
  assert.equal(r.verdict, 'outside');
  assert.equal(r.text, '24°F feels 15, roads dry. Run outside.');
  assert.equal(v({ temp: 40, feels: 40 }).text, '40°F, roads dry. Run outside.');
});

test('row 2: freezing rain now or in the last 6 hours → treadmill', () => {
  assert.equal(v({}, { weather_code: { 0: 66 } }).text, 'Treadmill today: freezing rain.');
  assert.equal(v({}, { weather_code: { '-5': 57 } }).verdict, 'treadmill');
  assert.equal(v({}, { weather_code: { '-9': 66 } }).verdict, 'outside', 'nine hours ago is outside the window');
});

test('row 2: unplowed snow → treadmill', () => {
  const overnight = v({}, { snowfall: { '-3': 0.6, '-2': 0.6 } });
  assert.equal(overnight.verdict, 'treadmill');
  assert.equal(overnight.text, 'Treadmill today: fresh snow, roads may be unplowed.');
  assert.equal(v({}, { weather_code: { 0: 73 } }).text, 'Treadmill today: snow falling.');
  assert.equal(v({}, { snowfall: { '-3': 0.3 } }).verdict, 'outside', 'a dusting is not unplowed snow');
});

test('row 2: ice → rain in the last 12 hours and at or below freezing at run time', () => {
  const ice = v({ temp: 30, feels: 22 }, { rain: { '-4': 0.1 } });
  assert.equal(ice.verdict, 'treadmill');
  assert.equal(ice.text, 'Treadmill today: rain then freezing, ice likely.');
  assert.equal(v({ temp: 32, feels: 25 }, { rain: { '-4': 0.1 } }).verdict, 'treadmill');
  assert.equal(v({ temp: 38, feels: 33 }, { rain: { '-4': 0.1 } }).verdict, 'outside', 'wet but above freezing');
  assert.equal(v({ temp: 30, feels: 22 }).verdict, 'outside', 'cold and dry');
});

test('row 3: feels-like below 0°F → treadmill (boundary at 0)', () => {
  assert.equal(v({ temp: 8, feels: -4 }).text, 'Treadmill today: feels like -4°F.');
  assert.equal(v({ temp: 8, feels: -0.1 }).verdict, 'treadmill');
  assert.equal(v({ temp: 8, feels: 0 }).verdict, 'treadmill', '"above 0" is the rule for running outside');
  assert.equal(v({ temp: 8, feels: 0.6 }).verdict, 'outside');
});

test('rain above freezing is reported but does not send him inside', () => {
  const r = v({ temp: 45, feels: 41 }, { weather_code: { 0: 61 }, rain: { 0: 0.05 } });
  assert.equal(r.text, '45°F feels 41, rain. Run outside.');
});

test('no verdict when the forecast does not cover the hour or is malformed', () => {
  assert.equal(verdictFor(hourly(), '2026-12-25', 6), null);
  assert.equal(verdictFor(null, DATE, 6), null);
  assert.equal(verdictFor({ time: [`${DATE}T06:00`] }, DATE, 6), null);
});

test('request: keyless, three fixed locations, Fahrenheit, local time', () => {
  const url = new URL(forecastUrl('east-lansing'));
  assert.equal(url.origin, 'https://api.open-meteo.com');
  assert.equal(url.searchParams.get('latitude'), '42.737');
  assert.equal(url.searchParams.get('temperature_unit'), 'fahrenheit');
  assert.equal(url.searchParams.get('timezone'), 'America/Detroit');
  assert.ok(![...url.searchParams.keys()].some((k) => /key|token/i.test(k)));
  assert.deepEqual(Object.keys(LOCATIONS), ['east-lansing', 'almont', 'shelby-township']);
  assert.equal(new URL(forecastUrl('nowhere')).searchParams.get('latitude'), '42.737');
  assert.equal(sessionHour('Tue'), 6);
  assert.equal(sessionHour('Sat'), 8);
});

function fakeStorage() {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, val) => data.set(k, val), data };
}
const okFetch = (calls) => async (url) => {
  calls.push(url);
  return { ok: true, json: async () => ({ hourly: hourly({ temp: 24, feels: 15 }) }) };
};
const failFetch = async () => {
  throw new Error('offline');
};

test('forecast is cached, reused while fresh, and refetched after 3 hours', async () => {
  const storage = fakeStorage();
  const calls = [];
  const t0 = 1_800_000_000_000;
  const first = await loadForecast('east-lansing', { storage, fetchFn: okFetch(calls), now: t0 });
  assert.equal(first.source, 'network');
  assert.ok(storage.data.has(WEATHER_KEY));
  const second = await loadForecast('east-lansing', { storage, fetchFn: okFetch(calls), now: t0 + 60 * 60 * 1000 });
  assert.equal(second.source, 'cache');
  assert.equal(calls.length, 1);
  const third = await loadForecast('east-lansing', { storage, fetchFn: okFetch(calls), now: t0 + 4 * 60 * 60 * 1000 });
  assert.equal(third.source, 'network');
  // A different location never reuses the cache.
  const other = await loadForecast('almont', { storage, fetchFn: okFetch(calls), now: t0 + 4 * 60 * 60 * 1000 + 1 });
  assert.equal(other.source, 'network');
});

test('a failed fetch falls back to a recent cache, else to nothing (the manual switch)', async () => {
  const storage = fakeStorage();
  const t0 = 1_800_000_000_000;
  assert.equal(await loadForecast('east-lansing', { storage, fetchFn: failFetch, now: t0 }), null);
  await loadForecast('east-lansing', { storage, fetchFn: okFetch([]), now: t0 });
  const stale = await loadForecast('east-lansing', { storage, fetchFn: failFetch, now: t0 + 5 * 60 * 60 * 1000 });
  assert.equal(stale.source, 'stale');
  assert.equal(await loadForecast('east-lansing', { storage, fetchFn: failFetch, now: t0 + 30 * 60 * 60 * 1000 }), null);
  const bad = async () => ({ ok: false, status: 500, json: async () => ({}) });
  assert.equal(await loadForecast('almont', { storage: fakeStorage(), fetchFn: bad, now: t0 }), null);
  const odd = async () => ({ ok: true, json: async () => ({ nope: 1 }) });
  assert.equal(await loadForecast('almont', { storage: fakeStorage(), fetchFn: odd, now: t0 }), null);
});
