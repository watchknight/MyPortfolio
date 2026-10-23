import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const EXPECTED_ROUTES = [
  {
    path: '/',
    title: 'Abdur Rahman Moayed — Software Engineer & Systems Architect',
    description: 'Software engineer specializing in browser internals, systems-level security, and high-performance web architecture. Creator of PureFeed, FocusGuard, and DocLensBD.',
    canonical: 'https://watchknight-dev.onrender.com/',
    ogUrl: 'https://watchknight-dev.onrender.com/',
  },
  {
    path: '/works',
    title: 'Selected Works & Engineering Systems — Abdur Rahman Moayed',
    description: 'Production systems, browser engines, and web apps by Abdur Rahman Moayed: PureFeed (MV3 adblock countermeasures), FocusGuard (OS DNS sinkhole), Rannabanna, and DocLensBD.',
    canonical: 'https://watchknight-dev.onrender.com/works',
    ogUrl: 'https://watchknight-dev.onrender.com/works',
  },
  {
    path: '/foundation',
    title: 'Academic Background & Technical Skills — Abdur Rahman Moayed',
    description: 'B.Sc. in Computer Science & Engineering at East West University with Board General Merit Scholarships and Distinction. Specializing in C++, TypeScript, React, and Systems Engineering.',
    canonical: 'https://watchknight-dev.onrender.com/foundation',
    ogUrl: 'https://watchknight-dev.onrender.com/foundation',
  },
  {
    path: '/resume',
    title: 'Curriculum Vitae (Résumé) — Abdur Rahman Moayed',
    description: 'Verified engineering credentials, academic honors at East West University, production software projects, and technical skills in browser internals, systems security, and frontend architecture.',
    canonical: 'https://watchknight-dev.onrender.com/resume',
    ogUrl: 'https://watchknight-dev.onrender.com/resume',
  },
  {
    path: '/contact',
    title: 'Get in Touch & Direct Contact — Abdur Rahman Moayed',
    description: 'Send a message, copy direct email address, check current Dhaka local time (UTC+6), and view software engineering internship and freelance project availability.',
    canonical: 'https://watchknight-dev.onrender.com/contact',
    ogUrl: 'https://watchknight-dev.onrender.com/contact',
  },
];

function normalizeText(text) {
  return (text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .trim();
}

async function runCheck() {
  console.log('=== VALIDATING PRERENDERED ROUTES AGAINST LOCAL PREVIEW SERVER ===\n');

  const PORT = 4179;
  let server;
  try {
    server = await preview({
      root: rootDir,
      preview: {
        port: PORT,
      },
    });
  } catch (err) {
    console.error('Failed to start Vite preview server:', err);
    process.exit(1);
  }

  const actualPort = server.httpServer?.address()?.port || PORT;
  const baseUrl = server.resolvedUrls?.local?.[0]?.replace(/\/$/, '') || `http://localhost:${actualPort}`;
  let passed = 0;
  let failed = 0;

  function assert(condition, label, details = '') {
    if (condition) {
      console.log(`  ✓ PASS: ${label}${details ? ` [${details}]` : ''}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${label}${details ? ` [${details}]` : ''}`);
      failed++;
    }
  }

  try {
    for (const exp of EXPECTED_ROUTES) {
      console.log(`\n--- Validating Route: ${exp.path} ---`);
      const url = `${baseUrl}${exp.path}`;
      const res = await fetch(url);

      assert(res.status === 200, `${exp.path} returns HTTP 200`, `status: ${res.status}`);

      const html = await res.text();

      // Check root content
      const rootOpen = '<div id="root">';
      const rootIdx = html.indexOf(rootOpen);
      let rootContent = '';
      if (rootIdx !== -1) {
        const afterRoot = html.slice(rootIdx + rootOpen.length);
        const bodyCloseIdx = afterRoot.lastIndexOf('</body>');
        const innerHtml = bodyCloseIdx !== -1 ? afterRoot.slice(0, bodyCloseIdx) : afterRoot;
        const lastDivIdx = innerHtml.lastIndexOf('</div>');
        rootContent = (lastDivIdx !== -1 ? innerHtml.slice(0, lastDivIdx) : innerHtml).trim();
      }
      assert(rootContent.length > 200, `${exp.path} has non-empty prerendered DOM markup within #root`, `size: ${rootContent.length} chars`);

      // Check title
      const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
      const actualTitle = titleMatch ? normalizeText(titleMatch[1]) : '';
      assert(actualTitle === normalizeText(exp.title), `${exp.path} has correct <title>`, `expected: "${exp.title}", got: "${actualTitle}"`);

      // Check meta description
      const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
      const actualDesc = descMatch ? normalizeText(descMatch[1]) : '';
      assert(actualDesc === normalizeText(exp.description), `${exp.path} has correct <meta name="description">`, `got: "${actualDesc.slice(0, 60)}..."`);

      // Check canonical link
      const canMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([\s\S]*?)["']\s*\/?>/i);
      const actualCanonical = canMatch ? canMatch[1] : '';
      assert(actualCanonical === exp.canonical, `${exp.path} has correct <link rel="canonical">`, `got: "${actualCanonical}"`);

      // Check og:url
      const ogUrlMatch = html.match(/<meta\s+property=["']og:url["']\s+content=["']([\s\S]*?)["']\s*\/?>/i);
      const actualOgUrl = ogUrlMatch ? ogUrlMatch[1] : '';
      assert(actualOgUrl === exp.ogUrl, `${exp.path} has correct <meta property="og:url">`, `got: "${actualOgUrl}"`);

      // Check exactly one <h1>
      const h1Matches = html.match(/<h1[\s>]/gi) || [];
      assert(h1Matches.length === 1, `${exp.path} has exactly one <h1>`, `actual count: ${h1Matches.length}`);
    }

    console.log(`\n========================================`);
    console.log(`Route Verification Summary: ${passed} PASS, ${failed} FAIL`);
    console.log(`========================================\n`);

    if (failed > 0) {
      process.exit(1);
    }
  } finally {
    if (server) {
      await server.close();
    }
  }
}

runCheck().catch((err) => {
  console.error('Fatal error in check-routes:', err);
  process.exit(1);
});
