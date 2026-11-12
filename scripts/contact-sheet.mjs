// Dev-only: lays out every screenshot matching a prefix from test-results/ into one image,
// so a whole theme can be reviewed at a glance.
//   node scripts/contact-sheet.mjs dark test-results/sheet-dark.png
import { chromium } from '@playwright/test';
import { readdir, readFile } from 'node:fs/promises';
import { join, resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const [prefix = 'dark', out = `test-results/sheet-${prefix}.png`, cols = '6'] = process.argv.slice(2);

async function find(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await find(path)));
    else if (entry.name.startsWith(`${prefix}-`) && entry.name.endsWith('.png')) files.push(path);
  }
  return files;
}

const files = (await find(join(root, 'test-results'))).sort((a, b) => basename(a).localeCompare(basename(b)));
const cells = await Promise.all(
  files.map(async (f) => `<figure><img src="data:image/png;base64,${(await readFile(f)).toString('base64')}"><figcaption>${basename(f, '.png')}</figcaption></figure>`),
);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Number(cols) * 268 + 8, height: 600 } });
await page.setContent(`<style>body{margin:8px;background:#777;display:grid;grid-template-columns:repeat(${cols},260px);gap:8px;font:12px system-ui}
figure{margin:0}img{width:260px;display:block}figcaption{color:#fff;padding:2px 0}</style>${cells.join('')}`);
await page.screenshot({ path: join(root, out), fullPage: true });
await browser.close();
console.log(`${files.length} screenshots -> ${out}`);
