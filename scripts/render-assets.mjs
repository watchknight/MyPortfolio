import { spawn } from 'node:child_process';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

async function render() {
  mkdirSync('public', { recursive: true });

  const ogPath = resolve('scripts/og-template.html');
  const ogUrl = pathToFileURL(ogPath).href;
  const ogOut = resolve('public/og-image.png');

  console.log('Rendering Open Graph image to', ogOut);
  const edgeOg = spawn(edgePath, [
    '--headless=new',
    '--disable-gpu',
    `--screenshot=${ogOut}`,
    '--window-size=1200,630',
    '--hide-scrollbars',
    ogUrl
  ]);

  await new Promise((res) => edgeOg.on('close', res));
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
