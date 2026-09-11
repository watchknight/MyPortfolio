import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-multipage';
const port = 9338;

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

    const outDir = 'screenshots/multipage';
    fs.mkdirSync(outDir, { recursive: true });

    // 1. Home Page
    console.log('Testing Home (/) ...');
    await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1200));
    let shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '01_home_page.png'), Buffer.from(shot.data, 'base64'));

    // 2. Click "Works" in Navbar
    console.log('Testing Navigation to Works (/works) ...');
    let res = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.querySelector('a[href="/works"]');
          if (!link) return 'Not found';
          link.click();
          return 'Clicked /works: ' + window.location.pathname;
        })()
      `,
      returnByValue: true
    });
    console.log(res?.result?.value);
    await new Promise(r => setTimeout(r, 1000));
    shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '02_works_page.png'), Buffer.from(shot.data, 'base64'));

    // 3. Click "Foundation" in Navbar
    console.log('Testing Navigation to Foundation (/foundation) ...');
    res = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.querySelector('a[href="/foundation"]');
          if (!link) return 'Not found';
          link.click();
          return 'Clicked /foundation: ' + window.location.pathname;
        })()
      `,
      returnByValue: true
    });
    console.log(res?.result?.value);
    await new Promise(r => setTimeout(r, 1000));
    shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '03_foundation_page.png'), Buffer.from(shot.data, 'base64'));

    // 4. Click "Résumé" in Navbar
    console.log('Testing Navigation to Résumé (/resume) ...');
    res = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.querySelector('a[href="/resume"]');
          if (!link) return 'Not found';
          link.click();
          return 'Clicked /resume: ' + window.location.pathname;
        })()
      `,
      returnByValue: true
    });
    console.log(res?.result?.value);
    await new Promise(r => setTimeout(r, 1000));
    shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '04_resume_page.png'), Buffer.from(shot.data, 'base64'));

    // 5. Click "Contact" in Navbar
    console.log('Testing Navigation to Contact (/contact) ...');
    res = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.querySelector('a[href="/contact"]');
          if (!link) return 'Not found';
          link.click();
          return 'Clicked /contact: ' + window.location.pathname;
        })()
      `,
      returnByValue: true
    });
    console.log(res?.result?.value);
    await new Promise(r => setTimeout(r, 1000));
    shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '05_contact_page.png'), Buffer.from(shot.data, 'base64'));

    // 6. Mobile Viewport (390 x 844) Test
    console.log('Testing Mobile Viewport ...');
    await sendSession('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1000));
    shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(outDir, '06_home_mobile.png'), Buffer.from(shot.data, 'base64'));

    console.log('All screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    edgeProcess.kill();
  }
}

run();
