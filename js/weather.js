// Weather for the run, and the outside-or-treadmill verdict from PLAN.md section 6.
//
// Forecast: Open-Meteo (https://open-meteo.com). Checked 2026-11-11: no API key, sends
// "access-control-allow-origin: *", free for non-commercial use under CC BY 4.0 with
// attribution (shown under the conditions line and on the About screen).
// No location permission is asked for: only the three fixed places below are used.
//
// A forecast cannot see the road, so "ice" and "unplowed snow" are judged from what fell:
//   freezing rain   freezing rain or drizzle at run time or in the 6 hours before
//   unplowed snow   1 inch or more of new snow in the 12 hours before, or snow falling at run time
//   ice             rain in the 12 hours before with the temperature at or below freezing at run time
// The manual switch on the card always wins over the forecast.

export const LOCATIONS = {
  'east-lansing': { name: 'East Lansing', lat: 42.737, lon: -84.484 },
  almont: { name: 'Almont', lat: 42.92, lon: -83.045 },
  'shelby-township': { name: 'Shelby Township', lat: 42.671, lon: -82.993 },
};

export const WEATHER_KEY = 'ten-mile-tracker.weather';
const FRESH_MS = 3 * 60 * 60 * 1000; // refetch after 3 hours
const STALE_MS = 24 * 60 * 60 * 1000; // a failed fetch may fall back to a cache up to a day old

const FREEZING_CODES = new Set([56, 57, 66, 67]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const RAIN_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99]);

/** Hour he usually starts, from the weekly template's finish-by times. */
export function sessionHour(weekdayShort) {
  if (weekdayShort === 'Tue') return 6; // done by 7:30
  if (weekdayShort === 'Sat') return 8;
  return 7;
}

export function forecastUrl(locationId) {
  const { lat, lon } = LOCATIONS[locationId] || LOCATIONS['east-lansing'];
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m,apparent_temperature,precipitation,rain,snowfall,weather_code',
    temperature_unit: 'fahrenheit',
    precipitation_unit: 'inch',
    timezone: 'America/Detroit',
    past_days: 1,
    forecast_days: 3,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

/**
 * The verdict for a run at `hour` on `date`, from Open-Meteo hourly data.
 * Returns null when the forecast does not cover that hour, else
 * { temp, feels, sky: 'dry' | 'rain' | 'snow' | 'freezing rain',
 *   verdict: 'outside' | 'treadmill', reason, text }
 */
export function verdictFor(hourly, date, hour) {
  if (!hourly || !Array.isArray(hourly.time)) return null;
  const stamp = `${date}T${String(hour).padStart(2, '0')}:00`;
  const i = hourly.time.indexOf(stamp);
  if (i < 0) return null;
  const temp = hourly.temperature_2m?.[i];
  const feels = hourly.apparent_temperature?.[i];
  if (!Number.isFinite(temp) || !Number.isFinite(feels)) return null;

  const window = (hours) => Array.from({ length: Math.min(hours, i) + 1 }, (_, k) => i - k);
  const code = (k) => hourly.weather_code?.[k];
  const sum = (key, hours) => window(hours).slice(1).reduce((s, k) => s + (hourly[key]?.[k] || 0), 0);

  const freezingRain = window(6).some((k) => FREEZING_CODES.has(code(k)));
  const snowingNow = SNOW_CODES.has(code(i));
  const newSnow = sum('snowfall', 12) + (hourly.snowfall?.[i] || 0);
  const rainBefore = sum('rain', 12);
  const rainingNow = RAIN_CODES.has(code(i)) || (hourly.rain?.[i] || 0) > 0;

  let verdict = 'outside';
  let reason = '';
  if (freezingRain) [verdict, reason] = ['treadmill', 'freezing rain'];
  else if (newSnow >= 1 || snowingNow) [verdict, reason] = ['treadmill', newSnow >= 1 ? 'fresh snow, roads may be unplowed' : 'snow falling'];
  else if (rainBefore >= 0.02 && temp <= 32) [verdict, reason] = ['treadmill', 'rain then freezing, ice likely'];
  else if (feels <= 0) [verdict, reason] = ['treadmill', `feels like ${Math.round(feels)}°F`];

  const sky = freezingRain ? 'freezing rain' : snowingNow ? 'snow' : rainingNow ? 'rain' : 'dry';
  const t = Math.round(temp);
  const f = Math.round(feels);
  const conditions = `${t}°F${f !== t ? ` feels ${f}` : ''}, ${sky === 'dry' ? 'roads dry' : sky}`;
  const text = verdict === 'outside'
    ? `${conditions}. Run outside.`
    : `Treadmill today: ${reason}.`;
  return { temp: t, feels: f, sky, verdict, reason, conditions, text };
}

function readCache(storage, locationId) {
  try {
    const cached = JSON.parse(storage.getItem(WEATHER_KEY));
    return cached && cached.location === locationId && cached.hourly ? cached : null;
  } catch {
    return null;
  }
}

/**
 * Get hourly forecast data: a fresh cache, else the network, else a cache up to a day old.
 * Never throws. Returns { hourly, source: 'cache' | 'network' | 'stale' } or null.
 */
export async function loadForecast(locationId, { storage, fetchFn, now = Date.now() }) {
  const cached = readCache(storage, locationId);
  if (cached && now - cached.fetchedAt < FRESH_MS) return { hourly: cached.hourly, source: 'cache' };
  try {
    const res = await fetchFn(forecastUrl(locationId));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data.hourly?.time) throw new Error('unexpected response');
    try {
      storage.setItem(WEATHER_KEY, JSON.stringify({ location: locationId, fetchedAt: now, hourly: data.hourly }));
    } catch {
      /* cache is optional */
    }
    return { hourly: data.hourly, source: 'network' };
  } catch {
    if (cached && now - cached.fetchedAt < STALE_MS) return { hourly: cached.hourly, source: 'stale' };
    return null;
  }
}
