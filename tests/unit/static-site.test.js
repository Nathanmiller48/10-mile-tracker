// Guards the hard constraints in SITE_SPEC.md section 2 that are easy to break by accident:
// relative paths only, no external requests from the shell, and every referenced file exists.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const html = await readFile(join(root, 'index.html'), 'utf8');
const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((m) => m[1]);

test('index.html references something', () => {
  assert.ok(refs.length >= 2, 'expected at least a stylesheet and a script');
});

test('every href and src in index.html is relative', () => {
  for (const ref of refs) {
    assert.ok(!ref.startsWith('/'), `root-absolute path breaks under /10-mile-tracker/: ${ref}`);
    assert.ok(!/^[a-z][a-z0-9+.-]*:/i.test(ref) && !ref.startsWith('//'), `external URL: ${ref}`);
  }
});

test('every file index.html references exists', async () => {
  for (const ref of refs) {
    await access(join(root, ref.split(/[?#]/)[0]));
  }
});

test('.nojekyll exists so GitHub Pages serves files as-is', async () => {
  await access(join(root, '.nojekyll'));
});

test('sw.js is up to date and lists every file the app loads', async () => {
  const { renderServiceWorker, shellFiles, SW_JS } = await import('../../scripts/build-sw.mjs');
  const committed = (await readFile(SW_JS, 'utf8')).replace(/\r\n/g, '\n');
  assert.equal(committed, await renderServiceWorker(), 'sw.js is stale: run npm run build:sw');
  const files = await shellFiles();
  for (const ref of refs.filter((r) => !r.startsWith('#'))) {
    assert.ok(files.includes(ref.split(/[?#]/)[0]), `${ref} is not in the offline cache list`);
  }
  for (const needed of ['js/app.js', 'js/data/plan.js', 'js/data/content.js', 'js/weather.js', 'icons/icon-192.png']) {
    assert.ok(files.includes(needed), `${needed} missing from the offline cache list`);
  }
});

test('manifest uses relative paths only', async () => {
  const manifest = JSON.parse(await readFile(join(root, 'manifest.webmanifest'), 'utf8'));
  for (const value of [manifest.start_url, manifest.scope, ...manifest.icons.map((i) => i.src)]) {
    assert.ok(value === './' || (!value.startsWith('/') && !value.includes('://')), value);
  }
  for (const icon of manifest.icons) await access(join(root, icon.src));
});
