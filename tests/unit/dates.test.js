import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isISODate, addDays, diffDays, weekday, weekdayName, shortDate, localISO, resolveToday,
  planDay, planPosition, weekDates, weekNumber, mondayOf,
} from '../../js/dates.js';

test('date math crosses the Nov→Dec and Dec→Jan boundaries', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-12-01', -1), '2026-11-30');
  assert.equal(diffDays('2026-11-12', '2026-12-31'), 49);
  assert.equal(diffDays('2026-12-31', '2026-11-12'), -49);
  assert.equal(weekday('2026-11-12'), 'Thu');
  assert.equal(weekdayName('2026-12-31'), 'Thursday');
  assert.equal(shortDate('2026-11-17'), 'Tue, Nov 17');
  assert.equal(mondayOf('2026-11-15'), '2026-11-09');
  assert.equal(mondayOf('2026-11-16'), '2026-11-16');
});

test('isISODate accepts only real dates', () => {
  assert.equal(isISODate('2026-11-12'), true);
  assert.equal(isISODate('2026-11-31'), false);
  assert.equal(isISODate('2026-1-5'), false);
  assert.equal(isISODate('tomorrow'), false);
  assert.equal(isISODate(null), false);
});

test('today is the local date, not the UTC date', () => {
  // 11:30pm local on Nov 16 must still be Nov 16, whatever the timezone.
  assert.equal(localISO(new Date(2026, 10, 16, 23, 30)), '2026-11-16');
  assert.equal(localISO(new Date(2026, 10, 17, 0, 5)), '2026-11-17');
});

test('?date= overrides today; a bad value is ignored', () => {
  const now = new Date(2026, 10, 16, 6, 10);
  assert.deepEqual(resolveToday('?date=2026-12-05', now), { date: '2026-12-05', overridden: true });
  assert.deepEqual(resolveToday('?date=nope', now), { date: '2026-11-16', overridden: false });
  assert.deepEqual(resolveToday('?date=2026-02-30', now), { date: '2026-11-16', overridden: false });
  assert.deepEqual(resolveToday('', now), { date: '2026-11-16', overridden: false });
});

test('plan position during the plan', () => {
  assert.deepEqual(planPosition('2026-11-12'), {
    phase: 'during', week: 1, totalWeeks: 8, daysToStart: 0, daysToTarget: 49,
  });
  assert.equal(planPosition('2026-11-24').week, 3);
  assert.equal(planPosition('2026-12-01').week, 4);
  assert.deepEqual(planPosition('2026-12-31'), {
    phase: 'during', week: 8, totalWeeks: 8, daysToStart: 0, daysToTarget: 0,
  });
  assert.equal(planPosition('2026-12-10', '2027-01-23').daysToTarget, 44);
});

test('before the plan and after it are states, not errors', () => {
  const before = planPosition('2026-11-11');
  assert.equal(before.phase, 'before');
  assert.equal(before.week, null);
  assert.equal(before.daysToStart, 1);
  assert.equal(planDay('2026-11-11'), null);

  const after = planPosition('2027-01-02');
  assert.equal(after.phase, 'after');
  assert.equal(after.week, null);
  assert.equal(after.daysToTarget, -2);
  assert.equal(planDay('2027-01-02'), null);
});

test('weeks run Monday to Sunday; week 1 and week 8 are partial', () => {
  const w1 = weekDates(1);
  assert.equal(w1[0], '2026-11-09');
  assert.equal(w1[6], '2026-11-15');
  assert.deepEqual(w1.map((d) => planDay(d) !== null), [false, false, false, true, true, true, true]);
  const w8 = weekDates(8);
  assert.equal(w8[0], '2026-12-28');
  assert.deepEqual(w8.map((d) => planDay(d) !== null), [true, true, true, true, false, false, false]);
  for (let week = 1; week <= 8; week++) {
    for (const date of weekDates(week)) {
      assert.equal(weekNumber(date), week);
      if (planDay(date)) assert.equal(planDay(date).week, week, date);
    }
  }
  assert.equal(weekNumber('2027-01-23'), 11);
});
