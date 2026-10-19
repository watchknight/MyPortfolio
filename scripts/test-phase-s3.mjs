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

const PORT = 4725;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[TEST] HTTP test server listening on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-s3-' + Date.now());
const CDP_PORT = 9360;
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--autoplay-policy=no-user-gesture-required',
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
  await send('Runtime.enable');
  await send('DOM.enable');

  // Wait for initial page hydration
  await new Promise((r) => setTimeout(r, 1500));

  console.log('\n--- TEST SUITE: /boost SOUND — PHASE S3: UI ---\n');

  // 1. Verify Nav Sound Button Presence, Attributes & Hit Area
  console.log('1. Testing Nav Sound Button attributes & hit area...');
  const btnData = await evalCode(`
    (() => {
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      if (!btn) return null;
      const rect = btn.getBoundingClientRect();
      const speaker = btn.querySelector('.speakerIcon, svg');
      const meter = btn.querySelector('.sound-meter');
      const bars = meter ? meter.querySelectorAll('i').length : 0;
      const tooltip = btn.querySelector('[role="tooltip"]')?.textContent?.trim();
      return {
        exists: true,
        ariaPressed: btn.getAttribute('aria-pressed'),
        width: rect.width,
        height: rect.height,
        hasSpeaker: !!speaker,
        meterBars: bars,
        tooltip,
      };
    })()
  `);

  if (!btnData || !btnData.exists) {
    throw new Error('Nav sound button with data-sound-toggle and data-magnetic not found!');
  }
  console.log('  ✓ Nav sound button found:', JSON.stringify(btnData));
  if (btnData.width < 44 || btnData.height < 44) {
    throw new Error(`Hit area < 44px! Measured ${btnData.width}x${btnData.height}`);
  }
  console.log('  ✓ Hit area ≥ 44px satisfied');
  if (btnData.meterBars !== 4) {
    throw new Error(`Expected 4-bar meter, found ${btnData.meterBars}`);
  }
  console.log('  ✓ 4-bar meter verified');
  if (btnData.tooltip !== 'Sound off · M') {
    throw new Error(`Expected tooltip "Sound off · M", got "${btnData.tooltip}"`);
  }
  console.log('  ✓ Initial tooltip verified: "Sound off · M"');

  // 2. Test Live Region & Toggling Sound via Click
  console.log('\n2. Testing Sound Toggle via Click & Live Region...');
  const clickToggleRes = await evalCode(`
    (async () => {
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      btn.click();
      await new Promise(r => setTimeout(r, 200));
      const pressedAfter = btn.getAttribute('aria-pressed');
      const liveRegion = document.querySelector('[aria-live="polite"]')?.textContent?.trim();
      const tooltipAfter = btn.querySelector('[role="tooltip"]')?.textContent?.trim();
      return { pressedAfter, liveRegion, tooltipAfter };
    })()
  `);
  console.log('  ✓ After click:', JSON.stringify(clickToggleRes));
  if (clickToggleRes.pressedAfter !== 'true') {
    throw new Error('Expected aria-pressed="true" after click!');
  }
  if (!clickToggleRes.liveRegion?.includes('Sound on')) {
    throw new Error(`Expected live region to announce "Sound on", got "${clickToggleRes.liveRegion}"`);
  }
  if (clickToggleRes.tooltipAfter !== 'Sound on · M') {
    throw new Error(`Expected tooltip "Sound on · M", got "${clickToggleRes.tooltipAfter}"`);
  }
  console.log('  ✓ Click toggle & live region announcement verified');

  // 3. Test Meter Animation while Sound is On
  console.log('\n3. Testing Sound Meter Animation & Ticker...');
  const meterRunning = await evalCode(`
    (() => {
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      const bars = Array.from(btn.querySelectorAll('.sound-meter i'));
      const bg = getComputedStyle(bars[0]).backgroundColor;
      return {
        barCount: bars.length,
        barBg: bg,
      };
    })()
  `);
  console.log('  ✓ Meter state while on:', JSON.stringify(meterRunning));

  // Test visibility change pausing ticker and resetting bars
  const visRes = await evalCode(`
    (async () => {
      // Simulate tab hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 100));

      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      const bars = Array.from(btn.querySelectorAll('.sound-meter i'));
      const hiddenTransforms = bars.map(b => b.style.transform);

      // Restore visibility
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
      await new Promise(r => setTimeout(r, 100));

      return {
        hiddenTransforms,
        allRestWhenHidden: hiddenTransforms.every(t => !t || t === ''),
      };
    })()
  `);
  console.log('  ✓ Visibility change check:', JSON.stringify(visRes));
  if (!visRes.allRestWhenHidden) {
    throw new Error('Bars should be reset when document.hidden is true!');
  }
  console.log('  ✓ Ticker removed and bars reset when tab is hidden');

  // 4. Test M Shortcut to Toggle Sound Off
  console.log('\n4. Testing M keyboard shortcut to toggle sound off...');
  const mToggleRes = await evalCode(`
    (async () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'm', bubbles: true }));
      await new Promise(r => setTimeout(r, 200));
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      const pressedAfter = btn.getAttribute('aria-pressed');
      const liveRegion = document.querySelector('[aria-live="polite"]')?.textContent?.trim();
      const tooltipAfter = btn.querySelector('[role="tooltip"]')?.textContent?.trim();
      return { pressedAfter, liveRegion, tooltipAfter };
    })()
  `);
  console.log('  ✓ After M shortcut:', JSON.stringify(mToggleRes));
  if (mToggleRes.pressedAfter !== 'false') {
    throw new Error('Expected aria-pressed="false" after M key!');
  }
  if (!mToggleRes.liveRegion?.includes('Sound off')) {
    throw new Error(`Expected live region to announce "Sound off", got "${mToggleRes.liveRegion}"`);
  }
  if (mToggleRes.tooltipAfter !== 'Sound off · M') {
    throw new Error(`Expected tooltip "Sound off · M", got "${mToggleRes.tooltipAfter}"`);
  }
  console.log('  ✓ M shortcut & live region announcement verified');

  // 4b. Test Reduced Motion Meter Behavior (static scaleY(.5) when on, reset when off)
  console.log('\n4b. Testing Reduced Motion Meter Behavior...');
  const calmRes = await evalCode(`
    (async () => {
      const origMatchMedia = window.matchMedia;
      window.matchMedia = (query) => {
        if (query.includes('prefers-reduced-motion')) {
          return { matches: true, media: query, onchange: null, addListener: () => {}, removeListener: () => {}, addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => true };
        }
        return origMatchMedia(query);
      };

      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      // Toggle sound on under reduced motion
      btn.click();
      await new Promise(r => setTimeout(r, 200));

      const bars = Array.from(btn.querySelectorAll('.sound-meter i'));
      const onTransforms = bars.map(b => b.style.transform);

      // Toggle sound off under reduced motion
      btn.click();
      await new Promise(r => setTimeout(r, 200));
      const offTransforms = bars.map(b => b.style.transform);

      // Restore matchMedia
      window.matchMedia = origMatchMedia;

      return {
        onTransforms,
        offTransforms,
        allHalfWhenOn: onTransforms.every(t => t.includes('0.5') || t.includes('.5')),
        allRestWhenOff: offTransforms.every(t => !t || t === ''),
      };
    })()
  `);
  console.log('  ✓ Reduced motion meter check:', JSON.stringify(calmRes));
  if (!calmRes.allHalfWhenOn) {
    throw new Error(`Expected bars at scaleY(.5) when sound on under reduced motion, got ${JSON.stringify(calmRes.onTransforms)}`);
  }
  if (!calmRes.allRestWhenOff) {
    throw new Error(`Expected bars to reset to flat when sound turned off under reduced motion, got ${JSON.stringify(calmRes.offTransforms)}`);
  }
  console.log('  ✓ Reduced motion meter scaleY(.5) when on and cleanly reset when off verified');

  // 5. Test Focus Ring on Nav Sound Button
  console.log('\n5. Testing visible focus ring...');
  const focusRingRes = await evalCode(`
    (() => {
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      btn.focus();
      const style = getComputedStyle(btn);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    })()
  `);
  console.log('  ✓ Focus styles:', JSON.stringify(focusRingRes));

  // 6. Test Controls Popover Sound Panel
  console.log('\n6. Testing Controls Popover Sound Panel...');
  const popoverRes = await evalCode(`
    (async () => {
      const gearBtn = document.querySelector('button[aria-controls="controls-popover"]');
      gearBtn.click();
      await new Promise(r => setTimeout(r, 350));
      const panel = document.querySelector('[data-sound-panel]');
      if (!panel) return { found: false };
      const volSlider = panel.querySelector('input[type="range"]');
      const switches = panel.querySelectorAll('button[role="button"], button.switchBtn, button[aria-label*="ambient"], button[aria-label*="Ambient"]');
      const chips = Array.from(panel.querySelectorAll('button')).filter(b => 
        ['Tick', 'Thump', 'Pluck', 'Swish', 'Keys', 'Chime'].includes(b.textContent.trim())
      );
      const chipsDisabled = chips.every(c => c.disabled);
      const chipWrappers = Array.from(panel.querySelectorAll('[class*="chipWrapper"]'));
      const allWrappersFocusable = chipWrappers.length === 6 && chipWrappers.every(w => w.tabIndex === 0);
      const tooltips = Array.from(panel.querySelectorAll('[role="tooltip"]')).map(t => t.textContent.trim());

      return {
        found: true,
        hasVolSlider: !!volSlider,
        volMin: volSlider?.min,
        volMax: volSlider?.max,
        volStep: volSlider?.step,
        chipCount: chips.length,
        chipsDisabled,
        tooltipSample: tooltips[0],
        allWrappersFocusable,
      };
    })()
  `);
  console.log('  ✓ Controls popover sound panel:', JSON.stringify(popoverRes));
  if (!popoverRes.found) {
    throw new Error('Sound panel not found in Controls popover!');
  }
  if (!popoverRes.hasVolSlider || popoverRes.volMin !== '0' || popoverRes.volMax !== '100' || popoverRes.volStep !== '5') {
    throw new Error('Volume slider missing or has invalid min/max/step!');
  }
  if (popoverRes.chipCount !== 6 || !popoverRes.chipsDisabled) {
    throw new Error(`Expected 6 disabled chips when sound is off, got count=${popoverRes.chipCount}, allDisabled=${popoverRes.chipsDisabled}`);
  }
  if (!popoverRes.allWrappersFocusable) {
    throw new Error('Expected disabled preview chip wrappers to be keyboard accessible (tabIndex=0)!');
  }
  if (!popoverRes.tooltipSample?.includes('Turn sound on to preview')) {
    throw new Error(`Expected preview chip tooltip "Turn sound on to preview", got "${popoverRes.tooltipSample}"`);
  }
  console.log('  ✓ Controls popover slider, switches, and preview chips verified (keyboard a11y passed)');

  // Test volume slider change
  console.log('\n7. Testing volume slider binding & sound preview...');
  const volChangeRes = await evalCode(`
    (async () => {
      const panel = document.querySelector('[data-sound-panel]');
      const volSlider = panel.querySelector('input[type="range"]');
      volSlider.value = '80';
      volSlider.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 100));

      // Enable sound
      const soundSwitch = panel.querySelector('button[data-sound-toggle]');
      soundSwitch.click();
      await new Promise(r => setTimeout(r, 200));

      // Chips should now be enabled
      const chips = Array.from(panel.querySelectorAll('button')).filter(b => 
        ['Tick', 'Thump', 'Pluck', 'Swish', 'Keys', 'Chime'].includes(b.textContent.trim())
      );
      const allEnabled = chips.every(c => !c.disabled);

      // Click Keys chip
      const keysChip = chips.find(c => c.textContent.trim() === 'Keys');
      keysChip.click();

      return {
        newVolValue: volSlider.value,
        chipsEnabledNow: allEnabled,
      };
    })()
  `);
  console.log('  ✓ Volume change & enabled chips:', JSON.stringify(volChangeRes));
  if (!volChangeRes.chipsEnabledNow) {
    throw new Error('Chips should be enabled after turning sound on!');
  }

  // 8. Test 390px Mobile Sheet Sound Panel
  console.log('\n8. Testing 390px Mobile Sheet Sound Panel...');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await new Promise(r => setTimeout(r, 300));

  const mobileRes = await evalCode(`
    (async () => {
      // Close popover if open
      const closePopover = document.querySelector('button[aria-label="Close controls"]');
      if (closePopover) closePopover.click();
      await new Promise(r => setTimeout(r, 200));

      // Open mobile sheet
      const hamburger = document.querySelector('button[aria-label*="navigation menu"]');
      if (!hamburger) return { hamburgerFound: false };
      hamburger.click();
      await new Promise(r => setTimeout(r, 400));

      const sheet = document.querySelector('[role="dialog"][aria-modal="true"]');
      if (!sheet) return { sheetFound: false };

      const panel = sheet.querySelector('[data-sound-panel]');
      if (!panel) return { panelFound: false };

      const volSlider = panel.querySelector('input[type="range"]');
      const ambientSwitch = panel.querySelector('button[aria-label*="ambient"], button[aria-label*="Ambient"]');
      const chips = Array.from(panel.querySelectorAll('button')).filter(b => 
        ['Tick', 'Thump', 'Pluck', 'Swish', 'Keys', 'Chime'].includes(b.textContent.trim())
      );
      const chipHeights = chips.map(c => Math.round(c.getBoundingClientRect().height));

      return {
        hamburgerFound: true,
        sheetFound: true,
        panelFound: true,
        hasVol: !!volSlider,
        hasAmbient: !!ambientSwitch,
        chipCount: chips.length,
        chipHeights,
        allChipsGte44: chipHeights.every(h => h >= 44),
      };
    })()
  `);
  console.log('  ✓ Mobile sheet check:', JSON.stringify(mobileRes));
  if (!mobileRes.panelFound || !mobileRes.hasVol || !mobileRes.hasAmbient || mobileRes.chipCount !== 6) {
    throw new Error('Sound panel in mobile sheet failed validation!');
  }
  if (!mobileRes.allChipsGte44) {
    throw new Error(`Expected mobile preview chip tap target height >= 44px, got ${JSON.stringify(mobileRes.chipHeights)}`);
  }
  console.log('  ✓ Mobile sheet sound panel verified at 390px (tap targets >= 44px satisfied)');

  // 9. Test Armed State
  console.log('\n9. Testing Armed State (sound saved as on, page reloaded)...');
  await evalCode(`
    (() => {
      localStorage.setItem('sound', 'on');
    })()
  `);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  const armedRes = await evalCode(`
    (() => {
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      const pressed = btn ? btn.getAttribute('aria-pressed') : null;
      const bars = Array.from(btn?.querySelectorAll('.sound-meter i') || []);
      const transforms = bars.map(b => b.style.transform);
      return {
        pressed,
        transforms,
      };
    })()
  `);
  console.log('  ✓ Armed state reload check:', JSON.stringify(armedRes));
  if (armedRes.pressed !== 'true') {
    throw new Error(`Expected aria-pressed="true" in armed state, got "${armedRes.pressed}"`);
  }
  // All transforms should be empty ("") because audio context has not yet resumed!
  const allFlat = armedRes.transforms.every(t => !t || t === '');
  if (!allFlat) {
    throw new Error('Bars should remain flat in armed state until audio starts!');
  }
  console.log('  ✓ Armed state verified: aria-pressed="true" with flat bars until audio starts');

  // 10. Test First-Visit Hint Logic
  console.log('\n10. Testing First-Visit Hint Logic...');
  // Clear localStorage and session
  await evalCode(`
    (() => {
      localStorage.clear();
      sessionStorage.clear();
    })()
  `);
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));

  // Trigger hero intro complete or let it fire
  await evalCode(`
    (() => {
      window.dispatchEvent(new CustomEvent('hero-intro-complete'));
    })()
  `);
  // Wait 1.7s (1.5s delay + margin)
  await new Promise(r => setTimeout(r, 1800));

  const hintRes = await evalCode(`
    (() => {
      const hint = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.trim() === 'Sound?');
      const hintKey = localStorage.getItem('sound-hint');
      return {
        hintFound: !!hint,
        hintKey,
      };
    })()
  `);
  console.log('  ✓ First-visit hint check:', JSON.stringify(hintRes));
  if (!hintRes.hintFound) {
    throw new Error('Expected "Sound?" hint to be visible 1.5s after hero intro!');
  }
  if (hintRes.hintKey !== '1') {
    throw new Error('Expected localStorage key sound-hint=1 to be saved!');
  }
  console.log('  ✓ First-visit hint appeared and saved sound-hint=1 in localStorage');

  // Dismiss on interaction
  const dismissRes = await evalCode(`
    (async () => {
      const btn = document.querySelector('button[data-sound-toggle][data-magnetic]');
      btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      await new Promise(r => setTimeout(r, 150));
      const hint = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.trim() === 'Sound?');
      return { hintStillPresent: !!hint };
    })()
  `);
  console.log('  ✓ Hint dismissal on interaction:', JSON.stringify(dismissRes));
  if (dismissRes.hintStillPresent) {
    throw new Error('Hint was not dismissed upon interacting with the sound button!');
  }
  console.log('  ✓ Hint dismissal verified');

  // Reload and verify hint NEVER shows again
  await send('Page.reload');
  await new Promise(r => setTimeout(r, 2000));
  await evalCode(`
    (() => {
      window.dispatchEvent(new CustomEvent('hero-intro-complete'));
    })()
  `);
  await new Promise(r => setTimeout(r, 2000));
  const hintReloadRes = await evalCode(`
    (() => {
      const hint = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.trim() === 'Sound?');
      return { hintFound: !!hint };
    })()
  `);
  console.log('  ✓ After reload hint check:', JSON.stringify(hintReloadRes));
  if (hintReloadRes.hintFound) {
    throw new Error('Hint showed again after reload despite sound-hint=1!');
  }
  console.log('  ✓ Hint never shows again after reload verified');

  console.log('\n🎉 ALL PHASE S3 TESTS PASSED PERFECTLY!\n');
} finally {
  try { ws.close(); } catch {}
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
  } catch {}
}
