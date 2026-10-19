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

const PORT = 4752;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[QA SERVER] Serving on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-b5-' + Date.now());
const CDP_PORT = 9388;
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

let allPassed = true;
function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    allPassed = false;
  } else {
    console.log(`✓ PASS: ${message}`);
  }
}

try {
  await send('Page.enable');
  await send('DOM.enable');

  // Test 1: Check SVG filters in HTML shell
  console.log('\n--- 1. Testing SVG filters in DOM ---');
  const svgCheck = await evalCode(`(() => {
    const svg = document.querySelector('body > svg');
    if (!svg) return { found: false };
    const style = window.getComputedStyle(svg);
    const soft = document.getElementById('grade-soft');
    const grade = document.getElementById('grade');
    const hard = document.getElementById('grade-hard');
    return {
      found: true,
      isFirstChild: document.body.firstElementChild === svg,
      isNotDisplayNone: style.display !== 'none',
      hasSoft: Boolean(soft),
      hasGrade: Boolean(grade),
      hasHard: Boolean(hard),
      softInterpolation: soft ? soft.getAttribute('color-interpolation-filters') : null,
      gradeInterpolation: grade ? grade.getAttribute('color-interpolation-filters') : null,
      hardInterpolation: hard ? hard.getAttribute('color-interpolation-filters') : null,
    };
  })()`);

  assert(svgCheck.found, 'SVG element exists directly under body');
  assert(svgCheck.isFirstChild, 'SVG is the first element after <body> opens');
  assert(svgCheck.isNotDisplayNone, 'SVG is NOT display:none');
  assert(svgCheck.hasSoft && svgCheck.hasGrade && svgCheck.hasHard, 'All 3 filter ids (#grade-soft, #grade, #grade-hard) exist');
  assert(svgCheck.softInterpolation === 'sRGB', 'Filter color-interpolation-filters is sRGB');

  // Test 2: Check markup on Home page
  console.log('\n--- 2. Testing Markup Pattern & Media Types on Home Page ---');
  const markupCheck = await evalCode(`(() => {
    const mediaWrappers = Array.from(document.querySelectorAll('.media'));
    const purefeedParent = document.querySelector('[data-tile="media"] .grade-hard');
    const doclensParent = document.querySelector('[data-tile="media"] .grade-lite');
    const standardParent = document.querySelector('[data-tile="media"] .grade');
    
    // Check that inner element has the grade class
    const purefeedInnerIsGraded = purefeedParent && purefeedParent.parentElement.classList.contains('media');
    const doclensInnerIsGraded = doclensParent && doclensParent.parentElement.classList.contains('media');
    
    // Check that guestbook canvas is NOT graded
    const guestbookCanvas = document.querySelector('#guestbook canvas');
    const guestbookIsGraded = guestbookCanvas ? (guestbookCanvas.closest('.grade') || guestbookCanvas.closest('.grade-hard') || guestbookCanvas.closest('.media')) : null;

    return {
      mediaCount: mediaWrappers.length,
      purefeedHard: Boolean(purefeedParent),
      purefeedInnerIsGraded: Boolean(purefeedInnerIsGraded),
      doclensLite: Boolean(doclensParent),
      doclensInnerIsGraded: Boolean(doclensInnerIsGraded),
      standardGrade: Boolean(standardParent),
      guestbookNotGraded: guestbookIsGraded === null,
    };
  })()`);

  assert(markupCheck.mediaCount >= 5, `Found ${markupCheck.mediaCount} .media containers (expected at least 5 on home)`);
  assert(markupCheck.purefeedHard, 'Featured project (PureFeed) has .grade-hard inner element');
  assert(markupCheck.purefeedInnerIsGraded, 'PureFeed .grade-hard is inner child of .media');
  assert(markupCheck.doclensLite, 'MediaPipe try-on (DocLensBD) has .grade-lite inner element');
  assert(markupCheck.doclensInnerIsGraded, 'DocLensBD .grade-lite is inner child of .media');
  assert(markupCheck.standardGrade, 'Standard mock previews have .grade inner element');
  assert(markupCheck.guestbookNotGraded, 'Guestbook canvas is NEVER graded or wrapped in .media');

  // Test 3: Check computed filter styles on Desktop (fine pointer)
  console.log('\n--- 3. Testing Desktop Computed Filter Styles ---');
  const desktopFilters = await evalCode(`(() => {
    let softEl = document.querySelector('.grade-soft');
    let createdSoft = false;
    if (!softEl) {
      softEl = document.createElement('div');
      softEl.className = 'grade-soft';
      document.body.appendChild(softEl);
      createdSoft = true;
    }
    const hardEl = document.querySelector('.grade-hard');
    const gradeEl = document.querySelector('.grade');
    const liteEl = document.querySelector('.grade-lite');
    const res = {
      hardFilter: hardEl ? window.getComputedStyle(hardEl).filter : null,
      gradeFilter: gradeEl ? window.getComputedStyle(gradeEl).filter : null,
      softFilter: softEl ? window.getComputedStyle(softEl).filter : null,
      liteFilter: liteEl ? window.getComputedStyle(liteEl).filter : null,
    };
    if (createdSoft) softEl.remove();
    return res;
  })()`);

  assert(desktopFilters.hardFilter?.includes('url(') && desktopFilters.hardFilter?.includes('#grade-hard'), `.grade-hard computed filter uses url(#grade-hard): ${desktopFilters.hardFilter}`);
  assert(desktopFilters.gradeFilter?.includes('url(') && desktopFilters.gradeFilter?.includes('#grade'), `.grade computed filter uses url(#grade): ${desktopFilters.gradeFilter}`);
  assert(desktopFilters.softFilter?.includes('url(') && desktopFilters.softFilter?.includes('#grade-soft'), `.grade-soft computed filter uses url(#grade-soft): ${desktopFilters.softFilter}`);
  assert(desktopFilters.liteFilter?.includes('contrast('), `.grade-lite computed filter uses contrast/saturate: ${desktopFilters.liteFilter}`);

  // Test 4: Check Touch Emulation (hover: none, pointer: coarse)
  console.log('\n--- 4. Testing Touch Emulation (cheap filter replaces SVG) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await new Promise((r) => setTimeout(r, 400));

  const isCoarse = await evalCode(`window.matchMedia('(pointer: coarse)').matches`);
  const isHoverNone = await evalCode(`window.matchMedia('(hover: none)').matches`);
  console.log(`[Emulation check] pointer: coarse = ${isCoarse}, hover: none = ${isHoverNone}`);

  const touchFilters = await evalCode(`(() => {
    let softEl = document.querySelector('.grade-soft');
    let createdSoft = false;
    if (!softEl) {
      softEl = document.createElement('div');
      softEl.className = 'grade-soft';
      document.body.appendChild(softEl);
      createdSoft = true;
    }
    const hardEl = document.querySelector('.grade-hard');
    const gradeEl = document.querySelector('.grade');
    const liteEl = document.querySelector('.grade-lite');
    const res = {
      hardFilter: hardEl ? window.getComputedStyle(hardEl).filter : null,
      gradeFilter: gradeEl ? window.getComputedStyle(gradeEl).filter : null,
      softFilter: softEl ? window.getComputedStyle(softEl).filter : null,
      liteFilter: liteEl ? window.getComputedStyle(liteEl).filter : null,
    };
    if (createdSoft) softEl.remove();
    return res;
  })()`);

  assert(!touchFilters.hardFilter?.includes('url('), `On touch, .grade-hard does NOT use url(): ${touchFilters.hardFilter}`);
  assert(touchFilters.hardFilter?.includes('contrast('), `On touch, .grade-hard is replaced by lite contrast filter`);
  assert(!touchFilters.gradeFilter?.includes('url('), `On touch, .grade does NOT use url(): ${touchFilters.gradeFilter}`);
  assert(touchFilters.gradeFilter?.includes('contrast('), `On touch, .grade is replaced by lite contrast filter`);
  assert(!touchFilters.softFilter?.includes('url('), `On touch, .grade-soft does NOT use url(): ${touchFilters.softFilter}`);
  assert(touchFilters.softFilter?.includes('contrast('), `On touch, .grade-soft is replaced by lite contrast filter`);

  // Reset emulation to desktop
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise((r) => setTimeout(r, 400));

  // Test 5: Controls Popover Grade Switch & Persistence
  console.log('\n--- 5. Testing Controls Popover Grade Switch & A/B Toggle ---');
  // Open controls popover
  await evalCode(`(() => {
    const controlsBtn = document.querySelector('button[aria-label*="ontrols"]');
    if (controlsBtn) controlsBtn.click();
    return { opened: Boolean(controlsBtn) };
  })()`);

  await new Promise((r) => setTimeout(r, 400));

  const toggleTest = await evalCode(`(() => {
    const gradeBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Toggle media grade');
    if (!gradeBtn) return { found: false };
    const initialState = gradeBtn.getAttribute('aria-pressed');
    const initialText = gradeBtn.querySelector('span:last-child')?.textContent;
    
    // Click to toggle off
    gradeBtn.click();
    
    const offHasClass = document.documentElement.classList.contains('grade-off');
    const offStorage = localStorage.getItem('grade');
    const offGradeFilter = window.getComputedStyle(document.querySelector('.grade-hard')).filter;

    // Click to toggle on
    gradeBtn.click();
    const onHasClass = document.documentElement.classList.contains('grade-off');
    const onStorage = localStorage.getItem('grade');
    const onGradeFilter = window.getComputedStyle(document.querySelector('.grade-hard')).filter;

    return {
      found: true,
      initialState,
      initialText,
      offHasClass,
      offStorage,
      offGradeFilter,
      onHasClass,
      onStorage,
      onGradeFilter,
    };
  })()`);

  assert(toggleTest.found, 'Grade switch button found in Controls popover');
  assert(toggleTest.initialState === 'true', 'Grade switch is initially ON (aria-pressed="true")');
  assert(toggleTest.offHasClass, 'Toggling switch OFF adds html.grade-off');
  assert(toggleTest.offStorage === 'off', 'Toggling switch OFF sets localStorage.grade to "off"');
  assert(toggleTest.offGradeFilter === 'none', 'When grade is OFF, computed filter is "none"');
  assert(!toggleTest.onHasClass, 'Toggling switch back ON removes html.grade-off');
  assert(toggleTest.onStorage === 'on', 'Toggling switch back ON sets localStorage.grade to "on"');
  assert(toggleTest.onGradeFilter?.includes('url('), 'When grade is ON, computed filter is restored');

  // Test 5b: Mobile Sheet Grade Switch & A/B Toggle
  console.log('\n--- 5b. Testing Mobile Navigation Sheet Grade Toggle ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await new Promise((r) => setTimeout(r, 400));

  const mobileToggleTest = await evalCode(`(() => {
    const menuBtn = document.querySelector('button[aria-label*="mobile menu" i], button[aria-label*="navigation menu" i], button[class*="mobileNavToggle"]');
    if (!menuBtn) return { menuBtnFound: false };
    menuBtn.click();
    return { menuBtnFound: true };
  })()`);

  assert(mobileToggleTest.menuBtnFound, 'Mobile hamburger button found and clicked');
  await new Promise((r) => setTimeout(r, 500));

  const mobileSheetCheck = await evalCode(`(() => {
    const mobileGradeBtn = Array.from(document.querySelectorAll('button')).find(b => 
      b.getAttribute('aria-label') === 'Toggle media grade' && b.closest('[class*="mobile"]')
    );
    if (!mobileGradeBtn) return { found: false };
    const initialText = mobileGradeBtn.textContent;
    mobileGradeBtn.click();
    const offHasClass = document.documentElement.classList.contains('grade-off');
    const offStorage = localStorage.getItem('grade');
    mobileGradeBtn.click();
    const onHasClass = document.documentElement.classList.contains('grade-off');
    const onStorage = localStorage.getItem('grade');
    return {
      found: true,
      initialText,
      offHasClass,
      offStorage,
      onHasClass,
      onStorage
    };
  })()`);

  assert(mobileSheetCheck.found, 'Grade switch found in mobile navigation sheet');
  assert(mobileSheetCheck.offHasClass, 'Toggling Grade switch in mobile sheet adds html.grade-off');
  assert(mobileSheetCheck.offStorage === 'off', 'Mobile sheet toggle OFF updates localStorage to "off"');
  assert(!mobileSheetCheck.onHasClass, 'Toggling Grade switch back ON in mobile sheet removes html.grade-off');
  assert(mobileSheetCheck.onStorage === 'on', 'Mobile sheet toggle ON restores localStorage to "on"');

  // Reset to desktop
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await new Promise((r) => setTimeout(r, 400));

  // Test 6: Testing ?grade=off boot script support
  console.log('\n--- 6. Testing URL Parameter ?grade=off ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?grade=off` });
  await new Promise((r) => setTimeout(r, 1500));

  const urlOffCheck = await evalCode(`(() => {
    return {
      hasClass: document.documentElement.classList.contains('grade-off'),
      filter: window.getComputedStyle(document.querySelector('.grade-hard')).filter,
    };
  })()`);

  assert(urlOffCheck.hasClass, '?grade=off adds html.grade-off immediately');
  assert(urlOffCheck.filter === 'none', 'Under ?grade=off, filter is "none"');

  // Test 7: Testing Works Page
  console.log('\n--- 7. Testing Works Page (/works) ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/works` });
  await new Promise((r) => setTimeout(r, 1500));

  const worksCheck = await evalCode(`(() => {
    const mediaList = Array.from(document.querySelectorAll('.media'));
    const hardEl = document.querySelector('.media .grade-hard');
    const liteEl = document.querySelector('.media .grade-lite');
    const gradeEls = Array.from(document.querySelectorAll('.media .grade'));
    return {
      mediaCount: mediaList.length,
      hasHard: Boolean(hardEl),
      hasLite: Boolean(liteEl),
      gradeCount: gradeEls.length,
    };
  })()`);

  assert(worksCheck.mediaCount >= 5, `Works page has ${worksCheck.mediaCount} .media wrappers`);
  assert(worksCheck.hasHard, 'Works page has featured .grade-hard preview');
  assert(worksCheck.hasLite, 'Works page has .grade-lite preview (MediaPipe)');
  assert(worksCheck.gradeCount >= 3, `Works page has ${worksCheck.gradeCount} standard .grade previews`);

  // Test 7.5: Zero-Overflow Check for All Media Containers
  console.log('\n--- 7.5. Testing Zero-Overflow on Media Containers ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 1500));
  await evalCode(`document.getElementById('selected-work')?.scrollIntoView()`);
  await new Promise((r) => setTimeout(r, 500));

  // Desktop overflow test
  const desktopOverflows = await evalCode(`(() => {
    const mediaEls = Array.from(document.querySelectorAll('.media'));
    return mediaEls.map((m, i) => {
      const sim = m.querySelector('[class*="simWrapper"]');
      return {
        index: i,
        overflow: sim ? sim.scrollHeight > m.clientHeight + 2 : false,
        diff: sim ? sim.scrollHeight - m.clientHeight : 0,
      };
    });
  })()`);
  const anyDesktopOverflow = desktopOverflows.some(o => o.overflow);
  assert(!anyDesktopOverflow, `Zero overflow on all media containers on desktop (max diff: ${Math.max(...desktopOverflows.map(o => o.diff))}px)`);

  // Mobile overflow test
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await new Promise((r) => setTimeout(r, 500));
  const mobileOverflows = await evalCode(`(() => {
    const mediaEls = Array.from(document.querySelectorAll('.media'));
    return mediaEls.map((m, i) => {
      const sim = m.querySelector('[class*="simWrapper"]');
      return {
        index: i,
        overflow: sim ? sim.scrollHeight > m.clientHeight + 2 : false,
        diff: sim ? sim.scrollHeight - m.clientHeight : 0,
      };
    });
  })()`);
  const anyMobileOverflow = mobileOverflows.some(o => o.overflow);
  assert(!anyMobileOverflow, `Zero overflow on all media containers on mobile (max diff: ${Math.max(...mobileOverflows.map(o => o.diff))}px)`);
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  // Test 8: Capture Screenshots
  console.log('\n--- 8. Capturing Desktop & Mobile Screenshots ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 2000));

  // Desktop (1440px)
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const dShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(os.tmpdir(), 'desktop-1440px.png'), Buffer.from(dShot.data, 'base64'));
  console.log('✓ Saved desktop-1440px.png');

  // Scroll to selected work and capture
  await evalCode(`document.getElementById('selected-work').scrollIntoView()`);
  await new Promise((r) => setTimeout(r, 600));
  const projShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(os.tmpdir(), 'inspect-tile.png'), Buffer.from(projShot.data, 'base64'));
  console.log('✓ Saved inspect-tile.png');

  // Mobile (390px)
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await evalCode(`document.getElementById('selected-work').scrollIntoView()`);
  await new Promise((r) => setTimeout(r, 600));
  const mShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(os.tmpdir(), 'mobile-390px.png'), Buffer.from(mShot.data, 'base64'));
  console.log('✓ Saved mobile-390px.png');

  console.log('\n=======================================');
  if (allPassed) {
    console.log('🎉 ALL PHASE B5 VERIFICATION CHECKS PASSED!');
  } else {
    console.error('❌ SOME VERIFICATION CHECKS FAILED!');
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Error during verification:', err);
  process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {}
}
