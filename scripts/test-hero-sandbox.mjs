import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9374;
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-sandbox-test2';

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
  try {
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

    console.log('Navigating to http://localhost:5173...');
    await new Promise(r => setTimeout(r, 1500));

    // Reset to dark theme and top of page
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
        window.scrollTo(0, 0);
      })()`
    });
    await new Promise(r => setTimeout(r, 400));

    const targetDir = 'd:\\Projects\\Portfolio\\screenshots';
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const artifactDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\brain\\e7ab17d9-d8ee-4733-9165-319bc25e47a3\\screenshots';
    if (!fs.existsSync(artifactDir)) fs.mkdirSync(artifactDir, { recursive: true });

    async function takeScreenshot(filename) {
      const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(shot.data, 'base64');
      fs.writeFileSync(path.join(targetDir, filename), buffer);
      fs.writeFileSync(path.join(artifactDir, filename), buffer);
      console.log(`Saved screenshot: ${filename}`);
    }

    // 1. Initial State in Dark Mode
    await takeScreenshot('12_hero_sandbox_redesigned_dark.png');

    // 2. Click whoami quick chip
    console.log('Clicking whoami quick chip...');
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const chips = Array.from(document.querySelectorAll('button'));
        const whoamiBtn = chips.find(b => b.textContent && b.textContent.trim() === 'whoami');
        if (whoamiBtn) {
          whoamiBtn.click();
          return true;
        }
        return false;
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot('13_terminal_whoami_executed.png');

    // 3. Switch to Light Mode
    console.log('Switching to Light Mode...');
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('theme', 'light');
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot('14_hero_sandbox_light_mode.png');

    // 4. Click Credentials Tab in Light Mode
    console.log('Clicking Credentials tab...');
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const credBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Credentials'));
        if (credBtn) credBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot('15_hero_sandbox_matrix_tab.png');

    // 5. Click Telemetry Tab in Light Mode
    console.log('Clicking Telemetry tab...');
    await sendSession('Runtime.evaluate', {
      expression: `(() => {
        const telBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent && b.textContent.includes('Telemetry'));
        if (telBtn) telBtn.click();
      })()`
    });
    await new Promise(r => setTimeout(r, 600));
    await takeScreenshot('16_hero_sandbox_telemetry_tab.png');

    console.log('All verification screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Test error:', err);
  } finally {
    edgeProcess.kill();
    process.exit(0);
  }
}

run();
