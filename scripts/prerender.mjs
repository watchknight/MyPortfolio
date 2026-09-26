import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

async function prerender() {
  console.log('⚡ Building SSR bundle with Vite...');
  await build({
    root: rootDir,
    build: {
      ssr: 'src/entry-server.tsx',
      outDir: 'dist-ssr',
      rollupOptions: {
        output: {
          format: 'esm',
        },
      },
    },
  });

  const ssrEntryPath = path.resolve(rootDir, 'dist-ssr', 'entry-server.js');
  const { render } = await import(pathToFileURL(ssrEntryPath).href);

  const templatePath = path.resolve(rootDir, 'dist', 'index.html');
  if (!fs.existsSync(templatePath)) {
    throw new Error('Client build template dist/index.html not found! Run vite build first.');
  }
  const template = fs.readFileSync(templatePath, 'utf-8');

  const SITE_URL = (process.env.VITE_SITE_URL || 'https://moayed.onrender.com').replace(/\/$/, '');

  const routes = [
    {
      path: '/',
      title: 'Abdur Rahman Moayed — Software Engineer & Systems Architect',
      description: 'Software engineer specializing in browser internals, systems-level security, and high-performance web architecture. Creator of PureFeed, FocusGuard, and DocLensBD.',
    },
    {
      path: '/works',
      title: 'Selected Works & Engineering Systems — Abdur Rahman Moayed',
      description: 'Production systems, browser engines, and web apps by Abdur Rahman Moayed: PureFeed (MV3 adblock countermeasures), FocusGuard (OS DNS sinkhole), Rannabanna, and DocLensBD.',
    },
    {
      path: '/foundation',
      title: 'Academic Background & Technical Skills — Abdur Rahman Moayed',
      description: 'B.Sc. in Computer Science & Engineering at East West University with Board General Merit Scholarships and Distinction. Specializing in C++, TypeScript, React, and Systems Engineering.',
    },
    {
      path: '/resume',
      title: 'Curriculum Vitae (Résumé) — Abdur Rahman Moayed',
      description: 'Verified engineering credentials, academic honors at East West University, production software projects, and technical skills in browser internals, systems security, and frontend architecture.',
    },
    {
      path: '/contact',
      title: 'Get in Touch & Direct Contact — Abdur Rahman Moayed',
      description: 'Send a message, copy direct email address, check current Dhaka local time (UTC+6), and view software engineering internship and freelance project availability.',
    },
    {
      path: '/404',
      title: 'Signal Void // 404 — Abdur Rahman Moayed',
      description: 'Sector unmapped. The requested coordinate or resource does not exist on this ledger. Telemetry indicates zero packets received.',
    },
  ];

  console.log('⚡ Prerendering static HTML for routes...');

  for (const route of routes) {
    const { html } = render(route.path);
    const canonicalUrl = `${SITE_URL}${route.path === '/' ? '/' : route.path}`;

    // Replace root container
    let pageHtml = template.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );

    // Update <title>
    pageHtml = pageHtml.replace(
      /<title>.*?<\/title>/,
      `<title>${route.title}</title>`
    );

    // Update <meta name="title" ...>
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="title" content="${route.title}" />`
    );

    // Update <meta name="description" ...>
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="description" content="${route.description}" />`
    );

    // Update <link rel="canonical" ...>
    pageHtml = pageHtml.replace(
      /<link\s+rel=["']canonical["']\s+href=["'].*?["']\s*\/?>/i,
      `<link rel="canonical" href="${canonicalUrl}" />`
    );

    // Update OpenGraph tags
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:title" content="${route.title}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:description" content="${route.description}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+property=["']og:url["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="og:url" content="${canonicalUrl}" />`
    );

    // Update Twitter tags
    pageHtml = pageHtml.replace(
      /<meta\s+(?:name|property)=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="twitter:title" content="${route.title}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:title["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="twitter:title" content="${route.title}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+(?:name|property)=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta property="twitter:description" content="${route.description}" />`
    );
    pageHtml = pageHtml.replace(
      /<meta\s+name=["']twitter:description["']\s+content=["'].*?["']\s*\/?>/i,
      `<meta name="twitter:description" content="${route.description}" />`
    );

    let outDir = path.resolve(rootDir, 'dist');
    if (route.path !== '/') {
      outDir = path.resolve(rootDir, 'dist', route.path.replace(/^\//, ''));
      fs.mkdirSync(outDir, { recursive: true });
    }

    const outFile = path.resolve(outDir, 'index.html');
    fs.writeFileSync(outFile, pageHtml, 'utf-8');
    const sizeKb = (Buffer.byteLength(pageHtml, 'utf-8') / 1024).toFixed(2);
    console.log(`  ✓ ${route.path.padEnd(12)} -> ${path.relative(rootDir, outFile)} (${sizeKb} KB)`);

    if (route.path !== '/') {
      const flatOutFile = path.resolve(rootDir, 'dist', `${route.path.replace(/^\//, '')}.html`);
      fs.writeFileSync(flatOutFile, pageHtml, 'utf-8');
      console.log(`  ✓ ${route.path.padEnd(12)} -> ${path.relative(rootDir, flatOutFile)}`);
    }
  }

  // Clean up dist-ssr
  fs.rmSync(path.resolve(rootDir, 'dist-ssr'), { recursive: true, force: true });
  console.log('✨ Static Site Prerendering complete!\n');
}

prerender().catch((err) => {
  console.error('❌ Prerender failed:', err);
  process.exit(1);
});
