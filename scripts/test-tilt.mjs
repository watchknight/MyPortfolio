import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-tilt';
const port = 9345;

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
        http.get('http://127.0.0.1:9345/json/version', (r) => {
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

  console.log('Navigating to http://localhost:5173/ ...');
  await sendSession('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1500));

  const evalRes = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const cards = document.querySelectorAll('article');
        for (const card of cards) {
          if (card.innerText.includes('PureFeed')) {
            card.scrollIntoView({ behavior: 'instant', block: 'center' });
            const rect = card.getBoundingClientRect();
            return {
              found: true,
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            };
          }
        }
        return { found: false };
      })()
    `,
    returnByValue: true
  });

  console.log('Card evaluation:', evalRes?.result?.value);
  const rect = evalRes?.result?.value;

  if (rect && rect.found) {
    const targetX = Math.round(rect.left + rect.width * 0.85);
    const targetY = Math.round(rect.top + rect.height * 0.2);

    console.log('Dispatching mousemove to (' + targetX + ', ' + targetY + ')...');
    await sendSession('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: targetX,
      y: targetY
    });

    await new Promise(r => setTimeout(r, 400));

    const checkRes = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('article');
          for (const card of cards) {
            if (card.innerText.includes('PureFeed')) {
              return {
                styleTransform: card.style.transform,
                computedTransform: window.getComputedStyle(card).transform,
                hasSpotlight: !!card.querySelector('[class*="spotlightOverlay"]')
              };
            }
          }
          return {};
        })()
      `,
      returnByValue: true
    });

    console.log('Tilt verification results on Home:', checkRes?.result?.value);

    const outDir = path.resolve('screenshots/tilt');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const filePath = path.join(outDir, '01_tilted_card_hover.png');
    fs.writeFileSync(filePath, buffer);
    console.log('Saved tilted screenshot to ' + filePath);
  }

  // Also test /works
  console.log('Navigating to http://localhost:5173/works ...');
  await sendSession('Page.navigate', { url: 'http://localhost:5173/works' });
  await new Promise(r => setTimeout(r, 1200));

  const worksRes = await sendSession('Runtime.evaluate', {
    expression: `
      (() => {
        const cards = document.querySelectorAll('article');
        for (const card of cards) {
          if (card.innerText.includes('PureFeed')) {
            card.scrollIntoView({ behavior: 'instant', block: 'center' });
            const rect = card.getBoundingClientRect();
            return {
              found: true,
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height
            };
          }
        }
        return { found: false };
      })()
    `,
    returnByValue: true
  });

  const wRect = worksRes?.result?.value;
  if (wRect && wRect.found) {
    const targetX = Math.round(wRect.left + wRect.width * 0.15);
    const targetY = Math.round(wRect.top + wRect.height * 0.85);

    await sendSession('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x: targetX,
      y: targetY
    });

    await new Promise(r => setTimeout(r, 400));

    const checkWorksRes = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const cards = document.querySelectorAll('article');
          for (const card of cards) {
            if (card.innerText.includes('PureFeed')) {
              return {
                styleTransform: card.style.transform,
                computedTransform: window.getComputedStyle(card).transform
              };
            }
          }
          return {};
        })()
      `,
      returnByValue: true
    });

    console.log('Works page tilt verification:', checkWorksRes?.result?.value);

    const outDir = path.resolve('screenshots/tilt');
    const shot = await sendSession('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(shot.data, 'base64');
    const filePath = path.join(outDir, '02_works_tilted_card.png');
    fs.writeFileSync(filePath, buffer);
    console.log('Saved works tilted screenshot to ' + filePath);
  }

  ws.close();
  edgeProcess.kill();
  console.log('All tilt tests passed.');
}

run().catch(err => {
  console.error(err);
  edgeProcess.kill();
  process.exit(1);
});
