import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const screenshotsDir = path.join(rootDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 4788;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-ss-' + Date.now());
const CDP_PORT = 9498;
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/`,
]);

await new Promise((r) => setTimeout(r, 2000));

const versionRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
const targets = await versionRes.json();
const pageTarget = targets.find((t) => t.type === 'page') || targets[0];

const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  ws.onopen = resolve;
  ws.onerror = reject;
});

let msgId = 1;
const pending = new Map();
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.id && pending.has(data.id)) {
    const { resolve, reject } = pending.get(data.id);
    pending.delete(data.id);
    if (data.error) reject(data.error);
    else resolve(data.result);
  }
};

function send(method, params = {}) {
  const id = msgId++;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function evalJs(expr) {
  const res = await send('Runtime.evaluate', { expression: expr, returnByValue: true });
  return res.result ? res.result.value : undefined;
}

async function capture(routePath, fileName, width, height, theme, dsf = 1, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: dsf,
    mobile,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${routePath}` });
  await new Promise((r) => setTimeout(r, 600));

  if (theme) {
    await evalJs(`document.documentElement.setAttribute('data-theme', '${theme}')`);
    await new Promise((r) => setTimeout(r, 200));
  }

  const { data } = await send('Page.captureScreenshot', {
    format: 'png',
    captureBeyondViewport: true,
  });
  const buffer = Buffer.from(data, 'base64');
  const dest = path.join(screenshotsDir, fileName);
  fs.writeFileSync(dest, buffer);
  console.log(`Saved screenshot: ${fileName} (${width}x${height}, ${theme})`);
}

const routes = [
  { path: '/', slug: 'home' },
  { path: '/works', slug: 'works' },
  { path: '/foundation', slug: 'foundation' },
  { path: '/resume', slug: 'resume' },
  { path: '/contact', slug: 'contact' },
];

try {
  await send('Page.enable');
  console.log('Capturing all 20 views across 5 routes at 1440px and 390px in dark & light...');

  for (const r of routes) {
    console.log(`\n--- Capturing route: ${r.path} ---`);
    // 1440px Desktop Dark
    const dDark = r.slug === 'home' ? 'desktop_dark_1440.png' : `${r.slug}_desktop_dark_1440.png`;
    await capture(r.path, dDark, 1440, 900, 'dark', 1, false);
    if (r.slug !== 'home') {
      fs.copyFileSync(path.join(screenshotsDir, dDark), path.join(screenshotsDir, `${r.slug}_desktop_1440.png`));
    } else {
      fs.copyFileSync(path.join(screenshotsDir, dDark), path.join(screenshotsDir, 'home_desktop_dark_1440.png'));
      fs.copyFileSync(path.join(screenshotsDir, dDark), path.join(screenshotsDir, 'home_desktop_1440.png'));
    }

    // 1440px Desktop Light
    const dLight = r.slug === 'home' ? 'desktop_light_1440.png' : `${r.slug}_desktop_light_1440.png`;
    await capture(r.path, dLight, 1440, 900, 'light', 1, false);
    if (r.slug === 'home') {
      fs.copyFileSync(path.join(screenshotsDir, dLight), path.join(screenshotsDir, 'home_desktop_light_1440.png'));
    }

    // 390px Mobile Dark
    const mDark = r.slug === 'home' ? 'mobile_dark_390.png' : `${r.slug}_mobile_dark_390.png`;
    await capture(r.path, mDark, 390, 844, 'dark', 2, true);
    if (r.slug !== 'home') {
      fs.copyFileSync(path.join(screenshotsDir, mDark), path.join(screenshotsDir, `${r.slug}_mobile_390.png`));
    } else {
      fs.copyFileSync(path.join(screenshotsDir, mDark), path.join(screenshotsDir, 'home_mobile_dark_390.png'));
      fs.copyFileSync(path.join(screenshotsDir, mDark), path.join(screenshotsDir, 'home_mobile_390.png'));
    }

    // 390px Mobile Light
    const mLight = r.slug === 'home' ? 'mobile_light_390.png' : `${r.slug}_mobile_light_390.png`;
    await capture(r.path, mLight, 390, 844, 'light', 2, true);
    if (r.slug === 'home') {
      fs.copyFileSync(path.join(screenshotsDir, mLight), path.join(screenshotsDir, 'home_mobile_light_390.png'));
    }
  }

  console.log('\n✨ All 20 full-page screenshots captured successfully!');
} finally {
  try { ws.close(); } catch {}
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
  try { fs.rmSync(tempProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
}
