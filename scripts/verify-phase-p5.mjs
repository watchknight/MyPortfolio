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

console.log('=== PHASE P5 VERIFICATION: /RESUME ===\n');

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
// 1. Static HTML & Prerender Audit (/resume)
// ─────────────────────────────────────────────────────────────
console.log('--- 1. Static Prerendered HTML Audit (/resume) ---');
const resumeHtmlPath = path.join(distDir, 'resume/index.html');
assert(fs.existsSync(resumeHtmlPath), 'dist/resume/index.html exists');

const resumeHtml = fs.readFileSync(resumeHtmlPath, 'utf-8');

// Title & Meta
assert(resumeHtml.includes('Curriculum Vitae (Résumé) — Abdur Rahman Moayed'), 'Page contains authoritative title');

// Shared shell
assert(resumeHtml.includes('data-section="hero"'), 'main element has data-section="hero"');
assert(resumeHtml.includes('<div class="atmo" aria-hidden="true">'), 'Page contains .atmo layer');
assert(resumeHtml.includes('class="page__header') || resumeHtml.includes("class='page__header'"), 'Page renders PageHeader (.page__header)');
assert(resumeHtml.includes('Curriculum Vitae'), 'PageHeader contains title "Curriculum Vitae"');
assert(resumeHtml.includes('Verified engineering credentials, academic honors at East West University'), 'PageHeader contains intro copy');

// No eyebrow tags above candidate header
assert(!resumeHtml.includes('credentialPill'), 'No eyebrow pill on candidate header');
assert(!resumeHtml.includes('EWU CSE Undergraduate</span>'), 'Eyebrow text "EWU CSE Undergraduate" removed from candidate header');

// Layout & Rail markup
assert(resumeHtml.includes('resume-layout') || resumeHtml.includes('_resumeLayout_'), 'Page contains .resume-layout grid container');
assert(resumeHtml.includes('resume-rail') || resumeHtml.includes('_resumeRail_'), 'Page contains .resume-rail aside element');
assert(resumeHtml.includes('data-print="hide"'), 'Site chrome and rail have data-print="hide"');

// Rail Actions
assert(resumeHtml.includes('href="/resume.pdf"'), 'Rail contains "Download PDF" link to /resume.pdf');
assert(resumeHtml.includes('Download PDF'), 'Rail contains "Download PDF" text');
assert(resumeHtml.includes('Print Résumé'), 'Rail contains "Print Résumé" action');
assert(resumeHtml.includes('Copy email'), 'Rail contains "Copy email" action');

// Section Jump Links
assert(resumeHtml.includes('href="#summary"'), 'Rail contains jump link href="#summary"');
assert(resumeHtml.includes('href="#education"'), 'Rail contains jump link href="#education"');
assert(resumeHtml.includes('href="#projects"'), 'Rail contains jump link href="#projects"');
assert(resumeHtml.includes('href="#skills"'), 'Rail contains jump link href="#skills"');
assert(resumeHtml.includes('href="#honors"'), 'Rail contains jump link href="#honors"');

// Target section IDs in sheet
assert(resumeHtml.includes('id="summary"'), 'Sheet contains section id="summary"');
assert(resumeHtml.includes('id="education"'), 'Sheet contains section id="education"');
assert(resumeHtml.includes('id="projects"'), 'Sheet contains section id="projects"');
assert(resumeHtml.includes('id="skills"'), 'Sheet contains section id="skills"');
assert(resumeHtml.includes('id="honors"'), 'Sheet contains section id="honors"');

// Section headings in sentence case
assert(resumeHtml.includes('>Summary<'), 'Section heading "Summary" present');
assert(resumeHtml.includes('>Education<'), 'Section heading "Education" present');
assert(resumeHtml.includes('>Featured projects<'), 'Section heading "Featured projects" present in sentence case');
assert(resumeHtml.includes('>Technical skills<'), 'Section heading "Technical skills" present in sentence case');
assert(resumeHtml.includes('>Honors &amp; awards<') || resumeHtml.includes('>Honors & awards<'), 'Section heading "Honors & awards" present in sentence case');

// Candidate header copy
assert(resumeHtml.includes('Abdur Rahman Moayed'), 'Candidate name "Abdur Rahman Moayed" present');
assert(resumeHtml.includes('East West University'), 'Institution "East West University" present');
assert(resumeHtml.includes('armabdur.rahman04@gmail.com'), 'Email "armabdur.rahman04@gmail.com" present');
assert(resumeHtml.includes('github.com/watchknight'), 'GitHub handle present');

// Content Deduplication
const educationSlice = resumeHtml.split('id="education"')[1]?.split('id="projects"')[0] || '';
assert(educationSlice.includes('B.Sc. in Computer Science &amp; Engineering') || educationSlice.includes('B.Sc. in Computer Science & Engineering'), 'Education contains EWU B.Sc.');
assert(educationSlice.includes('Higher Secondary Certificate (HSC)'), 'Education contains HSC');
assert(educationSlice.includes('Secondary School Certificate (SSC / Class 10) &mdash; GPA 5.0') || educationSlice.includes('GPA 5.0'), 'Education contains SSC (GPA 5.0)');
assert(!educationSlice.includes('Junior School Certificate'), 'Education DOES NOT contain JSC (deduplicated)');
assert(!educationSlice.includes('Primary School Certificate'), 'Education DOES NOT contain PSC (deduplicated)');

const honorsSlice = resumeHtml.split('id="honors"')[1] || '';
assert(honorsSlice.includes('SSC Class 10 (2021)'), 'Honors contains SSC Class 10 (2021)');
assert(honorsSlice.includes('JSC Class 8 (2018)'), 'Honors contains JSC Class 8 (2018)');
assert(honorsSlice.includes('PSC Class 5 (2015)'), 'Honors contains PSC Class 5 (2015)');

// ─────────────────────────────────────────────────────────────
// 2. Color Contrast Ratios & CSS Tokens Verification
// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. Color Contrast Ratios & Tokens Verification ---');

function getLuminance(hex) {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const paperColor = '#F5F1E8';
const inkColor = '#0E1A36';
const ink2Color = '#46557A';

const primaryContrast = getContrastRatio(paperColor, inkColor);
const secondaryContrast = getContrastRatio(paperColor, ink2Color);

console.log(`  Paper color: ${paperColor}, Primary Ink: ${inkColor}, Secondary Ink: ${ink2Color}`);
console.log(`  Calculated primary ink contrast: ${primaryContrast.toFixed(2)}:1`);
console.log(`  Calculated secondary text contrast: ${secondaryContrast.toFixed(2)}:1`);

assert(primaryContrast >= 14.0, `Primary ink contrast ${primaryContrast.toFixed(2)}:1 is >= 14:1`);
assert(secondaryContrast >= 6.0, `Secondary text contrast ${secondaryContrast.toFixed(2)}:1 is >= 6:1`);

// Verify CSS source files for tokens and elevation
const tokensCss = fs.readFileSync(path.join(rootDir, 'src/styles/tokens.css'), 'utf-8');
assert(tokensCss.includes('--paper: #F5F1E8'), 'tokens.css defines --paper: #F5F1E8');
assert(tokensCss.includes('--ink: #0E1A36'), 'tokens.css defines --ink: #0E1A36');
assert(tokensCss.includes('--ink-2: #46557A'), 'tokens.css defines --ink-2: #46557A');

const resumeCss = fs.readFileSync(path.join(rootDir, 'src/pages/Resume/ResumePage.module.css'), 'utf-8');
assert(resumeCss.includes('0 30px 80px rgb(2 6 20 / 0.45)') || resumeCss.includes('0 30px 80px rgb(2 6 20 / .45)'), 'ResumePage.module.css defines physical elevation box-shadow');
assert(resumeCss.includes('minmax(0, 794px) 280px'), 'ResumePage.module.css defines two-column grid (minmax(0, 794px) 280px)');
assert(resumeCss.includes('top: 96px'), 'ResumePage.module.css defines sticky rail top: 96px');
assert(resumeCss.includes('font-variant-numeric: tabular-nums'), 'ResumePage.module.css defines tabular-nums');
assert(resumeCss.includes('size: A4') && resumeCss.includes('margin: 14mm'), 'ResumePage.module.css defines @page { size: A4; margin: 14mm; }');
assert(resumeCss.includes('break-after: avoid') && resumeCss.includes('break-inside: avoid'), 'ResumePage.module.css defines page-break guards');

// ─────────────────────────────────────────────────────────────
// 3. Headless Chrome Browser Verification (1440px & 390px)
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

const PORT = 4905;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-p5-' + Date.now());
const CDP_PORT = 9595;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/resume`,
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

  async function evaluate(expression, awaitPromise = true) {
    const res = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise,
    });
    return res?.result?.result?.value ?? res?.result?.value;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  // ─────────────────────────────────────────────────────────
  // DESKTOP: 1440x900
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 3. Desktop 1440x900 Layout & Physical Sheet Verification ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/resume` });
  await new Promise((r) => setTimeout(r, 1500));

  const desktopMetrics = await evaluate(`
    (function() {
      const layout = document.querySelector('.resume-layout');
      const rail = document.querySelector('.resume-rail');
      const sheet = document.querySelector('.resume-sheet');

      const layoutStyle = layout ? getComputedStyle(layout) : null;
      const railStyle = rail ? getComputedStyle(rail) : null;
      const sheetStyle = sheet ? getComputedStyle(sheet) : null;

      const layoutRect = layout ? layout.getBoundingClientRect() : null;
      const railRect = rail ? rail.getBoundingClientRect() : null;
      const sheetRect = sheet ? sheet.getBoundingClientRect() : null;

      return {
        gridDisplay: layoutStyle?.display,
        gridColumns: layoutStyle?.gridTemplateColumns,
        gap: layoutStyle?.gap,
        railPosition: railStyle?.position,
        railTop: railStyle?.top,
        railWidth: railRect?.width,
        sheetWidth: sheetRect?.width,
        sheetLeft: sheetRect?.left,
        railLeft: railRect?.left,
        sheetBg: sheetStyle?.backgroundColor,
        sheetColor: sheetStyle?.color,
        sheetBoxShadow: sheetStyle?.boxShadow,
      };
    })()
  `);

  console.log('Desktop 1440x900 Metrics:', desktopMetrics);
  assert(desktopMetrics.gridDisplay === 'grid', 'Layout uses CSS grid display');
  assert(desktopMetrics.railPosition === 'sticky', 'Rail has position: sticky');
  assert(desktopMetrics.railTop === '96px', 'Rail has top: 96px');
  assert(desktopMetrics.sheetLeft < desktopMetrics.railLeft, 'Sheet is in left column, Rail is in right column');
  assert(desktopMetrics.sheetWidth <= 795, `Sheet width (${desktopMetrics.sheetWidth}px) adheres to max 794px`);
  assert(desktopMetrics.sheetBg === 'rgb(245, 241, 232)', `Sheet background is bone #F5F1E8 (${desktopMetrics.sheetBg})`);
  assert(desktopMetrics.sheetColor === 'rgb(14, 26, 54)', `Sheet text color is ink #0E1A36 (${desktopMetrics.sheetColor})`);
  assert(desktopMetrics.sheetBoxShadow && desktopMetrics.sheetBoxShadow.includes('rgba(2, 6, 20'), 'Sheet has physical elevation shadow');

  const sheetFocusToken = await evaluate(`
    getComputedStyle(document.querySelector('.resume-sheet')).getPropertyValue('--focus').trim()
  `);
  console.log('Sheet Focus Token:', JSON.stringify(sheetFocusToken));
  assert(sheetFocusToken.toUpperCase() === '#0E1A36', 'Sheet defines accessible high-contrast --focus: #0E1A36 token');

  const railNavTitleStyle = await evaluate(`
    (function() {
      const el = document.querySelector('[class*="railNavTitle"]');
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        textTransform: s.textTransform,
        fontFamily: s.fontFamily,
      };
    })()
  `);
  console.log('Rail Nav Title Computed Style:', railNavTitleStyle);
  assert(railNavTitleStyle && railNavTitleStyle.textTransform !== 'uppercase', 'Rail Nav Title avoids tracked all-caps (text-transform is none)');
  assert(railNavTitleStyle && !railNavTitleStyle.fontFamily.toLowerCase().includes('mono'), 'Rail Nav Title uses sans/display font (not mono)');

  // Verify Fixed Colors in Light Mode
  console.log('\n--- 4. Theme Invariance: Bone Paper Sheet in Light Mode ---');
  await evaluate(`document.documentElement.setAttribute('data-theme', 'light')`);
  await new Promise((r) => setTimeout(r, 200));

  const lightThemeMetrics = await evaluate(`
    (function() {
      const sheet = document.querySelector('.resume-sheet');
      const sheetStyle = getComputedStyle(sheet);
      return {
        sheetBg: sheetStyle.backgroundColor,
        sheetColor: sheetStyle.color,
      };
    })()
  `);
  console.log('Light Mode Sheet Metrics:', lightThemeMetrics);
  assert(lightThemeMetrics.sheetBg === 'rgb(245, 241, 232)', 'Sheet remains #F5F1E8 in light mode');
  assert(lightThemeMetrics.sheetColor === 'rgb(14, 26, 54)', 'Sheet remains #0E1A36 in light mode');

  // Restore dark theme
  await evaluate(`document.documentElement.setAttribute('data-theme', 'dark')`);
  await new Promise((r) => setTimeout(r, 200));

  // Interactive Actions: Copy Email & Window.Print
  console.log('\n--- 5. Interactive Actions & Section Jump Navigation ---');

  await evaluate(`
    (function() {
      window.__copiedEmail = '';
      try {
        Object.defineProperty(navigator, 'clipboard', {
          value: {
            writeText: function(text) {
              window.__copiedEmail = text;
              return Promise.resolve();
            }
          },
          configurable: true,
          writable: true,
        });
      } catch {
        try {
          navigator.clipboard.writeText = function(text) {
            window.__copiedEmail = text;
            return Promise.resolve();
          };
        } catch {}
      }

      const copyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Copy email'));
      if (copyBtn) copyBtn.click();
    })()
  `);

  await new Promise((r) => setTimeout(r, 300));

  const copyTestResult = await evaluate(`
    (function() {
      const copyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('copied') || b.textContent.includes('Copy'));
      return {
        success: !!copyBtn,
        copiedText: window.__copiedEmail,
        buttonTextAfterClick: copyBtn ? copyBtn.textContent.trim() : '',
      };
    })()
  `);
  console.log('Copy Email Interaction:', copyTestResult);
  assert(copyTestResult.success, 'Copy email button exists and clicked');
  assert(copyTestResult.copiedText === 'armabdur.rahman04@gmail.com', 'Copied exact email armabdur.rahman04@gmail.com');
  assert(copyTestResult.buttonTextAfterClick.includes('copied'), 'Button reflects copied state');

  // Test fallback copy when navigator.clipboard.writeText rejects (insecure context or denied permission)
  const fallbackCopyResult = await evaluate(`
    (function() {
      let execCommandCopied = '';
      const origExec = document.execCommand;
      document.execCommand = function(cmd) {
        if (cmd === 'copy') {
          const ta = document.querySelector('textarea');
          execCommandCopied = ta ? ta.value : '';
        }
        return true;
      };

      // Mock writeText rejection
      navigator.clipboard.writeText = function() {
        return Promise.reject(new Error('Permission denied'));
      };

      const copyBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('copied') || b.textContent.includes('Copy'));
      if (copyBtn) copyBtn.click();

      return new Promise((res) => {
        setTimeout(() => {
          document.execCommand = origExec;
          res({
            fallbackSuccess: execCommandCopied === 'armabdur.rahman04@gmail.com',
            copiedValue: execCommandCopied,
          });
        }, 100);
      });
    })()
  `);
  console.log('Clipboard Fallback Result:', fallbackCopyResult);
  assert(fallbackCopyResult.fallbackSuccess, 'Fallback document.execCommand succeeds when clipboard.writeText rejects');

  // Verify Bullet List Markers
  const bulletCheck = await evaluate(`
    (function() {
      const list = document.querySelector('.bullet-list, ul[class*="bulletList"]');
      const li = list ? list.querySelector('li') : null;
      const listStyle = list ? getComputedStyle(list) : null;
      const liStyle = li ? getComputedStyle(li) : null;
      return {
        listFound: !!list,
        liDisplay: liStyle?.display,
        listStyleType: liStyle?.listStyleType || listStyle?.listStyleType,
      };
    })()
  `);
  console.log('Bullet List Check:', bulletCheck);
  assert(bulletCheck.listFound, 'Bullet list elements found in DOM');
  assert(bulletCheck.liDisplay === 'list-item', 'Bullet list item has display: list-item');
  assert(bulletCheck.listStyleType === 'disc', 'Bullet list items render disc markers (list-style-type: disc)');

  const printTestResult = await evaluate(`
    (function() {
      let printCalled = false;
      const originalPrint = window.print;
      window.print = function() { printCalled = true; };

      const printBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Print Résumé'));
      if (!printBtn) return { success: false, reason: 'Print Résumé button not found' };

      printBtn.click();
      window.print = originalPrint;
      return {
        success: true,
        printCalled,
      };
    })()
  `);
  console.log('Print Résumé Interaction:', printTestResult);
  assert(printTestResult.success, 'Print Résumé button exists and clicked');
  assert(printTestResult.printCalled, 'Print Résumé invokes window.print()');

  // Section Jump Links Test
  const jumpLinksResult = await evaluate(`
    (function() {
      const links = Array.from(document.querySelectorAll('aside nav a')).map(a => ({
        href: a.getAttribute('href'),
        text: a.textContent.trim(),
        targetFound: !!document.querySelector(a.getAttribute('href')),
      }));
      return links;
    })()
  `);
  console.log('Jump Links Target Check:', jumpLinksResult);
  assert(jumpLinksResult.length === 5, 'Rail contains exactly 5 section jump links');
  assert(jumpLinksResult.every(l => l.targetFound), 'Every jump link targets an existing section ID');

  const sectionsTabindex = await evaluate(`
    (function() {
      const sections = Array.from(document.querySelectorAll('.resume-sheet section'));
      return sections.length === 5 && sections.every(s => s.getAttribute('tabindex') === '-1');
    })()
  `);
  assert(sectionsTabindex, 'All 5 résumé sections have tabindex="-1" for accessible programmatic focus');

  const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'resume_desktop_1440.png'), Buffer.from(shot1440.result.data, 'base64'));
  console.log('✓ Captured screenshots/resume_desktop_1440.png');

  // ─────────────────────────────────────────────────────────
  // MOBILE: 390x844
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 6. Mobile 390x844 Single-Column Stacking ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/resume` });
  await new Promise((r) => setTimeout(r, 1500));

  const mobileMetrics = await evaluate(`
    (function() {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const header = document.querySelector('.page__header');
      const rail = document.querySelector('.resume-rail');
      const sheet = document.querySelector('.resume-sheet');

      const headerRect = header ? header.getBoundingClientRect() : null;
      const railRect = rail ? rail.getBoundingClientRect() : null;
      const sheetRect = sheet ? sheet.getBoundingClientRect() : null;

      return {
        docWidth,
        scrollWidth,
        hasHorizontalScroll: scrollWidth > docWidth,
        headerTop: headerRect?.top,
        railTop: railRect?.top,
        sheetTop: sheetRect?.top,
        railAboveSheet: railRect && sheetRect && railRect.top < sheetRect.top,
        sheetWidth: sheetRect?.width,
      };
    })()
  `);

  console.log('Mobile 390px Metrics:', mobileMetrics);
  assert(!mobileMetrics.hasHorizontalScroll, 'Mobile has ZERO horizontal scroll');
  assert(mobileMetrics.railAboveSheet, 'Rail sits ordered above the résumé sheet under the header');
  assert(mobileMetrics.sheetWidth > 320, 'Sheet renders full width on mobile');

  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'resume_mobile_390.png'), Buffer.from(shot390.result.data, 'base64'));
  console.log('✓ Captured screenshots/resume_mobile_390.png');

  // ─────────────────────────────────────────────────────────
  // 7. Pristine A4 Print Output Verification
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 7. Pristine A4 Print Output Verification ---');

  // Reset viewport to A4 standard dimensions before print emulation
  await send('Emulation.setDeviceMetricsOverride', {
    width: 794,
    height: 1123,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Emulate print media
  await send('Emulation.setEmulatedMedia', { media: 'print' });
  await new Promise((r) => setTimeout(r, 500));

  const printAudit = await evaluate(`
    (function() {
      const atmo = document.querySelector('.atmo');
      const cursorRing = document.querySelector('.cursor-ring');
      const cursorDot = document.querySelector('.cursor-dot');
      const nav = document.querySelector('nav:not(.resume-sheet nav)');
      const footer = document.querySelector('footer');
      const footerSection = document.querySelector('[class*="footerSection"]');
      const contactCard = document.querySelector('[class*="contactCard"]');
      const rail = document.querySelector('.resume-rail');
      const pageHeader = document.querySelector('[data-print="hide"]');
      const sheet = document.querySelector('.resume-sheet');

      const isHidden = (el) => !el || getComputedStyle(el).display === 'none';

      const sheetStyle = sheet ? getComputedStyle(sheet) : null;
      const h2 = document.querySelector('.resume-sheet h2');
      const h3 = document.querySelector('.resume-sheet h3');
      const li = document.querySelector('.resume-sheet li');
      const row = document.querySelector('.resume-sheet .row');

      const h2Style = h2 ? getComputedStyle(h2) : null;
      const h3Style = h3 ? getComputedStyle(h3) : null;
      const liStyle = li ? getComputedStyle(li) : null;
      const rowStyle = row ? getComputedStyle(row) : null;

      return {
        atmoHidden: isHidden(atmo),
        cursorRingHidden: isHidden(cursorRing),
        cursorDotHidden: isHidden(cursorDot),
        navHidden: isHidden(nav),
        footerHidden: isHidden(footer),
        footerSectionHidden: isHidden(footerSection),
        contactCardHidden: isHidden(contactCard),
        railHidden: isHidden(rail),
        pageHeaderHidden: isHidden(pageHeader),
        dialogHidden: isHidden(document.querySelector('dialog, [role="dialog"]')),
        sheetBg: sheetStyle?.backgroundColor,
        sheetColor: sheetStyle?.color,
        sheetBoxShadow: sheetStyle?.boxShadow,
        sheetBorderRadius: sheetStyle?.borderRadius,
        sheetPadding: sheetStyle?.padding,
        h2BreakAfter: h2Style?.breakAfter || h2Style?.pageBreakAfter,
        h3BreakAfter: h3Style?.breakAfter || h3Style?.pageBreakAfter,
        liBreakInside: liStyle?.breakInside || liStyle?.pageBreakInside,
        rowBreakInside: rowStyle?.breakInside || rowStyle?.pageBreakInside,
      };
    })()
  `);

  console.log('Print Audit Metrics:', printAudit);
  assert(printAudit.atmoHidden, 'Print: .atmo is hidden');
  assert(printAudit.navHidden, 'Print: nav is hidden');
  assert(printAudit.footerHidden, 'Print: footer is hidden');
  assert(printAudit.footerSectionHidden, 'Print: footerSection is hidden');
  assert(printAudit.contactCardHidden, 'Print: footer contactCard is hidden');
  assert(printAudit.railHidden, 'Print: .resume-rail is hidden');
  assert(printAudit.pageHeaderHidden, 'Print: [data-print="hide"] elements hidden');
  assert(printAudit.dialogHidden, 'Print: dialog / [role="dialog"] elements hidden');
  assert(printAudit.sheetBg === 'rgb(255, 255, 255)', 'Print: sheet renders pure white background (#ffffff)');
  assert(printAudit.sheetColor === 'rgb(0, 0, 0)', 'Print: sheet renders pure black ink (#000000)');
  assert(printAudit.sheetBoxShadow === 'none', 'Print: sheet has zero box-shadow');
  assert(printAudit.sheetBorderRadius === '0px', 'Print: sheet has zero border-radius');
  assert(printAudit.sheetPadding === '0px', 'Print: sheet has zero padding');
  assert(printAudit.h2BreakAfter === 'avoid', 'Print: h2 has break-after: avoid');
  assert(printAudit.h3BreakAfter === 'avoid', 'Print: h3 has break-after: avoid');
  assert(printAudit.liBreakInside === 'avoid', 'Print: li has break-inside: avoid');
  assert(printAudit.rowBreakInside === 'avoid', 'Print: .row has break-inside: avoid');

  // Generate A4 PDF via CDP and verify page count (target: exactly 1 to 2 pages)
  const pdfResult = await send('Page.printToPDF', {
    paperWidth: 8.27,  // A4 width in inches
    paperHeight: 11.69, // A4 height in inches
    marginTop: 0.55,    // 14mm in inches
    marginBottom: 0.55,
    marginLeft: 0.55,
    marginRight: 0.55,
    printBackground: true,
  });

  const pdfBuffer = Buffer.from(pdfResult.result.data, 'base64');
  const pdfString = pdfBuffer.toString('binary');
  // Count pages in PDF: match /Type /Page (excluding /Type /Pages)
  const pageMatches = pdfString.match(/\/Type\s*\/Page\b/g);
  const pdfPageCount = pageMatches ? pageMatches.length : 1;

  console.log(`  Generated A4 PDF: ${pdfBuffer.length} bytes, Page Count: ${pdfPageCount}`);
  assert(pdfPageCount >= 1 && pdfPageCount <= 2, `PDF output is exactly 1-2 A4 pages (actual: ${pdfPageCount})`);

  const printPreviewShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'resume_print_preview.png'), Buffer.from(printPreviewShot.result.data, 'base64'));
  console.log('✓ Captured screenshots/resume_print_preview.png');

  // Restore screen media
  await send('Emulation.setEmulatedMedia', { media: '' });

  ws.close();
  chromeProcess.kill();
  server.close();
} catch (err) {
  console.error('Browser testing error:', err);
  fails++;
  try {
    chromeProcess.kill();
  } catch {}
  try {
    server.close();
  } catch {}
}

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passes + fails} | PASSES: ${passes} | FAILS: ${fails}`);
console.log(`========================================`);

if (fails > 0) {
  process.exit(1);
} else {
  console.log('\n✨ ALL PHASE P5 /RESUME CHECKS PASSED PERFECTLY!\n');
}
