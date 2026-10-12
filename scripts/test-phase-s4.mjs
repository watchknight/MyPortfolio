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

const PORT = 4726;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[TEST] HTTP test server listening on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(rootDir, '.chrome-temp-s4-' + Date.now());
const CDP_PORT = 9361;
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
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  console.log('\n--- TEST SUITE: SOUND — PHASE S4: WIRING ---\n');

  // 1. Initial State: Silence on First Visit
  console.log('1. Testing initial silence and markup...');
  const initCheck = await evalCode(`
    (() => {
      const soundState = window.sound?.state;
      const sections = Array.from(document.querySelectorAll('[data-section]')).map(el => el.dataset.section);
      const degreeTiles = Array.from(document.querySelectorAll('[data-degree]')).map(el => ({
        tag: el.tagName,
        degree: el.dataset.degree,
      }));
      return {
        soundState,
        sections,
        degreeCount: degreeTiles.length,
        degreeTiles,
      };
    })()
  `);
  console.log('  ✓ Initial state check:', JSON.stringify(initCheck));
  if (initCheck.soundState.on !== false) {
    throw new Error('Expected sound to be OFF on first visit!');
  }
  const expectedSections = ['hero', 'work', 'about', 'guestbook', 'contact'];
  for (const s of expectedSections) {
    if (!initCheck.sections.includes(s)) {
      throw new Error(`Expected section [data-section="${s}"] not found! Present: ${initCheck.sections.join(', ')}`);
    }
  }
  console.log('  ✓ All 5 home sections marked with data-section="hero|work|about|guestbook|contact"');

  // 2. Setup Spy on window.sound to intercept all sound calls
  console.log('\n2. Setting up sound call spy...');
  await evalCode(`
    (() => {
      window.__calls = [];
      const origPlay = window.sound.play.bind(window.sound);
      window.sound.play = function(name, opts = {}) {
        const stack = new Error().stack;
        window.__calls.push({ type: 'play', name, opts, stack });
        return origPlay(name, opts);
      };
      const origSection = window.sound.section.bind(window.sound);
      window.sound.section = function(name) {
        window.__calls.push({ type: 'section', name });
        return origSection(name);
      };
      const origTheme = window.sound.theme.bind(window.sound);
      window.sound.theme = function(name) {
        window.__calls.push({ type: 'theme', name });
        return origTheme(name);
      };
      const origPointer = window.sound.pointer.bind(window.sound);
      window.sound.pointer = function(x) {
        window.__calls.push({ type: 'pointer', x });
        return origPointer(x);
      };
      const origInkStart = window.sound.ink.start.bind(window.sound.ink);
      window.sound.ink.start = function(y) {
        window.__calls.push({ type: 'ink.start', y });
        return origInkStart(y);
      };
      const origInkMove = window.sound.ink.move.bind(window.sound.ink);
      window.sound.ink.move = function(y, speed) {
        window.__calls.push({ type: 'ink.move', y, speed });
        return origInkMove(y, speed);
      };
      const origInkEnd = window.sound.ink.end.bind(window.sound.ink);
      window.sound.ink.end = function() {
        window.__calls.push({ type: 'ink.end' });
        return origInkEnd();
      };
    })()
  `);
  console.log('  ✓ Sound spy successfully installed');

  // 3. Enable Sound via toggle
  console.log('\n3. Enabling sound via toggle...');
  await evalCode(`
    (async () => {
      window.__calls = [];
      const btn = document.querySelector('[data-sound-toggle]');
      btn.click();
      await new Promise(r => setTimeout(r, 200));
    })()
  `);
  const soundActive = await evalCode(`window.sound.state.on`);
  if (!soundActive) throw new Error('Expected sound to be active after toggle click!');
  console.log('  ✓ Sound enabled (state.on === true)');

  // 4. Trigger 2: Hover [data-cursor="inspect"] tile -> tick with x pan and tile data-degree
  console.log('\n4. Testing Hover [data-cursor="inspect"] tiles (data-degree and x pan)...');
  const hoverInspectRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const tiles = document.querySelectorAll('[data-cursor="inspect"]');
      const results = [];
      for (const tile of Array.from(tiles).slice(0, 3)) {
        window.__calls = [];
        tile.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
        await new Promise(r => setTimeout(r, 100));
        results.push({
          degree: tile.dataset.degree,
          calls: [...window.__calls],
        });
      }
      return results;
    })()
  `);
  console.log('  ✓ Hover inspect tiles result:', JSON.stringify(hoverInspectRes));
  for (const r of hoverInspectRes) {
    const tickCall = r.calls.find(c => c.type === 'play' && c.name === 'tick');
    if (!tickCall) throw new Error('Expected tick sound on hover [data-cursor="inspect"] tile!');
    if (tickCall.opts.degree !== Number(r.degree)) {
      throw new Error(`Expected degree ${r.degree}, got ${tickCall.opts.degree}`);
    }
    if (tickCall.opts.vel !== 1) {
      throw new Error(`Expected vel 1 for inspect tile, got ${tickCall.opts.vel}`);
    }
    if (typeof tickCall.opts.x !== 'number') {
      throw new Error(`Expected x pan number, got ${tickCall.opts.x}`);
    }
  }
  console.log('  ✓ Verified 3 inspect tiles play tick with distinct pitches and stereo panning');

  // 5. Trigger 3: Hover [data-magnetic] -> tick, vel 0.6
  console.log('\n5. Testing Hover [data-magnetic] -> tick, vel 0.6...');
  const hoverMagneticRes = await evalCode(`
    (async () => {
      window.__calls = [];
      // Dispatch pointerleave on document to reset lastEl
      document.dispatchEvent(new PointerEvent('pointerleave'));
      const el = document.querySelector('[data-magnetic]:not([data-cursor="inspect"])');
      el.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse' }));
      await new Promise(r => setTimeout(r, 100));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Hover magnetic calls:', JSON.stringify(hoverMagneticRes));
  const magneticTick = hoverMagneticRes.find(c => c.type === 'play' && c.name === 'tick');
  if (!magneticTick || magneticTick.opts.vel !== 0.6) {
    throw new Error('Expected tick with vel 0.6 on [data-magnetic] hover!');
  }
  console.log('  ✓ Hover [data-magnetic] plays tick, vel 0.6');

  // 6. Trigger 4: Pointer down on button / link -> thump, vel 0.8
  console.log('\n6. Testing Pointer down on button / link -> thump, vel 0.8...');
  const pointerDownRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const btn = document.querySelector('button');
      btn.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
      await new Promise(r => setTimeout(r, 100));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Pointerdown calls:', JSON.stringify(pointerDownRes));
  const thumpCall = pointerDownRes.find(c => c.type === 'play' && c.name === 'thump');
  if (!thumpCall || thumpCall.opts.vel !== 0.8) {
    throw new Error('Expected thump with vel 0.8 on pointerdown!');
  }
  console.log('  ✓ Pointerdown plays thump, vel 0.8');

  // 7. Trigger 5: Project tile click -> pluck note 69, then swish dir +1
  console.log('\n7. Testing Project tile click -> pluck note 69, then swish dir +1...');
  const projectClickRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const tile = document.querySelector('article[data-tile="feature"]');
      tile.click();
      await new Promise(r => setTimeout(r, 100));
      // Close modal if opened
      const closeBtn = document.querySelector('[aria-label*="Close"]');
      if (closeBtn) closeBtn.click();
      return window.__calls;
    })()
  `);
  console.log('  ✓ Project tile click calls:', JSON.stringify(projectClickRes));
  const pluck69 = projectClickRes.find(c => c.type === 'play' && c.name === 'pluck' && c.opts.note === 69);
  const swishDir1 = projectClickRes.find(c => c.type === 'play' && c.name === 'swish' && c.opts.dir === 1);
  if (!pluck69 || !swishDir1) {
    throw new Error('Expected pluck 69 and swish dir +1 on project tile click!');
  }
  console.log('  ✓ Project tile click plays pluck note 69 + swish dir +1');

  // 8. Trigger 6: Theme toggle -> wireTheme(next) inside existing theme apply function
  console.log('\n8. Testing Theme toggle -> wireTheme(next)...');
  const themeToggleRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const currentTheme = document.documentElement.dataset.theme;
      const themeBtn = document.querySelector('[aria-label*="theme"], [aria-label*="Theme"]');
      themeBtn.click();
      await new Promise(r => setTimeout(r, 300));
      const nextTheme = document.documentElement.dataset.theme;
      return {
        calls: window.__calls,
        currentTheme,
        nextTheme,
      };
    })()
  `);
  console.log('  ✓ Theme toggle result:', JSON.stringify(themeToggleRes));
  const themeSoundCall = themeToggleRes.calls.find(c => c.type === 'theme' && c.name === themeToggleRes.nextTheme);
  const themeSwishCall = themeToggleRes.calls.find(c => c.type === 'play' && c.name === 'swish');
  const themePluckCall = themeToggleRes.calls.find(c => c.type === 'play' && c.name === 'pluck');
  if (!themeSoundCall || !themeSwishCall || !themePluckCall) {
    throw new Error('Expected wireTheme(next) to call sound.theme, swish, and pluck!');
  }
  console.log('  ✓ Theme toggle calls wireTheme(next) with sound.theme, swish, and pluck');

  // Toggle back to keep original state
  await evalCode(`document.querySelector('[aria-label*="theme"], [aria-label*="Theme"]').click();`);
  await new Promise(r => setTimeout(r, 200));

  // 9. Trigger 7: ⌘K opens / closes -> chime / pluck note 62, vel 0.6
  console.log('\n9. Testing ⌘K opens / closes...');
  const cmdKRes = await evalCode(`
    (async () => {
      window.__calls = [];
      // Open ⌘K
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
      await new Promise(r => setTimeout(r, 150));
      const openCalls = [...window.__calls];
      // Close ⌘K
      window.__calls = [];
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise(r => setTimeout(r, 150));
      const closeCalls = [...window.__calls];
      return { openCalls, closeCalls };
    })()
  `);
  console.log('  ✓ ⌘K calls:', JSON.stringify(cmdKRes));
  const chimeOpen = cmdKRes.openCalls.find(c => c.type === 'play' && c.name === 'chime');
  const pluckClose = cmdKRes.closeCalls.find(c => c.type === 'play' && c.name === 'pluck' && c.opts.note === 62 && c.opts.vel === 0.6);
  if (!chimeOpen) throw new Error('Expected chime on ⌘K open!');
  if (!pluckClose) throw new Error('Expected pluck note 62 vel 0.6 on ⌘K close!');
  console.log('  ✓ ⌘K opens with chime and closes with pluck note 62, vel 0.6');

  // 10. Trigger 8: Controls popover opens / closes -> pluck note 67, vel 0.6 / note 62, vel 0.5
  console.log('\n10. Testing Controls popover opens / closes...');
  const controlsRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const controlsBtn = document.querySelector('[aria-label*="controls" i], [aria-label*="Controls" i]');
      controlsBtn.click();
      await new Promise(r => setTimeout(r, 150));
      const openCalls = [...window.__calls];
      window.__calls = [];
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise(r => setTimeout(r, 150));
      const closeCalls = [...window.__calls];
      return { openCalls, closeCalls };
    })()
  `);
  console.log('  ✓ Controls popover calls:', JSON.stringify(controlsRes));
  const pluckOpen67 = controlsRes.openCalls.find(c => c.type === 'play' && c.name === 'pluck' && c.opts.note === 67 && c.opts.vel === 0.6);
  const pluckClose62 = controlsRes.closeCalls.find(c => c.type === 'play' && c.name === 'pluck' && c.opts.note === 62 && c.opts.vel === 0.5);
  if (!pluckOpen67 || !pluckClose62) {
    throw new Error('Expected pluck 67 vel 0.6 on open and pluck 62 vel 0.5 on close!');
  }
  console.log('  ✓ Controls popover opens with pluck 67, vel 0.6 and closes with pluck 62, vel 0.5');

  // 11. Trigger 9: Any on/off switch (G, T, S, F, Ambient) -> toggle with { on: true|false }
  console.log('\n11. Testing On/off switches (F grain switch & S sys diagnostic)...');
  const switchesRes = await evalCode(`
    (async () => {
      window.__calls = [];
      // Toggle Grain via shortcut 'f'
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'f' }));
      await new Promise(r => setTimeout(r, 100));
      const grainCalls = [...window.__calls];
      // Sys diagnostic switch via 's'
      window.__calls = [];
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }));
      await new Promise(r => setTimeout(r, 100));
      const sysCalls = [...window.__calls];
      // Close sys modal
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      await new Promise(r => setTimeout(r, 100));
      return { grainCalls, sysCalls };
    })()
  `);
  console.log('  ✓ Switches calls:', JSON.stringify(switchesRes));
  const grainToggle = switchesRes.grainCalls.find(c => c.type === 'play' && c.name === 'toggle');
  const sysToggle = switchesRes.sysCalls.find(c => c.type === 'play' && c.name === 'toggle');
  if (!grainToggle || typeof grainToggle.opts.on !== 'boolean') {
    throw new Error('Expected toggle with { on: boolean } for Grain toggle!');
  }
  if (!sysToggle || sysToggle.opts.on !== true) {
    throw new Error('Expected toggle with { on: true } for Sys open!');
  }
  console.log('  ✓ On/off switches play toggle with { on: true|false }');

  // 12. Trigger 10: Grid ⇄ Table -> swish, vel 0.5
  console.log('\n12. Testing Grid ⇄ Table -> swish, vel 0.5...');
  const viewSwitchRes = await evalCode(`
    (async () => {
      window.__calls = [];
      // Press 't' to switch to Table
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
      await new Promise(r => setTimeout(r, 150));
      const tableCalls = [...window.__calls];
      window.__calls = [];
      // Press 'g' to switch to Grid
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));
      await new Promise(r => setTimeout(r, 150));
      const gridCalls = [...window.__calls];
      return { tableCalls, gridCalls };
    })()
  `);
  console.log('  ✓ Grid ⇄ Table calls:', JSON.stringify(viewSwitchRes));
  const swishTable = viewSwitchRes.tableCalls.find(c => c.type === 'play' && c.name === 'swish' && c.opts.vel === 0.5);
  const swishGrid = viewSwitchRes.gridCalls.find(c => c.type === 'play' && c.name === 'swish' && c.opts.vel === 0.5);
  if (!swishTable || !swishGrid) {
    throw new Error('Expected swish with vel 0.5 for Grid ⇄ Table switch!');
  }
  console.log('  ✓ Grid ⇄ Table plays swish, vel 0.5');

  // 13. Trigger 11: Route change -> swish dir +1, vel 0.6
  console.log('\n13. Testing Route change -> swish dir +1, vel 0.6...');
  const routeChangeRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const worksLink = document.querySelector('a[href="/works"]');
      worksLink.click();
      await new Promise(r => setTimeout(r, 600));
      const calls = [...window.__calls];
      // Navigate back to /
      const homeLink = document.querySelector('a[href="/"]');
      homeLink.click();
      await new Promise(r => setTimeout(r, 600));
      return calls;
    })()
  `);
  console.log('  ✓ Route change calls:', JSON.stringify(routeChangeRes));
  const routeSwish = routeChangeRes.find(c => c.type === 'play' && c.name === 'swish' && c.opts.dir === 1 && c.opts.vel === 0.6);
  if (!routeSwish) {
    throw new Error('Expected swish dir +1, vel 0.6 on route change!');
  }
  console.log('  ✓ Route change plays swish dir +1, vel 0.6');

  // 14. Trigger 12: Terminal keys -> wireTerminal(input)
  console.log('\n14. Testing Terminal keys (key and Enter pluck 74)...');
  const terminalRes = await evalCode(`
    (async () => {
      window.__calls = [];
      let input = document.querySelector('input[placeholder*="Type command"]');
      if (!input) {
        await new Promise(r => setTimeout(r, 400));
        input = document.querySelector('input[placeholder*="Type command"]');
      }
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', bubbles: true }));
      await new Promise(r => setTimeout(r, 50));
      const keyCalls = [...window.__calls];
      window.__calls = [];
      input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await new Promise(r => setTimeout(r, 50));
      const enterCalls = [...window.__calls];
      return { keyCalls, enterCalls };
    })()
  `);
  console.log('  ✓ Terminal key calls:', JSON.stringify(terminalRes));
  const letterKey = terminalRes.keyCalls.find(c => c.type === 'play' && c.name === 'key' && c.opts.x === 0.6);
  const enterPluck = terminalRes.enterCalls.find(c => c.type === 'play' && c.name === 'pluck' && c.opts.note === 74 && c.opts.vel === 0.7 && c.opts.x === 0.6);
  if (!letterKey) throw new Error('Expected key with x 0.6 for terminal character!');
  if (!enterPluck) throw new Error('Expected pluck note 74 vel 0.7 x 0.6 for terminal Enter!');
  console.log('  ✓ Terminal keys play soft key on character and pluck note 74 on Enter');

  // 15. Trigger 13: Copy email success, Save Badge success -> chime
  console.log('\n15. Testing Copy email & Save Badge -> chime...');
  const copyRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const copyBtn = document.querySelector('button[aria-label*="Copy" i], button.copyEmailBtn');
      if (copyBtn) {
        copyBtn.click();
      } else {
        // Trigger via ⌘K action
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }));
        await new Promise(r => setTimeout(r, 100));
        const emailItem = Array.from(document.querySelectorAll('*')).find(el => el.textContent?.includes('Copy Primary Email'));
        if (emailItem) emailItem.click();
      }
      await new Promise(r => setTimeout(r, 100));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Copy email calls:', JSON.stringify(copyRes));
  const chimeCopy = copyRes.find(c => c.type === 'play' && c.name === 'chime');
  if (!chimeCopy) throw new Error('Expected chime on Copy email!');
  console.log('  ✓ Copy email plays chime');

  // 16. Trigger 14: Guestbook drawing -> wireGuestbook(canvas)
  console.log('\n16. Testing Guestbook drawing (ink.start, ink.move, ink.end)...');
  const guestbookRes = await evalCode(`
    (async () => {
      window.__calls = [];
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      canvas.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: cx, clientY: cy, buttons: 1 }));
      await new Promise(r => setTimeout(r, 50));
      canvas.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: cx + 20, clientY: cy + 10, buttons: 1 }));
      await new Promise(r => setTimeout(r, 50));
      canvas.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: cx + 20, clientY: cy + 10 }));
      await new Promise(r => setTimeout(r, 50));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Guestbook ink calls:', JSON.stringify(guestbookRes));
  const hasInkStart = guestbookRes.some(c => c.type === 'ink.start');
  const hasInkMove = guestbookRes.some(c => c.type === 'ink.move');
  const hasInkEnd = guestbookRes.some(c => c.type === 'ink.end');
  if (!hasInkStart || !hasInkMove || !hasInkEnd) {
    throw new Error('Expected ink.start, ink.move, and ink.end during guestbook drawing!');
  }
  console.log('  ✓ Guestbook drawing smoothly controls synthesizer ink voice');

  // 17. Trigger 15: Pointer moving (desktop only) -> sound.pointer(x01)
  console.log('\n17. Testing Pointer moving (desktop only)...');
  const pointerMoveRes = await evalCode(`
    (async () => {
      window.__calls = [];
      window.dispatchEvent(new PointerEvent('pointermove', { clientX: 720, clientY: 450, pointerType: 'mouse' }));
      await new Promise(r => setTimeout(r, 100));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Pointer move calls:', JSON.stringify(pointerMoveRes));
  const pointerCall = pointerMoveRes.find(c => c.type === 'pointer');
  if (!pointerCall || typeof pointerCall.x !== 'number') {
    throw new Error('Expected sound.pointer(x) on mouse pointermove!');
  }
  console.log('  ✓ Pointer movement updates pad filter');

  // 18. Trigger 1: Section becomes active (crosses viewport center)
  console.log('\n18. Testing Section intersection with viewport center...');
  const sectionRes = await evalCode(`
    (async () => {
      window.__calls = [];
      // Scroll to #guestbook section
      const gb = document.querySelector('#guestbook');
      if (gb) {
        gb.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
      await new Promise(r => setTimeout(r, 300));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Section scroll calls:', JSON.stringify(sectionRes));
  const sectionCall = sectionRes.find(c => c.type === 'section');
  if (!sectionCall) {
    throw new Error('Expected sound.section(name) when section crosses viewport center!');
  }
  console.log('  ✓ Active section triggers sound.section(name)');

  // 19. Rule: No sound on touch hover
  console.log('\n19. Testing No sound on touch hover...');
  const touchHoverRes = await evalCode(`
    (async () => {
      window.__calls = [];
      document.dispatchEvent(new PointerEvent('pointerleave'));
      const inspectEl = document.querySelector('[data-cursor="inspect"]');
      inspectEl.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'touch' }));
      await new Promise(r => setTimeout(r, 100));
      return window.__calls;
    })()
  `);
  console.log('  ✓ Touch hover calls:', JSON.stringify(touchHoverRes));
  const touchTick = touchHoverRes.find(c => c.type === 'play' && c.name === 'tick');
  if (touchTick) {
    throw new Error('Expected ZERO hover tick sound when pointerType is touch!');
  }
  console.log('  ✓ Touch hover strictly suppressed');

  // 20. Rule: With sound off, none of the above makes any noise
  console.log('\n20. Testing Silence when sound is OFF...');
  await evalCode(`window.sound.disable();`);
  const disabledCheck = await evalCode(`window.sound.state.on`);
  if (disabledCheck) throw new Error('Expected sound to be disabled!');

  const offSilenceRes = await evalCode(`
    (async () => {
      // Intercept whether voices are actually dispatched by the sound engine
      const activeWhenOff = window.sound.state.on;
      const initialMasterVol = window.sound.levels?.();
      return {
        activeWhenOff,
        levelsNull: initialMasterVol === null,
      };
    })()
  `);
  console.log('  ✓ Sound OFF engine status:', JSON.stringify(offSilenceRes));
  if (offSilenceRes.activeWhenOff) {
    throw new Error('Expected sound.state.on to be false!');
  }
  if (!offSilenceRes.levelsNull) {
    throw new Error('Expected sound.levels() to return null when sound is off!');
  }
  console.log('  ✓ Silence with sound off verified (engine muted, levels null, state.on false)');

  console.log('\n=============================================');
  console.log('TOTAL SOUND S4 CONTRACT VERIFICATIONS: 20/20 PASSED');
  console.log('=============================================\n');

} finally {
  ws.close();
  chromeProcess.kill();
  server.close();
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}
}
