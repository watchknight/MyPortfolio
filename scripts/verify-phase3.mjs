import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const tempProfile = path.join(tmpdir(), 'chrome-portfolio-verify-p3-' + Date.now());

function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff'
  };

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath.endsWith('/')) urlPath += 'index.html';

    let filePath = path.join(distDir, urlPath);
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  fs.mkdirSync('screenshots/phase3', { recursive: true });

  const server = await new Promise((r) => {
    const s = createStaticServer(path.resolve('dist'), 0);
    s.then(srv => {
      srv.port = srv.address().port;
      r(srv);
    });
  });
  const port = server.port;
  console.log(`Static server running on http://127.0.0.1:${port}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9270',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://127.0.0.1:${port}/`
  ]);

  await new Promise((r) => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9270/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');

  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    throw new Error('No page target found: ' + JSON.stringify(targets));
  }

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');
  await send('Runtime.enable');

  console.log('\n--- 1. Testing Desktop 1440x900 ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await new Promise((r) => setTimeout(r, 1500));

  // Verify structure & markup hooks on desktop
  const desktopChecks = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const nav = document.querySelector('nav');
        const hero = document.querySelector('section[aria-label="Introduction"]');
        const works = document.querySelector('section[aria-label="Selected Work"]');
        const about = document.querySelector('section[aria-label="About & Tools"]');
        const guestbook = document.querySelector('section[aria-label="Digital Guestbook"]');
        const contact = document.querySelector('section[aria-label="Contact and Footer"]');

        const heroTitle = document.querySelector('[data-hero-title]');
        const heroIn = document.querySelectorAll('[data-hero-in]');
        const tiles = document.querySelectorAll('[data-tile]');
        const magnetic = document.querySelectorAll('[data-magnetic]');
        const inspectTiles = document.querySelectorAll('[data-cursor="inspect"]');
        const hideCursor = document.querySelectorAll('[data-cursor="hide"], input, canvas');

        // Check horizontal overflow
        const docWidth = document.documentElement.clientWidth;
        const scrollWidth = document.documentElement.scrollWidth;
        const bodyWidth = document.body.scrollWidth;

        return {
          sectionOrderValid: !!(nav && hero && works && about && guestbook && contact),
          docWidth,
          scrollWidth,
          bodyWidth,
          overflow: scrollWidth > docWidth || bodyWidth > docWidth,
          heroTitlePresent: !!heroTitle,
          heroInCount: heroIn.length,
          totalTilesCount: tiles.length,
          magneticCount: magnetic.length,
          inspectTilesCount: inspectTiles.length,
          hideCursorCount: hideCursor.length,
          navBrandText: document.querySelector('[data-cursor="link"]')?.textContent?.trim()
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Desktop Layout Evaluation:', desktopChecks.result.value);

  // Take desktop top screenshot
  let shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/1440_home_top.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/1440_home_top.png');
  }

  // Open controls popover
  await send('Runtime.evaluate', {
    expression: `
      const ctrlBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Controls and layout options');
      if (ctrlBtn) ctrlBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 600));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/1440_home_controls.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/1440_home_controls.png');
  }

  // Close controls & scroll to works
  await send('Runtime.evaluate', {
    expression: `
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      document.getElementById('selected-work').scrollIntoView();
    `
  });
  await new Promise((r) => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/1440_home_work.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/1440_home_work.png');
  }

  // Scroll to about
  await send('Runtime.evaluate', {
    expression: `document.getElementById('about').scrollIntoView();`
  });
  await new Promise((r) => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/1440_home_about.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/1440_home_about.png');
  }

  // Scroll to guestbook & contact
  await send('Runtime.evaluate', {
    expression: `document.getElementById('guestbook').scrollIntoView();`
  });
  await new Promise((r) => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/1440_home_guestbook.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/1440_home_guestbook.png');
  }

  console.log('\n--- 2. Testing Mobile 390x844 (Zero Horizontal Scroll Test) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });

  await send('Page.navigate', { url: `http://127.0.0.1:${port}/` });
  await new Promise((r) => setTimeout(r, 1500));

  // Thorough horizontal scroll check at 390px
  const mobileChecks = await send('Runtime.evaluate', {
    expression: `
      (function() {
        const doc = document.documentElement;
        const body = document.body;
        const docWidth = doc.clientWidth;
        const scrollWidth = doc.scrollWidth;
        const bodyScrollWidth = body.scrollWidth;

        // Find any element overflowing 390px
        const allElements = Array.from(document.querySelectorAll('*'));
        const overflowingElements = allElements
          .filter(el => {
            const rect = el.getBoundingClientRect();
            return rect.right > docWidth + 1 || rect.left < -1;
          })
          .map(el => ({
            tag: el.tagName,
            id: el.id,
            className: el.className?.toString().slice(0, 50),
            right: el.getBoundingClientRect().right,
            width: el.getBoundingClientRect().width
          }));

        return {
          viewportWidth: docWidth,
          docScrollWidth: scrollWidth,
          bodyScrollWidth: bodyScrollWidth,
          hasHorizontalScroll: scrollWidth > docWidth || bodyScrollWidth > docWidth,
          overflowingElementsCount: overflowingElements.length,
          overflowingSample: overflowingElements.slice(0, 3)
        };
      })()
    `,
    returnByValue: true
  });

  console.log('Mobile 390px Evaluation:', mobileChecks.result.value);

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/390_home_top.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/390_home_top.png');
  }

  // Scroll to works on mobile
  await send('Runtime.evaluate', {
    expression: `document.getElementById('selected-work').scrollIntoView();`
  });
  await new Promise((r) => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/390_home_work.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/390_home_work.png');
  }

  // Scroll to about on mobile
  await send('Runtime.evaluate', {
    expression: `document.getElementById('about').scrollIntoView();`
  });
  await new Promise((r) => setTimeout(r, 800));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/390_home_about.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/390_home_about.png');
  }

  // Open controls on mobile
  await send('Runtime.evaluate', {
    expression: `
      window.scrollTo(0, 0);
      const ctrlBtn = Array.from(document.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Controls and layout options');
      if (ctrlBtn) ctrlBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 600));

  shot = await send('Page.captureScreenshot', { format: 'png' });
  if (shot.result && shot.result.data) {
    fs.writeFileSync('screenshots/phase3/390_home_controls.png', Buffer.from(shot.result.data, 'base64'));
    console.log('✓ Saved screenshots/phase3/390_home_controls.png');
  }

  ws.close();
  chrome.kill();
  server.close();
  console.log('\n--- Phase 3 Verification Complete! ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
