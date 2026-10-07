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

// Simple static server
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

await new Promise((resolve) => server.listen(4567, '127.0.0.1', resolve));
console.log('HTTP test server listening on http://127.0.0.1:4567');

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const chromeProcess = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9333',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  '--user-data-dir=' + path.join(rootDir, '.chrome-temp-' + Date.now()),
  'http://127.0.0.1:4567/',
]);

await new Promise((r) => setTimeout(r, 1500));

// Connect to Chrome DevTools Protocol
const versionRes = await fetch('http://127.0.0.1:9333/json/list');
const targets = await versionRes.json();
const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
console.log('Connected to target:', pageTarget.title, pageTarget.url);

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

try {
  await send('Page.enable');
  await send('DOM.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  // Wait for React hydration
  await new Promise((r) => setTimeout(r, 1500));

  console.log('\n--- TEST 1: Desktop Pointer Inspection ---');
  const desktopCheck = await evalJs(`(() => {
    const hasCursorClass = document.documentElement.classList.contains('has-cursor');
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    const label = document.querySelector('.cursor-label');
    return {
      hasCursorClass,
      ringFound: !!ring,
      dotFound: !!dot,
      labelFound: !!label,
      ringClass: ring?.className,
      dotClass: dot?.className,
    };
  })()`);
  console.log('Desktop initial cursor state:', desktopCheck);

  if (!desktopCheck.hasCursorClass || !desktopCheck.ringFound || !desktopCheck.dotFound) {
    throw new Error('Desktop cursor failed to mount!');
  }

  // Move pointer over empty space
  console.log('\n--- TEST 2: Pointer Movement & quickTo ---');
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 400,
    y: 300,
  });
  await new Promise((r) => setTimeout(r, 200));

  const afterMoveCheck = await evalJs(`(() => {
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    const ringTransform = ring ? getComputedStyle(ring).transform : '';
    const dotTransform = dot ? getComputedStyle(dot).transform : '';
    return {
      ringIsOn: ring?.classList.contains('is-on'),
      dotIsOn: dot?.classList.contains('is-on'),
      ringTransform,
      dotTransform,
    };
  })()`);
  console.log('After pointer move:', afterMoveCheck);

  // Test magnetic attraction
  console.log('\n--- TEST 3: Magnetic Attraction ---');
  const magnetTarget = await evalJs(`(() => {
    const el = document.querySelector('[data-magnetic]');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      text: el.textContent?.trim().slice(0, 20),
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  })()`);
  console.log('Found magnetic target:', magnetTarget);

  if (magnetTarget) {
    // Move near the edge of the magnetic target
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: magnetTarget.x + 15,
      y: magnetTarget.y + 10,
    });
    await new Promise((r) => setTimeout(r, 300));

    const magnetActive = await evalJs(`(() => {
      const el = document.querySelector('[data-magnetic]');
      const ring = document.querySelector('.cursor-ring');
      const transform = el ? getComputedStyle(el).transform : '';
      return {
        isHover: ring?.classList.contains('is-hover'),
        transform,
      };
    })()`);
    console.log('Magnetic active state:', magnetActive);

    if (!magnetActive.isHover || !magnetActive.transform.includes('matrix')) {
      throw new Error('Magnetic element failed to attract pointer!');
    }

    // Move away
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: 100,
      y: 100,
    });
    await new Promise((r) => setTimeout(r, 600));

    const magnetReleased = await evalJs(`(() => {
      const el = document.querySelector('[data-magnetic]');
      const ring = document.querySelector('.cursor-ring');
      return {
        isHover: ring?.classList.contains('is-hover'),
        transform: el ? getComputedStyle(el).transform : '',
      };
    })()`);
    console.log('Magnetic released state:', magnetReleased);
  }

  // Test Hero CTA Magnetic Wrapper
  console.log('\n--- TEST 3b: Hero Magnetic CTA Button ---');
  const heroCtaTarget = await evalJs(`(() => {
    const el = document.querySelector('[data-hero-in] [data-magnetic]') || document.querySelector('a[href="/resume.pdf"][data-magnetic]');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      text: el.textContent?.trim().slice(0, 25),
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  })()`);
  console.log('Found Hero magnetic CTA:', heroCtaTarget);
  if (!heroCtaTarget) {
    throw new Error('Hero magnetic CTA not found!');
  }
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: heroCtaTarget.x + 10,
    y: heroCtaTarget.y + 8,
  });
  await new Promise((r) => setTimeout(r, 300));
  const heroActive = await evalJs(`(() => {
    const el = document.querySelector('[data-hero-in] [data-magnetic]') || document.querySelector('a[href="/resume.pdf"][data-magnetic]');
    const ring = document.querySelector('.cursor-ring');
    return {
      isHover: ring?.classList.contains('is-hover'),
      transform: el ? getComputedStyle(el).transform : '',
    };
  })()`);
  console.log('Hero magnetic CTA active:', heroActive);
  if (!heroActive.isHover || !heroActive.transform.includes('matrix')) {
    throw new Error('Hero magnetic CTA failed attraction!');
  }

  // Test Inspect Tile bounds snapping
  console.log('\n--- TEST 4: Inspector Snap on Tile ---');
  const inspectTarget = await evalJs(`(() => {
    const el = document.querySelector('[data-cursor="inspect"]');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      label: el.dataset.cursorLabel,
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };
  })()`);
  console.log('Found inspect target:', inspectTarget);

  if (inspectTarget) {
    // Scroll element into view if needed
    await evalJs(`document.querySelector('[data-cursor="inspect"]').scrollIntoView({ block: 'center' })`);
    await new Promise((r) => setTimeout(r, 300));

    const centerAfterScroll = await evalJs(`(() => {
      const el = document.querySelector('[data-cursor="inspect"]');
      const rect = el.getBoundingClientRect();
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      };
    })()`);

    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: centerAfterScroll.x,
      y: centerAfterScroll.y,
    });
    await new Promise((r) => setTimeout(r, 600));

    const inspectActive = await evalJs(`(() => {
      const ring = document.querySelector('.cursor-ring');
      const dot = document.querySelector('.cursor-dot');
      const label = document.querySelector('.cursor-label');
      const ringRect = ring?.getBoundingClientRect();
      const dotTransform = dot ? getComputedStyle(dot).transform : '';
      return {
        isInspect: ring?.classList.contains('is-inspect'),
        labelText: label?.textContent,
        ringWidth: Math.round(ringRect?.width || 0),
        ringHeight: Math.round(ringRect?.height || 0),
        computedBorderRadius: ring ? getComputedStyle(ring).borderRadius : '',
        inlineStyle: ring?.getAttribute('style'),
        dotTransform,
      };
    })()`);
    console.log('Inspector active state:', inspectActive);

    const inspectShot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(rootDir, 'inspect-tile.png'), Buffer.from(inspectShot.data, 'base64'));
    console.log('Saved inspect-tile.png');

    // Test mouse down while snapped
    await send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x: centerAfterScroll.x,
      y: centerAfterScroll.y,
      button: 'left',
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 200));

    const downState = await evalJs(`(() => {
      const ring = document.querySelector('.cursor-ring');
      return {
        transform: ring ? getComputedStyle(ring).transform : '',
      };
    })()`);
    console.log('Mouse down while snapped:', downState);

    await send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x: centerAfterScroll.x,
      y: centerAfterScroll.y,
      button: 'left',
      clickCount: 1,
    });
    await new Promise((r) => setTimeout(r, 200));

    // Test page scroll while snapped
    console.log('\n--- TEST 5: Scroll while snapped ---');
    await evalJs(`window.scrollBy(0, 100)`);
    await new Promise((r) => setTimeout(r, 300));

    const snappedAfterScroll = await evalJs(`(() => {
      const el = document.querySelector('[data-cursor="inspect"]');
      const ring = document.querySelector('.cursor-ring');
      const elRect = el.getBoundingClientRect();
      const ringRect = ring.getBoundingClientRect();
      return {
        elCenterY: Math.round(elRect.top + elRect.height / 2),
        ringCenterY: Math.round(ringRect.top + ringRect.height / 2),
        diffY: Math.abs(Math.round((elRect.top + elRect.height / 2) - (ringRect.top + ringRect.height / 2))),
      };
    })()`);
    console.log('Inspector following scroll:', snappedAfterScroll);

    // Test scroll off tile: cursor should cleanly exit inspect mode when tile leaves pointer
    await evalJs(`window.scrollBy(0, 1500)`);
    await new Promise((r) => setTimeout(r, 400));
    const inspectAfterScrollOff = await evalJs(`(() => {
      const ring = document.querySelector('.cursor-ring');
      return {
        isInspect: ring?.classList.contains('is-inspect'),
      };
    })()`);
    console.log('Inspector after scrolling tile away:', inspectAfterScrollOff);
    if (inspectAfterScrollOff.isInspect) {
      throw new Error('Inspector remained snapped after tile was scrolled away!');
    }
  }

  // Test hide mode
  console.log('\n--- TEST 6: Cursor Hide on [data-cursor="hide"] ---');
  await evalJs(`(() => {
    const el = document.querySelector('[data-cursor="hide"]');
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  })()`);
  await new Promise((r) => setTimeout(r, 400));

  const hideTarget = await evalJs(`(() => {
    const el = document.querySelector('[data-cursor="hide"]');
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      tag: el.tagName,
      x: Math.round(rect.left + rect.width / 2),
      y: Math.round(rect.top + rect.height / 2),
    };
  })()`);
  console.log('Found hide target:', hideTarget);

  if (hideTarget) {
    await send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: hideTarget.x,
      y: hideTarget.y,
    });
    await new Promise((r) => setTimeout(r, 400));

    const hideActive = await evalJs(`(() => {
      const ring = document.querySelector('.cursor-ring');
      const dot = document.querySelector('.cursor-dot');
      return {
        ringHidden: ring?.classList.contains('is-hidden'),
        dotHidden: dot?.classList.contains('is-hidden'),
      };
    })()`);
    console.log('Cursor hide active state:', hideActive);
  }

  // Desktop screenshot
  console.log('\n--- Taking Desktop Screenshot (1440px) ---');
  await evalJs(`window.scrollTo(0, 0)`);
  await new Promise((r) => setTimeout(r, 400));
  const desktopShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(rootDir, 'desktop-1440px.png'), Buffer.from(desktopShot.data, 'base64'));
  console.log('Saved desktop-1440px.png');

  // Test Touch Emulation
  console.log('\n--- TEST 7: Touch Device Emulation (390px, coarse, hover: none) ---');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send('Emulation.setTouchEmulationEnabled', {
    enabled: true,
    maxTouchPoints: 5,
  });
  // Reload page under touch emulation
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 2000));

  const touchCheck = await evalJs(`(() => {
    const hasCursorClass = document.documentElement.classList.contains('has-cursor');
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    return {
      hasCursorClass,
      ringExists: !!ring,
      dotExists: !!dot,
      fineMatches: window.matchMedia('(hover: hover) and (pointer: fine)').matches,
    };
  })()`);
  console.log('Touch device state:', touchCheck);

  const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(rootDir, 'mobile-390px.png'), Buffer.from(mobileShot.data, 'base64'));
  console.log('Saved mobile-390px.png');

  // Test Reduced Motion Emulation
  console.log('\n--- TEST 8: Reduced Motion Emulation ---');
  await send('Emulation.setEmulatedMedia', {
    media: '',
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }],
  });
  // Switch back to desktop fine pointer with reduced-motion
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });
  await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 2000));

  const reducedMotionCheck = await evalJs(`(() => {
    const hasCursorClass = document.documentElement.classList.contains('has-cursor');
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    return {
      hasCursorClass,
      ringExists: !!ring,
      dotExists: !!dot,
      reducedMatches: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  })()`);
  console.log('Reduced motion state:', reducedMotionCheck);

  if (reducedMotionCheck.hasCursorClass || reducedMotionCheck.ringExists || reducedMotionCheck.dotExists) {
    throw new Error('Reduced motion check failed: cursor elements should not exist!');
  }

  // Test Keyboard Focus
  console.log('\n--- TEST 9: Keyboard Focus Rings ---');
  // Reset media to standard desktop
  await send('Emulation.setEmulatedMedia', { media: '', features: [] });
  await send('Page.reload');
  await new Promise((r) => setTimeout(r, 2000));

  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
  await new Promise((r) => setTimeout(r, 200));

  const focusCheck = await evalJs(`(() => {
    const el = document.activeElement;
    const outline = el ? getComputedStyle(el).outline : '';
    const outlineOffset = el ? getComputedStyle(el).outlineOffset : '';
    return {
      activeTag: el?.tagName,
      activeClass: el?.className,
      outline,
      outlineOffset,
    };
  })()`);
  console.log('Active element focus styles:', focusCheck);

  // Test Theme Toggle
  console.log('\n--- TEST 10: Theme Toggle and Cursor Styling ---');
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'd', code: 'KeyD', windowsVirtualKeyCode: 68 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD', windowsVirtualKeyCode: 68 });
  await new Promise((r) => setTimeout(r, 500));

  const themeCheck = await evalJs(`(() => {
    const htmlTheme = document.documentElement.getAttribute('data-theme');
    const ring = document.querySelector('.cursor-ring');
    const dot = document.querySelector('.cursor-dot');
    return {
      htmlTheme,
      ringBorder: ring ? getComputedStyle(ring).borderColor : '',
      dotColor: dot ? getComputedStyle(dot).backgroundColor : '',
    };
  })()`);
  console.log('Theme toggle result:', themeCheck);
  if (!themeCheck.htmlTheme) {
    throw new Error('Theme toggle via key shortcut did not apply data-theme attribute!');
  }

  console.log('\nALL VERIFICATION TESTS COMPLETED SUCCESSFULLY!');
} catch (err) {
  console.error('Test error:', err);
  process.exitCode = 1;
} finally {
  ws.close();
  chromeProcess.kill();
  server.close();
}
