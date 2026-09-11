import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempProfile = join(tmpdir(), 'edge-portfolio-test-' + Date.now());

async function run() {
  mkdirSync('screenshots/tests', { recursive: true });

  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9231',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9231/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page' && !t.url.startsWith('edge://')) || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(res => { ws.onopen = res; });

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
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false
  });

  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1800));

  // Scroll to engineering section
  await send('Runtime.evaluate', {
    expression: `
      document.querySelector('#engineering').scrollIntoView({ behavior: 'instant' });
    `
  });
  await new Promise(r => setTimeout(r, 600));

  // 1. Switch to Table Ledger view
  console.log('Testing table view toggle...');
  await send('Runtime.evaluate', {
    expression: `
      const tableBtn = document.querySelector('button[aria-label="Table ledger view"]');
      if (tableBtn) tableBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const tableShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/tests/01_table_view.png', Buffer.from(tableShot.result.data, 'base64'));
  console.log('Saved 01_table_view.png');

  // 2. Open Inspector Drawer for PureFeed
  console.log('Testing inspector sheet open...');
  await send('Runtime.evaluate', {
    expression: `
      const buttons = Array.from(document.querySelectorAll('button'));
      const inspectBtn = buttons.find(b => b.textContent.trim() === 'Inspect' || b.textContent.includes('Inspect Anatomy'));
      if (inspectBtn) inspectBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const modalShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/tests/02_inspector_sheet.png', Buffer.from(modalShot.result.data, 'base64'));
  console.log('Saved 02_inspector_sheet.png');

  // 3. Switch to code tab
  console.log('Testing code tab...');
  await send('Runtime.evaluate', {
    expression: `
      const codeTab = Array.from(document.querySelectorAll('button[role="tab"]')).find(b => b.textContent.includes('Code'));
      if (codeTab) codeTab.click();
    `
  });
  await new Promise(r => setTimeout(r, 400));

  const codeShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/tests/03_code_tab.png', Buffer.from(codeShot.result.data, 'base64'));
  console.log('Saved 03_code_tab.png');

  // 4. Close modal and switch theme to Studio Light
  console.log('Testing light mode theme switch...');
  await send('Runtime.evaluate', {
    expression: `
      const closeBtn = document.querySelector('button[aria-label="Close command sheet"]');
      if (closeBtn) closeBtn.click();
      const themeBtn = document.querySelector('button[aria-label*="Studio Light"]');
      if (themeBtn) themeBtn.click();
    `
  });
  await new Promise(r => setTimeout(r, 600));

  const lightShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/tests/04_studio_light.png', Buffer.from(lightShot.result.data, 'base64'));
  console.log('Saved 04_studio_light.png');

  ws.close();
  edge.kill();
  console.log('Finished interaction verification.');
}

run().catch(console.error);
