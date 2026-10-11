import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const fontPath = path.join(rootDir, 'public', 'fonts', 'bricolage-grotesque-latin-wght-normal.woff2');
const fontBase64 = fs.readFileSync(fontPath).toString('base64');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @font-face {
      font-family: 'Bricolage Grotesque';
      src: url('data:font/woff2;base64,${fontBase64}') format('woff2');
      font-weight: 200 800;
      font-style: normal;
      font-display: block;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      width: 1200px;
      height: 630px;
      overflow: hidden;
      background: #0E1A36;
      font-family: 'Bricolage Grotesque', system-ui, sans-serif;
      color: #F1EDE4;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 72px 80px;
      position: relative;
    }
    .background-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(to right, rgba(38, 58, 106, 0.25) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(38, 58, 106, 0.25) 1px, transparent 1px);
      background-size: 48px 48px;
      z-index: 0;
      pointer-events: none;
    }
    .content-wrap {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      justify-content: space-between;
    }
    .top-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .top-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #A9B4CC;
    }
    .signal-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #14244A;
      border: 1px solid #263A6A;
      padding: 6px 16px;
      border-radius: 999px;
      font-size: 15px;
      font-weight: 600;
      color: #F1EDE4;
    }
    .signal-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #5BD6A0;
      box-shadow: 0 0 10px #5BD6A0;
    }
    .handle {
      font-size: 18px;
      color: #A9B4CC;
      font-weight: 500;
    }
    .main-body {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .hero-title {
      font-size: 68px;
      font-weight: 800;
      line-height: 1.05;
      letter-spacing: -0.035em;
      color: #F1EDE4;
    }
    .hero-sub {
      font-size: 26px;
      font-weight: 500;
      color: #A9B4CC;
      line-height: 1.4;
      max-width: 960px;
    }
    .chips-row {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 8px;
    }
    .project-chip {
      background: #14244A;
      border: 1px solid #263A6A;
      padding: 8px 18px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      color: #F1EDE4;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .chip-accent {
      color: #FFB224;
      font-weight: 700;
    }
    .bottom-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #263A6A;
      padding-top: 24px;
    }
    .credentials {
      font-size: 17px;
      color: #A9B4CC;
    }
    .credentials strong {
      color: #F1EDE4;
      font-weight: 600;
    }
    .internship-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #FFB224;
      color: #0E1A36;
      padding: 10px 22px;
      border-radius: 999px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
  </style>
</head>
<body>
  <div class="background-grid"></div>
  <div class="content-wrap">
    <div class="top-bar">
      <div class="signal-pill">
        <span class="signal-dot"></span>
        <span>Dhaka, Bangladesh · UTC+6</span>
      </div>
      <div class="handle">github.com/watchknight</div>
    </div>

    <div class="main-body">
      <h1 class="hero-title">Abdur Rahman Moayed</h1>
      <p class="hero-sub">
        Software engineer specializing in browser internals, systems-level security, and high-performance web architecture.
      </p>
      <div class="chips-row">
        <div class="project-chip"><span class="chip-accent">PureFeed</span> · MV3 Adblock Countermeasures</div>
        <div class="project-chip"><span class="chip-accent">FocusGuard</span> · OS Network Policy Firewall</div>
        <div class="project-chip"><span class="chip-accent">DocLensBD</span> · 60 FPS 3D Computer Vision</div>
        <div class="project-chip"><span class="chip-accent">POSHRA</span> · Commerce Engine</div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="credentials">
        <strong>East West University</strong> · B.Sc. CSE · Board General Merit Scholar
      </div>
      <div class="internship-badge">
        Available for Remote Internships
      </div>
    </div>
  </div>
</body>
</html>`;

const tempHtmlPath = path.join(rootDir, 'og-image-temp.html');
fs.writeFileSync(tempHtmlPath, htmlContent, 'utf-8');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-og-' + Date.now());
const CDP_PORT = 9347;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  '--window-size=1200,630',
  `file:///${tempHtmlPath.replace(/\\/g, '/')}`,
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

try {
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1200,
    height: 630,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await new Promise((r) => setTimeout(r, 800));

  const screenshot = await send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: 1200, height: 630, scale: 1 },
  });

  const outImagePath = path.join(rootDir, 'public', 'og-image.png');
  fs.writeFileSync(outImagePath, Buffer.from(screenshot.data, 'base64'));
  console.log('✓ Successfully regenerated 1200x630 og-image.png in new palette:', outImagePath);

} catch (err) {
  console.error('OG image generation error:', err);
} finally {
  ws.close();
  chromeProcess.kill();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
  try { fs.unlinkSync(tempHtmlPath); } catch {}
}
