import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempProfile = join(tmpdir(), 'edge-research-' + Date.now());
mkdirSync('screenshots/research', { recursive: true });

const sites = [
  { name: 'm4hdi', url: 'https://m4hdi.codes/' },
  { name: 'zahid', url: 'https://main-portfolio-eight-iota.vercel.app/' },
  { name: 'jason', url: 'https://jasondhaki-dev.vercel.app/' },
  { name: 'anik', url: 'https://api-render-5a59.onrender.com/' },
];

async function inspectSites() {
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9246',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9246/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise(r => { ws.onopen = r; });

  let id = 1;
  const pending = new Map();
  ws.onmessage = (msg) => {
    const data = JSON.parse(msg.data);
    if (data.id && pending.has(data.id)) {
      pending.get(data.id)(data.result || data);
      pending.delete(data.id);
    }
  };
  function send(method, params = {}) {
    return new Promise(r => {
      const msgId = id++;
      pending.set(msgId, r);
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

  for (const site of sites) {
    console.log(`Navigating to ${site.name} (${site.url})...`);
    try {
      await send('Page.navigate', { url: site.url });
      await new Promise(r => setTimeout(r, 5000));

      const titleRes = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
      const textSummary = await send('Runtime.evaluate', {
        expression: `(() => {
          const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4, nav, button, [role="tab"], .badge, .tag, a'));
          const texts = elements.map(el => el.innerText.trim()).filter(t => t && t.length < 80);
          return {
            title: document.title,
            sampleHeadings: Array.from(new Set(texts)).slice(0, 40)
          };
        })()`,
        returnByValue: true
      });

      console.log(`[${site.name}] Title:`, titleRes.result?.value);
      console.log(`[${site.name}] Highlights:`, textSummary.result?.value?.sampleHeadings?.slice(0, 8));
      writeFileSync(`screenshots/research/${site.name}_summary.json`, JSON.stringify(textSummary.result?.value, null, 2));

      const shot = await send('Page.captureScreenshot', { format: 'png' });
      const imgBuffer = Buffer.from(shot.data, 'base64');
      writeFileSync(`screenshots/research/${site.name}_desktop.png`, imgBuffer);
      console.log(`Saved screenshots/research/${site.name}_desktop.png (${imgBuffer.length} bytes)`);

      // Scroll 800px down and capture mid section
      await send('Runtime.evaluate', { expression: 'window.scrollBy(0, 800)' });
      await new Promise(r => setTimeout(r, 1200));
      const midShot = await send('Page.captureScreenshot', { format: 'png' });
      if (midShot.data) {
        writeFileSync(`screenshots/research/${site.name}_mid.png`, Buffer.from(midShot.data, 'base64'));
        console.log(`Saved screenshots/research/${site.name}_mid.png`);
      }
    } catch (err) {
      console.error(`Error processing ${site.name}:`, err);
    }
  }

  ws.close();
  edge.kill();
  console.log('Research inspection complete.');
}

inspectSites().catch(console.error);
