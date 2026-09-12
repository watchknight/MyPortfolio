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

  const routes = [
    { path: '/', title: 'Moayed Portfolio — Creative Engineer & Systems Architect' },
    { path: '/works', title: 'Works — Moayed Portfolio' },
    { path: '/foundation', title: 'Foundation — Moayed Portfolio' },
    { path: '/resume', title: 'Resume — Moayed Portfolio' },
    { path: '/contact', title: 'Contact — Moayed Portfolio' },
  ];

  console.log('⚡ Prerendering static HTML for routes...');

  for (const route of routes) {
    const { html } = render(route.path);

    // Replace root container
    let pageHtml = template.replace(
      '<div id="root"></div>',
      `<div id="root">${html}</div>`
    );

    // Update title
    pageHtml = pageHtml.replace(
      /<title>.*?<\/title>/,
      `<title>${route.title}</title>`
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
