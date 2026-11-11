import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mileMarkers, mileToX, ROUTE_MILES } from '../../js/route.js';

test('route is ten miles with a marker at every whole mile', () => {
  const markers = mileMarkers(10, 330);
  assert.equal(ROUTE_MILES, 10);
  assert.equal(markers.length, 11);
  assert.deepEqual(markers.map((m) => m.mile), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.equal(markers[0].x, 10);
  assert.equal(markers[10].x, 330);
  assert.equal(markers[5].x, 170);
});

test('mileToX clamps to the ends of the line', () => {
  assert.equal(mileToX(-1, 0, 100), 0);
  assert.equal(mileToX(12, 0, 100), 100);
  assert.equal(mileToX(8.5, 0, 100), 85);
});
