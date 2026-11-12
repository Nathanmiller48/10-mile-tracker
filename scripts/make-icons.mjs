// Dev-only: renders icons/icon.svg to the PNG sizes the manifest and iOS need.
//   node scripts/make-icons.mjs
// The PNGs are committed; this only needs running again if icon.svg changes.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const svg = await readFile(join(root, 'icons', 'icon.svg'), 'utf8');
const sizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-maskable-512.png', 512], // the art already sits inside the maskable safe zone
  ['apple-touch-icon.png', 180],
];

const browser = await chromium.launch();
for (const [name, size] of sizes) {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(`<style>html,body{margin:0;background:#0d0d0f}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`);
  await page.screenshot({ path: join(root, 'icons', name), clip: { x: 0, y: 0, width: size, height: size } });
  await page.close();
  console.log(`icons/${name}`);
}
await browser.close();
