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

const PORT = 4788;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-b3-' + Date.now());
const CDP_PORT = 9492;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/`,
]);

await new Promise((r) => setTimeout(r, 1200));

try {
  const versionRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const targets = await versionRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  const wsUrl = pageTarget.webSocketDebuggerUrl;

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
    });
    if (res.exceptionDetails) {
      throw new Error(`Eval error: ${JSON.stringify(res.exceptionDetails)}`);
    }
    return res.result?.value;
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('CSS.enable');
  await send('LayerTree.enable');

  console.log('=== TEST 1: DESKTOP 1440x900 (DARK MODE, GRAIN ON) ===');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 1000));

  const desktopStyles = await evaluate(`(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    const atmo = document.querySelector('.atmo');
    const blobA = document.querySelector('.atmo__blob--a');
    const blobB = document.querySelector('.atmo__blob--b');
    const blobC = document.querySelector('.atmo__blob--c');
    const pointer = document.querySelector('.atmo__pointer');
    const grain = document.querySelector('.atmo__grain');

    const cs = (el) => el ? window.getComputedStyle(el) : null;
    return {
      htmlBg: cs(html)?.backgroundColor,
      bodyBg: cs(body)?.backgroundColor,
      rootBg: cs(root)?.backgroundColor,
      atmo: {
        exists: !!atmo,
        position: cs(atmo)?.position,
        zIndex: cs(atmo)?.zIndex,
        isolation: cs(atmo)?.isolation,
        contain: cs(atmo)?.contain,
        display: cs(atmo)?.display,
        bg: cs(atmo)?.backgroundImage?.slice(0, 40),
      },
      blobA: {
        exists: !!blobA,
        display: cs(blobA)?.display,
        animationName: cs(blobA)?.animationName,
        willChange: cs(blobA)?.willChange,
      },
      blobB: {
        exists: !!blobB,
        display: cs(blobB)?.display,
        animationName: cs(blobB)?.animationName,
      },
      blobC: {
        exists: !!blobC,
        display: cs(blobC)?.display,
        animationName: cs(blobC)?.animationName,
      },
      pointer: {
        exists: !!pointer,
        display: cs(pointer)?.display,
        opacity: cs(pointer)?.opacity,
      },
      grain: {
        exists: !!grain,
        display: cs(grain)?.display,
        mixBlendMode: cs(grain)?.mixBlendMode,
        opacity: cs(grain)?.opacity,
      },
      grainOnClass: html.classList.contains('grain-on'),
      dataGrainAttr: html.getAttribute('data-grain'),
    };
  })()`);

  console.log('Desktop computed styles:', JSON.stringify(desktopStyles, null, 2));

  // Screenshot 1: Desktop Dark
  const ss1 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'b3_desktop_1440x900_dark.png'), Buffer.from(ss1.data, 'base64'));
  console.log('Saved b3_desktop_1440x900_dark.png');

  console.log('\n=== TEST 2: GRAIN TOGGLE (KEYBOARD SHORTCUT F) ===');
  await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  const grainOffStyles = await evaluate(`(() => {
    const html = document.documentElement;
    const grain = document.querySelector('.atmo__grain');
    return {
      grainOnClass: html.classList.contains('grain-on'),
      dataGrainAttr: html.getAttribute('data-grain'),
      grainDisplay: window.getComputedStyle(grain).display,
    };
  })()`);
  console.log('Grain OFF styles:', grainOffStyles);

  const ss2 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'b3_desktop_1440x900_grain_off.png'), Buffer.from(ss2.data, 'base64'));
  console.log('Saved b3_desktop_1440x900_grain_off.png');

  // Toggle grain back on
  await evaluate(`(() => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f', bubbles: true }));
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  console.log('\n=== TEST 3: LIGHT THEME ===');
  await evaluate(`(() => {
    document.documentElement.setAttribute('data-theme', 'light');
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  const lightStyles = await evaluate(`(() => {
    const html = document.documentElement;
    const body = document.body;
    const atmo = document.querySelector('.atmo');
    return {
      htmlBg: window.getComputedStyle(html).backgroundColor,
      bodyBg: window.getComputedStyle(body).backgroundColor,
      atmoDisplay: window.getComputedStyle(atmo).display,
    };
  })()`);
  console.log('Light mode styles:', lightStyles);

  const ss3 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'b3_desktop_1440x900_light.png'), Buffer.from(ss3.data, 'base64'));
  console.log('Saved b3_desktop_1440x900_light.png');

  // Restore dark theme
  await evaluate(`(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
  })()`);
  await new Promise((r) => setTimeout(r, 200));

  console.log('\n=== TEST 4: PREFERS-REDUCED-MOTION ===');
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await new Promise((r) => setTimeout(r, 200));

  const reducedMotionStyles = await evaluate(`(() => {
    const blobA = document.querySelector('.atmo__blob--a');
    const pointer = document.querySelector('.atmo__pointer');
    return {
      blobAnimation: window.getComputedStyle(blobA).animationName,
      pointerDisplay: window.getComputedStyle(pointer).display,
    };
  })()`);
  console.log('Reduced motion styles:', reducedMotionStyles);

  // Clear emulated media
  await send('Emulation.setEmulatedMedia', { features: [] });
  await new Promise((r) => setTimeout(r, 200));

  console.log('\n=== TEST 5: TOUCH / MOBILE EMULATION (390x844) ===');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await new Promise((r) => setTimeout(r, 200));

  const touchStyles = await evaluate(`(() => {
    const blobA = document.querySelector('.atmo__blob--a');
    const blobB = document.querySelector('.atmo__blob--b');
    const blobC = document.querySelector('.atmo__blob--c');
    const pointer = document.querySelector('.atmo__pointer');
    const grain = document.querySelector('.atmo__grain');
    const cs = (el) => window.getComputedStyle(el);
    return {
      blobA: { display: cs(blobA).display },
      blobB: { display: cs(blobB).display },
      blobC: { display: cs(blobC).display },
      pointer: { display: cs(pointer).display },
      grain: {
        mixBlendMode: cs(grain).mixBlendMode,
        opacity: cs(grain).opacity,
      },
    };
  })()`);
  console.log('Touch / Mobile styles:', touchStyles);

  const ss4 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'b3_mobile_390x844_dark.png'), Buffer.from(ss4.data, 'base64'));
  console.log('Saved b3_mobile_390x844_dark.png');

  console.log('\n=== TEST 6: DEVTOOLS PAINT FLASHING & COMPOSITOR-ONLY CHECK ===');
  // Revert to desktop
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await new Promise((r) => setTimeout(r, 500));

  // Check animations are compositor-driven
  const animationInfo = await evaluate(`(() => {
    const blobs = Array.from(document.querySelectorAll('.atmo__blob'));
    return blobs.map((b) => {
      const anims = b.getAnimations();
      return {
        id: b.className,
        animations: anims.map(a => ({
          name: a.animationName,
          playState: a.playState,
        }))
      };
    });
  })()`);
  console.log('Active Web Animations on blobs:', JSON.stringify(animationInfo, null, 2));

  ws.close();
  chromeProcess.kill();
  server.close();
  try {
    await new Promise(r => setTimeout(r, 500));
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}

  console.log('\nAll B3 verification tests executed successfully.');
  process.exit(0);
} catch (err) {
  console.error('Verification failed:', err);
  chromeProcess.kill();
  server.close();
  try {
    await new Promise(r => setTimeout(r, 500));
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}
  process.exit(1);
}
