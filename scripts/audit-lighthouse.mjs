import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  let filePath = path.join(distDir, reqPath);
  if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
    filePath += '.html';
  } else if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    let content = fs.readFileSync(filePath);
    const headers = { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' };

    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip') && ['.html', '.js', '.css', '.json', '.svg'].includes(ext)) {
      headers['Content-Encoding'] = 'gzip';
      content = zlib.gzipSync(content);
    }

    res.writeHead(200, headers);
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 4730;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const { launch } = await import('file:///C:/Users/Moayed/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/chrome-launcher/dist/index.js');
const lighthouse = (await import('file:///C:/Users/Moayed/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/core/index.js')).default;
const desktopConfig = (await import('file:///C:/Users/Moayed/AppData/Local/npm-cache/_npx/0f94ee7615faf582/node_modules/lighthouse/core/config/desktop-config.js')).default;

const chrome = await launch({
  chromeFlags: ['--headless=new', '--disable-gpu', '--no-sandbox'],
});

const routes = ['/', '/works', '/foundation', '/resume', '/contact'];
const results = [];

async function runLh(route, formFactor) {
  const url = `http://127.0.0.1:${PORT}${route}`;
  const options = {
    logLevel: 'error',
    output: 'json',
    port: chrome.port,
  };

  const config = formFactor === 'desktop' ? desktopConfig : undefined;
  const runnerResult = await lighthouse(url, options, config);
  const lhr = runnerResult.lhr;

  const perf = Math.round((lhr.categories.performance?.score || 0) * 100);
  const a11y = Math.round((lhr.categories.accessibility?.score || 0) * 100);
  const bp = Math.round((lhr.categories['best-practices']?.score || 0) * 100);
  const seo = Math.round((lhr.categories.seo?.score || 0) * 100);

  const lcp = lhr.audits['largest-contentful-paint']?.displayValue || 'N/A';
  const cls = lhr.audits['cumulative-layout-shift']?.displayValue || 'N/A';
  const tbt = lhr.audits['total-blocking-time']?.displayValue || 'N/A';

  const entry = { route, formFactor, perf, a11y, bp, seo, lcp, cls, tbt };
  console.log(`Route: ${route} [${formFactor}] => Perf: ${perf}, A11y: ${a11y}, BP: ${bp}, SEO: ${seo} | LCP: ${lcp}, CLS: ${cls}, TBT: ${tbt}`);
  results.push(entry);
  return entry;
}

try {
  console.log('Running Lighthouse on all routes (mobile and desktop)...');
  for (const r of routes) {
    await runLh(r, 'desktop');
    await runLh(r, 'mobile');
  }
  const outPath = process.env.LIGHTHOUSE_OUT || path.join(os.tmpdir(), 'lighthouse-full-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nAll audits finished! Saved ${outPath}`);
} catch (e) {
  console.error(e);
} finally {
  try {
    await chrome.kill();
  } catch {}
  server.close();
}
