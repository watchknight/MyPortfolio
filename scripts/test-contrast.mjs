import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9355;
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-contrast';

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

  const outDir = path.resolve('screenshots/contrast');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // 1. Dark Mode Home & HUD
  console.log('1. Testing Dark Mode Home & HUD...');
  await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1200));

  const darkHudRes = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const dock = document.querySelector('[class*="dockContainer"]');
        const label = dock ? dock.querySelector('[class*="dockLabel"]') : null;
        const key = dock ? dock.querySelector('[class*="keyCap"]') : null;
        const name = dock ? dock.querySelector('[class*="shortcutName"]') : null;
        return {
          dockBg: dock ? window.getComputedStyle(dock).backgroundColor : null,
          labelColor: label ? window.getComputedStyle(label).color : null,
          keyBg: key ? window.getComputedStyle(key).backgroundColor : null,
          keyColor: key ? window.getComputedStyle(key).color : null,
          nameColor: name ? window.getComputedStyle(name).color : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Dark HUD computed colors:', darkHudRes?.result?.value);

  let shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '01_dark_home_hud.png'), Buffer.from(shot.data, 'base64'));

  // 2. Dark Mode Foundation & AST Card
  console.log('2. Testing Dark Mode Foundation AST Schema...');
  await sendSession('Page.navigate', { url: 'http://localhost:5173/foundation' });
  await new Promise(r => setTimeout(r, 1200));

  const darkAstRes = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const ast = document.querySelector('[class*="cardContainer"]');
        if (ast) ast.scrollIntoView({ behavior: 'instant', block: 'center' });
        const prop = document.querySelector('[class*="propKey"]');
        const kw = document.querySelector('[class*="keyword"]');
        const str = document.querySelector('[class*="stringVal"]');
        const code = document.querySelector('[class*="codeArea"]');
        return {
          codeBg: code ? window.getComputedStyle(code).backgroundColor : null,
          propKeyColor: prop ? window.getComputedStyle(prop).color : null,
          keywordColor: kw ? window.getComputedStyle(kw).color : null,
          stringColor: str ? window.getComputedStyle(str).color : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Dark AST computed colors:', darkAstRes?.result?.value);

  shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '02_dark_foundation_ast.png'), Buffer.from(shot.data, 'base64'));

  // 3. Switch to Light Mode and Test AST Card
  console.log('3. Switching to Light Mode and Testing AST Schema...');
  await sendSession('Runtime.evaluate', {
    expression: `
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.dataset.theme = 'light';
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const lightAstRes = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const ast = document.querySelector('[class*="cardContainer"]');
        if (ast) ast.scrollIntoView({ behavior: 'instant', block: 'center' });
        const prop = document.querySelector('[class*="propKey"]');
        const kw = document.querySelector('[class*="keyword"]');
        const str = document.querySelector('[class*="stringVal"]');
        const code = document.querySelector('[class*="codeArea"]');
        return {
          codeBg: code ? window.getComputedStyle(code).backgroundColor : null,
          propKeyColor: prop ? window.getComputedStyle(prop).color : null,
          keywordColor: kw ? window.getComputedStyle(kw).color : null,
          stringColor: str ? window.getComputedStyle(str).color : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Light AST computed colors:', lightAstRes?.result?.value);

  shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '03_light_foundation_ast.png'), Buffer.from(shot.data, 'base64'));

  // 4. Light Mode Home & HUD
  console.log('4. Testing Light Mode Home & HUD...');
  await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1200));
  await sendSession('Runtime.evaluate', {
    expression: `
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.dataset.theme = 'light';
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const lightHudRes = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const dock = document.querySelector('[class*="dockContainer"]');
        const label = dock ? dock.querySelector('[class*="dockLabel"]') : null;
        const key = dock ? dock.querySelector('[class*="keyCap"]') : null;
        const name = dock ? dock.querySelector('[class*="shortcutName"]') : null;
        return {
          dockBg: dock ? window.getComputedStyle(dock).backgroundColor : null,
          labelColor: label ? window.getComputedStyle(label).color : null,
          keyBg: key ? window.getComputedStyle(key).backgroundColor : null,
          keyColor: key ? window.getComputedStyle(key).color : null,
          nameColor: name ? window.getComputedStyle(name).color : null
        };
      })()
    `,
    returnByValue: true
  });
  console.log('Light HUD computed colors:', lightHudRes?.result?.value);

  shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '04_light_home_hud.png'), Buffer.from(shot.data, 'base64'));

  // 5. Light Mode Works
  console.log('5. Testing Light Mode Works (/works)...');
  await sendSession('Page.navigate', { url: 'http://localhost:5173/works' });
  await new Promise(r => setTimeout(r, 1200));
  await sendSession('Runtime.evaluate', {
    expression: `
      localStorage.setItem('theme', 'light');
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.dataset.theme = 'light';
    `
  });
  await new Promise(r => setTimeout(r, 400));

  shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '05_light_works.png'), Buffer.from(shot.data, 'base64'));

  ws.close();
  edgeProcess.kill();
  console.log('All contrast tests finished successfully.');
}

run().catch(err => {
  console.error(err);
  edgeProcess.kill();
  process.exit(1);
});
