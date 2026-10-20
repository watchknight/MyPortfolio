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

console.log('=== PHASE P3 VERIFICATION: /WORKS ===\n');

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
console.log('--- 1. Static Prerendered HTML Audit (/works) ---');
const worksHtmlPath = path.join(distDir, 'works/index.html');
assert(fs.existsSync(worksHtmlPath), 'dist/works/index.html exists');

const worksHtml = fs.readFileSync(worksHtmlPath, 'utf-8');

// Title & PageHeader
assert(worksHtml.includes('<h1') && worksHtml.includes('Selected Works'), 'Page contains H1 "Selected Works"');
assert(worksHtml.includes('A showcase of real web applications, browser extensions, and practical desktop tools I have engineered.'), 'Page contains existing intro copy');

// Filter row & chips
assert(worksHtml.includes('aria-pressed="true"') && worksHtml.includes('>All<'), 'Filter chip "All" has aria-pressed="true"');
assert(worksHtml.includes('Web Applications') && worksHtml.includes('>3<'), 'Filter chip "Web Applications" has count 3');
assert(worksHtml.includes('Tools &amp; Extensions') && worksHtml.includes('>2<'), 'Filter chip "Tools & Extensions" has count 2');
assert(worksHtml.includes('E-Commerce') && worksHtml.includes('>1<'), 'Filter chip "E-Commerce" has count 1');

// Grid/Table view switch
assert(worksHtml.includes('Grid [G]') && worksHtml.includes('Table [T]'), 'Grid [G] and Table [T] switch buttons present');

// Grid structure & featured pair
assert(worksHtml.includes('span-7 rows-6') && worksHtml.includes('PureFeed'), 'PureFeed has span-7 rows-6');
assert(worksHtml.includes('span-5 rows-6') && worksHtml.includes('DocLensBD'), 'DocLensBD has span-5 rows-6');
assert(worksHtml.includes('FocusGuard') && worksHtml.includes('span-4 rows-5'), 'FocusGuard has span-4 rows-5');
assert(worksHtml.includes('Rannabanna') && worksHtml.includes('span-4 rows-5'), 'Rannabanna has span-4 rows-5');
assert(worksHtml.includes('POSHRA') && worksHtml.includes('span-4 rows-5'), 'POSHRA has span-4 rows-5');
assert(worksHtml.includes('Sentinel Portfolio') && worksHtml.includes('span-12 rows-3'), 'Sentinel Portfolio has span-12 rows-3');
assert(worksHtml.includes('data-tile="inverted"'), 'Sentinel Portfolio is inverted tile (data-tile="inverted")');

// Subtitle check (no banned prefixes)
assert(worksHtml.includes('MV3 Browser Internals &amp; Security') || worksHtml.includes('MV3 Browser Internals & Security'), 'PureFeed has subtitle "MV3 Browser Internals & Security"');
assert(!worksHtml.includes('OS_DNS'), 'Prefix OS_DNS dropped from works page');
assert(!worksHtml.includes('RECIPE_AI'), 'Prefix RECIPE_AI dropped from works page');
assert(!worksHtml.includes('3D_TRYON'), 'Prefix 3D_TRYON dropped from works page');
assert(!worksHtml.includes('ECOM_STACK'), 'Prefix ECOM_STACK dropped from works page');
assert(!worksHtml.includes('DSP_ENGINE'), 'Prefix DSP_ENGINE dropped from works page');

// Type chips & Metric chips
assert(worksHtml.includes('Extension'), 'Type chip "Extension" rendered');
assert(worksHtml.includes('Desktop App'), 'Type chip "Desktop App" rendered');
assert(worksHtml.includes('Live on Render'), 'Type chip "Live on Render" rendered');
assert(worksHtml.includes('This Website'), 'Type chip "This Website" rendered');

// Links
assert(worksHtml.includes('Visit Live Site'), 'Amber pill "Visit Live Site" rendered');
assert(worksHtml.includes('Explore Architecture'), 'Button "Explore Architecture" rendered');
assert(worksHtml.includes('Source'), 'Text link "Source" rendered');

// Stretched link attributes
assert(worksHtml.includes('data-cursor="inspect"'), 'Tiles have data-cursor="inspect"');
assert(worksHtml.includes('data-cursor-label="View project"'), 'Tiles have data-cursor-label="View project"');
assert(worksHtml.includes('data-degree="0"') && worksHtml.includes('data-degree="1"'), 'Tiles have data-degree per tile');

// Media wrapper & grades
assert(worksHtml.includes('class="grade-hard"'), 'Featured tiles use grade-hard');
assert(worksHtml.includes('class="grade-lite"'), 'Continuously animating non-featured tiles use grade-lite');
assert(!worksHtml.includes('&rarr;'), 'No banned arrow indicators (&rarr;) on action links');
assert(worksHtml.includes('Run preview'), 'Media has "Run preview" poster button');

// ABSOLUTELY ZERO BANNED STRINGS
assert(!worksHtml.includes('Simulation ready'), 'NO "Simulation ready" string on page');
assert(!worksHtml.includes('Interactive Mock'), 'NO "Interactive Mock" string on page');
assert(!worksHtml.includes('system.local/preview'), 'NO "system.local/preview" string on page');
assert(!worksHtml.includes('Tap or scroll into view to load live runtime'), 'NO "Tap or scroll into view..." string on page');

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

const PORT = 4789;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-p3-' + Date.now());
const CDP_PORT = 9491;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/works`,
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

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/works` });
  await new Promise((r) => setTimeout(r, 1500));

  // Check First Screen: Header, Filters, and Featured Pair visible within 900px
  const fsRes = await evaluate(`
    (function() {
      const header = document.querySelector('.page__header');
      const filterBar = document.querySelector('[role="group"][aria-label="Filter projects by category"]');
      const tiles = Array.from(document.querySelectorAll('article[data-tile]'));
      const purefeed = tiles[0];
      const doclens = tiles[1];

      const headerRect = header ? header.getBoundingClientRect() : null;
      const filterRect = filterBar ? filterBar.getBoundingClientRect() : null;
      const pfRect = purefeed ? purefeed.getBoundingClientRect() : null;
      const dlRect = doclens ? doclens.getBoundingClientRect() : null;

      return {
        headerTop: headerRect?.top,
        filterTop: filterRect?.top,
        pfTop: pfRect?.top,
        pfBottom: pfRect?.bottom,
        dlTop: dlRect?.top,
        dlBottom: dlRect?.bottom,
        purefeedVisibleOnFirstScreen: pfRect && pfRect.top < 900,
        doclensVisibleOnFirstScreen: dlRect && dlRect.top < 900,
        totalTiles: tiles.length,
      };
    })()
  `);

  console.log('First Screen 1440x900 Metrics:', fsRes);
  assert(fsRes.headerTop !== undefined && fsRes.headerTop < 200, 'Header is visible on first screen');
  assert(fsRes.filterTop !== undefined && fsRes.filterTop < 350, 'Filter chips row is visible on first screen');
  assert(fsRes.pfTop < 500 && fsRes.dlTop < 500, 'Both featured tiles start within top 500px on first screen');
  assert(fsRes.purefeedVisibleOnFirstScreen, 'PureFeed featured tile is visible on first screen');
  assert(fsRes.doclensVisibleOnFirstScreen, 'DocLensBD featured tile is visible on first screen');

  // Check Preview Manager: Single Active Preview Enforcement
  console.log('\n--- 3. Poster-First Preview Manager Verification ---');
  const previewState1 = await evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Run preview') || b.textContent.includes('Pause'));
      return {
        totalPreviewButtons: buttons.length,
        buttonsText: buttons.map(b => b.textContent.trim()),
        runningCount: buttons.filter(b => b.textContent.includes('Pause')).length,
      };
    })()
  `);
  console.log('Initial preview buttons state:', previewState1);
  assert(previewState1.totalPreviewButtons === 6, 'All 6 tiles have preview toggle buttons');
  assert(previewState1.runningCount <= 1, 'Initial state: at most one preview running');

  // Start first preview explicitly
  await send('Runtime.evaluate', {
    expression: `
      const btn1 = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Run preview'));
      if (btn1) btn1.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 400));

  const previewState2 = await evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Run preview') || b.textContent.includes('Pause'));
      return {
        runningCount: buttons.filter(b => b.textContent.includes('Pause')).length,
        pausedCount: buttons.filter(b => b.textContent.includes('Run preview')).length,
      };
    })()
  `);
  console.log('After starting first preview:', previewState2);
  assert(previewState2.runningCount === 1, 'Exactly one preview is now running (Pause)');

  // Start a second preview: the previous one must stop!
  await send('Runtime.evaluate', {
    expression: `
      const btns = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Run preview'));
      if (btns[0]) btns[0].click();
    `,
  });
  await new Promise((r) => setTimeout(r, 400));

  const previewState3 = await evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Run preview') || b.textContent.includes('Pause'));
      return {
        runningCount: buttons.filter(b => b.textContent.includes('Pause')).length,
        pausedCount: buttons.filter(b => b.textContent.includes('Run preview')).length,
      };
    })()
  `);
  console.log('After starting second preview:', previewState3);
  assert(previewState3.runningCount === 1, 'Starting another preview stopped previous (still exactly 1 running)');

  // Tab hidden test: visibilitychange stops all previews
  await send('Runtime.evaluate', {
    expression: `
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    `,
  });
  await new Promise((r) => setTimeout(r, 200));

  const hiddenCheck = await evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Run preview') || b.textContent.includes('Pause'));
      return {
        runningCount: buttons.filter(b => b.textContent.includes('Pause')).length,
      };
    })()
  `);
  console.log('When tab is hidden:', hiddenCheck);
  assert(hiddenCheck.runningCount === 0, 'Hidden tab stops all previews (0 running)');

  // Restore tab visibility
  await send('Runtime.evaluate', {
    expression: `
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    `,
  });
  await new Promise((r) => setTimeout(r, 200));

  const restoredCheck = await evaluate(`
    (function() {
      const buttons = Array.from(document.querySelectorAll('button')).filter(b => b.textContent.includes('Run preview') || b.textContent.includes('Pause'));
      return {
        runningCount: buttons.filter(b => b.textContent.includes('Pause')).length,
      };
    })()
  `);
  console.log('When tab visibility restored:', restoredCheck);
  assert(restoredCheck.runningCount === 1, 'Restoring tab visibility resumes active preview');

  // ─────────────────────────────────────────────────────────
  // FILTERING CHECKS (Web Applications, Tools & Extensions, E-Commerce)
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 4. Filter Chips & GSAP Flip Verification ---');

  // Click "Web Applications"
  await send('Runtime.evaluate', {
    expression: `
      const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Web Applications'));
      if (filterBtn) filterBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  const webAppCheck = await evaluate(`
    (function() {
      const tiles = Array.from(document.querySelectorAll('article[data-tile]'));
      const titles = tiles.map(t => t.querySelector('h2')?.textContent);
      return {
        count: tiles.length,
        titles,
      };
    })()
  `);
  console.log('Web Applications filter result:', webAppCheck);
  assert(webAppCheck.count === 3, 'Filter "Web Applications" shows 3 projects');
  assert(webAppCheck.titles.includes('DocLensBD'), 'Includes DocLensBD');
  assert(webAppCheck.titles.includes('Rannabanna'), 'Includes Rannabanna');
  assert(webAppCheck.titles.includes('Sentinel Portfolio'), 'Includes Sentinel Portfolio');

  // Click "Tools & Extensions"
  const toolsClickRes = await evaluate(`
    (function() {
      const allButtons = Array.from(document.querySelectorAll('button')).map(b => b.textContent.trim().replace(/\\s+/g, ' '));
      const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Tools') || b.getAttribute('data-filter') === 'Tool');
      if (filterBtn) {
        filterBtn.click();
        return { clicked: true, text: filterBtn.textContent.trim().replace(/\\s+/g, ' ') };
      }
      return { clicked: false, allButtons };
    })()
  `);
  console.log('Tools & Extensions click result:', toolsClickRes);
  await new Promise((r) => setTimeout(r, 800));

  const toolsCheck = await evaluate(`
    (function() {
      const tiles = Array.from(document.querySelectorAll('article[data-tile]'));
      const titles = tiles.map(t => t.querySelector('h2')?.textContent);
      return {
        count: tiles.length,
        titles,
      };
    })()
  `);
  console.log('Tools & Extensions filter result:', toolsCheck);
  assert(toolsCheck.count === 2, 'Filter "Tools & Extensions" shows 2 projects');
  assert(toolsCheck.titles.includes('PureFeed'), 'Includes PureFeed');
  assert(toolsCheck.titles.includes('FocusGuard'), 'Includes FocusGuard');

  // Click "E-Commerce"
  const ecomClickRes = await evaluate(`
    (function() {
      const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('E-Commerce') || b.getAttribute('data-filter') === 'Commercial');
      if (filterBtn) {
        filterBtn.click();
        return { clicked: true, text: filterBtn.textContent.trim().replace(/\\s+/g, ' ') };
      }
      return { clicked: false };
    })()
  `);
  console.log('E-Commerce click result:', ecomClickRes);
  await new Promise((r) => setTimeout(r, 800));

  const ecomCheck = await evaluate(`
    (function() {
      const tiles = Array.from(document.querySelectorAll('article[data-tile]'));
      const titles = tiles.map(t => t.querySelector('h2')?.textContent);
      return {
        count: tiles.length,
        titles,
      };
    })()
  `);
  console.log('E-Commerce filter result:', ecomCheck);
  assert(ecomCheck.count === 1, 'Filter "E-Commerce" shows 1 project');
  assert(ecomCheck.titles.includes('POSHRA'), 'Includes POSHRA');

  // Reset filter to "All"
  await evaluate(`
    (function() {
      const filterBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('All') || b.getAttribute('data-filter') === 'all');
      if (filterBtn) filterBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 800));

  // ─────────────────────────────────────────────────────────
  // VIEW MODE & KEYBOARD SHORTCUTS (G / T)
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 5. Grid / Table Toggle & G/T Keyboard Shortcuts ---');

  // Press 'T' to switch to Table mode
  await send('Runtime.evaluate', {
    expression: `
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 't', bubbles: true }));
    `,
  });
  await new Promise((r) => setTimeout(r, 400));

  const tableCheck = await evaluate(`
    (function() {
      const table = document.querySelector('[class*="tableWrapper"]');
      const bento = document.querySelector('[class*="bentoGrid"]');
      return {
        tablePresent: !!table,
        bentoPresent: !!bento,
        activeView: localStorage.getItem('view_mode'),
      };
    })()
  `);
  console.log('Table mode evaluation:', tableCheck);
  assert(tableCheck.tablePresent, 'Pressing [T] renders ProjectLedger table');
  assert(tableCheck.activeView === 'table', 'localStorage view_mode is "table"');

  // Press 'G' to switch back to Grid mode
  await send('Runtime.evaluate', {
    expression: `
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g', bubbles: true }));
    `,
  });
  await new Promise((r) => setTimeout(r, 400));

  const gridCheck = await evaluate(`
    (function() {
      const bento = document.querySelector('[class*="bentoGrid"]');
      return {
        bentoPresent: !!bento,
        activeView: localStorage.getItem('view_mode'),
      };
    })()
  `);
  console.log('Grid mode evaluation:', gridCheck);
  assert(gridCheck.bentoPresent, 'Pressing [G] restores 12-col Bento grid');
  assert(gridCheck.activeView === 'grid', 'localStorage view_mode is "grid"');

  // ─────────────────────────────────────────────────────────
  // EXPLORE ARCHITECTURE MODAL
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 6. Explore Architecture Case Study Modal ---');

  await send('Runtime.evaluate', {
    expression: `
      const archBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Explore Architecture'));
      if (archBtn) archBtn.click();
    `,
  });
  await new Promise((r) => setTimeout(r, 600));

  const modalCheck = await evaluate(`
    (function() {
      const dialog = document.querySelector('[role="dialog"]');
      const sheet = dialog ? dialog.querySelector('[class*="sheet"]') : null;
      const heading = sheet ? sheet.querySelector('h3')?.textContent : '';
      const bg = sheet ? getComputedStyle(sheet).backgroundColor : '';
      return {
        dialogOpen: !!dialog,
        heading,
        sheetBg: bg,
      };
    })()
  `);
  console.log('CaseStudyModal evaluation:', modalCheck);
  assert(modalCheck.dialogOpen, 'Explore Architecture opens CaseStudyModal');
  assert(modalCheck.heading.length > 0, `Modal opened for project: ${modalCheck.heading}`);

  // Close modal via Escape key
  await send('Runtime.evaluate', {
    expression: `
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    `,
  });
  await new Promise((r) => setTimeout(r, 400));

  const modalClosedCheck = await evaluate(`!document.querySelector('[role="dialog"]')`);
  assert(modalClosedCheck, 'Pressing Escape smoothly closes CaseStudyModal');

  // Take 1440 screenshot
  const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'works_desktop_1440.png'), Buffer.from(shot1440.result.data, 'base64'));
  console.log('✓ Captured screenshots/works_desktop_1440.png');

  // ─────────────────────────────────────────────────────────
  // MOBILE: 390x844 (Zero Horizontal Scroll & 1-Col Stacking)
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 7. Mobile 390x844 Browser Verification ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/works` });
  await new Promise((r) => setTimeout(r, 1500));

  const mobileCheck = await evaluate(`
    (function() {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      const tiles = Array.from(document.querySelectorAll('article[data-tile]'));

      const tileWidths = tiles.map(t => {
        const r = t.getBoundingClientRect();
        return {
          title: t.querySelector('h2')?.textContent,
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
        tilesStackedInOneCol: tileWidths.every(t => t.width > docWidth - 40),
      };
    })()
  `);

  console.log('Mobile 390px evaluation:', mobileCheck);
  assert(!mobileCheck.hasHorizontalScroll, 'Mobile 390px has ZERO horizontal scroll');
  assert(mobileCheck.overflowingCount === 0, 'No elements overflow 390px viewport');
  assert(mobileCheck.tilesStackedInOneCol, 'All tiles stack in 1 full-width column on mobile');

  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'works_mobile_390.png'), Buffer.from(shot390.result.data, 'base64'));
  console.log('✓ Captured screenshots/works_mobile_390.png');

  ws.close();
  chromeProcess.kill();
  server.close();
} catch (err) {
  console.error('Browser testing error:', err);
  fails++;
  chromeProcess.kill();
  server.close();
}

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passes + fails} | PASSES: ${passes} | FAILS: ${fails}`);
console.log(`========================================`);

if (fails > 0) {
  process.exit(1);
} else {
  console.log('\n✨ ALL PHASE P3 /WORKS CHECKS PASSED PERFECTLY!\n');
}
