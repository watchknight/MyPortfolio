import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempProfile = join(tmpdir(), 'edge-portfolio-profile-' + Date.now());

async function run() {
  mkdirSync('screenshots', { recursive: true });
  
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9229',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9229/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('edge://')) || targets.find(t => t.type === 'page') || targets[0];
  
  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    throw new Error('No page target found: ' + JSON.stringify(targets));
  }

  console.log('Connected to target:', pageTarget.title, pageTarget.url);
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data);
      pending.delete(data.id);
    }
  };

  function send(method, params = {}) {
    return new Promise((resolve) => {
      const msgId = id++;
      pending.set(msgId, resolve);
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  await send('Page.enable');

  const devices = [
    { name: 'desktop', width: 1440, height: 900, mobile: false, scale: 1 },
    { name: 'tablet', width: 768, height: 1024, mobile: true, scale: 1 },
    { name: 'mobile', width: 390, height: 844, mobile: true, scale: 2 },
  ];

  for (const dev of devices) {
    console.log(`Setting device metrics for ${dev.name}...`);
    await send('Emulation.setDeviceMetricsOverride', {
      width: dev.width,
      height: dev.height,
      deviceScaleFactor: dev.scale,
      mobile: dev.mobile
    });
    
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    // Wait for the Signal Sweep load animation to fully complete
    await new Promise(r => setTimeout(r, 2000));

    // 1. Capture above-the-fold viewport
    const vpShot = await send('Page.captureScreenshot', { format: 'png' });
    if (vpShot.result && vpShot.result.data) {
      writeFileSync(`screenshots/${dev.name}_viewport.png`, Buffer.from(vpShot.result.data, 'base64'));
      console.log(`Saved ${dev.name}_viewport.png`);
    }

    // 2. Capture full scrollable page
    const fullShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    if (fullShot.result && fullShot.result.data) {
      writeFileSync(`screenshots/${dev.name}_full.png`, Buffer.from(fullShot.result.data, 'base64'));
      console.log(`Saved ${dev.name}_full.png`);
    }
  }

  ws.close();
  edge.kill();
  console.log('Finished capturing all devices successfully.');
}

run().catch(console.error);
