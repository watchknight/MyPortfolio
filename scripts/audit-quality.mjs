import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const tempProfile = join(tmpdir(), 'edge-portfolio-audit-' + Date.now());

async function run() {
  mkdirSync('screenshots/audit', { recursive: true });

  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9240',
    `--user-data-dir=${tempProfile}`,
    '--disable-gpu',
    'http://localhost:5173/'
  ]);

  await new Promise(r => setTimeout(r, 2000));
  const listRes = await fetch('http://127.0.0.1:9240/json/list');
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

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res.result?.result?.value;
  }

  await send('Page.enable');
  await send('Runtime.enable');
  await send('DOM.enable');

  const report = {};

  // ==========================================
  // 1. PERFORMANCE & LOAD METRICS
  // ==========================================
  console.log('--- 1. AUDITING PERFORMANCE METRICS ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 2000));

  report.performance = await evaluate(`
    (() => {
      const nav = performance.getEntriesByType('navigation')[0] || {};
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find(p => p.name === 'first-contentful-paint');
      const resources = performance.getEntriesByType('resource');
      
      return {
        domContentLoadedMs: Math.round(nav.domContentLoadedEventEnd - nav.startTime) || 0,
        loadTimeMs: Math.round(nav.loadEventEnd - nav.startTime) || 0,
        fcpMs: fcp ? Math.round(fcp.startTime) : 0,
        totalResources: resources.length,
        jsResources: resources.filter(r => r.initiatorType === 'script').length,
        cssResources: resources.filter(r => r.initiatorType === 'link' || r.initiatorType === 'css').length,
        totalTransferKb: Math.round((resources.reduce((acc, r) => acc + (r.transferSize || 0), 0)) / 1024)
      };
    })()
  `);
  console.log('Performance:', report.performance);

  // ==========================================
  // 2. ACCESSIBILITY & CONTRAST & SEMANTICS
  // ==========================================
  console.log('\n--- 2. AUDITING ACCESSIBILITY ---');
  report.accessibility = await evaluate(`
    (() => {
      const issues = [];
      
      // Images alt check
      const imgs = Array.from(document.querySelectorAll('img'));
      imgs.forEach(img => {
        if (!img.hasAttribute('alt')) issues.push('Image missing alt attribute: ' + img.src);
      });

      // Interactive names
      const buttons = Array.from(document.querySelectorAll('button'));
      buttons.forEach(btn => {
        const name = (btn.getAttribute('aria-label') || btn.innerText || '').trim();
        if (!name) issues.push('Button missing accessible name: ' + btn.outerHTML);
      });

      const links = Array.from(document.querySelectorAll('a'));
      links.forEach(a => {
        const name = (a.getAttribute('aria-label') || a.innerText || '').trim();
        if (!name) issues.push('Link missing accessible name: ' + a.href);
      });

      // Heading order
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        tag: h.tagName.toLowerCase(),
        level: parseInt(h.tagName[1]),
        text: h.innerText.slice(0, 35)
      }));

      // Landmarks
      const landmarks = {
        nav: !!document.querySelector('nav'),
        main: !!document.querySelector('main'),
        footer: !!document.querySelector('footer'),
        heroSection: !!document.querySelector('#hero'),
        engineeringSection: !!document.querySelector('#engineering'),
        interfacesSection: !!document.querySelector('#interfaces'),
        foundationSection: !!document.querySelector('#foundation'),
        contactSection: !!document.querySelector('#contact')
      };

      const focusables = Array.from(document.querySelectorAll('a, button, [tabindex]:not([tabindex="-1"])'));
      
      return {
        totalInteractive: focusables.length,
        totalButtons: buttons.length,
        totalLinks: links.length,
        headingsCount: headings.length,
        headings,
        landmarks,
        issuesCount: issues.length,
        issues
      };
    })()
  `);
  console.log('Accessibility:', {
    totalInteractive: report.accessibility?.totalInteractive,
    headingsCount: report.accessibility?.headingsCount,
    issuesCount: report.accessibility?.issuesCount,
    landmarks: report.accessibility?.landmarks
  });

  // ==========================================
  // 3. BEST PRACTICES & SEO
  // ==========================================
  console.log('\n--- 3. AUDITING SEO & BEST PRACTICES ---');
  report.seo = await evaluate(`
    (() => {
      const title = document.title;
      const metaDesc = document.querySelector('meta[name="description"]')?.content;
      const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
      const ogDesc = document.querySelector('meta[property="og:description"]')?.content;
      const ogImage = document.querySelector('meta[property="og:image"]')?.content;
      const twitterCard = document.querySelector('meta[property="twitter:card"]')?.content;
      const viewport = document.querySelector('meta[name="viewport"]')?.content;
      const themeColor = document.querySelector('meta[name="theme-color"]')?.content;
      const lang = document.documentElement.lang;
      const favicon = document.querySelector('link[rel*="icon"]')?.href;

      return {
        title,
        titleLength: title.length,
        metaDesc,
        metaDescLength: (metaDesc || '').length,
        ogTitle,
        ogDesc,
        ogImage,
        twitterCard,
        viewport,
        themeColor,
        lang,
        favicon
      };
    })()
  `);
  console.log('SEO & Meta:', report.seo);

  // ==========================================
  // 4. REDUCED MOTION
  // ==========================================
  console.log('\n--- 4. AUDITING PREFERS-REDUCED-MOTION ---');
  await send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
  });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  // Wait only 100ms
  await new Promise(r => setTimeout(r, 100));

  report.reducedMotion = await evaluate(`
    (() => {
      const overlay = document.querySelector('[class*="sweepOverlay"]');
      const main = document.querySelector('main');
      const hero = document.querySelector('#hero');
      const mainStyle = window.getComputedStyle(main || document.body);
      return {
        overlayRendered: !!overlay,
        mainFilter: mainStyle.filter,
        mainOpacity: mainStyle.opacity,
        heroRendered: !!hero,
        heroHeight: hero?.offsetHeight || 0
      };
    })()
  `);
  console.log('Reduced Motion Audit:', report.reducedMotion);

  const rmShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/audit/reduced_motion_check.png', Buffer.from(rmShot.result.data, 'base64'));

  // Reset media
  await send('Emulation.setEmulatedMedia', { features: [] });

  // ==========================================
  // 5. KEYBOARD-ONLY TAB NAVIGATION PASS
  // ==========================================
  console.log('\n--- 5. AUDITING KEYBOARD-ONLY TAB NAVIGATION ---');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'http://localhost:5173/' });
  await new Promise(r => setTimeout(r, 1800));

  const totalElements = report.accessibility?.totalInteractive || 20;
  const tabSequence = [];

  for (let i = 0; i < totalElements + 2; i++) {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9 });
    await new Promise(r => setTimeout(r, 60));

    const activeEl = await evaluate(`
      (() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const style = window.getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const hasVisibleOutline = (style.outlineStyle !== 'none' && parseInt(style.outlineWidth) > 0);
        const hasBoxShadow = style.boxShadow && style.boxShadow !== 'none';
        
        return {
          step: ${i + 1},
          tag: el.tagName.toLowerCase(),
          text: (el.innerText || el.getAttribute('aria-label') || '').trim().slice(0, 35),
          hasVisibleFocus: hasVisibleOutline || hasBoxShadow,
          outline: style.outline,
          boxShadow: style.boxShadow
        };
      })()
    `);

    if (activeEl) {
      tabSequence.push(activeEl);
    }
  }

  report.tabSequence = tabSequence;
  console.log(`Tabbed through ${tabSequence.length} interactive elements in sequence.`);
  const missingFocus = tabSequence.filter(t => !t.hasVisibleFocus);
  console.log(`Interactive elements missing visible focus ring: ${missingFocus.length}`);

  // Capture focused element on hero CTA
  const heroFocusShot = await send('Page.captureScreenshot', { format: 'png' });
  writeFileSync('screenshots/audit/focus_ring_capture.png', Buffer.from(heroFocusShot.result.data, 'base64'));

  // ==========================================
  // 6. EXACT RESPONSIVE BREAKPOINTS (375, 768, 1440)
  // ==========================================
  console.log('\n--- 6. AUDITING RESPONSIVE BREAKPOINTS (375, 768, 1440) ---');
  const breakpoints = [
    { name: 'mobile_375px', width: 375, height: 667, mobile: true },
    { name: 'tablet_768px', width: 768, height: 1024, mobile: true },
    { name: 'desktop_1440px', width: 1440, height: 900, mobile: false }
  ];

  const responsiveReport = [];
  for (const bp of breakpoints) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: bp.width,
      height: bp.height,
      deviceScaleFactor: bp.mobile ? 2 : 1,
      mobile: bp.mobile
    });
    await send('Page.navigate', { url: 'http://localhost:5173/' });
    await new Promise(r => setTimeout(r, 1800));

    const check = await evaluate(`
      (() => {
        const doc = document.documentElement;
        const body = document.body;
        const scrollWidth = Math.max(doc.scrollWidth, body.scrollWidth);
        const clientWidth = doc.clientWidth;
        const diff = scrollWidth - clientWidth;
        
        return {
          viewportWidth: ${bp.width},
          clientWidth,
          scrollWidth,
          hasHorizontalOverflow: diff > 1,
          overflowDeltaPx: Math.max(0, diff)
        };
      })()
    `);

    responsiveReport.push(check);
    console.log(`Breakpoint ${bp.name}:`, check);

    const shot = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(`screenshots/audit/${bp.name}_hero.png`, Buffer.from(shot.result.data, 'base64'));

    const fullShot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true });
    writeFileSync(`screenshots/audit/${bp.name}_full.png`, Buffer.from(fullShot.result.data, 'base64'));
  }
  report.responsive = responsiveReport;

  // Save complete audit report
  writeFileSync('screenshots/audit/quality-audit-report.json', JSON.stringify(report, null, 2));

  ws.close();
  edge.kill();
  console.log('\nQuality audit complete. Results saved to screenshots/audit/quality-audit-report.json');
}

run().catch(console.error);
