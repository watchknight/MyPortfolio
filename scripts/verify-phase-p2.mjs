import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('=== PHASE P2 VERIFICATION: SHARED SHELL ===\n');

let passes = 0;
let fails = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passes++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    fails++;
  }
}

// 1. Verify prerendered HTML files exist
const routes = [
  { path: '/', file: 'index.html', title: 'Abdur Rahman Moayed — Software Engineer & Systems Architect', section: undefined, cta: true },
  { path: '/works', file: 'works/index.html', title: 'Selected Works & Engineering Systems — Abdur Rahman Moayed', section: 'work', cta: true },
  { path: '/foundation', file: 'foundation/index.html', title: 'Academic Background & Technical Skills — Abdur Rahman Moayed', section: 'about', cta: true },
  { path: '/resume', file: 'resume/index.html', title: 'Curriculum Vitae (Résumé) — Abdur Rahman Moayed', section: 'hero', cta: true },
  { path: '/contact', file: 'contact/index.html', title: 'Get in Touch & Direct Contact — Abdur Rahman Moayed', section: 'contact', cta: false },
];

for (const r of routes) {
  const filePath = path.join(distDir, r.file);
  assert(fs.existsSync(filePath), `Prerender file exists: ${r.file}`);
  const html = fs.readFileSync(filePath, 'utf-8');

  // Verify atmosphere
  assert(html.includes('<div class="atmo" aria-hidden="true">'), `${r.path}: contains .atmo layer`);
  assert(html.includes('class="atmo__blob atmo__blob--a"'), `${r.path}: contains .atmo blobs`);

  // Verify main and data-section
  assert(html.includes('id="main-content"'), `${r.path}: contains main#main-content`);
  if (r.section) {
    assert(html.includes(`data-section="${r.section}"`), `${r.path}: main has data-section="${r.section}"`);
  }

  // Verify Nav aria-current="page"
  if (r.path !== '/') {
    const hasAriaCurrent = new RegExp(`href="${r.path}"[^>]*aria-current="page"`).test(html);
    assert(hasAriaCurrent, `${r.path}: nav link has aria-current="page"`);
  }

  // Verify PageHeader on sub-pages
  if (r.path !== '/') {
    assert(html.includes('class="page__header"'), `${r.path}: renders PageHeader (.page__header)`);
    assert(html.includes('class="page__title"'), `${r.path}: renders PageHeader h1 (.page__title)`);
    assert(html.includes('class="page__intro"'), `${r.path}: renders PageHeader intro (.page__intro)`);
  }

  // Verify no eyebrow in sub-pages
  if (r.path !== '/') {
    const hasEyebrow = /class="[^"]*eyebrow[^"]*"/.test(html);
    assert(!hasEyebrow, `${r.path}: no eyebrow label found`);
  }

  // Verify Footer CTA card presence/absence
  const hasCtaCard = html.includes('class="_contactCard_') || html.includes('Let&#39;s build something');
  if (r.cta) {
    assert(hasCtaCard, `${r.path}: footer CTA card is rendered`);
  } else {
    assert(!hasCtaCard, `${r.path}: footer CTA card is omitted on /contact`);
  }

  // Verify noscript banner has design token styling
  assert(html.includes('var(--surface)'), `${r.path}: noscript banner uses design token var(--surface)`);
}

// 2. Check sections.js and hooks wiring
const sectionsJs = fs.readFileSync(path.join(rootDir, 'src/lib/sections.js'), 'utf-8');
assert(sectionsJs.includes('export function onSection('), 'sections.js exports onSection');
assert(sectionsJs.includes('export function refreshSections('), 'sections.js exports refreshSections');

const atmoJs = fs.readFileSync(path.join(rootDir, 'src/motion/atmosphere.js'), 'utf-8');
assert(atmoJs.includes("onSection((name) => balance(name))"), 'atmosphere.js listens to onSection');

const hooksJs = fs.readFileSync(path.join(rootDir, 'src/audio/hooks.js'), 'utf-8');
assert(hooksJs.includes("onSection((name) => sound.section(name))"), 'hooks.js listens to onSection');

// 3. Check CSS utilities
const globalCss = fs.readFileSync(path.join(rootDir, 'src/styles/global.css'), 'utf-8');
assert(globalCss.includes('.page {'), 'global.css defines .page utility');
assert(globalCss.includes('.page__header {'), 'global.css defines .page__header');
assert(globalCss.includes('.page__intro {'), 'global.css defines .page__intro');
assert(globalCss.includes('.bento {'), 'global.css defines .bento grid system');

// 4. Check Resume content dedup (JSC & PSC exclusively under Honors)
const resumeHtml = fs.readFileSync(path.join(distDir, 'resume/index.html'), 'utf-8');
const educationSection = resumeHtml.split('Education</h3>')[1]?.split('Featured projects</h3>')[0] || '';
assert(!educationSection.includes('Junior School Certificate'), 'resume: JSC removed from Education section');
assert(!educationSection.includes('Primary School Certificate'), 'resume: PSC removed from Education section');
const honorsSection = resumeHtml.split('Honors &amp; awards</h3>')[1] || '';
assert(honorsSection.includes('JSC Class 8'), 'resume: JSC present in Honors & awards');
assert(honorsSection.includes('PSC Class 5'), 'resume: PSC present in Honors & awards');

// 5. Check FooterBand scroll-margin-top
const footerCss = fs.readFileSync(path.join(rootDir, 'src/components/FooterBand/FooterBand.module.css'), 'utf-8');
assert(footerCss.includes('scroll-margin-top: calc(var(--nav-height) + 1.5rem);'), 'FooterBand defines scroll-margin-top');

// 6. Check useRouter hash preservation
const useRouterTs = fs.readFileSync(path.join(rootDir, 'src/hooks/useRouter.ts'), 'utf-8');
assert(useRouterTs.includes('targetUrl = to'), 'useRouter preserves full targetUrl with hash');

console.log(`\n========================================`);
console.log(`TOTAL CHECKS: ${passes + fails} | PASSES: ${passes} | FAILS: ${fails}`);
console.log(`========================================`);

if (fails > 0) {
  process.exit(1);
}
