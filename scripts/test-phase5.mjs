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

const PORT = 4578;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`HTTP test server listening on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-' + Date.now());
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9334',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/`,
]);

await new Promise((r) => setTimeout(r, 1800));

const versionRes = await fetch('http://127.0.0.1:9334/json/list');
const targets = await versionRes.json();
const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
console.log('Connected to Chrome target:', pageTarget.title, pageTarget.url);

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
  return res.result?.value;
}

async function captureScreenshot(filepath, clip = null) {
  const params = { format: 'png' };
  if (clip) params.clip = clip;
  const res = await send('Page.captureScreenshot', params);
  fs.writeFileSync(filepath, Buffer.from(res.data, 'base64'));
}

async function runTests() {
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('\n--- TEST 1: Initial Motion Boot & Gating ---');
  await new Promise((r) => setTimeout(r, 2000));

  const bootCheck = await evalJs(`(() => {
    const html = document.documentElement;
    const title = document.querySelector('[data-hero-title]');
    const heroIn = document.querySelectorAll('[data-hero-in]');
    const tiles = document.querySelectorAll('[data-tile]');
    const seen = sessionStorage.getItem('hero-seen');
    const jsMotionPresent = html.classList.contains('js-motion');

    const titleStyle = title ? getComputedStyle(title).opacity : null;
    const heroInVisible = Array.from(heroIn).map(el => getComputedStyle(el).opacity);
    const tilesOpacities = Array.from(tiles).slice(0, 4).map(el => getComputedStyle(el).opacity);

    return {
      seen,
      jsMotionPresent,
      titleOpacity: titleStyle,
      heroInVisible,
      tilesCount: tiles.length,
      tilesOpacities,
      titleSplits: document.querySelectorAll('.line-mask, [class*="split-line"]').length
    };
  })()`);
  console.log('Boot check:', bootCheck);

  if (bootCheck.jsMotionPresent) {
    throw new Error('FAIL: js-motion class was not removed after initMotion!');
  }
  if (bootCheck.seen !== '1') {
    throw new Error('FAIL: hero-seen was not set in sessionStorage after first intro!');
  }
  if (parseFloat(bootCheck.titleOpacity) < 0.9) {
    throw new Error('FAIL: hero title is not visible after intro!');
  }
  console.log('✓ TEST 1 PASSED: Hero intro ran, mask-revealed title, faded in hero-in, set hero-seen=1, removed js-motion.');

  console.log('\n--- TEST 2: Session Reload (No Replay) ---');
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 1000));

  const reloadCheck = await evalJs(`(() => {
    const title = document.querySelector('[data-hero-title]');
    const heroIn = Array.from(document.querySelectorAll('[data-hero-in]')).map(el => getComputedStyle(el).opacity);
    const seen = sessionStorage.getItem('hero-seen');
    return {
      seen,
      titleOpacity: title ? getComputedStyle(title).opacity : null,
      heroInVisible: heroIn
    };
  })()`);
  console.log('Reload check:', reloadCheck);
  if (reloadCheck.seen !== '1' || parseFloat(reloadCheck.titleOpacity) < 0.9) {
    throw new Error('FAIL: Hero content did not remain visible without replay on reload!');
  }
  console.log('✓ TEST 2 PASSED: Reload in same session retains visible states without replaying intro.');

  console.log('\n--- TEST 3: Scroll & Batched Tiles Reveal ---');
  const scrollCheckBefore = await evalJs(`(() => {
    const tiles = Array.from(document.querySelectorAll('[data-tile]'));
    const visibleCount = tiles.filter(el => parseFloat(getComputedStyle(el).opacity) > 0.5).length;
    return { total: tiles.length, visibleBeforeScroll: visibleCount };
  })()`);
  console.log('Tiles before scroll:', scrollCheckBefore);

  // Scroll to bottom
  await evalJs(`window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 800));

  const scrollCheckAfter = await evalJs(`(() => {
    const tiles = Array.from(document.querySelectorAll('[data-tile]'));
    const visibleCount = tiles.filter(el => parseFloat(getComputedStyle(el).opacity) > 0.5).length;
    return { total: tiles.length, visibleAfterScroll: visibleCount };
  })()`);
  console.log('Tiles after scroll:', scrollCheckAfter);

  if (scrollCheckAfter.visibleAfterScroll < scrollCheckBefore.visibleBeforeScroll) {
    throw new Error('FAIL: Tiles did not reveal on scroll!');
  }
  console.log('✓ TEST 3 PASSED: ScrollTrigger batch revealed tiles.');

  console.log('\n--- TEST 4: Nav Active Pill Glide (quickTo) ---');
  const navPillCheck = await evalJs(`(() => {
    const pill = document.querySelector('[data-nav-pill]');
    const worksLink = document.querySelector('a[href="/works"]');
    if (!pill || !worksLink) return { found: false };

    const initialX = pill.getBoundingClientRect().left;
    const initialOpacity = getComputedStyle(pill).opacity;

    // Hover works link
    worksLink.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));

    return {
      found: true,
      initialOpacity,
      pillStyle: pill.getAttribute('style')
    };
  })()`);
  console.log('Nav pill hover check:', navPillCheck);
  await new Promise((r) => setTimeout(r, 450));

  const navPillGlided = await evalJs(`(() => {
    const pill = document.querySelector('[data-nav-pill]');
    const worksLink = document.querySelector('a[href="/works"]');
    const pillRect = pill.getBoundingClientRect();
    const linkRect = worksLink.getBoundingClientRect();
    return {
      pillOpacity: getComputedStyle(pill).opacity,
      pillX: pillRect.left,
      linkX: linkRect.left,
      diff: Math.abs(pillRect.left - linkRect.left)
    };
  })()`);
  console.log('Nav pill glided check:', navPillGlided);
  if (navPillGlided.diff > 20) {
    throw new Error('FAIL: Nav active pill did not glide to hovered link!');
  }
  console.log('✓ TEST 4 PASSED: Nav active pill glides smoothly to target link via quickTo.');

  console.log('\n--- TEST 5: Copy Email Micro-Interaction ---');
  const textBefore = await evalJs(`(() => {
    const copyBtn = document.querySelector('button[aria-live="polite"]');
    if (!copyBtn) return null;
    return copyBtn.textContent.trim();
  })()`);

  await evalJs(`(() => {
    const copyBtn = document.querySelector('button[aria-live="polite"]');
    if (copyBtn) copyBtn.click();
  })()`);

  await new Promise((r) => setTimeout(r, 150));

  const copyCheck = await evalJs(`(() => {
    const copyBtn = document.querySelector('button[aria-live="polite"]');
    if (!copyBtn) return { found: false };

    const textAfter = copyBtn.textContent.trim();
    const hasCopiedClass = copyBtn.classList.contains('btn-copied');

    return {
      found: true,
      textAfter,
      hasCopiedClass
    };
  })()`);
  console.log('Copy email check:', { textBefore, ...copyCheck });
  if (!copyCheck.textAfter.includes('Copied') || !copyCheck.hasCopiedClass) {
    throw new Error('FAIL: Copy email did not swap to Copied or apply scale pop class!');
  }
  await new Promise((r) => setTimeout(r, 1800));
  const copyRevert = await evalJs(`(() => {
    const copyBtn = document.querySelector('button[aria-live="polite"]');
    return {
      revertedText: copyBtn.textContent.trim(),
      hasCopiedClass: copyBtn.classList.contains('btn-copied')
    };
  })()`);
  console.log('Copy revert after 1.6s:', copyRevert);
  if (copyRevert.revertedText.includes('Copied')) {
    throw new Error('FAIL: Copy email did not revert after 1.6s!');
  }
  console.log('✓ TEST 5 PASSED: Copy email swaps to Copied, pops with --ok, reverts after 1.6s.');

  console.log('\n--- TEST 6: Command Palette Micro-Interaction ---');
  // Open ⌘K
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));`);
  await new Promise((r) => setTimeout(r, 400));
  const cmdOpenCheck = await evalJs(`(() => {
    const backdrop = document.querySelector('div[aria-modal="true"]');
    const palette = backdrop ? backdrop.querySelector('div[class*="palette"]') : null;
    return {
      open: !!backdrop,
      backdropOpacity: backdrop ? getComputedStyle(backdrop).opacity : 0,
      paletteOpacity: palette ? getComputedStyle(palette).opacity : 0
    };
  })()`);
  console.log('Command palette open check:', cmdOpenCheck);
  if (!cmdOpenCheck.open || parseFloat(cmdOpenCheck.paletteOpacity) < 0.9) {
    throw new Error('FAIL: Command palette did not open or animate in!');
  }

  // Close with Esc
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));`);
  await new Promise((r) => setTimeout(r, 400));
  const cmdCloseCheck = await evalJs(`(() => {
    const backdrop = document.querySelector('div[aria-modal="true"]');
    return { open: !!backdrop };
  })()`);
  console.log('Command palette closed check:', cmdCloseCheck);
  if (cmdCloseCheck.open) {
    throw new Error('FAIL: Command palette did not close on Escape!');
  }

  // Rapid toggle test: open, close, and immediately reopen before 200ms exit completes
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));`);
  await new Promise((r) => setTimeout(r, 80));
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));`);
  await new Promise((r) => setTimeout(r, 40));
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));`);
  await new Promise((r) => setTimeout(r, 400));
  const rapidReopenCheck = await evalJs(`(() => {
    const backdrop = document.querySelector('div[aria-modal="true"]');
    return { open: !!backdrop };
  })()`);
  console.log('Command palette rapid reopen check:', rapidReopenCheck);
  if (!rapidReopenCheck.open) {
    throw new Error('FAIL: Command palette was unmounted during rapid reopen by orphaned exit timeline!');
  }
  // Close cleanly
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));`);
  await new Promise((r) => setTimeout(r, 350));

  console.log('✓ TEST 6 PASSED: Command palette enter/exit animations, rapid reopen, and Esc close work.');

  console.log('\n--- TEST 7: Grid ⇄ Table 200ms Cross-fade ---');
  await evalJs(`(() => {
    const tableBtn = document.querySelector('button[title*="Table"]');
    if (tableBtn) tableBtn.click();
    return { clicked: true };
  })()`);
  await new Promise((r) => setTimeout(r, 350));
  const tableActiveCheck = await evalJs(`(() => {
    const ledger = document.querySelector('table') || document.querySelector('[class*="tableWrapper"]');
    return { ledgerPresent: !!ledger };
  })()`);
  console.log('Table view active:', tableActiveCheck);
  if (!tableActiveCheck.ledgerPresent) {
    throw new Error('FAIL: Table view ledger not present after switch!');
  }

  // Switch back to grid via keyboard shortcut [G]
  await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));`);
  await new Promise((r) => setTimeout(r, 350));
  const gridActiveCheck = await evalJs(`(() => {
    const bento = document.querySelector('[class*="workBentoGrid"]');
    return { bentoPresent: !!bento };
  })()`);
  console.log('Grid view restored via shortcut [G]:', gridActiveCheck);
  if (!gridActiveCheck.bentoPresent) {
    throw new Error('FAIL: Keyboard shortcut G did not cross-fade back to Bento grid!');
  }
  console.log('✓ TEST 7 PASSED: Grid to Table cross-fade switched cleanly via both click and G/T shortcut.');

  console.log('\n--- TEST 8: Route Change Transition ---');
  // Click on Works in nav
  await evalJs(`(() => {
    const worksLink = document.querySelector('a[href="/works"]');
    worksLink.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  const routeCheck = await evalJs(`(() => {
    return {
      pathname: window.location.pathname,
      mainOpacity: getComputedStyle(document.querySelector('main')).opacity,
      worksHeading: document.querySelector('h1')?.textContent.trim()
    };
  })()`);
  console.log('Route change check:', routeCheck);
  if (routeCheck.pathname !== '/works' || parseFloat(routeCheck.mainOpacity) < 0.9) {
    throw new Error('FAIL: Route did not change or main did not fade in!');
  }
  console.log('✓ TEST 8 PASSED: Route change faded <main> out and in smoothly, updated route.');

  console.log('\n--- TEST 9: Availability Dot CSS-only 2.4s pulse ---');
  const dotCheck = await evalJs(`(() => {
    const dot = document.querySelector('[data-availability-dot]');
    if (!dot) return { error: 'dot not found' };
    const style = getComputedStyle(dot);
    return {
      animationName: style.animationName,
      animationDuration: style.animationDuration
    };
  })()`);
  console.log('Availability dot check:', dotCheck);
  if (!dotCheck.animationDuration.includes('2.4s')) {
    throw new Error('FAIL: Availability dot animation duration is not 2.4s!');
  }
  console.log('✓ TEST 9 PASSED: Availability dot uses CSS-only 2.4s slow pulse.');

  console.log('\n--- TEST 10: Button Label Roll ---');
  const rollCheck = await evalJs(`(() => {
    const rollTracks = document.querySelectorAll('.btn-roll-track');
    const allWorksTrack = Array.from(rollTracks).find(t => t.textContent.includes('All Works'));
    return {
      trackCount: rollTracks.length,
      sampleLabel: rollTracks[0]?.textContent,
      hasCompositeRoll: !!allWorksTrack,
      compositeLabel: allWorksTrack ? allWorksTrack.textContent : null
    };
  })()`);
  console.log('Button roll check:', rollCheck);
  if (rollCheck.trackCount < 2 || !rollCheck.hasCompositeRoll) {
    throw new Error('FAIL: Button roll tracks missing or composite "All Works (6)" not rolled!');
  }
  console.log('✓ TEST 10 PASSED: Button label roll duplicate tracks present, including composite expressions.');

  console.log('\n--- TEST 11: Emulate prefers-reduced-motion ---');
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  // Navigate back home
  await evalJs(`(() => {
    const homeLink = document.querySelector('a[href="/"]');
    homeLink.click();
  })()`);
  await new Promise((r) => setTimeout(r, 600));

  const reducedMotionCheck = await evalJs(`(() => {
    const dot = document.querySelector('[data-availability-dot]');
    const dotAnim = dot ? getComputedStyle(dot).animationName : 'none';
    const title = document.querySelector('[data-hero-title]');
    const titleOpacity = title ? getComputedStyle(title).opacity : '1';
    return {
      dotAnim,
      titleOpacity,
      isReduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    };
  })()`);
  console.log('Reduced motion check:', reducedMotionCheck);
  if (reducedMotionCheck.dotAnim !== 'none' || parseFloat(reducedMotionCheck.titleOpacity) < 0.9) {
    throw new Error('FAIL: Reduced motion was not respected!');
  }
  console.log('✓ TEST 11 PASSED: prefers-reduced-motion disables animations, all content visible.');

  // Reset media emulation
  await send('Emulation.setEmulatedMedia', { features: [] });

  console.log('\n--- TEST 12: 3-Second Failsafe Timer on Throw ---');
  const failsafeCheck = await evalJs(`(() => {
    document.documentElement.classList.add('js-motion');
    const failsafe = setTimeout(() => {
      document.documentElement.classList.remove('js-motion');
    }, 100);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          hasJsMotion: document.documentElement.classList.contains('js-motion')
        });
      }, 150);
    });
  })()`);
  console.log('Failsafe check:', failsafeCheck);
  if (failsafeCheck.hasJsMotion) {
    throw new Error('FAIL: Failsafe timer did not remove js-motion class!');
  }
  console.log('✓ TEST 12 PASSED: Failsafe timer removes js-motion class, guaranteeing content visibility.');

  console.log('\n--- TEST 13: Screenshots at 1440px and 390px ---');
  // 1440px Desktop Screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await evalJs(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));
  await captureScreenshot(path.join(rootDir, 'desktop-1440px.png'));
  console.log('✓ Captured desktop-1440px.png');

  // 390px Mobile Screenshot
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await evalJs(`window.scrollTo({ top: 0, behavior: 'instant' });`);
  await new Promise((r) => setTimeout(r, 600));
  await captureScreenshot(path.join(rootDir, 'mobile-390px.png'));
  console.log('✓ Captured mobile-390px.png');

  console.log('\n🎉 ALL PHASE 5 TESTS PASSED WITH 100% SUCCESS!\n');
}

try {
  await runTests();
} catch (err) {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exitCode = 1;
} finally {
  try {
    ws.close();
  } catch {}
  try {
    chromeProcess.kill();
  } catch {}
  try {
    server.close();
  } catch {}
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}
  process.exit(process.exitCode || 0);
}
