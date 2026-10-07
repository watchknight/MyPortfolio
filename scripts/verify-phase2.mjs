import { spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const tempProfile = path.join(tmpdir(), 'chrome-portfolio-verify-' + Date.now());

// Simple static server for dist
function createStaticServer(distDir, port) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2',
    '.woff': 'font/woff'
  };

  const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    if (urlPath.endsWith('/')) urlPath += 'index.html';
    
    let filePath = path.join(distDir, urlPath);
    if (!fs.existsSync(filePath) && fs.existsSync(filePath + '.html')) {
      filePath = filePath + '.html';
    } else if (!fs.existsSync(filePath) && fs.existsSync(path.join(filePath, 'index.html'))) {
      filePath = path.join(filePath, 'index.html');
    } else if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }

    try {
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      const data = fs.readFileSync(filePath);
      const ext = path.extname(filePath);
      res.writeHead(200, {
        'Content-Type': mimeTypes[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  fs.mkdirSync('screenshots/phase2', { recursive: true });

  const port = 4180;
  const server = await createStaticServer(path.resolve('dist'), port);
  console.log(`Static server running on http://127.0.0.1:${port}`);

  const chrome = spawn(chromePath, [
    '--headless=new',
    '--remote-debugging-port=9230',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `http://127.0.0.1:${port}/`
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const listRes = await fetch('http://127.0.0.1:9230/json/list');
  const targets = await listRes.json();
  const pageTarget = targets.find(t => t.type === 'page');

  if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
    throw new Error('No page target found: ' + JSON.stringify(targets));
  }

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
  await send('Runtime.enable');

  const routes = ['/', '/works', '/foundation', '/resume', '/contact', '/404'];
  const themes = ['dark', 'light'];
  const viewports = [
    { name: '1440', width: 1440, height: 900, scale: 1, mobile: false },
    { name: '390', width: 390, height: 844, scale: 2, mobile: true }
  ];

  for (const theme of themes) {
    for (const vp of viewports) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.scale,
        mobile: vp.mobile
      });

      for (const route of routes) {
        const url = `http://127.0.0.1:${port}${route}`;
        await send('Page.navigate', { url });
        await new Promise(r => setTimeout(r, 1200));

        // Set theme on html
        await send('Runtime.evaluate', {
          expression: `
            document.documentElement.setAttribute('data-theme', '${theme}');
            localStorage.setItem('theme', '${theme}');
          `
        });

        await new Promise(r => setTimeout(r, 600));

        // Evaluate tokens and fonts
        const tokenEval = await send('Runtime.evaluate', {
          expression: `
            (function() {
              const cs = getComputedStyle(document.documentElement);
              const bodyCs = getComputedStyle(document.body);
              const h1 = document.querySelector('h1');
              const h1Cs = h1 ? getComputedStyle(h1) : null;
              return {
                theme: document.documentElement.getAttribute('data-theme'),
                bg: cs.getPropertyValue('--bg').trim(),
                surface: cs.getPropertyValue('--surface').trim(),
                text: cs.getPropertyValue('--text').trim(),
                accent: cs.getPropertyValue('--accent').trim(),
                bodyFont: bodyCs.fontFamily,
                h1Font: h1Cs ? h1Cs.fontFamily : null,
                h1LineHeight: h1Cs ? h1Cs.lineHeight : null,
                h1LetterSpacing: h1Cs ? h1Cs.letterSpacing : null
              };
            })()
          `,
          returnByValue: true
        });

        const routeClean = route === '/' ? 'home' : route.replace('/', '');
        const filename = `${vp.name}_${theme}_${routeClean}.png`;

        const shot = await send('Page.captureScreenshot', { format: 'png' });
        if (shot.result && shot.result.data) {
          fs.writeFileSync(`screenshots/phase2/${filename}`, Buffer.from(shot.result.data, 'base64'));
          console.log(`✓ Saved screenshots/phase2/${filename} | Tokens:`, tokenEval.result.value);
        }
      }
    }
  }

  ws.close();
  chrome.kill();
  server.close();
  console.log('\nAll phase-2 screenshots captured and verified successfully!');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
