import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const port = 9365;
const userDataDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\edge-profile-scroll-test';

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

  const outDir = path.resolve('screenshots/modals');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log('=== TEST 1: Command Palette Scrolling and ESC Click ===');

  // Open Command Palette
  await sendSession('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('toggle-command-palette'))`
  });
  await new Promise(r => setTimeout(r, 400));

  // Verify modal is open and body scroll is locked
  const cpOpenState = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"][aria-label="Command Deck"]');
      const escBtn = document.querySelector('[class*="escButton"]');
      const list = document.querySelector('[class*="resultsList"]');
      return {
        isOpen: Boolean(dialog),
        bodyOverflow: document.body.style.overflow,
        htmlOverflow: document.documentElement.style.overflow,
        hasEscBtn: Boolean(escBtn),
        escBtnTag: escBtn?.tagName,
        escBtnCursor: escBtn ? window.getComputedStyle(escBtn).cursor : null,
        listScrollHeight: list?.scrollHeight,
        listClientHeight: list?.clientHeight,
        initialListScrollTop: list?.scrollTop,
        windowScrollY: window.scrollY
      };
    })()`,
    returnByValue: true
  });
  console.log('Command Palette Initial State:', cpOpenState.result.value);

  // Dispatch wheel event on the results list
  const listRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const list = document.querySelector('[class*="resultsList"]');
      const rect = list.getBoundingClientRect();
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`,
    returnByValue: true
  });

  const { x: listX, y: listY } = listRect.result.value;

  // Scroll down by 250px on list
  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: listX,
    y: listY,
    deltaX: 0,
    deltaY: 250
  });
  await new Promise(r => setTimeout(r, 300));

  const cpAfterScroll = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const list = document.querySelector('[class*="resultsList"]');
      return {
        listScrollTop: list?.scrollTop,
        windowScrollY: window.scrollY
      };
    })()`,
    returnByValue: true
  });
  console.log('Command Palette After Wheel:', cpAfterScroll.result.value);

  // Capture screenshot of scrolled command palette
  let shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '01_command_palette_scroll.png'), Buffer.from(shot.data, 'base64'));

  // Test ESC button click by mouse
  const escBtnRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[class*="escButton"]');
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`,
    returnByValue: true
  });
  const { x: escX, y: escY } = escBtnRect.result.value;

  await sendSession('Input.dispatchMouseEvent', { type: 'mousePressed', x: escX, y: escY, button: 'left', clickCount: 1 });
  await sendSession('Input.dispatchMouseEvent', { type: 'mouseReleased', x: escX, y: escY, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 400));

  const cpClosedState = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      return {
        dialogExists: Boolean(document.querySelector('[role="dialog"][aria-label="Command Deck"]')),
        bodyOverflow: document.body.style.overflow,
        htmlOverflow: document.documentElement.style.overflow
      };
    })()`,
    returnByValue: true
  });
  console.log('Command Palette After Clicking ESC Button:', cpClosedState.result.value);


  console.log('\n=== TEST 2: Case Study Modal Scrolling and ESC Click ===');

  // Open Case Study Modal
  await sendSession('Runtime.evaluate', {
    expression: `window.dispatchEvent(new CustomEvent('open-project-modal', { detail: 'purefeed' }))`
  });
  await new Promise(r => setTimeout(r, 400));

  const csOpenState = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const dialog = document.querySelector('[role="dialog"][aria-labelledby="modal-project-title"]');
      const closeBtn = document.querySelector('[class*="closeBtn"]');
      const content = document.querySelector('[class*="contentBody"]');
      const closeKbd = closeBtn?.querySelector('[class*="closeKbd"]');
      return {
        isOpen: Boolean(dialog),
        bodyOverflow: document.body.style.overflow,
        htmlOverflow: document.documentElement.style.overflow,
        hasCloseBtn: Boolean(closeBtn),
        closeKbdText: closeKbd?.textContent,
        contentScrollHeight: content?.scrollHeight,
        contentClientHeight: content?.clientHeight,
        initialContentScrollTop: content?.scrollTop,
        windowScrollY: window.scrollY
      };
    })()`,
    returnByValue: true
  });
  console.log('Case Study Modal Initial State:', csOpenState.result.value);

  // Switch to tab 2 (Engineering Challenges) which has overflowing content
  await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const tabs = document.querySelectorAll('[class*="tabBtn"]');
      if (tabs[1]) tabs[1].click();
    })()`
  });
  await new Promise(r => setTimeout(r, 300));

  // Dispatch wheel events on content body
  const csContentRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const content = document.querySelector('[class*="contentBody"]');
      const r = content.getBoundingClientRect();
      return {
        x: r.x + r.width / 2,
        y: r.y + r.height / 2,
        scrollHeight: content?.scrollHeight,
        clientHeight: content?.clientHeight
      };
    })()`,
    returnByValue: true
  });
  console.log('Case Study Modal Tab 2 Metrics:', csContentRect.result.value);
  const { x: csX, y: csY } = csContentRect.result.value;

  // Scroll down by 350px on content
  await sendSession('Input.dispatchMouseEvent', {
    type: 'mouseWheel',
    x: csX,
    y: csY,
    deltaX: 0,
    deltaY: 350
  });
  await new Promise(r => setTimeout(r, 300));

  const csAfterScroll = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const content = document.querySelector('[class*="contentBody"]');
      return {
        contentScrollTop: content?.scrollTop,
        windowScrollY: window.scrollY
      };
    })()`,
    returnByValue: true
  });
  console.log('Case Study Modal After Wheel:', csAfterScroll.result.value);

  // Capture screenshot of scrolled case study
  shot = await sendSession('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(path.join(outDir, '02_casestudy_modal_scroll.png'), Buffer.from(shot.data, 'base64'));

  // Test ESC close button click by mouse
  const csCloseBtnRect = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      const btn = document.querySelector('[class*="closeBtn"]');
      const r = btn.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()`,
    returnByValue: true
  });
  const { x: closeX, y: closeY } = csCloseBtnRect.result.value;

  await sendSession('Input.dispatchMouseEvent', { type: 'mousePressed', x: closeX, y: closeY, button: 'left', clickCount: 1 });
  await sendSession('Input.dispatchMouseEvent', { type: 'mouseReleased', x: closeX, y: closeY, button: 'left', clickCount: 1 });
  await new Promise(r => setTimeout(r, 400));

  const csClosedState = await sendSession('Runtime.evaluate', {
    expression: `(() => {
      return {
        dialogExists: Boolean(document.querySelector('[role="dialog"][aria-labelledby="modal-project-title"]')),
        bodyOverflow: document.body.style.overflow,
        htmlOverflow: document.documentElement.style.overflow
      };
    })()`,
    returnByValue: true
  });
  console.log('Case Study Modal After Clicking ESC Button:', csClosedState.result.value);

  ws.close();
  edgeProcess.kill();
  console.log('\nAll modal scroll & click tests finished successfully.');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  edgeProcess.kill();
  process.exit(1);
});
