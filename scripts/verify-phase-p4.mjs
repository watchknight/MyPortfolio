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
const screenshotsDir = path.join(rootDir, 'screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

console.log('=== PHASE P4 VERIFICATION: /FOUNDATION ===\n');

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    fails++;
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Static HTML & Prerender Audit
// ─────────────────────────────────────────────────────────────
console.log('--- 1. Static Prerendered HTML Audit (/foundation) ---');
const foundationHtmlPath = path.join(distDir, 'foundation/index.html');
assert(fs.existsSync(foundationHtmlPath), 'dist/foundation/index.html exists');

const foundationHtml = fs.readFileSync(foundationHtmlPath, 'utf-8');

// Header
assert(foundationHtml.includes('<h1') && foundationHtml.includes('Background &amp; Skills') || foundationHtml.includes('Background & Skills'), 'Page contains H1 "Background & Skills"');
assert(
  foundationHtml.includes('My academic foundation at East West University, national board scholarship distinctions, and technical skills.'),
  'Page contains existing intro copy'
);

// Shared shell
assert(foundationHtml.includes('data-section="about"'), 'main element has data-section="about"');
assert(foundationHtml.includes('<div class="atmo" aria-hidden="true">'), 'Page contains .atmo layer');
assert(foundationHtml.includes('class="page__header'), 'Page renders PageHeader');

// Bento Grid & Tiles
assert(foundationHtml.includes('span-7 rows-9'), 'Timeline tile has span-7 rows-9');
assert(foundationHtml.includes('span-5 rows-3'), 'Core coursework tile has span-5 rows-3');
assert(foundationHtml.includes('span-5 rows-2'), 'Skills tiles have span-5 rows-2');
assert(foundationHtml.includes('span-12 rows-2'), 'Tools & Practices tile has span-12 rows-2');
assert(foundationHtml.includes('span-12 rows-5'), 'Developer profile manifest has span-12 rows-5');
assert(foundationHtml.includes('data-tile="surface"'), 'Tiles use data-tile="surface"');

// Timeline Markup & Items
assert(foundationHtml.includes('class="timeline') || foundationHtml.includes('class="timeline '), 'Timeline markup contains .timeline');
assert(foundationHtml.includes('data-timeline-line'), 'Timeline markup contains data-timeline-line');
assert(foundationHtml.includes('data-timeline-item'), 'Timeline markup contains data-timeline-item');
assert(foundationHtml.includes('data-primary'), 'EWU entry has data-primary');
assert(foundationHtml.includes('Undergrad Scholar'), 'EWU entry has "Undergrad Scholar" chip');

// All 5 educational milestones present
assert(foundationHtml.includes('B.Sc. in Computer Science &amp; Engineering') || foundationHtml.includes('B.Sc. in Computer Science & Engineering'), 'EWU B.Sc. milestone present');
assert(foundationHtml.includes('Higher Secondary Certificate (HSC)'), 'HSC milestone present');
assert(foundationHtml.includes('Secondary School Certificate (SSC / Class 10)'), 'SSC milestone present');
assert(foundationHtml.includes('Junior School Certificate (JSC / Class 8)'), 'JSC milestone present');
assert(foundationHtml.includes('Primary School Certificate (PSC / Class 5)'), 'PSC milestone present');
assert(foundationHtml.includes('GPA 5.0 / 5.0'), 'GPA 5.0 badges present');
assert(foundationHtml.includes('Board Distinction'), 'Board Distinction badge present');
assert(foundationHtml.includes('General Scholarship'), 'General Scholarship badge present');
assert(foundationHtml.includes('timeline__year'), 'Years formatted with timeline__year class (tabular numerals)');

// Skills & Coursework content
assert(foundationHtml.includes('Data Structures &amp; Algorithms') || foundationHtml.includes('Data Structures & Algorithms'), 'Coursework contains Data Structures');
assert(foundationHtml.includes('Operating Systems'), 'Coursework contains Operating Systems');
assert(foundationHtml.includes('JavaScript (ES6+)'), 'Languages contain JavaScript');
assert(foundationHtml.includes('TypeScript'), 'Languages contain TypeScript');
assert(foundationHtml.includes('Python'), 'Languages contain Python');
assert(foundationHtml.includes('React'), 'Frontend contains React');
assert(foundationHtml.includes('Next.js'), 'Frontend contains Next.js');
assert(foundationHtml.includes('Node.js'), 'Backend contains Node.js');
assert(foundationHtml.includes('PostgreSQL'), 'Backend contains PostgreSQL');
assert(foundationHtml.includes('Git &amp; GitHub') || foundationHtml.includes('Git & GitHub'), 'Tools contain Git & GitHub');

// Developer Profile Manifest (Terminal Tile)
assert(foundationHtml.includes('architect.schema.ts'), 'Manifest header has title architect.schema.ts');
assert(foundationHtml.includes('TypeScript AST'), 'Manifest header has TypeScript AST chip');
assert(foundationHtml.includes('Copy .ts') || foundationHtml.includes('Copied'), 'Manifest header has Copy .ts button');
assert(foundationHtml.includes('class="code') || foundationHtml.includes('class="code '), 'Manifest has code class');
assert(foundationHtml.includes('class="k"') || foundationHtml.includes("class='k'"), 'Manifest code uses .k for keywords');
assert(foundationHtml.includes('class="s"') || foundationHtml.includes("class='s'"), 'Manifest code uses .s for strings');
assert(foundationHtml.includes('class="t"') || foundationHtml.includes("class='t'"), 'Manifest code uses .t for types');
assert(foundationHtml.includes('class="c"') || foundationHtml.includes("class='c'"), 'Manifest code uses .c for comments');
assert(foundationHtml.includes('ORIGIN NODE // ASIA-SOUTH-1 (DHAKA)'), 'Manifest footer has ORIGIN NODE');
assert(foundationHtml.includes('SHA-256 // VERIFIED SCHEMA'), 'Manifest footer has SHA-256');

// ─────────────────────────────────────────────────────────────
// 2. Headless Chrome Browser Verification (1440px & 390px)
// ─────────────────────────────────────────────────────────────
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

const PORT = 4899;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-p4-' + Date.now());
const CDP_PORT = 9592;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/foundation`,
]);

await new Promise((r) => setTimeout(r, 2000));

try {
  const versionRes = await fetch(`http://127.0.0.1:${CDP_PORT}/json/list`);
  const targets = await versionRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');

  if (!pageTarget) throw new Error('Could not find page target');

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let msgId = 1;
  const pending = new Map();
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === 'Runtime.consoleAPICalled') {
      console.log('PAGE LOG:', msg.params.args.map((a) => a.value || a.description).join(' '));
    }
    if (msg.method === 'Runtime.exceptionThrown') {
      console.error('PAGE EXCEPTION:', JSON.stringify(msg.params.exceptionDetails));
    }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve) => {
      const id = msgId++;
      pending.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
    });
    return res?.result?.result?.value ?? res?.result?.value;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // ─────────────────────────────────────────────────────────
  // DESKTOP: 1440x900
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 2. Desktop 1440x900 Browser Verification ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/foundation` });
  await new Promise((r) => setTimeout(r, 1500));

  // Check 12-col Layout geometry
  const layoutMetrics = await evaluate(`
    (function() {
      const timelineTile = document.querySelector('[class*="timelineTile"]');
      const courseworkTile = document.querySelector('[class*="courseworkTile"]');
      const languagesTile = document.querySelector('[class*="languagesTile"]');
      const toolsTile = document.querySelector('[class*="toolsTile"]');
      const manifestTile = document.querySelector('[class*="manifestCard"]');

      const tlRect = timelineTile?.getBoundingClientRect();
      const cwRect = courseworkTile?.getBoundingClientRect();
      const langRect = languagesTile?.getBoundingClientRect();
      const toolsRect = toolsTile?.getBoundingClientRect();
      const mfRect = manifestTile?.getBoundingClientRect();

      return {
        timelineWidth: tlRect?.width,
        timelineLeft: tlRect?.left,
        courseworkWidth: cwRect?.width,
        courseworkLeft: cwRect?.left,
        toolsWidth: toolsRect?.width,
        manifestWidth: mfRect?.width,
        isTwoColumnsTop: cwRect && tlRect && cwRect.left > tlRect.right,
        toolsSpansFull: toolsRect && toolsRect.width > 1000,
        manifestSpansFull: mfRect && mfRect.width > 1000,
      };
    })()
  `);

  console.log('Desktop 1440x900 layout metrics:', layoutMetrics);
  assert(layoutMetrics.isTwoColumnsTop, 'Timeline (left, span-7) and Coursework (right, span-5) sit side by side in 12-col layout');
  assert(layoutMetrics.toolsSpansFull, 'Tools & Practices tile spans full width (span-12)');
  assert(layoutMetrics.manifestSpansFull, 'Developer profile manifest tile spans full width (span-12)');

  // Check Timeline initial state & Scroll Drawing
  console.log('\n--- 3. Timeline Scroll Drawing & Lighting Verification ---');
  const initialTimelineState = await evaluate(`
    (function() {
      const line = document.querySelector('[data-timeline-line]');
      const items = Array.from(document.querySelectorAll('[data-timeline-item]'));
      const litItems = items.filter(it => it.classList.contains('is-lit'));
      const transform = line ? getComputedStyle(line).transform : '';

      return {
        totalItems: items.length,
        initialLitCount: litItems.length,
        transform,
      };
    })()
  `);
  console.log('Initial timeline state at scroll top 0:', initialTimelineState);
  assert(initialTimelineState.totalItems === 5, 'Found exactly 5 timeline items');
  assert(initialTimelineState.initialLitCount >= 1, 'Top item (EWU) is lit on initial screen load');

  // Scroll down to 600px
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: 600, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 300));

  const scrolledState = await evaluate(`
    (function() {
      const line = document.querySelector('[data-timeline-line]');
      const items = Array.from(document.querySelectorAll('[data-timeline-item]'));
      const litItems = items.filter(it => it.classList.contains('is-lit'));
      const transform = line ? line.style.transform : '';

      return {
        litCount: litItems.length,
        transform,
      };
    })()
  `);
  console.log('After scrolling 600px:', scrolledState);
  assert(scrolledState.litCount > initialTimelineState.initialLitCount, 'Scrolling down lights more timeline nodes');
  assert(scrolledState.transform.includes('scaleY'), 'Timeline line scales down via transform scaleY on scroll');

  // Scroll all the way down
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 400));

  const bottomState = await evaluate(`
    (function() {
      const line = document.querySelector('[data-timeline-line]');
      const items = Array.from(document.querySelectorAll('[data-timeline-item]'));
      const litItems = items.filter(it => it.classList.contains('is-lit'));
      const transform = line ? line.style.transform : '';

      return {
        litCount: litItems.length,
        transform,
      };
    })()
  `);
  console.log('At bottom of page:', bottomState);
  assert(bottomState.litCount === 5, 'All 5 timeline nodes are lit when scrolled past');
  assert(bottomState.transform === 'scaleY(1)', 'Timeline line is fully drawn (scaleY(1))');

  // Scroll back to top
  await send('Runtime.evaluate', {
    expression: `window.scrollTo({ top: 0, behavior: 'instant' });`,
  });
  await new Promise((r) => setTimeout(r, 300));

  // ─────────────────────────────────────────────────────────
  // Manifest Copy Button Feedback Verification
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 4. Developer Manifest Copy Button Verification ---');
  const copyBtnInitial = await evaluate(`
    (function() {
      const btn = document.querySelector('[class*="copyButton"]');
      return {
        text: btn ? btn.textContent.trim() : '',
        exists: !!btn,
      };
    })()
  `);
  assert(copyBtnInitial.text === 'Copy .ts', 'Initial button label is "Copy .ts"');

  // Click Copy Button
  await send('Runtime.evaluate', {
    expression: `
      const btn = document.querySelector('[class*="copyButton"]');
      if (btn) btn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 100));

  const copyBtnActive = await evaluate(`
    (function() {
      const btn = document.querySelector('[class*="copyButton"]');
      return btn ? btn.textContent.trim() : '';
    })()
  `);
  console.log('Button label immediately after click:', copyBtnActive);
  assert(copyBtnActive === 'Copied', 'Button label swaps to "Copied" immediately upon click');

  // Wait 1.8s for 1.6s timeout to revert
  await new Promise((r) => setTimeout(r, 1800));

  const copyBtnReverted = await evaluate(`
    (function() {
      const btn = document.querySelector('[class*="copyButton"]');
      return btn ? btn.textContent.trim() : '';
    })()
  `);
  console.log('Button label after 1.8s:', copyBtnReverted);
  assert(copyBtnReverted === 'Copy .ts', 'Button label reverts back to "Copy .ts" after 1.6s timeout');

  // ─────────────────────────────────────────────────────────
  // Prefers-Reduced-Motion Verification
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 5. Prefers-Reduced-Motion Verification ---');
  await send('Emulation.setEmulatedMedia', {
    media: 'screen',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });

  // Re-navigate under reduced motion
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/foundation` });
  await new Promise((r) => setTimeout(r, 1000));

  const reducedMotionState = await evaluate(`
    (function() {
      const line = document.querySelector('[data-timeline-line]');
      const items = Array.from(document.querySelectorAll('[data-timeline-item]'));
      const litItems = items.filter(it => it.classList.contains('is-lit'));
      const lineTransform = line ? line.style.transform : '';

      return {
        totalItems: items.length,
        litCount: litItems.length,
        lineTransform,
      };
    })()
  `);
  console.log('Under prefers-reduced-motion: reduce:', reducedMotionState);
  assert(reducedMotionState.litCount === 5, 'All 5 items are immediately lit under prefers-reduced-motion: reduce');
  assert(reducedMotionState.lineTransform === 'scaleY(1)', 'Line is immediately full (scaleY(1)) under prefers-reduced-motion: reduce');

  // Reset media emulation
  await send('Emulation.setEmulatedMedia', { media: '', features: [] });

  // Take 1440 desktop screenshot
  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/foundation` });
  await new Promise((r) => setTimeout(r, 1200));

  const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'foundation_desktop_1440.png'), Buffer.from(shot1440.result.data, 'base64'));
  console.log('✓ Captured screenshots/foundation_desktop_1440.png');

  // ─────────────────────────────────────────────────────────
  // MOBILE: 390x844 (Zero Horizontal Scroll & Code Scrolls Inside Tile)
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 6. Mobile 390x844 Browser Verification ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/foundation` });
  await new Promise((r) => setTimeout(r, 1500));

  const mobileCheck = await evaluate(`
    (function() {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;

      const codeEl = document.querySelector('pre.code');
      const codeScrollWidth = codeEl ? codeEl.scrollWidth : 0;
      const codeClientWidth = codeEl ? codeEl.clientWidth : 0;

      const tiles = Array.from(document.querySelectorAll('article[data-tile]'));
      const tileWidths = tiles.map(t => {
        const r = t.getBoundingClientRect();
        return {
          title: t.querySelector('h2')?.textContent || t.getAttribute('aria-label'),
          width: r.width,
          left: r.left,
          right: r.right,
        };
      });

      const overflowing = tileWidths.filter(t => t.right > docWidth + 2);

      return {
        docWidth,
        scrollWidth,
        bodyScrollWidth,
        hasHorizontalScroll: scrollWidth > docWidth || bodyScrollWidth > docWidth,
        overflowingCount: overflowing.length,
        tilesStackedInOneCol: tileWidths.every(t => t.width > docWidth - 48),
        codeScrollsInternally: codeScrollWidth > codeClientWidth,
        codeScrollWidth,
        codeClientWidth,
      };
    })()
  `);

  console.log('Mobile 390px evaluation:', mobileCheck);
  assert(!mobileCheck.hasHorizontalScroll, 'Mobile 390px has ZERO page-level horizontal scroll');
  assert(mobileCheck.overflowingCount === 0, 'No elements overflow 390px viewport');
  assert(mobileCheck.tilesStackedInOneCol, 'All bento tiles stack into 1 full-width column on 390px');
  assert(mobileCheck.codeScrollsInternally, 'TypeScript schema code block scrolls horizontally inside its tile container');

  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'foundation_mobile_390.png'), Buffer.from(shot390.result.data, 'base64'));
  console.log('✓ Captured screenshots/foundation_mobile_390.png');

  ws.close();
  chromeProcess.kill();
  server.close();
} catch (err) {
  console.error('Browser testing error:', err);
  fails++;
  try { chromeProcess.kill(); } catch {}
  try { server.close(); } catch {}
}

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passes + fails} | PASSES: ${passes} | FAILS: ${fails}`);
console.log(`========================================`);

if (fails > 0) {
  process.exit(1);
} else {
  console.log('\n✨ ALL PHASE P4 /FOUNDATION CHECKS PASSED PERFECTLY!\n');
}
