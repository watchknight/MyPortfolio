import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-verify';
const port = 9335;

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

    // Create target page
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
    await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 2000));

    // 1. Screenshot of Hero with WaypointDock & Canvas Flight Arcs
    const heroShot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.mkdirSync('screenshots/features', { recursive: true });
    fs.writeFileSync('screenshots/features/01_hero_waypoint_dock.png', Buffer.from(heroShot.data, 'base64'));
    console.log('Saved 01_hero_waypoint_dock.png');

    // 2. Scroll directly to the DeveloperASTCard schema
    await sendSession('Runtime.evaluate', {
      expression: `
        const schema = document.querySelector('[aria-label="Systems Architect Type Schema"]');
        if (schema) schema.scrollIntoView({ behavior: 'instant', block: 'center' });
      `
    });
    await new Promise(r => setTimeout(r, 1200));
    const foundationShot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/features/02_foundation_ast_schema.png', Buffer.from(foundationShot.data, 'base64'));
    console.log('Saved 02_foundation_ast_schema.png');

    // 3. Open SysDiagnosticModal and wait for all 5 tests to finish
    await sendSession('Runtime.evaluate', {
      expression: `window.dispatchEvent(new CustomEvent('open-sys-diagnostic'));`
    });
    // Wait 3.2 seconds for all 5 tests and certificate hash generation
    await new Promise(r => setTimeout(r, 3200));

    const diagShot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/features/03_sys_diagnostic_modal.png', Buffer.from(diagShot.data, 'base64'));
    console.log('Saved 03_sys_diagnostic_modal.png');

    // 4. Test Command Palette has run-sys-check
    await sendSession('Runtime.evaluate', {
      expression: `
        // Click [ESC] close button
        const closeBtn = document.querySelector('[aria-label="Close Diagnostic Suite"]');
        if (closeBtn) closeBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 500));
    await sendSession('Runtime.evaluate', {
      expression: `
        // Open Command Palette via Nav button
        const cmdBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Command'));
        if (cmdBtn) cmdBtn.click();
      `
    });
    await new Promise(r => setTimeout(r, 600));
    const cmdShot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('screenshots/features/04_command_palette_sys.png', Buffer.from(cmdShot.data, 'base64'));
    console.log('Saved 04_command_palette_sys.png');

    ws.close();
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    edgeProcess.kill();
  }
}

run();
