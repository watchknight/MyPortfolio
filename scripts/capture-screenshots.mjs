import http from 'node:http';
import fs from 'node:fs';
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

const PORT = 4755;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-ss-' + Date.now());
const CDP_PORT = 9489;
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
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

async function capture(fileName, width, height, theme, dsf = 1, mobile = false) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: dsf,
    mobile,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 800));

  if (theme) {
    await evalJs(`document.documentElement.setAttribute('data-theme', '${theme}')`);
    await new Promise((r) => setTimeout(r, 300));
  }

  const { data } = await send('Page.captureScreenshot', { format: 'png' });
  const buffer = Buffer.from(data, 'base64');
  const dest = path.join(screenshotsDir, fileName);
  fs.writeFileSync(dest, buffer);
  console.log(`Saved screenshot: ${dest} (${width}x${height}, ${theme || 'default'})`);
}

try {
  await send('Page.enable');
  await capture('desktop_dark_1440.png', 1440, 900, 'dark', 1, false);
  await capture('desktop_light_1440.png', 1440, 900, 'light', 1, false);
  await capture('mobile_dark_390.png', 390, 844, 'dark', 3, true);
  await capture('mobile_light_390.png', 390, 844, 'light', 3, true);
  console.log('All screenshots captured successfully!');
} finally {
  ws.close();
  try { chromeProcess.kill(); } catch {}
  server.close();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
}
