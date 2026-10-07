import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(tmpdir(), 'chrome-portfolio-eval-' + Date.now());

function createStaticServer(distDir) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
  };

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    let filePath = path.join(distDir, urlPath);
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    try {
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((r) =>
    server.listen(0, () => {
      server.port = server.address().port;
      r(server);
    })
  );
}

async function test() {
  const server = await createStaticServer(path.resolve('dist'));
  const port = server.port;

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9265',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://127.0.0.1:${port}/`
  ]);

  await new Promise((r) => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9265/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');

  // Desktop check
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await new Promise((r) => setTimeout(r, 1200));

  const desktopRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const sections = Array.from(document.querySelectorAll('nav, section')).map(el => ({
          tag: el.tagName,
          id: el.id,
          ariaLabel: el.getAttribute('aria-label')
        }));
        const tiles = Array.from(document.querySelectorAll('[data-tile]')).map(el => ({
          type: el.getAttribute('data-tile'),
          tag: el.tagName,
          cls: el.className
        }));
        const navBrand = document.querySelector('[data-cursor="link"]')?.textContent?.trim();
        return JSON.stringify({
          sections,
          totalTiles: tiles.length,
          tileTypes: tiles.map(t => t.type),
          hasHeroTitle: !!document.querySelector('[data-hero-title]'),
          heroInCount: document.querySelectorAll('[data-hero-in]').length,
          magneticCount: document.querySelectorAll('[data-magnetic]').length,
          inspectCount: document.querySelectorAll('[data-cursor="inspect"]').length,
          hideCursorCount: document.querySelectorAll('[data-cursor="hide"], input, canvas').length
        });
      })()
    `,
    returnByValue: true
  });
  const desktopVal = desktopRes.result?.result?.value || desktopRes.result?.value;
  console.log('DESKTOP METRICS:', desktopVal ? JSON.parse(desktopVal) : desktopRes);

  // Mobile 390px check
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await new Promise((r) => setTimeout(r, 1200));

  const mobileRes = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const clientWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const overflows = [];
        document.querySelectorAll('*').forEach(el => {
          const r = el.getBoundingClientRect();
          if (r.right > clientWidth + 0.5) {
            overflows.push({
              tag: el.tagName,
              id: el.id,
              class: el.className ? String(el.className).slice(0, 40) : '',
              right: Math.round(r.right),
              clientWidth
            });
          }
        });
        return JSON.stringify({
          clientWidth,
          scrollWidth,
          bodyScrollWidth,
          hasOverflow: scrollWidth > clientWidth || bodyScrollWidth > clientWidth,
          overflowElementsCount: overflows.length,
          overflows: overflows.slice(0, 5)
        });
      })()
    `,
    returnByValue: true
  });
  const mobileVal = mobileRes.result?.result?.value || mobileRes.result?.value;
  console.log('MOBILE 390PX METRICS:', mobileVal ? JSON.parse(mobileVal) : mobileRes);

  ws.close();
  chrome.kill();
  server.close();
}

test().catch(console.error);
