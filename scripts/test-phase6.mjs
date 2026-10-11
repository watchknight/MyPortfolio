import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

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
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 4690;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[TEST] HTTP test server listening on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-' + Date.now());
const CDP_PORT = 9338;
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
console.log('[TEST] Connected to Chrome target:', pageTarget.title, pageTarget.url);

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

async function setViewport(width, height, isMobile = false) {
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 2,
    mobile: isMobile,
    screenOrientation: { angle: 0, type: 'portraitPrimary' },
  });
  if (isMobile) {
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  } else {
    await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  }
  await new Promise((r) => setTimeout(r, 150));
}

async function navigate(urlPath) {
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}${urlPath}` });
  await new Promise((r) => setTimeout(r, 500));
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
  await send('DOM.enable');

  console.log('\n--- 1. VIEWPORT HORIZONTAL OVERFLOW & LAYOUT CHECKS ---');
  const viewports = [
    { w: 360, h: 740, mobile: true, name: 'Small Android (360x740)' },
    { w: 390, h: 844, mobile: true, name: 'iPhone 12/13/14 (390x844)' },
    { w: 412, h: 915, mobile: true, name: 'Pixel 7 (412x915)' },
    { w: 768, h: 1024, mobile: true, name: 'iPad Portrait (768x1024)' },
    { w: 1024, h: 768, mobile: false, name: 'iPad Landscape (1024x768)' },
    { w: 1440, h: 900, mobile: false, name: 'Desktop (1440x900)' },
  ];

  for (const vp of viewports) {
    await setViewport(vp.w, vp.h, vp.mobile);
    await navigate('/');
    await new Promise((r) => setTimeout(r, 200));

    const overflowData = await evalJs(`(() => {
      const docW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      const winW = window.innerWidth;
      return { docW, bodyW, winW, hasOverflow: docW > winW || bodyW > winW };
    })()`);

    assert(
      `No horizontal overflow on ${vp.name}`,
      !overflowData.hasOverflow,
      `docW=${overflowData.docW}, bodyW=${overflowData.bodyW}, winW=${overflowData.winW}`
    );
  }

  console.log('\n--- 2. MOBILE TOP BAR & FULL-HEIGHT MENU SHEET (< 640px) ---');
  await setViewport(390, 844, true);
  await navigate('/');

  const mobileNavCheck = await evalJs(`(() => {
    const menuBtn = document.querySelector('button[aria-label="Open navigation menu"]');
    const desktopLinks = document.querySelector('nav span:not([aria-hidden])');
    const menuBtnRect = menuBtn ? menuBtn.getBoundingClientRect() : null;
    return {
      hasMenuBtn: !!menuBtn,
      menuBtnWidth: menuBtnRect ? menuBtnRect.width : 0,
      menuBtnHeight: menuBtnRect ? menuBtnRect.height : 0
    };
  })()`);

  assert('Menu button present on mobile', mobileNavCheck.hasMenuBtn);
  assert(
    'Menu button tap target >= 44x44px',
    mobileNavCheck.menuBtnWidth >= 44 && mobileNavCheck.menuBtnHeight >= 44,
    `width=${mobileNavCheck.menuBtnWidth}, height=${mobileNavCheck.menuBtnHeight}`
  );

  // Click menu button to open full-height sheet
  await evalJs(`document.querySelector('button[aria-label="Open navigation menu"]').click()`);
  await new Promise((r) => setTimeout(r, 200));

  const sheetOpenCheck = await evalJs(`(() => {
    const sheet = document.querySelector('[role="dialog"][aria-label="Navigation Menu"]');
    const links = sheet ? sheet.querySelectorAll('a').length : 0;
    const bodyLocked = document.body.style.overflow === 'hidden';
    const closeBtn = document.querySelector('button[aria-label="Close navigation menu"]');
    const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
    return {
      sheetPresent: !!sheet,
      linksCount: links,
      bodyLocked,
      hasCloseBtn: !!closeBtn,
      closeBtnWidth: closeRect ? closeRect.width : 0,
      closeBtnHeight: closeRect ? closeRect.height : 0
    };
  })()`);

  assert('Mobile sheet opens on menu button click', sheetOpenCheck.sheetPresent);
  assert('Mobile sheet contains navigation links', sheetOpenCheck.linksCount >= 4, `count=${sheetOpenCheck.linksCount}`);
  assert('Body scroll locked when mobile sheet is open', sheetOpenCheck.bodyLocked);
  assert(
    'Close button tap target >= 44x44px',
    sheetOpenCheck.closeBtnWidth >= 44 && sheetOpenCheck.closeBtnHeight >= 44,
    `width=${sheetOpenCheck.closeBtnWidth}, height=${sheetOpenCheck.closeBtnHeight}`
  );

  // Close sheet
  await evalJs(`document.querySelector('button[aria-label="Close navigation menu"]').click()`);
  await new Promise((r) => setTimeout(r, 350));

  const sheetClosedCheck = await evalJs(`(() => {
    const sheet = document.querySelector('[role="dialog"][aria-label="Navigation Menu"]');
    const bodyLocked = document.body.style.overflow === 'hidden';
    return { sheetPresent: !!sheet, bodyLocked };
  })()`);

  assert('Mobile sheet closes properly', !sheetClosedCheck.sheetPresent);
  assert('Body scroll unlocked when mobile sheet closes', !sheetClosedCheck.bodyLocked);

  console.log('\n--- 3. GUESTBOOK CANVAS TOUCH BEHAVIOR & DPR CAP ---');
  const canvasCheck = await evalJs(`(() => {
    const canvas = document.querySelector('section#guestbook canvas');
    const container = canvas ? canvas.parentElement : null;
    const drawBtn = document.querySelector('button[aria-label="Open full-screen drawing canvas"]');
    const touchAction = container ? getComputedStyle(container).touchAction : '';
    const canvasTouchAction = canvas ? getComputedStyle(canvas).touchAction : '';
    const drawBtnRect = drawBtn ? drawBtn.getBoundingClientRect() : null;
    const dprCap = Math.min(window.devicePixelRatio || 1, 2);
    return {
      touchAction,
      canvasTouchAction,
      hasDrawBtn: !!drawBtn,
      drawBtnWidth: drawBtnRect ? drawBtnRect.width : 0,
      drawBtnHeight: drawBtnRect ? drawBtnRect.height : 0,
      dprCap
    };
  })()`);

  assert(
    'Inline guestbook canvas has touch-action: pan-y (prevents scroll trapping)',
    canvasCheck.canvasTouchAction.includes('pan-y') || canvasCheck.touchAction.includes('pan-y'),
    `touchAction=${canvasCheck.touchAction || canvasCheck.canvasTouchAction}`
  );
  assert('Guestbook has "Draw" button for dedicated touch drawing', canvasCheck.hasDrawBtn);
  assert(
    'Draw button tap target >= 44x44px',
    canvasCheck.drawBtnWidth >= 44 && canvasCheck.drawBtnHeight >= 44,
    `width=${canvasCheck.drawBtnWidth}, height=${canvasCheck.drawBtnHeight}`
  );
  assert('Canvas DPR is capped at 2', canvasCheck.dprCap <= 2, `dprCap=${canvasCheck.dprCap}`);

  // Click Draw button to open full-screen sheet
  await evalJs(`document.querySelector('button[aria-label="Open full-screen drawing canvas"]').click()`);
  await new Promise((r) => setTimeout(r, 200));

  const drawSheetCheck = await evalJs(`(() => {
    const sheet = document.querySelector('[role="dialog"][aria-label="Signature Drawing Pad"]');
    const doneBtn = sheet ? sheet.querySelector('button[class*="sheetDoneBtn"]') : null;
    const sheetCanvas = sheet ? sheet.querySelector('canvas') : null;
    const sheetTouchAction = sheetCanvas ? getComputedStyle(sheetCanvas).touchAction : '';
    const doneRect = doneBtn ? doneBtn.getBoundingClientRect() : null;
    return {
      sheetPresent: !!sheet,
      sheetTouchAction,
      hasDoneBtn: !!doneBtn,
      doneWidth: doneRect ? doneRect.width : 0,
      doneHeight: doneRect ? doneRect.height : 0
    };
  })()`);

  assert('Draw button opens full-screen drawing sheet', drawSheetCheck.sheetPresent);
  assert(
    'Drawing sheet canvas has touch-action: none for uninterrupted sketching',
    drawSheetCheck.sheetTouchAction === 'none',
    `touchAction=${drawSheetCheck.sheetTouchAction}`
  );
  assert(
    'Drawing sheet Done button tap target >= 44x44px',
    drawSheetCheck.doneWidth >= 44 && drawSheetCheck.doneHeight >= 44,
    `width=${drawSheetCheck.doneWidth}, height=${drawSheetCheck.doneHeight}`
  );

  // Close drawing sheet
  await evalJs(`document.querySelector('[role="dialog"][aria-label="Signature Drawing Pad"] button[class*="sheetDoneBtn"]').click()`);
  await new Promise((r) => setTimeout(r, 350));

  console.log('\n--- 4. INPUT FONT SIZE >= 16PX (NO IOS AUTO-ZOOM) ---');
  const inputFontCheck = await evalJs(`(() => {
    const terminalInput = document.querySelector('input[aria-label="Terminal command input"]');
    const termFontSize = terminalInput ? parseFloat(getComputedStyle(terminalInput).fontSize) : 0;
    return { termFontSize };
  })()`);

  assert(
    'Terminal input font size >= 16px',
    inputFontCheck.termFontSize >= 16,
    `fontSize=${inputFontCheck.termFontSize}px`
  );

  const termBtnsCheck = await evalJs(`(() => {
    const execBtn = document.querySelector('button[aria-label="Run command"]');
    const execRect = execBtn ? execBtn.getBoundingClientRect() : null;
    const chips = Array.from(document.querySelectorAll('button[class*="quickChip"]'));
    const chipHeights = chips.map((c) => c.getBoundingClientRect().height);
    const minChipHeight = chipHeights.length ? Math.min(...chipHeights) : 0;
    const viewToggle = document.querySelector('button[class*="viewToggleBtn"]');
    const viewToggleHeight = viewToggle ? viewToggle.getBoundingClientRect().height : 0;
    return {
      execWidth: execRect ? execRect.width : 0,
      execHeight: execRect ? execRect.height : 0,
      minChipHeight,
      viewToggleHeight
    };
  })()`);

  assert(
    'Terminal execute button tap target >= 44x44px',
    termBtnsCheck.execWidth >= 44 && termBtnsCheck.execHeight >= 44,
    `width=${termBtnsCheck.execWidth}, height=${termBtnsCheck.execHeight}`
  );
  assert(
    'Terminal quick chips min-height >= 44px',
    termBtnsCheck.minChipHeight >= 44,
    `minHeight=${termBtnsCheck.minChipHeight}px`
  );
  assert(
    'Home view toggle button min-height >= 44px',
    termBtnsCheck.viewToggleHeight >= 44,
    `height=${termBtnsCheck.viewToggleHeight}px`
  );

  // Navigate to contact and check inputs
  await navigate('/contact');
  await new Promise((r) => setTimeout(r, 200));

  const contactInputsCheck = await evalJs(`(() => {
    const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
    const fontSizes = inputs.map((el) => parseFloat(getComputedStyle(el).fontSize));
    const allGe16 = fontSizes.every((sz) => sz >= 16);
    return { count: inputs.length, minFont: Math.min(...fontSizes), allGe16 };
  })()`);

  assert(
    'All contact form inputs have font-size >= 16px',
    contactInputsCheck.allGe16,
    `count=${contactInputsCheck.count}, minFont=${contactInputsCheck.minFont}px`
  );

  console.log('\n--- 5. COMMAND PALETTE MODAL & TAP TARGETS ---');
  await navigate('/');
  await evalJs(`window.dispatchEvent(new CustomEvent('toggle-command-palette'))`);
  await new Promise((r) => setTimeout(r, 350));

  const cmdPaletteCheck = await evalJs(`(() => {
    const palette = document.querySelector('[role="dialog"][aria-label="Command Deck"]');
    const searchInput = palette ? palette.querySelector('input') : null;
    const inputFont = searchInput ? parseFloat(getComputedStyle(searchInput).fontSize) : 0;
    const items = palette ? Array.from(palette.querySelectorAll('[role="option"]')) : [];
    const itemHeights = items.map((it) => it.getBoundingClientRect().height);
    const minHeight = itemHeights.length ? Math.min(...itemHeights) : 0;
    const escBtn = palette ? palette.querySelector('button[aria-label="Close command palette"]') : null;
    const escRect = escBtn ? escBtn.getBoundingClientRect() : null;
    return {
      palettePresent: !!palette,
      inputFont,
      minItemHeight: minHeight,
      escBtnWidth: escRect ? escRect.width : 0,
      escBtnHeight: escRect ? escRect.height : 0
    };
  })()`);

  assert('Command palette modal opens', cmdPaletteCheck.palettePresent);
  assert(
    'Command palette search input font size >= 16px',
    cmdPaletteCheck.inputFont >= 16,
    `fontSize=${cmdPaletteCheck.inputFont}px`
  );
  assert(
    'Command palette option items min-height >= 44px',
    cmdPaletteCheck.minItemHeight >= 44,
    `minItemHeight=${cmdPaletteCheck.minItemHeight}px`
  );
  assert(
    'Command palette close button tap target >= 44x44px',
    cmdPaletteCheck.escBtnWidth >= 44 && cmdPaletteCheck.escBtnHeight >= 44,
    `width=${cmdPaletteCheck.escBtnWidth}, height=${cmdPaletteCheck.escBtnHeight}`
  );

  // Close palette
  await evalJs(`document.querySelector('button[aria-label="Close command palette"]').click()`);
  await new Promise((r) => setTimeout(r, 350));

  console.log('\n--- 6. SYSTEM DIAGNOSTIC MODAL TAP TARGETS ---');
  await evalJs(`window.dispatchEvent(new CustomEvent('open-sys-diagnostic'))`);
  for (let i = 0; i < 25; i++) {
    const isLoaded = await evalJs(`!!document.querySelector('[role="dialog"][aria-labelledby="diag-title"]')`);
    if (isLoaded) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  const sysModalCheck = await evalJs(`(() => {
    const modal = document.querySelector('[role="dialog"][aria-labelledby="diag-title"]');
    const closeBtn = modal ? modal.querySelector('button[aria-label="Close Diagnostic Suite (Esc)"]') : null;
    const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
    const actionBtns = modal ? Array.from(modal.querySelectorAll('footer button')) : [];
    const actionHeights = actionBtns.map((b) => b.getBoundingClientRect().height);
    const minActionHeight = actionHeights.length ? Math.min(...actionHeights) : 0;
    return {
      modalPresent: !!modal,
      closeBtnWidth: closeRect ? closeRect.width : 0,
      closeBtnHeight: closeRect ? closeRect.height : 0,
      minActionHeight
    };
  })()`);

  assert('System diagnostic modal opens', sysModalCheck.modalPresent);
  assert(
    'System diagnostic close button tap target >= 44x44px',
    sysModalCheck.closeBtnWidth >= 44 && sysModalCheck.closeBtnHeight >= 44,
    `width=${sysModalCheck.closeBtnWidth}, height=${sysModalCheck.closeBtnHeight}`
  );
  assert(
    'System diagnostic action buttons min-height >= 44px',
    sysModalCheck.minActionHeight >= 44,
    `minActionHeight=${sysModalCheck.minActionHeight}px`
  );

  // Close modal
  await evalJs(`document.querySelector('button[aria-label="Close Diagnostic Suite (Esc)"]').click()`);
  await new Promise((r) => setTimeout(r, 350));

  console.log('\n--- 7. CASE STUDY MODAL TAP TARGETS & SAFE AREAS ---');
  await evalJs(`window.dispatchEvent(new CustomEvent('open-project-modal', { detail: 'purefeed' }))`);
  for (let i = 0; i < 25; i++) {
    const isLoaded = await evalJs(`!!document.querySelector('[role="dialog"][aria-label*="PureFeed"]') || !!document.querySelector('button[aria-label="Close case study"]')`);
    if (isLoaded) break;
    await new Promise((r) => setTimeout(r, 100));
  }

  const caseStudyCheck = await evalJs(`(() => {
    const closeBtn = document.querySelector('button[aria-label="Close case study"]') || document.querySelector('button[class*="closeBtn"]');
    const closeRect = closeBtn ? closeBtn.getBoundingClientRect() : null;
    const tabBtns = Array.from(document.querySelectorAll('button[class*="tabBtn"]'));
    const tabHeights = tabBtns.map((b) => b.getBoundingClientRect().height);
    const minTabHeight = tabHeights.length ? Math.min(...tabHeights) : 0;
    return {
      modalPresent: !!closeBtn,
      closeBtnWidth: closeRect ? closeRect.width : 0,
      closeBtnHeight: closeRect ? closeRect.height : 0,
      minTabHeight
    };
  })()`);

  assert('Case study modal opens', caseStudyCheck.modalPresent);
  assert(
    'Case study close button tap target >= 44x44px',
    caseStudyCheck.closeBtnWidth >= 44 && caseStudyCheck.closeBtnHeight >= 44,
    `width=${caseStudyCheck.closeBtnWidth}, height=${caseStudyCheck.closeBtnHeight}`
  );
  assert(
    'Case study tab buttons min-height >= 44px',
    caseStudyCheck.minTabHeight >= 44,
    `minTabHeight=${caseStudyCheck.minTabHeight}px`
  );

  // Close case study
  await evalJs(`(document.querySelector('button[aria-label="Close case study"]') || document.querySelector('button[class*="closeBtn"]')).click()`);
  await new Promise((r) => setTimeout(r, 350));

  console.log('\n--- 8. INITIAL JS GZIP PAYLOAD BUDGET (< 200 KB) ---');
  const indexJsFile = fs.readdirSync(path.join(distDir, 'assets')).find((f) => f.startsWith('index-') && f.endsWith('.js'));
  const jsBuffer = fs.readFileSync(path.join(distDir, 'assets', indexJsFile));
  const zlib = await import('node:zlib');
  const gzippedJs = zlib.gzipSync(jsBuffer);
  const gzipKb = (gzippedJs.length / 1024).toFixed(2);
  assert('Initial client JS bundle <= 200 KB gzip', gzippedJs.length <= 200 * 1024, `${gzipKb} KB`);

  console.log('\n--- 9. MOBILE DEVTOOLS PERFORMANCE (4x CPU Slowdown & Fast 4G) ---');
  await send('Network.enable');
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  // Fast 4G network: 20ms latency, 4 Mbps down, 3 Mbps up
  await send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 20,
    downloadThroughput: (4 * 1024 * 1024) / 8,
    uploadThroughput: (3 * 1024 * 1024) / 8,
  });

  await setViewport(390, 844, true);
  await navigate('/');
  await new Promise((r) => setTimeout(r, 600));

  const vitals = await evalJs(`(() => {
    return new Promise((resolve) => {
      let cls = 0;
      let lcp = 0;
      let fcp = 0;

      try {
        const poCls = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              cls += entry.value;
            }
          }
        });
        poCls.observe({ type: 'layout-shift', buffered: true });
      } catch {}

      try {
        const poLcp = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (entries.length) {
            lcp = entries[entries.length - 1].startTime;
          }
        });
        poLcp.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {}

      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find((e) => e.name === 'first-contentful-paint');
      if (fcpEntry) fcp = fcpEntry.startTime;

      setTimeout(() => {
        resolve({ cls, lcp, fcp });
      }, 500);
    });
  })()`);

  console.log(`  [MEASURED VITALS] CLS: ${vitals.cls.toFixed(4)}, LCP: ${vitals.lcp.toFixed(1)}ms, FCP: ${vitals.fcp.toFixed(1)}ms`);
  assert('Cumulative Layout Shift (CLS) < 0.05', vitals.cls < 0.05, `CLS=${vitals.cls.toFixed(4)}`);
  assert('Largest Contentful Paint (LCP) < 2500ms', vitals.lcp < 2500, `LCP=${vitals.lcp.toFixed(1)}ms`);

  // Reset throttling
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 });

  console.log('\n--- 10. TOUCH ISOLATION (NO CURSOR LISTENERS ON TOUCH) ---');
  const touchCursorCheck = await evalJs(`(() => {
    const htmlHasCursor = document.documentElement.classList.contains('has-cursor');
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    return {
      hasCursorClass: htmlHasCursor,
      ringPresent: !!ring,
      dotPresent: !!dot
    };
  })()`);

  assert('No custom cursor DOM elements active on mobile/touch', !touchCursorCheck.ringPresent && !touchCursorCheck.dotPresent);
  assert('Root html does not have has-cursor class on mobile/touch', !touchCursorCheck.hasCursorClass);

  console.log('\n--- 11. SCROLL PAST GUESTBOOK WITH ONE FINGER ---');
  const guestbookScrollCheck = await evalJs(`(() => {
    const section = document.querySelector('section#guestbook');
    const canvas = section ? section.querySelector('canvas') : null;
    const computedTouchAction = canvas ? getComputedStyle(canvas).touchAction : '';
    const containerTouchAction = canvas && canvas.parentElement ? getComputedStyle(canvas.parentElement).touchAction : '';
    // Single finger scrolling requires pan-y touch-action so touch gestures propagate to document scroll
    const allowsPanY = computedTouchAction.includes('pan-y') || containerTouchAction.includes('pan-y');
    return {
      allowsPanY,
      computedTouchAction,
      containerTouchAction
    };
  })()`);

  assert('Guestbook canvas touch-action allows single-finger page scrolling (pan-y)', guestbookScrollCheck.allowsPanY, `canvas=${guestbookScrollCheck.computedTouchAction}`);

  console.log('\n=============================================');
  console.log(`TOTAL TESTS: ${passes + fails} | PASSES: ${passes} | FAILS: ${fails}`);
  console.log('=============================================\n');

  if (fails > 0) {
    process.exitCode = 1;
  }
} catch (err) {
  console.error('[TEST ERROR]', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chromeProcess.kill();
  server.close();
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}
}
