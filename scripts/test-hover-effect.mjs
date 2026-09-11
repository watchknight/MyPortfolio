import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9370;
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-hover-test';

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

  await new Promise(r => setTimeout(r, 1200));

  // Reset to dark theme and top of page
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      window.scrollTo(0, 0);
    })()`
  });
  await new Promise(r => setTimeout(r, 400));

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

  console.log('\n=== TESTING HOVER EFFECT ON HERO HEADLINE ===');
  // Locate the headline title element
  const titleRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const titleSpan = document.querySelector('h1 span[data-cursor="inspect"]');
      if (!titleSpan) return null;
      const r = titleSpan.getBoundingClientRect();
      return { x: r.x + r.width / 3, y: r.y + r.height / 2 };
    })()`,
    returnByValue: true
  });

  if (titleRect.result.value) {
    const { x, y } = titleRect.result.value;
    console.log('Hovering over title at:', { x, y });

    // Move cursor over title
    await sendSession('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
    await new Promise(r => setTimeout(r, 150));

    // Check if cursor inspect label is active and text is scrambling
    const hoverState = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const cursorLabel = document.querySelector('[class*="label"]');
        const titleSpan = document.querySelector('h1 span[data-cursor="inspect"]');
        return {
          cursorLabelText: cursorLabel ? cursorLabel.textContent.trim() : null,
          titleText: titleSpan ? titleSpan.textContent.trim() : null
        };
      })()`,
      returnByValue: true
    });
    console.log('Hover state active:', hoverState.result.value);

    await takeScreenshot('10_hero_hover_scramble.png');

    // Wait for scramble to resolve
    await new Promise(r => setTimeout(r, 800));

    // Now hover over the second line "fast, reliable software"
    const highlightRect = await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const hlSpan = document.querySelector('h1 [class*="highlight"] span[data-cursor="inspect"]');
        if (!hlSpan) return null;
        const r = hlSpan.getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
      })()`,
      returnByValue: true
    });

    if (highlightRect.result.value) {
      const { x: hx, y: hy } = highlightRect.result.value;
      console.log('Hovering over highlight at:', { x: hx, y: hy });
      await sendSession('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hx, y: hy });
      await new Promise(r => setTimeout(r, 150));
      await takeScreenshot('11_hero_hover_highlight_scramble.png');
    }
  }

  ws.close();
  edgeProcess.kill();
  console.log('\nHover effect test finished successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  edgeProcess.kill();
  process.exit(1);
});
