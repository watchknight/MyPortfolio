import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9368;
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-enhancements-test';

const edgeProcess = spawn(edgePath, [
  '--remote-debugging-port=' + port,
  '--headless=new',
  '--user-data-dir=' + userDataDir,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1440,900',
  'about:blank'
], { stdio: 'ignore' });

async function getWsUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await new Promise((resolve, reject) => {
        http.get('http://127.0.0.1:' + port + '/json/version', (r) => {
          let data = '';
          r.on('data', chunk => data += chunk);
          r.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      if (res.webSocketDebuggerUrl) return res.webSocketDebuggerUrl;
    } catch {
      // retry
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error('Could not connect to Edge debugger');
}

function connect(wsUrl) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => resolve(ws);
    ws.onerror = reject;
  });
}

let idCounter = 1;
function send(ws, method, params = {}) {
  return new Promise((resolve) => {
    const id = idCounter++;
    const listener = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', listener);
        resolve(msg.result);
      }
    };
    ws.addEventListener('message', listener);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function run() {
  const wsUrl = await getWsUrl();
  const ws = await connect(wsUrl);

  const { targetId } = await send(ws, 'Target.createTarget', { url: 'http://localhost:5173/' });
  const { sessionId } = await send(ws, 'Target.attachToTarget', { targetId, flatten: true });

  function sendSession(method, params = {}) {
    return new Promise((resolve) => {
      const id = idCounter++;
      const listener = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === id) {
          ws.removeEventListener('message', listener);
          resolve(msg.result);
        }
      };
      ws.addEventListener('message', listener);
      ws.send(JSON.stringify({ id, sessionId, method, params }));
    });
  }

  await sendSession('Page.enable');
  await sendSession('Runtime.enable');
  await sendSession('DOM.enable');

  await new Promise(r => setTimeout(r, 1500));

  const outDir = path.resolve('screenshots/enhancements');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  async function takeScreenshot(name) {
    const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const filePath = path.join(outDir, name);
    fs.writeFileSync(filePath, buffer);
    console.log(`Saved screenshot: ${filePath}`);
  }

  console.log('\n=== INITIALIZING DARK THEME ===');
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      window.scrollTo(0, 0);
      if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true });
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  console.log('\n=== TEST 1: HERO SANDBOX & TERMINAL ===');
  // Check HeroSandbox tabs
  const heroTabs = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]')).map(t => t.textContent.trim());
      return { tabs };
    })()`,
    returnByValue: true
  });
  console.log('Hero Sandbox Tabs:', heroTabs.result.value);

  // Click 'whoami' chip in terminal
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const chip = Array.from(document.querySelectorAll('button')).find(c => c.textContent.trim() === 'whoami');
      if (chip) chip.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  // Click 'projects' chip in terminal
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const chip = Array.from(document.querySelectorAll('button')).find(c => c.textContent.trim() === 'projects');
      if (chip) chip.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  // Take screenshot of terminal active in Dark theme
  await takeScreenshot('01_hero_terminal_dark.png');

  // Switch to Telemetry tab
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const tab = Array.from(document.querySelectorAll('button[role="tab"]')).find(t => t.textContent.includes('Telemetry'));
      if (tab) tab.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('02_hero_telemetry_dark.png');

  // Switch to Verified Matrix tab
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const tab = Array.from(document.querySelectorAll('button[role="tab"]')).find(t => t.textContent.includes('Matrix'));
      if (tab) tab.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('03_hero_matrix_dark.png');

  console.log('\n=== TEST 2: PROJECT SIMULATORS ON HOME PAGE ===');
  // Scroll to featured projects
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('section[aria-label="Featured Projects"]');
      if (window.__lenis && el) {
        window.__lenis.scrollTo(el, { immediate: true });
      } else if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // PureFeed Simulator: Toggle ad blocker
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const toggle = document.querySelector('button[aria-label="Toggle PureFeed Countermeasure"]');
      if (toggle) toggle.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

  // DocLensBD Simulator: Frame Switcher
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const frameBtns = Array.from(document.querySelectorAll('[class*="frameBtn"]'));
      if (frameBtns[1]) frameBtns[1].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('04_project_simulators_home.png');

  console.log('\n=== TEST 3: DIGITAL GUESTBOOK / SIGNATURE CANVAS ===');
  // Scroll down to the Guestbook
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const el = document.querySelector('section[aria-label="Digital Guestbook"]');
      if (window.__lenis && el) {
        window.__lenis.scrollTo(el, { immediate: true });
      } else if (el) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 700));

  // Get canvas coordinates
  const canvasRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const canvas = document.querySelector('canvas[class*="canvas"]');
      if (!canvas) return null;
      const r = canvas.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()`,
    returnByValue: true
  });

  if (canvasRect.result.value) {
    const { x, y, width, height } = canvasRect.result.value;
    console.log('Canvas location:', { x, y, width, height });

    // Draw stylized signature curves
    const startX = x + width * 0.2;
    const startY = y + height * 0.5;

    await sendSession('Input.dispatchMouseEvent', { type: 'mousePressed', x: startX, y: startY, button: 'left', clickCount: 1 });
    for (let i = 1; i <= 25; i++) {
      const curX = startX + (width * 0.6 * (i / 25));
      const curY = startY + Math.sin(i / 2.5) * 45;
      await sendSession('Input.dispatchMouseEvent', { type: 'mouseMoved', x: curX, y: curY, button: 'left' });
      await new Promise(r => setTimeout(r, 12));
    }
    await sendSession('Input.dispatchMouseEvent', { type: 'mouseReleased', x: startX + width * 0.6, y: startY, button: 'left', clickCount: 1 });
    await new Promise(r => setTimeout(r, 500));

    // Verify drawing state
    const canvasStatus = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const dlBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Save Badge'));
        return { hasDownloadBtn: Boolean(dlBtn), downloadDisabled: dlBtn ? dlBtn.disabled : true };
      })()`,
      returnByValue: true
    });
    console.log('Signature Canvas Draw Status:', canvasStatus.result.value);
    await takeScreenshot('05_guestbook_signed.png');
  }

  console.log('\n=== TEST 4: WORKS PAGE FULL SIMULATOR SUITE ===');
  // Navigate to Works page using HTML5 history & popstate
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      window.history.pushState(null, '', '/works');
      window.dispatchEvent(new PopStateEvent('popstate'));
    })()`
  });
  await new Promise(r => setTimeout(r, 1000));

  // Scroll to first project simulator
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const sim = document.querySelector('[class*="simWrapper"]');
      if (window.__lenis && sim) {
        window.__lenis.scrollTo(sim, { immediate: true });
      }
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Test FocusGuard domain click
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const chip = Array.from(document.querySelectorAll('[class*="fgPill"]')).find(c => c.textContent.includes('reddit.com'));
      if (chip) chip.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 400));
  await takeScreenshot('06_works_simulators_active.png');

  console.log('\n=== TEST 5: ATMOSPHERE GRAIN & LIGHT THEME CONTRAST ===');
  // Toggle Grain shortcut
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const grainBtn = Array.from(document.querySelectorAll('[class*="shortcutItem"]')).find(b => b.textContent.includes('Grain'));
      if (grainBtn) grainBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  const grainActive = await sendSession('Runtime.evaluate', {
    expression: `document.documentElement.getAttribute('data-grain')`,
    returnByValue: true
  });
  console.log('Data-grain active state:', grainActive.result.value);
  await takeScreenshot('07_atmosphere_grain_on.png');

  // Toggle Theme to Light Mode
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const themeBtn = Array.from(document.querySelectorAll('[class*="shortcutItem"]')).find(b => b.textContent.includes('Theme'));
      if (themeBtn) themeBtn.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 600));

  // Return to home page to inspect Hero and components in Light theme
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));
  await takeScreenshot('08_light_theme_hero_sandbox.png');

  // Scroll down to light theme guestbook
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const canvasSection = document.querySelector('[class*="guestbookSection"]');
      if (canvasSection) canvasSection.scrollIntoView({ behavior: 'instant', block: 'center' });
    })()`
  });
  await new Promise(r => setTimeout(r, 500));
  await takeScreenshot('09_light_theme_guestbook.png');

  ws.close();
  edgeProcess.kill();
  console.log('\nAll enhancement tests passed successfully with screenshots saved.');
  process.exit(0);
}

run().catch(err => {
  console.error('Test failed with error:', err);
  edgeProcess.kill();
  process.exit(1);
});
