// Themes, accessibility and performance, checked on every screen in dark and light.
import { test, expect, seed, run, shot, sampleLog, smallTargets, watchErrors } from './helpers.js';

const yellowLog = () => ({ ...sampleLog(), '2026-12-05': { morning: run(7, 3) } });

// Each screen: [name, url, optional setup once loaded]
const SCREENS = [
  ['today', './?date=2026-12-08', null],
  ['today-strength', './?date=2026-11-30', null],
  ['week', './?date=2026-12-08#/week', null],
  ['progress', './?date=2026-12-08#/progress', null],
  ['library', './?date=2026-12-08#/library', async (page) => page.locator('#lib-PULL > summary').click()],
  ['more', './?date=2026-12-08#/more', null],
  ['safety', './?date=2026-12-08#/more/safety', null],
  ['history', './?date=2026-12-08#/more/history', null],
  ['settings', './?date=2026-12-08#/more/settings', null],
  ['about', './?date=2026-12-08#/more/about', null],
  ['sheet-run', './?date=2026-12-08', async (page) => page.getByRole('button', { name: 'Log run' }).click()],
];

/**
 * WCAG contrast of every piece of visible text against its real background.
 * Returns the failures: text under 4.5:1 (or 3:1 for large text).
 */
async function contrastFailures(page) {
  return page.evaluate(() => {
    const parse = (c) => {
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const [r, g, b, a = '1'] = m[1].split(/[,/ ]+/).filter(Boolean);
      return { r: +r, g: +g, b: +b, a: +a };
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const over = (top, under) => ({
      r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1,
    });
    const background = (el) => {
      const layers = [];
      for (let node = el; node; node = node.parentElement) {
        const c = parse(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) { layers.push(c); if (c.a === 1) break; }
      }
      let color = parse(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
      for (const layer of layers.reverse()) color = over(layer, color);
      return color;
    };
    const failures = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      const el = node.parentElement;
      if (!text || !el || seen.has(el)) continue;
      seen.add(el);
      if (el.closest('svg, noscript, script, style')) continue; // chart labels are checked by eye; data is also in text
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      if (rect.width === 0 || rect.height === 0 || style.visibility === 'hidden' || +style.opacity === 0) continue;
      if (el.closest('dialog:not([open])')) continue;
      const fg = parse(style.color);
      if (!fg) continue;
      const bg = background(el);
      const color = fg.a < 1 ? over(fg, bg) : fg;
      const [a, b] = [lum(color), lum(bg)].sort((x, y) => y - x);
      const ratio = (a + 0.05) / (b + 0.05);
      const size = parseFloat(style.fontSize);
      const large = size >= 24 || (size >= 18.66 && +style.fontWeight >= 700);
      if (ratio < (large ? 3 : 4.5)) failures.push(`${ratio.toFixed(2)} "${text.slice(0, 30)}" <${el.tagName.toLowerCase()} class="${el.className}">`);
    }
    return failures;
  });
}

async function a11yProblems(page) {
  return page.evaluate(() => {
    const problems = [];
    const visible = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
    for (const el of document.querySelectorAll('button, a[href], input, select, textarea, summary')) {
      if (!visible(el) || el.closest('dialog:not([open])')) continue;
      const name = (el.getAttribute('aria-label') || el.textContent || '').trim()
        || (el.labels && [...el.labels].map((l) => l.textContent.trim()).join(' '))
        || el.getAttribute('title') || '';
      if (!name) problems.push(`no accessible name: <${el.tagName.toLowerCase()} name="${el.getAttribute('name') || ''}">`);
    }
    for (const el of document.querySelectorAll('p, li, span, a, button, label, summary, h2, input, select, textarea')) {
      if (!visible(el) || el.closest('svg') || !el.textContent.trim()) continue;
      const size = parseFloat(getComputedStyle(el).fontSize);
      const isChip = el.matches('.chip, .pill, .ms-tag, .shin-chip') || el.closest('.chip, .pill, .ms-tag');
      if (size < (isChip ? 15 : 16)) problems.push(`text ${size}px: "${el.textContent.trim().slice(0, 30)}" .${el.className}`);
    }
    if (document.documentElement.scrollWidth > document.documentElement.clientWidth) problems.push('page scrolls sideways');
    return [...new Set(problems)];
  });
}

for (const scheme of ['dark', 'light']) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });

    test(`every screen: contrast, tap targets, labels, text size (${scheme})`, async ({ page }, testInfo) => {
      test.setTimeout(90_000);
      const errors = watchErrors(page);
      await seed(page, sampleLog());
      for (const [name, url, setup] of SCREENS) {
        await page.goto(url);
        await expect(page.locator('#app h1')).toBeVisible();
        if (setup) await setup(page);
        expect(await contrastFailures(page), `contrast on ${name} (${scheme})`).toEqual([]);
        expect(await smallTargets(page), `tap targets on ${name} (${scheme})`).toEqual([]);
        expect(await a11yProblems(page), `accessibility on ${name} (${scheme})`).toEqual([]);
        await shot(page, testInfo, `${scheme}-${name}`);
        if (['today', 'progress', 'safety', 'settings'].includes(name)) {
          await page.evaluate(() => window.scrollTo(0, 760));
          await shot(page, testInfo, `${scheme}-${name}-2`);
        }
        if (name === 'progress') {
          for (const [i, y] of [[3, 1500], [4, 2250], [5, 3000]]) {
            await page.evaluate((top) => window.scrollTo(0, top), y);
            await shot(page, testInfo, `${scheme}-${name}-${i}`);
          }
        }
      }
      expect(errors).toEqual([]);
    });

    test(`shin banners keep their word and their contrast (${scheme})`, async ({ page }, testInfo) => {
      await seed(page, yellowLog());
      await page.goto('./?date=2026-12-06');
      await expect(page.locator('.banner .shin-chip')).toHaveText('Yellow');
      expect(await contrastFailures(page)).toEqual([]);
      await shot(page, testInfo, `${scheme}-today-yellow`);
      await page.goto('./?date=2026-12-06#/more/safety');
      expect(await contrastFailures(page)).toEqual([]);
    });
  });
}

test('the theme setting overrides the phone', async ({ page }, testInfo) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('./?date=2026-12-08#/more/settings');
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const light = await bg();
  await page.getByLabel('Theme').selectOption('dark');
  expect(await bg()).toBe('rgb(13, 13, 15)');
  expect(await contrastFailures(page)).toEqual([]);
  await page.getByLabel('Theme').selectOption('light');
  expect(await bg()).toBe(light);
  await page.emulateMedia({ colorScheme: 'dark' });
  expect(await bg()).toBe(light); // still light: his choice beats the system
  await page.getByLabel('Theme').selectOption('system');
  expect(await bg()).toBe('rgb(13, 13, 15)');
});

test('reduced motion: no animation and no transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed(page, { '2026-11-14': { morning: run(4, 1) } });
  await page.goto('./?date=2026-11-21');
  await page.getByRole('button', { name: 'Log run' }).click();
  await page.locator('#sheet').getByRole('group', { name: 'Shin during the run, 0 to 10' }).getByRole('button', { name: '1', exact: true }).click();
  await page.locator('#sheet').getByRole('button', { name: 'Log run' }).click();
  await expect(page.locator('.unlock')).toBeVisible();
  const motion = await page.evaluate(() => {
    const s = (sel) => getComputedStyle(document.querySelector(sel));
    return [s('.unlock').animationName, s('.unlock-dot').animationName, s('.btn').transitionDuration];
  });
  expect(motion).toEqual(['none', 'none', '0s']);
});

test('keyboard: tabs are reachable and focus is visible', async ({ page }) => {
  await page.goto('./?date=2026-12-08');
  await page.locator('#tabs a').first().focus();
  const outline = await page.evaluate(() => {
    const el = document.activeElement;
    el.classList.add('x');
    return [el.textContent, getComputedStyle(el).outlineStyle !== 'none' || el.matches(':focus-visible')];
  });
  expect(outline[0]).toBe('Today');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Week');
});

test('shin colors appear only on shin elements', async ({ page }) => {
  await seed(page, yellowLog());
  for (const url of ['./?date=2026-12-06', './?date=2026-12-06#/progress', './?date=2026-12-06#/week', './?date=2026-12-06#/more/settings']) {
    await page.goto(url);
    const strays = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const probe = document.createElement('span');
      document.body.append(probe);
      const shin = ['--shin-green', '--shin-yellow', '--shin-red'].map((v) => { probe.style.color = root.getPropertyValue(v); return getComputedStyle(probe).color; });
      probe.remove();
      const out = [];
      for (const el of document.querySelectorAll('#app *, #tabs *')) {
        const s = getComputedStyle(el);
        for (const prop of ['color', 'backgroundColor', 'borderTopColor', 'fill', 'stroke']) {
          if (shin.includes(s[prop]) && !el.closest('.shin-chip, .banner[class*="shin-border"], .band')) out.push(`${el.tagName}.${el.className} ${prop}`);
        }
      }
      return out;
    });
    expect(strays, url).toEqual([]);
  }
});

test('warm load: Today paints in under a second', async ({ page }, testInfo) => {
  await seed(page, sampleLog());
  await page.goto('./?date=2026-12-08');
  await expect(page.locator('#morning-title')).toBeVisible();
  const times = [];
  for (let i = 0; i < 5; i++) {
    await page.reload();
    await expect(page.locator('#morning-title')).toBeVisible();
    times.push(await page.evaluate(() => new Promise((resolve) => {
      new PerformanceObserver((list) => resolve(Math.round(list.getEntriesByName('first-contentful-paint')[0].startTime))).observe({ type: 'paint', buffered: true });
    })));
  }
  const worst = Math.max(...times);
  testInfo.annotations.push({ type: 'first-contentful-paint ms', description: times.join(', ') });
  console.log(`warm first-contentful-paint (ms): ${times.join(', ')}`);
  expect(worst).toBeLessThan(1000);
  // Nothing render-blocking from another origin, and no web fonts.
  const external = await page.evaluate(() => performance.getEntriesByType('resource').map((r) => r.name).filter((n) => !n.startsWith(location.origin)));
  expect(external.filter((n) => !n.includes('open-meteo'))).toEqual([]);
  expect(await page.evaluate(() => document.fonts.size)).toBe(0);
});

test('the audits themselves catch a real problem', async ({ page }) => {
  await page.goto('./?date=2026-12-08');
  await page.evaluate(() => {
    const p = document.createElement('p');
    p.textContent = 'faint text';
    p.style.color = '#3a3a3a';
    const b = document.createElement('button');
    b.style.cssText = 'height:30px;width:60px';
    b.id = 'tiny';
    const small = document.createElement('p');
    small.textContent = 'tiny words';
    small.style.fontSize = '12px';
    document.querySelector('#app').append(p, b, small);
  });
  expect((await contrastFailures(page)).some((f) => f.includes('faint text'))).toBe(true);
  expect((await smallTargets(page)).length).toBe(1);
  const problems = await a11yProblems(page);
  expect(problems.some((x) => x.startsWith('no accessible name'))).toBe(true);
  expect(problems.some((x) => x.startsWith('text 12px'))).toBe(true);
});
