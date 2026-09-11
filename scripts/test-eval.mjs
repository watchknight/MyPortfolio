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
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2500));

  // 1. Capture Hero modern state
  const heroShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/hero_modern.png', Buffer.from(heroShot.result.data, 'base64'));
  console.log('Saved screenshots/hero_modern.png');

  // 2. Click Role Tab 2 ("02 // KERNEL & NET")
  await send('Runtime.evaluate', {
    expression: `(() => {
      const tabs = Array.from(document.querySelectorAll('button[role="tab"]'));
      tabs[1]?.click();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));
  const roleShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/hero_role_switched.png', Buffer.from(roleShot.result.data, 'base64'));
  console.log('Saved screenshots/hero_role_switched.png');

  // 3. Hover over the first InsightNode ("digital countermeasures")
  await send('Runtime.evaluate', {
    expression: `(() => {
      const trigger = document.querySelector('span[role="button"][aria-label*="digital countermeasures"]');
      trigger?.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
      trigger?.focus();
    })()`
  });
  await new Promise(r => setTimeout(r, 800));
  const insightShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/hero_insight_hover.png', Buffer.from(insightShot.result.data, 'base64'));
  console.log('Saved screenshots/hero_insight_hover.png');

  // 4. Test Mobile viewport (390x844)
  await send('Emulation.setDeviceMetricsOverride', {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true
  });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));
  const mobileShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/hero_mobile.png', Buffer.from(mobileShot.result.data, 'base64'));
  console.log('Saved screenshots/hero_mobile.png');

  ws.close();
  edge.kill();
}
run().catch(console.error);
