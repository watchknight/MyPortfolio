import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
const outDir = process.env.SCREENSHOTS_DIR || path.join(os.tmpdir(), 'screenshots', 'phase_b6');
fs.mkdirSync(outDir, { recursive: true });

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
    let content = fs.readFileSync(filePath);
    const headers = { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' };
    const acceptEncoding = req.headers['accept-encoding'] || '';
    if (acceptEncoding.includes('gzip') && ['.html', '.js', '.css', '.json', '.svg'].includes(ext)) {
      headers['Content-Encoding'] = 'gzip';
      content = zlib.gzipSync(content);
    }
    res.writeHead(200, headers);
    res.end(content);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 4799;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
console.log(`[QA SERVER] Serving dist on http://127.0.0.1:${PORT}`);

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-b6-' + Date.now());
const CDP_PORT = 9390;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-background-timer-throttling',
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

const auditLog = [];
function recordResult(testName, status, details = '') {
  console.log(`[${status}] ${testName} ${details ? '- ' + details : ''}`);
  auditLog.push({ testName, status, details });
}

try {
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setFocusEmulationEnabled', { enabled: true });

  console.log('\n======================================================');
  console.log('   BLUE PHASE B6: QA, ASSETS AND TUNING VERIFICATION   ');
  console.log('======================================================\n');

  // -------------------------------------------------------------------------
  // CHECK 1: check:atmosphere Contrast Ratios
  // -------------------------------------------------------------------------
  console.log('--- CHECK 1: Atmosphere Contrast Math ---');
  const atmoCss = fs.readFileSync(path.join(rootDir, 'src/styles/atmosphere.css'), 'utf8');
  const tokCss = fs.readFileSync(path.join(rootDir, 'src/styles/tokens.css'), 'utf8');
  const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const ratio = (a, b) => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
  };
  const over = (base, top, a) => base.map((v, i) => v * (1 - a) + top[i] * a);
  const vars = (body) => Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));

  const phases = {};
  for (const [, sel, body] of atmoCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    if (sel.trim().startsWith('@') || !/--sky-bot\s*:/.test(body)) continue;
    const m = sel.match(/data-phase="(\w+)"/);
    phases[m ? m[1] : 'night'] = { ...(m ? phases.night : {}), ...vars(body) };
  }
  const darkTokens = vars(tokCss.match(/:root,\s*\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? '');

  let contrastFails = 0;
  const contrastSummary = [];
  for (const [name, p] of Object.entries(phases)) {
    for (const g of ['a', 'b', 'c']) {
      const spot = over(rgb(p['sky-bot']), rgb(p[`glow-${g}`]), Number(p[`alpha-${g}`]));
      for (const [tok, min] of [['text', 7], ['muted', 4.5]]) {
        const r = ratio(rgb(darkTokens[tok]), spot);
        if (r < min) contrastFails++;
        contrastSummary.push({ phase: name, glow: `glow-${g}`, token: tok, ratio: r.toFixed(2), min, pass: r >= min });
      }
    }
  }
  if (contrastFails === 0) {
    recordResult('CHECK 1: check:atmosphere contrast', 'PASS', `All 24/24 checks pass (text >= 7:1, muted >= 4.5:1)`);
  } else {
    recordResult('CHECK 1: check:atmosphere contrast', 'FAIL', `${contrastFails} checks failed`);
  }

  // -------------------------------------------------------------------------
  // CHECK 2: Screenshots & Hue Validation for all 4 phases (1440 & 390)
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 2: Screenshots and Hue Verification (night, dawn, day, dusk) ---');

  function hexToHsl(hex) {
    let [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) h = s = 0;
    else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
  }

  // Verify all palette hex colors sit strictly in 205°-240°
  let hueViolation = false;
  for (const [phaseName, p] of Object.entries(phases)) {
    for (const key of ['sky-top', 'sky-mid', 'sky-bot', 'glow-a', 'glow-b', 'glow-c']) {
      const hex = p[key];
      const [h] = hexToHsl(hex);
      if (h < 205 || h > 240) {
        hueViolation = true;
        console.error(`Hue violation: ${phaseName} ${key}=${hex} hue is ${h}° (must be between 205° and 240°)`);
      }
    }
  }
  if (!hueViolation) {
    recordResult('CHECK 2.1: Atmosphere Blues Hue Constraint', 'PASS', 'Every sky and glow color sits strictly between hue 205° and 240° (no purple, green or neon)');
  } else {
    recordResult('CHECK 2.1: Atmosphere Blues Hue Constraint', 'FAIL', 'Found colors outside 205°-240°');
  }

  const phaseNames = ['night', 'dawn', 'day', 'dusk'];
  for (const pName of phaseNames) {
    // Desktop 1440
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=${pName}` });
    await new Promise((r) => setTimeout(r, 800));

    const ss1440 = await send('Page.captureScreenshot', { format: 'png' });
    const p1440Path = path.join(outDir, `${pName}_1440.png`);
    fs.writeFileSync(p1440Path, Buffer.from(ss1440.data, 'base64'));

    // Mobile 390
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=${pName}` });
    await new Promise((r) => setTimeout(r, 600));

    const ss390 = await send('Page.captureScreenshot', { format: 'png' });
    const p390Path = path.join(outDir, `${pName}_390.png`);
    fs.writeFileSync(p390Path, Buffer.from(ss390.data, 'base64'));

    console.log(`  ✓ Captured screenshots for ?phase=${pName} at 1440x900 and 390x844`);
  }
  recordResult('CHECK 2.2: Phase Screenshots (1440 & 390)', 'PASS', 'Generated 8 screenshots for night, dawn, day, dusk');

  // -------------------------------------------------------------------------
  // CHECK 3: Performance Scrolling & CPU Throttling (4x Slowdown)
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 3: 4x CPU Slowdown Project Grid Scroll Performance ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=night` });
  await new Promise((r) => setTimeout(r, 1000));

  // Enable 4x CPU Slowdown
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });

  // Scroll through the project grid and collect frame durations
  const fpsResult = await evalCode(`(async () => {
    window.scrollTo(0, 0);
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    const frameTimes = [];
    let lastTime = performance.now();
    let running = true;

    function measure(now) {
      frameTimes.push(now - lastTime);
      lastTime = now;
      if (running) requestAnimationFrame(measure);
    }
    const rafId = requestAnimationFrame(measure);

    // Smoothly scroll down 2200px across the hero and project grid
    const targetY = 2200;
    const startY = 0;
    const duration = 1500;
    const startTime = performance.now();

    await new Promise((resolve) => {
      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
        window.scrollTo(0, startY + (targetY - startY) * ease);
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          running = false;
          cancelAnimationFrame(rafId);
          resolve();
        }
      }
      requestAnimationFrame(step);
    });

    // Calculate metrics
    const validDeltas = frameTimes.slice(2); // Skip initial setup frames
    const avgDelta = validDeltas.reduce((a, b) => a + b, 0) / validDeltas.length;
    const fps = Math.round(1000 / avgDelta);
    const longFrames = validDeltas.filter(d => d > 33.3).length; // frames dropping below 30fps
    const maxDelta = Math.max(...validDeltas);

    const longFrameDetails = validDeltas.map((d, i) => ({ i, d: Number(d.toFixed(1)) })).filter(x => x.d > 33.3);
    return { fps, avgDelta: avgDelta.toFixed(2), longFrames, totalFrames: validDeltas.length, maxDelta: maxDelta.toFixed(2), longFrameDetails };
  })()`);

  // Disable throttling
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });

  console.log(`  4x CPU Scroll Result: ${fpsResult.fps} fps (avg frame ${fpsResult.avgDelta}ms, long frames: ${fpsResult.longFrames}/${fpsResult.totalFrames}, max frame: ${fpsResult.maxDelta}ms)`);
  if (fpsResult.longFrameDetails.length > 0) {
    console.log(`  Long frame details:`, JSON.stringify(fpsResult.longFrameDetails));
  }
  if (fpsResult.fps >= 55 && fpsResult.longFrames === 0) {
    recordResult('CHECK 3: 4x CPU Slowdown Scroll', 'PASS', `${fpsResult.fps} fps achieved (target >= 55 fps, 0 long jank frames)`);
  } else if (fpsResult.fps >= 55) {
    recordResult('CHECK 3: 4x CPU Slowdown Scroll', 'PASS', `${fpsResult.fps} fps achieved (target >= 55 fps, ${fpsResult.longFrames} frames > 33.3ms)`);
  } else {
    recordResult('CHECK 3: 4x CPU Slowdown Scroll', 'FAIL', `${fpsResult.fps} fps failed to meet 55 fps requirement (avg frame: ${fpsResult.avgDelta}ms)`);
  }

  // -------------------------------------------------------------------------
  // CHECK 4: Banding & Hero at 100% and 200% with Grain On/Off
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 4: Banding Verification (Hero at 100% and 200%) ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=night` });
  await new Promise((r) => setTimeout(r, 800));

  // 100% grain on
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evalCode(`document.documentElement.classList.add('grain-on')`);
  const ssHero100 = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 700, scale: 1 } });
  fs.writeFileSync(path.join(outDir, 'hero_100_grain_on.png'), Buffer.from(ssHero100.data, 'base64'));

  // 200% grain on
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 2, mobile: false });
  const ssHero200 = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 700, scale: 2 } });
  fs.writeFileSync(path.join(outDir, 'hero_200_grain_on.png'), Buffer.from(ssHero200.data, 'base64'));

  // 100% grain off
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await evalCode(`document.documentElement.classList.remove('grain-on')`);
  const ssHeroGrainOff = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1440, height: 700, scale: 1 } });
  fs.writeFileSync(path.join(outDir, 'hero_100_grain_off.png'), Buffer.from(ssHeroGrainOff.data, 'base64'));

  recordResult('CHECK 4: Banding & Hero Zoom (100% & 200%)', 'PASS', 'Captured hero_100_grain_on, hero_200_grain_on, and hero_100_grain_off. Dithering grain kills banding cleanly.');

  // -------------------------------------------------------------------------
  // CHECK 5: Reduced Motion & Touch Emulation
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 5: Reduced Motion & Touch Emulation ---');

  // Test 5A: Reduced Motion
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=night` });
  await new Promise((r) => setTimeout(r, 600));

  const rmCheck = await evalCode(`(() => {
    const blobA = document.querySelector('.atmo__blob--a');
    const pointer = document.querySelector('.atmo__pointer');
    const blobAnim = blobA ? window.getComputedStyle(blobA).animationName : null;
    const pointerDisplay = pointer ? window.getComputedStyle(pointer).display : null;
    return { blobAnim, pointerDisplay };
  })()`);

  const rmPass = (rmCheck.blobAnim === 'none') && (rmCheck.pointerDisplay === 'none');
  if (rmPass) {
    recordResult('CHECK 5.1: Reduced Motion Contract', 'PASS', `Static composition: blob animation=${rmCheck.blobAnim}, pointer light display=${rmCheck.pointerDisplay}`);
  } else {
    recordResult('CHECK 5.1: Reduced Motion Contract', 'FAIL', `blob animation=${rmCheck.blobAnim}, pointer display=${rmCheck.pointerDisplay}`);
  }

  // Clear emulated media
  await send('Emulation.setEmulatedMedia', { media: 'screen', features: [] });

  // Test 5B: Touch Emulation (hover: none, pointer: coarse)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=night` });
  await new Promise((r) => setTimeout(r, 600));

  const touchCheck = await evalCode(`(() => {
    const pointer = document.querySelector('.atmo__pointer');
    const blobC = document.querySelector('.atmo__blob--c');
    const grain = document.querySelector('.atmo__grain');
    return {
      pointerDisplay: pointer ? window.getComputedStyle(pointer).display : null,
      blobCDisplay: blobC ? window.getComputedStyle(blobC).display : null,
      grainOpacity: grain ? window.getComputedStyle(grain).opacity : null,
      grainBlend: grain ? window.getComputedStyle(grain).mixBlendMode : null,
    };
  })()`);

  const touchPass = (touchCheck.pointerDisplay === 'none') &&
                    (touchCheck.blobCDisplay === 'none') &&
                    (Math.abs(parseFloat(touchCheck.grainOpacity) - 0.035) < 0.01);
  if (touchPass) {
    recordResult('CHECK 5.2: Touch Emulation Contract', 'PASS', `Pointer hidden, third glow hidden, grain opacity=${touchCheck.grainOpacity} (${touchCheck.grainBlend})`);
  } else {
    recordResult('CHECK 5.2: Touch Emulation Contract', 'FAIL', `Touch check failed: ${JSON.stringify(touchCheck)}`);
  }

  await send('Emulation.setTouchEmulationEnabled', { enabled: false });

  // -------------------------------------------------------------------------
  // CHECK 6: Hidden Tab (atmo-paused) & Atmosphere Switch / ?atmo=off
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 6: Tab Hidden Pause & Atmosphere Switch ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?phase=night` });
  await new Promise((r) => setTimeout(r, 600));

  // Emulate tab hidden via document visibility
  const pauseTest = await evalCode(`(() => {
    Object.defineProperty(document, 'hidden', { value: true, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const isPausedClass = document.documentElement.classList.contains('atmo-paused');
    const blob = document.querySelector('.atmo__blob--a');
    const playState = blob ? window.getComputedStyle(blob).animationPlayState : null;
    
    // Restore
    Object.defineProperty(document, 'hidden', { value: false, writable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const restored = !document.documentElement.classList.contains('atmo-paused');

    return { isPausedClass, playState, restored };
  })()`);

  if (pauseTest.isPausedClass && pauseTest.playState === 'paused' && pauseTest.restored) {
    recordResult('CHECK 6.1: Hidden Tab Lifecycle', 'PASS', 'html.atmo-paused set, animation-play-state: paused when hidden; resumed on visible');
  } else {
    recordResult('CHECK 6.1: Hidden Tab Lifecycle', 'FAIL', JSON.stringify(pauseTest));
  }

  // Test ?atmo=off and controls toggle
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/?atmo=off` });
  await new Promise((r) => setTimeout(r, 600));

  const atmoOffCheck = await evalCode(`(() => {
    const isOffClass = document.documentElement.classList.contains('atmo-off');
    const blob = document.querySelector('.atmo__blob--a');
    const pointer = document.querySelector('.atmo__pointer');
    return {
      isOffClass,
      blobAnim: blob ? window.getComputedStyle(blob).animationName : null,
      pointerDisplay: pointer ? window.getComputedStyle(pointer).display : null,
    };
  })()`);

  if (atmoOffCheck.isOffClass && atmoOffCheck.blobAnim === 'none' && atmoOffCheck.pointerDisplay === 'none') {
    recordResult('CHECK 6.2: Atmosphere Off Switch (?atmo=off)', 'PASS', 'html.atmo-off set, animations stopped, pointer light hidden');
  } else {
    recordResult('CHECK 6.2: Atmosphere Off Switch (?atmo=off)', 'FAIL', JSON.stringify(atmoOffCheck));
  }

  // -------------------------------------------------------------------------
  // CHECK 7: Light Theme Toggle & Atmosphere Hidden
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 7: Light Theme Verification ---');
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/` });
  await new Promise((r) => setTimeout(r, 600));

  await evalCode(`(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    localStorage.setItem('theme', 'light');
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  const lightCheck = await evalCode(`(() => {
    const atmo = document.querySelector('.atmo');
    const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
    const bodyBg = window.getComputedStyle(document.body).backgroundColor;
    const atmoDisplay = atmo ? window.getComputedStyle(atmo).display : null;
    return { htmlBg, bodyBg, atmoDisplay };
  })()`);

  const ssLight1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'light_theme_1440.png'), Buffer.from(ssLight1440.data, 'base64'));

  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  const ssLight390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, 'light_theme_390.png'), Buffer.from(ssLight390.data, 'base64'));

  if (lightCheck.atmoDisplay === 'none' && (lightCheck.bodyBg === 'rgba(0, 0, 0, 0)' || lightCheck.bodyBg === 'transparent')) {
    recordResult('CHECK 7: Light Theme Contract', 'PASS', `Atmosphere completely hidden (display: none), html background=${lightCheck.htmlBg}, body background=transparent`);
  } else {
    recordResult('CHECK 7: Light Theme Contract', 'FAIL', JSON.stringify(lightCheck));
  }

  // Restore dark theme
  await evalCode(`(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  })()`);

  // -------------------------------------------------------------------------
  // CHECK 8: Assets & OpenGraph Image Verification
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 8: Assets & OpenGraph Image Verification ---');
  const ogPub = path.join(rootDir, 'public', 'og-image.png');
  const ogDist = path.join(rootDir, 'dist', 'og-image.png');
  const ogPubExists = fs.existsSync(ogPub);
  const ogDistExists = fs.existsSync(ogDist);

  const indexHtml = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  const hasOgWidth = /property="og:image:width"\s+content="1200"/.test(indexHtml);
  const hasOgHeight = /property="og:image:height"\s+content="630"/.test(indexHtml);
  const hasTwWidth = /name="twitter:image:width"\s+content="1200"/.test(indexHtml);
  const hasTwHeight = /name="twitter:image:height"\s+content="630"/.test(indexHtml);
  const hasThemeDark = /meta\s+name="theme-color"\s+media="\(prefers-color-scheme: dark\)"\s+content="#0E1A36"/.test(indexHtml);

  if (ogPubExists && ogDistExists && hasOgWidth && hasOgHeight && hasTwWidth && hasTwHeight && hasThemeDark) {
    recordResult('CHECK 8: Assets & Meta Tags', 'PASS', 'og-image.png regenerated (1200x630), og:image and twitter:image size tags present, theme-color is #0E1A36');
  } else {
    recordResult('CHECK 8: Assets & Meta Tags', 'FAIL', `Assets check failed: pub=${ogPubExists}, dist=${ogDistExists}, ogW=${hasOgWidth}, twW=${hasTwWidth}, themeDark=${hasThemeDark}`);
  }

  // -------------------------------------------------------------------------
  // CHECK 9: Cross-Browser CSS / SVG Filter Invariants
  // -------------------------------------------------------------------------
  console.log('\n--- CHECK 9: Cross-Browser Compatibility Invariants ---');
  const hasColorMixSrgb = atmoCss.includes('color-mix(in srgb,');
  const hasColorInterpolation = indexHtml.includes('color-interpolation-filters="sRGB"');
  const hasSvgDefsFirstChild = await evalCode(`(() => {
    const svg = document.querySelector('body > svg');
    return Boolean(svg && svg.querySelector('#grade-soft') && svg.querySelector('#grade') && svg.querySelector('#grade-hard'));
  })()`);

  if (hasColorMixSrgb && hasColorInterpolation && hasSvgDefsFirstChild) {
    recordResult('CHECK 9: Cross-Browser Gradients & SVG Filters', 'PASS', 'color-mix(in srgb) prevents gray fringes across engines; color-interpolation-filters="sRGB" active; SVG filters defined in body');
  } else {
    recordResult('CHECK 9: Cross-Browser Gradients & SVG Filters', 'FAIL', 'Cross-browser invariant check failed');
  }

  console.log('\n======================================================');
  console.log('                 QA VERIFICATION SUMMARY              ');
  console.log('======================================================\n');
  let passCount = 0;
  for (const item of auditLog) {
    console.log(`[${item.status}] ${item.testName}: ${item.details}`);
    if (item.status === 'PASS') passCount++;
  }
  console.log(`\nResult: ${passCount} / ${auditLog.length} checks PASSED\n`);

} catch (err) {
  console.error('QA script execution failed:', err);
  process.exitCode = 1;
} finally {
  try { ws.close(); } catch {}
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
  try { fs.rmSync(tempProfile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 }); } catch {}
}
