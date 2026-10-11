import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const axeSourcePath = 'C:\\Users\\Moayed\\AppData\\Local\\npm-cache\\_npx\\0f94ee7615faf582\\node_modules\\axe-core\\axe.min.js';
const axeSource = fs.readFileSync(axeSourcePath, 'utf-8');

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

const PORT = 4710;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-p7-' + Date.now());
const CDP_PORT = 9355;
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
  const res = await send('Runtime.evaluate', {
    expression: expr,
    returnByValue: true,
    awaitPromise: true,
  });
  if (res.exceptionDetails) {
    throw new Error(JSON.stringify(res.exceptionDetails));
  }
  return res.result ? res.result.value : undefined;
}


let passes = 0;
let fails = 0;
function assert(name, condition, extra = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${name} ${extra ? '(' + extra + ')' : ''}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${name} ${extra ? '(' + extra + ')' : ''}`);
    fails++;
  }
}

try {
  await send('Page.enable');

  console.log('\n--- 1. AXE ACCESSIBILITY AUDIT (ALL ROUTES) ---');
  const routes = ['/', '/works', '/foundation', '/resume', '/contact'];
  for (const route of routes) {
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${route}` });
    await new Promise((r) => setTimeout(r, 1200));
    await send('Runtime.evaluate', { expression: axeSource });
    const report = await evalJs(`axe.run()`);
    const violations = report.violations || [];
    if (violations.length > 0) {
      console.log('Violation on', route, JSON.stringify(violations, null, 2));
    }
    assert(`Axe a11y on ${route} has 0 violations`, violations.length === 0, `violations=${violations.length}, passed=${report.passes.length}`);
  }

  console.log('\n--- 2. KEYBOARD NAVIGATION & FOCUS TRAPS ---');
  // Test skip link
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 500));
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
  const skipLinkCheck = await evalJs(`(() => {
    const el = document.activeElement;
    return el && el.getAttribute('href') === '#main-content';
  })()`);
  assert('First tab stop is skip link', skipLinkCheck);

  // Test Command Palette focus trap & escape
  await evalJs(`window.dispatchEvent(new CustomEvent('toggle-command-palette'))`);
  await new Promise((r) => setTimeout(r, 350));
  const paletteOpen = await evalJs(`!!document.querySelector('[role="dialog"][aria-label="Command Deck"]')`);
  assert('Command palette opens', paletteOpen);

  // Tab multiple times to verify focus remains trapped inside the palette
  for (let i = 0; i < 3; i++) {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Tab', code: 'Tab' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab' });
  }
  const focusTrappedInPalette = await evalJs(`(() => {
    const dialog = document.querySelector('[role="dialog"][aria-label="Command Deck"]');
    return dialog && dialog.contains(document.activeElement);
  })()`);
  assert('⌘K Command palette traps focus inside dialog', focusTrappedInPalette);

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await new Promise((r) => setTimeout(r, 350));
  const paletteClosed = await evalJs(`!document.querySelector('[role="dialog"][aria-label="Command Deck"]')`);
  assert('Escape closes Command Palette', paletteClosed);

  // Test Controls Popover keyboard open, focus trap, and Escape closure
  await evalJs(`(() => {
    const btn = document.querySelector('[aria-controls="controls-popover"]');
    if (btn) btn.click();
  })()`);
  await new Promise((r) => setTimeout(r, 350));
  const controlsOpened = await evalJs(`!!document.querySelector('#controls-popover')`);
  assert('Controls popover opens on button click', controlsOpened);

  const focusInControls = await evalJs(`(() => {
    const popover = document.querySelector('#controls-popover');
    return popover && popover.contains(document.activeElement);
  })()`);
  assert('Controls popover traps initial keyboard focus', focusInControls);

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await new Promise((r) => setTimeout(r, 350));
  const controlsClosed = await evalJs(`!document.querySelector('#controls-popover')`);
  assert('Escape closes Controls popover', controlsClosed);

  // Test Mobile Sheet keyboard open, focus trap, and Escape closure
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 800));

  await evalJs(`(() => {
    const burger = document.querySelector('button[aria-label*="navigation menu"]');
    if (burger) burger.click();
  })()`);
  await new Promise((r) => setTimeout(r, 350));
  const sheetOpened = await evalJs(`!!document.querySelector('[role="dialog"][aria-label="Navigation Menu"]')`);
  assert('Mobile navigation sheet opens', sheetOpened);

  const focusInSheet = await evalJs(`(() => {
    const sheet = document.querySelector('[role="dialog"][aria-label="Navigation Menu"]');
    return sheet && sheet.contains(document.activeElement);
  })()`);
  assert('Mobile navigation sheet traps keyboard focus', focusInSheet);

  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape' });
  await new Promise((r) => setTimeout(r, 350));
  const sheetClosed = await evalJs(`!document.querySelector('[role="dialog"][aria-label="Navigation Menu"]')`);
  assert('Escape closes Mobile navigation sheet', sheetClosed);

  // Reset viewport to desktop
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('\n--- 3. SEO METADATA & STRUCTURED DATA ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 600));

  const seoCheck = await evalJs(`(() => {
    const title = document.title;
    const metaDesc = document.querySelector('meta[name="description"]')?.getAttribute('content');
    const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href');
    const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content');
    const jsonLd = document.querySelector('script[type="application/ld+json"]')?.textContent;
    let parsedLd = null;
    try { parsedLd = JSON.parse(jsonLd); } catch {}
    return {
      title,
      metaDesc,
      canonical,
      ogImage,
      hasPersonSchema: parsedLd && parsedLd['@type'] === 'Person',
    };
  })()`);

  assert('Title contains Abdur Rahman Moayed', seoCheck.title.includes('Abdur Rahman Moayed'));
  assert('Meta description has correct project list', seoCheck.metaDesc.includes('PureFeed, FocusGuard, and DocLensBD'));
  assert('Canonical matches production domain', seoCheck.canonical === 'https://watchknight-dev.onrender.com/');
  assert('OG image points to production og-image.png', seoCheck.ogImage === 'https://watchknight-dev.onrender.com/og-image.png');
  assert('JSON-LD Person schema is valid', seoCheck.hasPersonSchema);

  console.log('\n--- 4. REDUCED MOTION, TOUCH EMULATION & NO-JS PASSES ---');
  // Reduced Motion
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 500));
  const motionCheck = await evalJs(`(() => {
    const mainEl = document.querySelector('main');
    return mainEl && getComputedStyle(mainEl).opacity === '1';
  })()`);
  assert('Main content is visible under prefers-reduced-motion', motionCheck);

  // Touch Emulation (coarse pointer)
  await send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    mobile: true,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 600));

  const touchCheck = await evalJs(`(() => {
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    const ringHidden = !ring || getComputedStyle(ring).display === 'none';
    const dotHidden = !dot || getComputedStyle(dot).display === 'none';

    // Verify touch target sizes
    const interactive = Array.from(document.querySelectorAll('button, a[href]'));
    const smallTargets = interactive.filter((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40);
    });

    return {
      cursorHidden: ringHidden && dotHidden,
      minTapTargetsMet: smallTargets.length === 0,
      smallCount: smallTargets.length,
    };
  })()`);
  assert('Custom cursor ring and dot hidden under touch emulation', touchCheck.cursorHidden);
  assert('Touch interactive targets satisfy minimum hit dimensions', touchCheck.minTapTargetsMet, `small=${touchCheck.smallCount}`);

  // No-JS static archive check
  const noJsHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf-8');
  assert('Prerendered HTML contains noscript banner', noJsHtml.includes('⚡ JavaScript execution is disabled'));
  assert('Prerendered HTML contains full hero and project markup', noJsHtml.includes('PureFeed') && noJsHtml.includes('FocusGuard') && noJsHtml.includes('DocLensBD'));

  console.log('\n=============================================');
  console.log(`TOTAL PHASE 7 TESTS: ${passes + fails} | PASSES: ${passes} | FAILS: ${fails}`);
  console.log('=============================================\n');

  if (fails > 0) process.exitCode = 1;

} catch (err) {
  console.error('Test Error:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chromeProcess.kill();
  server.close();
  try { fs.rmSync(tempProfile, { recursive: true, force: true }); } catch {}
}
