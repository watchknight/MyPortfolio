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

console.log('=== PHASE P6 VERIFICATION: /CONTACT ===\n');

let passes = 0;
let fails = 0;

function assert(condition, message, details = '') {
  if (condition) {
    console.log(`  ✓ PASS: ${message}${details ? ` (${details})` : ''}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${message}${details ? ` (${details})` : ''}`);
    fails++;
  }
}

// ─────────────────────────────────────────────────────────────
// 1. Static HTML & Prerender Audit (/contact)
// ─────────────────────────────────────────────────────────────
console.log('--- 1. Static Prerendered HTML Audit (/contact) ---');
const contactHtmlPath = path.join(distDir, 'contact/index.html');
assert(fs.existsSync(contactHtmlPath), 'dist/contact/index.html exists');

const contactHtml = fs.readFileSync(contactHtmlPath, 'utf-8');

// Header and Meta
assert(contactHtml.includes('Get in Touch &amp; Direct Contact — Abdur Rahman Moayed') || contactHtml.includes('Get in Touch & Direct Contact'), 'Page contains authoritative title');
assert(contactHtml.includes('<h1') && contactHtml.includes('Get in Touch'), 'Page contains H1 "Get in Touch"');
assert(
  contactHtml.includes('Have a software project, an internship opportunity, or want to connect? Feel free to send me a message or email me directly.'),
  'Page contains existing intro copy'
);

// Shared shell
assert(contactHtml.includes('data-section="contact"'), 'main element has data-section="contact"');
assert(contactHtml.includes('<div class="atmo" aria-hidden="true">'), 'Page contains .atmo layer');
assert(contactHtml.includes('class="page__header') || contactHtml.includes("class='page__header'"), 'Page renders PageHeader (.page__header)');

// No footer CTA band on contact page
assert(!contactHtml.includes('Interested in working together?'), 'Footer CTA heading is omitted on /contact');
assert(!contactHtml.includes('class="_contactCard_'), 'Footer CTA card element is omitted on /contact');

// Bento Grid & Tiles classes
assert(contactHtml.includes('span-5 rows-3'), 'Availability tile has span-5 rows-3');
assert(contactHtml.includes('span-5 rows-2'), 'Tiles have span-5 rows-2');
assert(contactHtml.includes('span-7 rows-9'), 'Form tile has span-7 rows-9');
assert(contactHtml.includes('data-tile="accent"'), 'Availability tile uses data-tile="accent"');
assert(contactHtml.includes('data-tile="surface"'), 'Direct email, time, and form tiles use data-tile="surface"');
assert(contactHtml.includes('data-tile="inverted"'), 'Links tile uses data-tile="inverted"');

// Tile contents
assert(contactHtml.includes('Open for Internships &amp; Freelance Projects') || contactHtml.includes('Open for Internships & Freelance Projects'), 'Availability tile contains "Open for Internships & Freelance Projects"');
assert(contactHtml.includes('Typically respond within 24 hours.'), 'Availability tile contains "Typically respond within 24 hours."');
assert(contactHtml.includes('armabdur.rahman04@gmail.com'), 'Direct email tile contains email address');
assert(contactHtml.includes('Copy email'), 'Direct email tile contains Copy email button');
assert(contactHtml.includes('Dhaka, Bangladesh (UTC+6)'), 'Local time tile contains "Dhaka, Bangladesh (UTC+6)"');
assert(contactHtml.includes('Local Time'), 'Local time tile contains "Local Time"');
assert(contactHtml.includes('https://github.com/watchknight'), 'Links tile contains GitHub URL');
assert(contactHtml.includes('/resume.pdf'), 'Links tile contains Download CV link');
assert(contactHtml.includes('https://linkedin.com/in/abdur-rahman-moayed-9225b5389'), 'Links tile contains LinkedIn URL');

// Form elements
assert(contactHtml.includes('Your Name'), 'Form contains label "Your Name"');
assert(contactHtml.includes('Your Email'), 'Form contains label "Your Email"');
assert(contactHtml.includes('Subject (Optional)'), 'Form contains label "Subject (Optional)"');
assert(contactHtml.includes('Message'), 'Form contains label "Message"');
assert(contactHtml.includes('Draft &amp; Send Message') || contactHtml.includes('Draft & Send Message'), 'Form contains submit button "Draft & Send Message"');
assert(contactHtml.includes('Opens your email app with the message filled in.'), 'Form contains muted line under submit button');

// ─────────────────────────────────────────────────────────────
// 2. CSS Rules & Contract Verification
// ─────────────────────────────────────────────────────────────
console.log('\n--- 2. CSS Rules & Contract Verification ---');
const globalCss = fs.readFileSync(path.join(rootDir, 'src/styles/global.css'), 'utf-8');
const contactModuleCss = fs.readFileSync(path.join(rootDir, 'src/pages/Contact/ContactPage.module.css'), 'utf-8');

assert(globalCss.includes('.field { display: grid; gap: 6px; }'), 'global.css defines .field { display: grid; gap: 6px; }');
assert(globalCss.includes('.field label { font-size: var(--fs-small); color: var(--muted); }'), 'global.css defines .field label rule');
assert(globalCss.includes('.field :is(input, textarea) {'), 'global.css defines .field :is(input, textarea) rule');
assert(globalCss.includes('min-height: 48px;'), 'global.css defines min-height: 48px for input/textarea');
assert(globalCss.includes('max(16px, 1rem)'), 'global.css defines max(16px, 1rem) font-size');
assert(globalCss.includes('.field textarea { min-height: 160px; resize: vertical; }'), 'global.css defines textarea min-height: 160px');
assert(globalCss.includes('.field :is(input, textarea):focus-visible'), 'global.css defines focus-visible rule');
assert(globalCss.includes('.field [aria-invalid="true"]'), 'global.css defines aria-invalid rule');
assert(globalCss.includes('.field .error'), 'global.css defines .field .error rule');

assert(contactModuleCss.includes('.field { display: grid; gap: 6px; }'), 'ContactPage.module.css defines .field');
assert(contactModuleCss.includes('--r-xl'), 'ContactPage.module.css uses --r-xl for form card');
assert(contactModuleCss.includes('6 / 13'), 'ContactPage.module.css positions form tile in cols 6-12 on desktop');
assert(contactModuleCss.includes('1 / 10'), 'ContactPage.module.css spans form tile 9 rows on desktop');

// Contract: Eliminate banned uppercase mono eyebrow labels from UI
assert(!contactModuleCss.includes('.tileKicker'), 'ContactPage.module.css eliminates .tileKicker eyebrow');
assert(!contactModuleCss.includes('.availabilityStatus'), 'ContactPage.module.css eliminates .availabilityStatus uppercase tracking');
assert(!contactModuleCss.includes('.linksKicker'), 'ContactPage.module.css eliminates .linksKicker eyebrow');
assert(!contactHtml.includes('Direct Links'), 'Prerendered HTML eliminates tracked "Direct Links" kicker');

// ─────────────────────────────────────────────────────────────
// 3. Headless Chrome Browser Verification (1440px & 390px)
// ─────────────────────────────────────────────────────────────
console.log('\n--- 3. Headless Chrome Verification ---');

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

const PORT = 4906;
await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(os.tmpdir(), '.chrome-temp-p6-' + Date.now());
const CDP_PORT = 9596;

const chromeProcess = spawn(chromePath, [
  '--headless=new',
  `--remote-debugging-port=${CDP_PORT}`,
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + tempProfile,
  `http://127.0.0.1:${PORT}/contact`,
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
  console.log('\n--- 4. Desktop 1440x900 Layout & Form Verification ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/contact` });
  await new Promise((r) => setTimeout(r, 1500));

  const desktopAudit = await evaluate(`
    (function() {
      const grid = document.querySelector('.bento');
      const availTile = document.querySelector('[data-tile="accent"]');
      const formTile = document.querySelector('article[class*="formTile"]');
      const emailTile = document.querySelector('[class*="emailTile"]');
      const timeTile = document.querySelector('[class*="timeTile"]');
      const linksTile = document.querySelector('[class*="linksTile"]');

      const availRect = availTile ? availTile.getBoundingClientRect() : null;
      const formRect = formTile ? formTile.getBoundingClientRect() : null;
      const emailRect = emailTile ? emailTile.getBoundingClientRect() : null;
      const timeRect = timeTile ? timeTile.getBoundingClientRect() : null;
      const linksRect = linksTile ? linksTile.getBoundingClientRect() : null;

      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const subjectInput = document.getElementById('contact-subject');
      const messageInput = document.getElementById('contact-message');
      const submitBtn = document.querySelector('button[type="submit"]');

      const nameRect = nameInput ? nameInput.getBoundingClientRect() : null;
      const emailInputRect = emailInput ? emailInput.getBoundingClientRect() : null;
      const messageRect = messageInput ? messageInput.getBoundingClientRect() : null;
      const submitRect = submitBtn ? submitBtn.getBoundingClientRect() : null;

      const nameStyle = nameInput ? getComputedStyle(nameInput) : null;
      const messageStyle = messageInput ? getComputedStyle(messageInput) : null;
      const submitStyle = submitBtn ? getComputedStyle(submitBtn) : null;

      const copyEmailBtn = document.querySelector('button[class*="copyBtn"]');

      return {
        gridDisplay: grid ? getComputedStyle(grid).display : '',
        availLeft: availRect?.left,
        formLeft: formRect?.left,
        formOnRight: formRect && availRect && formRect.left > availRect.left,
        nameEmailSideBySide: nameRect && emailInputRect && Math.abs(nameRect.top - emailInputRect.top) < 5,
        nameHeight: nameRect?.height,
        nameFontSize: parseFloat(nameStyle?.fontSize || '0'),
        messageHeight: messageRect?.height,
        submitHeight: submitRect?.height,
        submitBg: submitStyle?.backgroundColor,
        submitRadius: submitStyle?.borderRadius,
        formRadius: formTile ? getComputedStyle(formTile).borderRadius : '',
        copyEmailBtnText: copyEmailBtn ? copyEmailBtn.innerText.trim() : '',
        copyEmailAriaLive: copyEmailBtn ? copyEmailBtn.getAttribute('aria-live') : '',
        hasMagnetic: submitBtn ? submitBtn.getAttribute('data-magnetic') : '',
      };
    })()
  `);

  console.log('Desktop 1440px Audit:', desktopAudit);
  assert(desktopAudit.gridDisplay === 'grid', 'Contact layout uses CSS grid');
  assert(desktopAudit.formOnRight, 'Form tile is positioned in the right column');
  assert(desktopAudit.nameEmailSideBySide, 'Name and Email fields sit side by side on desktop');
  assert(desktopAudit.nameHeight >= 48, `Input height (${desktopAudit.nameHeight}px) is >= 48px`);
  assert(desktopAudit.nameFontSize >= 16, `Input font-size (${desktopAudit.nameFontSize}px) is >= 16px`);
  assert(desktopAudit.messageHeight >= 160, `Message textarea height (${desktopAudit.messageHeight}px) is >= 160px`);
  assert(desktopAudit.submitHeight >= 48, `Submit button height (${desktopAudit.submitHeight}px) is >= 48px`);
  assert(desktopAudit.submitRadius === '999px', 'Submit button has pill radius (999px)');
  assert(desktopAudit.formRadius === '28px', 'Form tile has --r-xl radius (28px)');
  assert(desktopAudit.copyEmailAriaLive === 'polite', 'Copy email button has aria-live="polite"');
  assert(Boolean(desktopAudit.hasMagnetic), 'Submit button has data-magnetic');

  // Test Copy Email Interaction
  console.log('\n--- 5. Copy Email Interaction & Audio Feedback ---');
  await evaluate(`
    (function() {
      const btn = document.querySelector('button[class*="copyBtn"]');
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  const copyResult = await evaluate(`
    (function() {
      const btn = document.querySelector('button[class*="copyBtn"]');
      return {
        clicked: Boolean(btn),
        textImmediately: btn ? btn.innerText.trim() : '',
        hasCopiedClass: btn ? btn.classList.contains('btn-copied') : false,
      };
    })()
  `);
  console.log('Copy Email Click Result:', copyResult);
  assert(copyResult.clicked, 'Copy email button exists and was clicked');
  assert(copyResult.textImmediately.includes('Copied'), 'Button text swapped to "Copied" immediately');
  assert(copyResult.hasCopiedClass, 'Button has .btn-copied class applied');

  // Test 1.6s Reversion
  await new Promise((r) => setTimeout(r, 1800));
  const copyReverted = await evaluate(`
    (function() {
      const btn = document.querySelector('button[class*="copyBtn"]');
      return btn ? btn.innerText.trim() : '';
    })()
  `);
  assert(copyReverted.includes('Copy email'), 'Copy email label reverted to "Copy email" after 1.6s timeout');

  // Test Inline Form Validation
  console.log('\n--- 6. Form Validation & Keyboard Completion ---');
  await evaluate(`
    (function() {
      const nameInput = document.getElementById('contact-name');
      const submitBtn = document.querySelector('button[type="submit"]');

      // Blur without typing
      nameInput.focus();
      nameInput.dispatchEvent(new FocusEvent('blur', { bubbles: true }));

      // Click submit with empty form
      submitBtn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  const validationTest = await evaluate(`
    (function() {
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const msgInput = document.getElementById('contact-message');
      const nameErrorEl = document.getElementById('name-error');

      return {
        nameAriaInvalid: nameInput ? nameInput.getAttribute('aria-invalid') : null,
        nameDescribedBy: nameInput ? nameInput.getAttribute('aria-describedby') : null,
        nameErrorText: nameErrorEl ? nameErrorEl.innerText.trim() : '',
        emailAriaInvalid: emailInput ? emailInput.getAttribute('aria-invalid') : null,
        msgAriaInvalid: msgInput ? msgInput.getAttribute('aria-invalid') : null,
      };
    })()
  `);
  console.log('Validation Test Result:', validationTest);
  assert(validationTest.nameAriaInvalid === 'true', 'Name input has aria-invalid="true" on blur when empty');
  assert(validationTest.nameDescribedBy === 'name-error', 'Name input has aria-describedby="name-error"');
  assert(validationTest.nameErrorText.includes('required'), 'Name error message rendered');
  assert(validationTest.emailAriaInvalid === 'true', 'Email input marked aria-invalid on submit');
  assert(validationTest.msgAriaInvalid === 'true', 'Message input marked aria-invalid on submit');

  // Test Valid Submission & State Swap
  console.log('\n--- 7. Submission & Success State Swap ---');
  await evaluate(`
    (function() {
      const nameInput = document.getElementById('contact-name');
      const emailInput = document.getElementById('contact-email');
      const subjectInput = document.getElementById('contact-subject');
      const msgInput = document.getElementById('contact-message');
      const form = document.querySelector('form');

      // Fill in valid data using React synthetic event setter
      const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      const nativeAreaSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;

      nativeSetter.call(nameInput, 'Alex Morgan');
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      nativeSetter.call(emailInput, 'alex@example.com');
      emailInput.dispatchEvent(new Event('input', { bubbles: true }));

      nativeSetter.call(subjectInput, 'Systems Project Inquiry');
      subjectInput.dispatchEvent(new Event('input', { bubbles: true }));

      nativeAreaSetter.call(msgInput, 'Hello Abdur, I would love to collaborate on a systems project.');
      msgInput.dispatchEvent(new Event('input', { bubbles: true }));

      const submitBtn = document.querySelector('button[type="submit"]');
      submitBtn.click();
    })()
  `);

  // Wait for submission completion (450ms processing + state update)
  await new Promise((r) => setTimeout(r, 800));

  const successSwap = await evaluate(`
    (function() {
      const formTile = document.querySelector('article[class*="formTile"]');
      const successTitle = formTile ? formTile.querySelector('h2') : null;
      const sendAnotherBtn = formTile ? formTile.querySelector('button[class*="sendAnotherBtn"]') : null;
      const formElement = formTile ? formTile.querySelector('form') : null;
      const tilesCount = document.querySelectorAll("section:not([aria-label='Introduction']) [data-tile]").length;

      return {
        formElementPresent: Boolean(formElement),
        successTitle: successTitle ? successTitle.innerText.trim() : '',
        sendAnotherBtnPresent: Boolean(sendAnotherBtn),
        hasConfirmationFocus: document.activeElement === successTitle || (formTile && formTile.contains(document.activeElement)),
        tilesCount,
      };
    })()
  `);
  console.log('Success Swap Result:', successSwap);
  assert(!successSwap.formElementPresent, 'Form element is unmounted in success state');
  assert(successSwap.successTitle.includes('Draft prepared'), 'Confirmation title is displayed');
  assert(successSwap.sendAnotherBtnPresent, '"Send another message" button is present');
  assert(successSwap.hasConfirmationFocus, 'Programmatic focus is transferred into confirmation tile');
  assert(successSwap.tilesCount === 5, `All 5 contact tiles matched by initTileReveals selector (actual: ${successSwap.tilesCount})`);

  // Test "Send another message" reset
  await evaluate(`
    (function() {
      const formTile = document.querySelector('article[class*="formTile"]');
      const btn = formTile ? formTile.querySelector('button[class*="sendAnotherBtn"]') : null;
      if (btn) btn.click();
    })()
  `);
  await new Promise((r) => setTimeout(r, 200));

  const resetResult = await evaluate(`
    (function() {
      const formTile = document.querySelector('article[class*="formTile"]');
      const restoredForm = formTile ? formTile.querySelector('form') : null;
      const nameInput = document.getElementById('contact-name');
      return {
        restoredFormPresent: Boolean(restoredForm),
        nameCleared: nameInput ? nameInput.value === '' : false,
        nameHasFocus: document.activeElement === nameInput,
      };
    })()
  `);
  console.log('Reset Form Result:', resetResult);
  assert(resetResult.restoredFormPresent, 'Form is restored when "Send another message" is clicked');
  assert(resetResult.nameCleared, 'Input fields are reset to empty');
  assert(resetResult.nameHasFocus, 'Focus is restored to the first input field on reset');

  // Capture Desktop Screenshot
  const shot1440 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'contact_desktop_1440.png'), Buffer.from(shot1440.result.data, 'base64'));
  console.log('✓ Captured screenshots/contact_desktop_1440.png');

  // ─────────────────────────────────────────────────────────
  // MOBILE: 390x844
  // ─────────────────────────────────────────────────────────
  console.log('\n--- 8. Mobile 390x844 Single-Column Order & Horizontal Scroll ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${PORT}/contact` });
  await new Promise((r) => setTimeout(r, 1500));

  const mobileMetrics = await evaluate(`
    (function() {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;

      const avail = document.querySelector('[data-tile="accent"]');
      const email = document.querySelector('[class*="emailTile"]');
      const form = document.querySelector('article[class*="formTile"]');
      const time = document.querySelector('[class*="timeTile"]');
      const links = document.querySelector('[class*="linksTile"]');

      const availRect = avail ? avail.getBoundingClientRect() : null;
      const emailRect = email ? email.getBoundingClientRect() : null;
      const formRect = form ? form.getBoundingClientRect() : null;
      const timeRect = time ? time.getBoundingClientRect() : null;
      const linksRect = links ? links.getBoundingClientRect() : null;

      // Order check: availability, email, form, local time, links
      const isOrdered = availRect && emailRect && formRect && timeRect && linksRect &&
        (availRect.top < emailRect.top) &&
        (emailRect.top < formRect.top) &&
        (formRect.top < timeRect.top) &&
        (timeRect.top < linksRect.top);

      return {
        docWidth,
        scrollWidth,
        hasHorizontalScroll: scrollWidth > docWidth,
        isOrdered,
        availTop: Math.round(availRect?.top || 0),
        emailTop: Math.round(emailRect?.top || 0),
        formTop: Math.round(formRect?.top || 0),
        timeTop: Math.round(timeRect?.top || 0),
        linksTop: Math.round(linksRect?.top || 0),
      };
    })()
  `);

  console.log('Mobile 390px Metrics:', mobileMetrics);
  assert(!mobileMetrics.hasHorizontalScroll, 'Mobile has ZERO horizontal scroll at 390px', `clientWidth=${mobileMetrics.docWidth}, scrollWidth=${mobileMetrics.scrollWidth}`);
  assert(mobileMetrics.isOrdered, 'Tiles are stacked in exact mobile order: availability -> email -> form -> local time -> links');

  const shot390 = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(screenshotsDir, 'contact_mobile_390.png'), Buffer.from(shot390.result.data, 'base64'));
  console.log('✓ Captured screenshots/contact_mobile_390.png');

  ws.close();
} catch (err) {
  console.error('Chrome Verification Error:', err);
  fails++;
} finally {
  try {
    chromeProcess.kill('SIGKILL');
  } catch {}
  try {
    fs.rmSync(tempProfile, { recursive: true, force: true });
  } catch {}
  server.close();
}

console.log('\n========================================');
console.log(`Phase P6 Verification Complete: ${passes} PASS, ${fails} FAIL`);
console.log('========================================');

if (fails > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
