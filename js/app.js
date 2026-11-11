import { mileMarkers, ROUTE_MILES } from './route.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el(name, attrs, text) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (text !== undefined) node.textContent = text;
  return node;
}

function drawRoute() {
  const group = document.getElementById('route-markers');
  if (!group) return;
  for (const { mile, x } of mileMarkers(10, 330)) {
    if (mile === 0) {
      group.append(el('circle', { class: 'route-start', cx: x, cy: 22, r: 6 }));
    } else {
      group.append(el('line', { class: 'route-tick', x1: x, y1: 15, x2: x, y2: 29 }));
    }
    const isGoal = mile === ROUTE_MILES;
    group.append(
      el('text', { class: isGoal ? 'route-label is-goal' : 'route-label', x, y: 48 }, String(mile)),
    );
  }
}

drawRoute();
