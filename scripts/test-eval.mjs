import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempProfile = join(tmpdir(), 'edge-portfolio-eval-' + Date.now());

async function run() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9238',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9238/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('edge://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
  };
  function send(method, params = {}) {
    return new Promise(r => { const msgId = id++; pending.set(msgId, r); ws.send(JSON.stringify({ id: msgId, method, params })); });
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });
  await new Promise(r => setTimeout(r, 2000));

  // Scroll to engineering (CaseStudy section)
  await send('Runtime.evaluate', { expression: 'document.getElementById("engineering")?.scrollIntoView({ behavior: "instant" })' });
  await new Promise(r => setTimeout(r, 1200));
  const worksShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/works_bento.png', Buffer.from(worksShot.result.data, 'base64'));
  console.log('Saved screenshots/works_bento.png');

  // Scroll down more to see the second row (DocLensBD, POSHRA, Sentinel Portfolio)
  await send('Runtime.evaluate', { expression: 'window.scrollBy(0, 650)' });
  await new Promise(r => setTimeout(r, 1200));
  const worksRow2Shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/works_bento_row2.png', Buffer.from(worksRow2Shot.result.data, 'base64'));
  console.log('Saved screenshots/works_bento_row2.png');

  // Click on Rannabanna's Inspect Anatomy button to open modal
  await send('Runtime.evaluate', {
    expression: `(() => {
      const btns = Array.from(document.querySelectorAll('button[data-cursor="inspect"]'));
      btns[2]?.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 1200));
  const modalShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/modal_live.png', Buffer.from(modalShot.result.data, 'base64'));
  console.log('Saved screenshots/modal_live.png');

  // Close modal with Escape
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await new Promise(r => setTimeout(r, 600));

  // Scroll to foundation
  await send('Runtime.evaluate', { expression: 'document.getElementById("foundation")?.scrollIntoView({ behavior: "instant" })' });
  await new Promise(r => setTimeout(r, 1000));
  const foundationShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/foundation_timeline.png', Buffer.from(foundationShot.result.data, 'base64'));
  console.log('Saved screenshots/foundation_timeline.png');

  // Scroll a bit down in foundation to verify Class 5 (2015)
  await send('Runtime.evaluate', { expression: 'window.scrollBy(0, 350)' });
  await new Promise(r => setTimeout(r, 1000));
  const foundationBottomShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/foundation_class5.png', Buffer.from(foundationBottomShot.result.data, 'base64'));
  console.log('Saved screenshots/foundation_class5.png');

  ws.close();
  edge.kill();
}
run().catch(console.error);
