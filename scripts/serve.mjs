// Dev-only static server. Serves the repo root the way GitHub Pages does,
// under a /10-mile-tracker/ subpath so relative-path mistakes show up locally.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const BASE = '/10-mile-tracker/';
const PORT = Number(process.env.PORT) || 4173;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

// Test hook: GET /__test/deploy makes the server act as if a new version was deployed
// (sw.js gets a new VERSION and index.html gains a marker); /__test/reset undoes it.
let deployed = false;

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname.startsWith('/__test/')) {
    deployed = pathname === '/__test/deploy';
    res.writeHead(200, { 'Content-Type': 'text/plain', 'Access-Control-Allow-Origin': '*' }).end(String(deployed));
    return;
  }
  if (pathname === '/' || pathname === BASE.slice(0, -1)) {
    res.writeHead(302, { Location: BASE }).end();
    return;
  }
  if (!pathname.startsWith(BASE)) {
    res.writeHead(404).end('Not found');
    return;
  }
  let file = normalize(join(ROOT, decodeURIComponent(pathname.slice(BASE.length))));
  if (file !== ROOT && !file.startsWith(ROOT + sep)) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    let body = await readFile(file);
    if (deployed && file === join(ROOT, 'sw.js')) body = Buffer.from(String(body).replace(/const VERSION = '[^']+'/, "const VERSION = 'test-deploy-2'"));
    if (deployed && file === join(ROOT, 'index.html')) body = Buffer.from(String(body).replace('<body>', '<body data-deploy="2">'));
    res.writeHead(200, {
      'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404).end('Not found');
  }
}).listen(PORT, () => {
  console.log(`Serving http://localhost:${PORT}${BASE}`);
});
