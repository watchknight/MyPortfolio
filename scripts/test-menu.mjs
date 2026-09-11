import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempProfile = join(tmpdir(), 'edge-portfolio-profile-menu-' + Date.now());

async function run() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    'http://localhost:5173/'
  ]);
  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9230/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('edge://')) || targets[0];
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
  };
  function send(method, params = {}) {
    return new Promise(res => { const msgId = id++; pending.set(msgId, res); ws.send(JSON.stringify({ id: msgId, method, params })); });
  }

  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1800));

  // Click hamburger button
  await send('Runtime.evaluate', { expression: 'document.querySelector("button[aria-label=\\"Open navigation\\"]").click()' });
  await new Promise(r => setTimeout(r, 300));

  const shot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/mobile_menu_open.png', Buffer.from(shot.result.data, 'base64'));
  console.log('Saved mobile_menu_open.png');

  ws.close();
  edge.kill();
}
run().catch(console.error);
