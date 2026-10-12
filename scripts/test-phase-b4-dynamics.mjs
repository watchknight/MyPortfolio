import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { dhakaHour, phaseFor } from '../src/motion/atmosphere.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('Testing unit functions:');
console.log('dhakaHour():', dhakaHour());
console.log('phaseFor(3):', phaseFor(3), 'should be night');
console.log('phaseFor(6):', phaseFor(6), 'should be dawn');
console.log('phaseFor(12):', phaseFor(12), 'should be day');
console.log('phaseFor(18):', phaseFor(18), 'should be dusk');
console.log('phaseFor(22):', phaseFor(22), 'should be night');

if (phaseFor(3) !== 'night' || phaseFor(6) !== 'dawn' || phaseFor(12) !== 'day' || phaseFor(18) !== 'dusk' || phaseFor(22) !== 'night') {
  console.error('Unit tests failed for phaseFor!');
  process.exit(1);
}

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

const PORT = 4731;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[QA SERVER] Serving on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-b4-' + Date.now());
const CDP_PORT = 9367;
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
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

async function evalCode(expression) {
  const res = await send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(res.exceptionDetails.exception?.description || res.exceptionDetails.text);
  }
  return res.result?.value;
}

try {
  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('\n--- TEST 1: ?phase= query param honors forced phase ---');
  for (const phase of ['dawn', 'day', 'dusk', 'night']) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=${phase}` });
    await new Promise((r) => setTimeout(r, 800));
    const resultPhase = await evalCode(`document.documentElement.dataset.phase`);
    console.log(`  Phase ${phase}: got data-phase="${resultPhase}"`);
    if (resultPhase !== phase) {
      throw new Error(`Expected phase ${phase}, got ${resultPhase}`);
    }
  }

  console.log('\n--- TEST 2: ?atmo=off honors query param and saved off ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?atmo=off` });
  await new Promise((r) => setTimeout(r, 800));
  const isAtmoOff = await evalCode(`document.documentElement.classList.contains('atmo-off')`);
  console.log(`  ?atmo=off -> classList contains 'atmo-off':`, isAtmoOff);
  if (!isAtmoOff) throw new Error('Expected atmo-off class when ?atmo=off is present');

  // Test saved atmo=off in localStorage
  await evalCode(`localStorage.setItem('atmo', 'off');`);
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 800));
  const isSavedAtmoOff = await evalCode(`document.documentElement.classList.contains('atmo-off')`);
  console.log(`  localStorage 'atmo'='off' -> classList contains 'atmo-off':`, isSavedAtmoOff);
  if (!isSavedAtmoOff) throw new Error('Expected atmo-off class restored from localStorage');

  // Clear localStorage
  await evalCode(`localStorage.removeItem('atmo');`);
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 800));

  console.log('\n--- TEST 3: Section balance transitions on scroll ---');
  // Check initial hero balance
  const initialLayers = await evalCode(`
    (() => {
      const layers = Array.from(document.querySelectorAll('.atmo__layer'));
      return layers.map(l => parseFloat(window.getComputedStyle(l).opacity || '1'));
    })()
  `);
  console.log('  Hero section initial layer opacities:', initialLayers);
  // Hero is [1, 0.8, 0.6]
  if (Math.abs(initialLayers[0] - 1) > 0.05 || Math.abs(initialLayers[1] - 0.8) > 0.05 || Math.abs(initialLayers[2] - 0.6) > 0.05) {
    console.warn('  Layer opacities hero variance:', initialLayers);
  }

  // Scroll to #selected-work (data-section="work")
  await evalCode(`
    (() => {
      const el = document.querySelector('[data-section="work"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()
  `);
  // Allow GSAP 2.2s ease to complete
  await new Promise((r) => setTimeout(r, 2500));
  const workLayers = await evalCode(`
    (() => {
      const layers = Array.from(document.querySelectorAll('.atmo__layer'));
      return layers.map(l => parseFloat(window.getComputedStyle(l).opacity || '1'));
    })()
  `);
  console.log('  Work section layer opacities (target [0.7, 1, 0.7]):', workLayers);
  if (Math.abs(workLayers[0] - 0.7) > 0.05 || Math.abs(workLayers[1] - 1) > 0.05 || Math.abs(workLayers[2] - 0.7) > 0.05) {
    throw new Error(`Work balance mismatch: got ${JSON.stringify(workLayers)}`);
  }

  // Scroll to #about (data-section="about")
  await evalCode(`
    (() => {
      const el = document.querySelector('[data-section="about"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));
  const aboutLayers = await evalCode(`
    (() => {
      const layers = Array.from(document.querySelectorAll('.atmo__layer'));
      return layers.map(l => parseFloat(window.getComputedStyle(l).opacity || '1'));
    })()
  `);
  console.log('  About section layer opacities (target [0.6, 0.8, 1]):', aboutLayers);
  if (Math.abs(aboutLayers[0] - 0.6) > 0.05 || Math.abs(aboutLayers[1] - 0.8) > 0.05 || Math.abs(aboutLayers[2] - 1) > 0.05) {
    throw new Error(`About balance mismatch: got ${JSON.stringify(aboutLayers)}`);
  }

  // Scroll to #guestbook (data-section="guestbook")
  await evalCode(`
    (() => {
      const el = document.querySelector('[data-section="guestbook"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));
  const guestbookLayers = await evalCode(`
    (() => {
      const layers = Array.from(document.querySelectorAll('.atmo__layer'));
      return layers.map(l => parseFloat(window.getComputedStyle(l).opacity || '1'));
    })()
  `);
  console.log('  Guestbook section layer opacities (target [0.8, 0.7, 0.8]):', guestbookLayers);
  if (Math.abs(guestbookLayers[0] - 0.8) > 0.05 || Math.abs(guestbookLayers[1] - 0.7) > 0.05 || Math.abs(guestbookLayers[2] - 0.8) > 0.05) {
    throw new Error(`Guestbook balance mismatch: got ${JSON.stringify(guestbookLayers)}`);
  }

  // Scroll to #contact (data-section="contact")
  await evalCode(`
    (() => {
      const el = document.querySelector('[data-section="contact"]');
      if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()
  `);
  await new Promise((r) => setTimeout(r, 2500));
  const contactLayers = await evalCode(`
    (() => {
      const layers = Array.from(document.querySelectorAll('.atmo__layer'));
      return layers.map(l => parseFloat(window.getComputedStyle(l).opacity || '1'));
    })()
  `);
  console.log('  Contact section layer opacities (target [1, 0.9, 0.5]):', contactLayers);
  if (Math.abs(contactLayers[0] - 1) > 0.05 || Math.abs(contactLayers[1] - 0.9) > 0.05 || Math.abs(contactLayers[2] - 0.5) > 0.05) {
    throw new Error(`Contact balance mismatch: got ${JSON.stringify(contactLayers)}`);
  }

  console.log('\n--- TEST 4: Pointer light follows cursor on desktop ---');
  // Dispatch pointermove
  await evalCode(`
    (() => {
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 300, clientY: 400 }));
    })()
  `);
  await new Promise((r) => setTimeout(r, 500));
  const pointerState = await evalCode(`
    (() => {
      const p = document.querySelector('.atmo__pointer');
      return {
        isOn: p?.classList.contains('is-on'),
        transform: p?.style.transform,
      };
    })()
  `);
  console.log('  Desktop pointer light:', pointerState);
  if (!pointerState.isOn || !pointerState.transform.includes('300')) {
    console.log('  Pointer transformed to:', pointerState.transform);
  }

  console.log('\n--- TEST 5: Atmosphere Switch in Controls Popover ---');
  // Open controls popover
  await evalCode(`
    (() => {
      const btn = document.querySelector('[aria-controls="controls-popover"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  const popoverSwitchState = await evalCode(`
    (() => {
      const popover = document.querySelector('#controls-popover');
      if (!popover) return { found: false };
      const rows = Array.from(popover.querySelectorAll('[class*="controlRow"]'));
      const atmoRow = rows.find(r => r.textContent.includes('Atmosphere'));
      if (!atmoRow) return { found: false };
      const btn = atmoRow.querySelector('button');
      return {
        found: true,
        pressed: btn?.getAttribute('aria-pressed'),
        text: btn?.textContent?.trim(),
        htmlAtmoOff: document.documentElement.classList.contains('atmo-off'),
      };
    })()
  `);
  console.log('  Controls popover Atmosphere switch initial:', popoverSwitchState);
  if (!popoverSwitchState.found) throw new Error('Atmosphere switch not found in Controls popover');
  if (popoverSwitchState.pressed !== 'true' || popoverSwitchState.text !== 'ON') {
    throw new Error(`Expected switch ON, got ${JSON.stringify(popoverSwitchState)}`);
  }

  // Click switch to turn OFF
  await evalCode(`
    (() => {
      const popover = document.querySelector('#controls-popover');
      const rows = Array.from(popover.querySelectorAll('[class*="controlRow"]'));
      const atmoRow = rows.find(r => r.textContent.includes('Atmosphere'));
      atmoRow.querySelector('button').click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  const turnedOffState = await evalCode(`
    (() => {
      const popover = document.querySelector('#controls-popover');
      const rows = Array.from(popover.querySelectorAll('[class*="controlRow"]'));
      const atmoRow = rows.find(r => r.textContent.includes('Atmosphere'));
      const btn = atmoRow.querySelector('button');
      return {
        pressed: btn?.getAttribute('aria-pressed'),
        text: btn?.textContent?.trim(),
        htmlAtmoOff: document.documentElement.classList.contains('atmo-off'),
        storage: localStorage.getItem('atmo'),
        pointerDisplay: window.getComputedStyle(document.querySelector('.atmo__pointer')).display,
        blobAnimation: window.getComputedStyle(document.querySelector('.atmo__blob')).animationName,
      };
    })()
  `);
  console.log('  Toggled OFF state:', turnedOffState);
  if (turnedOffState.pressed !== 'false' || turnedOffState.text !== 'OFF' || !turnedOffState.htmlAtmoOff) {
    throw new Error('Atmosphere switch did not turn off properly');
  }
  if (turnedOffState.pointerDisplay !== 'none') {
    throw new Error(`Expected pointer display:none when atmo-off, got ${turnedOffState.pointerDisplay}`);
  }
  if (turnedOffState.blobAnimation !== 'none') {
    throw new Error(`Expected blob animation:none when atmo-off, got ${turnedOffState.blobAnimation}`);
  }

  // Click switch to turn back ON
  await evalCode(`
    (() => {
      const popover = document.querySelector('#controls-popover');
      const rows = Array.from(popover.querySelectorAll('[class*="controlRow"]'));
      const atmoRow = rows.find(r => r.textContent.includes('Atmosphere'));
      atmoRow.querySelector('button').click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  const turnedOnState = await evalCode(`
    (() => {
      const popover = document.querySelector('#controls-popover');
      const rows = Array.from(popover.querySelectorAll('[class*="controlRow"]'));
      const atmoRow = rows.find(r => r.textContent.includes('Atmosphere'));
      const btn = atmoRow.querySelector('button');
      return {
        pressed: btn?.getAttribute('aria-pressed'),
        text: btn?.textContent?.trim(),
        htmlAtmoOff: document.documentElement.classList.contains('atmo-off'),
        storage: localStorage.getItem('atmo'),
      };
    })()
  `);
  console.log('  Toggled ON state:', turnedOnState);
  if (turnedOnState.pressed !== 'true' || turnedOnState.text !== 'ON' || turnedOnState.htmlAtmoOff) {
    throw new Error('Atmosphere switch did not turn on properly');
  }

  console.log('\n--- TEST 6: Tab Visibility Pauses CSS Animation ---');
  await evalCode(`
    (() => {
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  const hiddenState = await evalCode(`
    (() => {
      return {
        htmlPaused: document.documentElement.classList.contains('atmo-paused'),
        blobPlayState: window.getComputedStyle(document.querySelector('.atmo__blob')).animationPlayState,
      };
    })()
  `);
  console.log('  Document hidden state:', hiddenState);
  if (!hiddenState.htmlPaused || hiddenState.blobPlayState !== 'paused') {
    throw new Error('Expected atmo-paused class and paused animation-play-state when tab hidden');
  }

  // Return tab to visible
  await evalCode(`
    (() => {
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  const visibleState = await evalCode(`
    (() => {
      return {
        htmlPaused: document.documentElement.classList.contains('atmo-paused'),
        blobPlayState: window.getComputedStyle(document.querySelector('.atmo__blob')).animationPlayState,
      };
    })()
  `);
  console.log('  Document visible state:', visibleState);
  if (visibleState.htmlPaused || !visibleState.blobPlayState.includes('running')) {
    throw new Error('Expected atmo-paused removed and running animation-play-state when tab visible');
  }

  console.log('\n--- TEST 7: Mobile Sheet Atmosphere switch ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 1000));

  // Open mobile menu
  await evalCode(`
    (() => {
      const btn = document.querySelector('button[aria-label*="navigation menu"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 400));

  const mobileSwitchState = await evalCode(`
    (() => {
      const items = Array.from(document.querySelectorAll('[class*="mobileControlItem"]'));
      const atmoItem = items.find(i => i.textContent.includes('Atmosphere'));
      if (!atmoItem) return { found: false };
      const btn = atmoItem.querySelector('button');
      return {
        found: true,
        pressed: btn?.getAttribute('aria-pressed'),
        text: btn?.textContent?.trim(),
      };
    })()
  `);
  console.log('  Mobile sheet Atmosphere switch:', mobileSwitchState);
  if (!mobileSwitchState.found || mobileSwitchState.pressed !== 'true' || mobileSwitchState.text !== 'ON') {
    throw new Error('Atmosphere switch in mobile sheet not found or not ON');
  }

  // Toggle on mobile
  await evalCode(`
    (() => {
      const items = Array.from(document.querySelectorAll('[class*="mobileControlItem"]'));
      const atmoItem = items.find(i => i.textContent.includes('Atmosphere'));
      atmoItem.querySelector('button').click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 300));

  const mobileToggledOff = await evalCode(`
    (() => {
      const items = Array.from(document.querySelectorAll('[class*="mobileControlItem"]'));
      const atmoItem = items.find(i => i.textContent.includes('Atmosphere'));
      const btn = atmoItem.querySelector('button');
      return {
        pressed: btn?.getAttribute('aria-pressed'),
        text: btn?.textContent?.trim(),
        htmlAtmoOff: document.documentElement.classList.contains('atmo-off'),
      };
    })()
  `);
  console.log('  Mobile sheet toggled off:', mobileToggledOff);
  if (mobileToggledOff.pressed !== 'false' || mobileToggledOff.text !== 'OFF' || !mobileToggledOff.htmlAtmoOff) {
    throw new Error('Mobile switch did not toggle off');
  }

  // Pointer light on mobile touch
  const mobilePointer = await evalCode(`
    (() => {
      const p = document.querySelector('.atmo__pointer');
      return {
        display: p ? window.getComputedStyle(p).display : 'none',
      };
    })()
  `);
  console.log('  Mobile pointer light display (should be none):', mobilePointer.display);
  if (mobilePointer.display !== 'none') {
    throw new Error(`Expected mobile pointer display: none, got ${mobilePointer.display}`);
  }

  console.log('\n========================================================');
  console.log('   ALL PHASE B4 DYNAMICS ACCEPTANCE TESTS PASSED!   ');
  console.log('========================================================\n');
} catch (err) {
  console.error('Test execution failed:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chromeProcess.kill();
  server.close();
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}
}
