// Geometry for the 10-mile route line. Pure, so it can be unit tested.

export const ROUTE_MILES = 10;

/**
 * X position of a mile on a line running from x0 to x1.
 * Miles outside 0..ROUTE_MILES are clamped to the ends.
 */
export function mileToX(mile, x0, x1) {
  const clamped = Math.min(ROUTE_MILES, Math.max(0, mile));
  return x0 + ((x1 - x0) * clamped) / ROUTE_MILES;
}

/** One marker per whole mile, 0 through 10. */
export function mileMarkers(x0, x1) {
  return Array.from({ length: ROUTE_MILES + 1 }, (_, mile) => ({
    mile,
    x: mileToX(mile, x0, x1),
  }));
}
