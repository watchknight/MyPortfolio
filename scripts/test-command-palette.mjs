import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-verify-cmd';
const port = 9336;

const edgeProcess = spawn(edgePath, [
  `--remote-debugging-port=${port}`,
  '--headless=new',
  `--user-data-dir=${userDataDir}`,
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
        http.get(`http://127.0.0.1:${port}/json/version`, (r) => {
          let data = '';
          r.on('data', chunk => data += chunk);
          r.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
      });
      return res.webSocketDebuggerUrl;
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error('Edge failed to start');
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

    await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1800));

    // Dispatch ⌘K / Ctrl+K
    await sendSession('Runtime.evaluate', {
      expression: `
        const e = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true });
        window.dispatchEvent(e);
      `
    });
    await new Promise(r => setTimeout(r, 500));

    const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/features/04_command_palette_sys.png', Buffer.from(shot.data, 'base64'));
    console.log('Saved 04_command_palette_sys.png');

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    edgeProcess.kill();
  }
}

run();
