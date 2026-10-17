import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function render() {
  mkdirSync('public', { recursive: true });

  console.log('Rendering Open Graph image...');
  const genOg = spawn(process.execPath, [resolve('scripts/generate-og-image.mjs')], { stdio: 'inherit' });
  await new Promise((res) => genOg.on('close', res));
  console.log('Open Graph image rendered successfully.');

  // Also copy resume.html to public
  const resumePath = resolve('scripts/resume-template.html');
  const resumeOutHtml = resolve('public/resume.html');
  copyFileSync(resumePath, resumeOutHtml);
  console.log('Copied resume.html to public/resume.html');

  // Print resume to PDF
  const resumeUrl = pathToFileURL(resumePath).href;
  const resumeOutPdf = resolve('public/resume.pdf');
  console.log('Rendering resume to PDF at', resumeOutPdf);
  const edgePdf = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    `--print-to-pdf=${resumeOutPdf}`,
    '--no-pdf-header-footer',
    resumeUrl
  ]);

  await new Promise((res) => edgePdf.on('close', res));
  console.log('Resume PDF rendered successfully.');
}

render().catch(console.error);
