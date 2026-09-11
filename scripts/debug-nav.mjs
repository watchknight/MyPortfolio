import { spawn } from 'child_process';
import http from 'http';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-debug';
const port = 9339;

const edgeProcess = spawn(edgePath, [
  `--remote-debugging-port=${port}`,
  '--headless=new',
  `--user-data-dir=${userDataDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
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
    await new Promise(r => setTimeout(r, 1500));

    // Check all links on page
    const linksEval = await sendSession('Runtime.evaluate', {
      expression: `
        Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.getAttribute('href'),
          pathname: a.pathname
        }))
      `,
      returnByValue: true
    });
    console.log('Links found:', JSON.stringify(linksEval.result.value, null, 2));

    // Click Foundation link
    const clickEval = await sendSession('Runtime.evaluate', {
      expression: `
        (() => {
          const link = document.querySelector('a[href="/foundation"]');
          if (!link) return 'Link not found';
          link.click();
          return 'Clicked link, current path: ' + window.location.pathname;
        })()
      `,
      returnByValue: true
    });
    console.log('Click result:', clickEval.result.value);

    await new Promise(r => setTimeout(r, 1000));

    const pathAfter = await sendSession('Runtime.evaluate', {
      expression: `
        ({
          pathname: window.location.pathname,
          h1: document.querySelector('h1')?.textContent,
          hasTimeline: !!document.querySelector('[aria-label="Academic Timeline"]'),
          mainChildren: document.querySelector('main')?.innerHTML.slice(0, 300)
        })
      `,
      returnByValue: true
    });
    console.log('State after navigation:', JSON.stringify(pathAfter.result.value, null, 2));

    ws.close();
  } catch (err) {
    console.error(err);
  } finally {
    edgeProcess.kill();
  }
}

run();
