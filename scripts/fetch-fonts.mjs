import https from 'https';
import fs from 'fs';
import path from 'path';

const fontsDir = 'd:/Projects/Portfolio/public/fonts';
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function downloadBinary(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('Fetching Google Fonts CSS...');
  const instrumentCss = await fetchText('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
  const geistCss = await fetchText('https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap');

  console.log('Instrument Sans CSS length:', instrumentCss.length);
  console.log('Geist CSS length:', geistCss.length);

  // Extract woff2 URLs for latin subsets
  function extractUrls(css) {
    const blocks = css.split('@font-face').slice(1);
    const fonts = [];
    for (const b of blocks) {
      if (b.includes('latin')) {
        const weightMatch = b.match(/font-weight:\s*([^;]+);/);
        const urlMatch = b.match(/url\((https:\/\/[^)]+\.woff2)\)/);
        if (weightMatch && urlMatch) {
          fonts.push({ weight: weightMatch[1].trim(), url: urlMatch[1] });
        }
      }
    }
    return fonts;
  }

  const instFonts = extractUrls(instrumentCss);
  const geistFonts = extractUrls(geistCss);

  console.log('Instrument Fonts found:', instFonts);
  console.log('Geist Fonts found:', geistFonts);

  // Download the primary files
  if (instFonts.length > 0) {
    // Instrument Sans is a variable font (400 to 700) or individual weights
    for (let i = 0; i < instFonts.length; i++) {
      const f = instFonts[i];
      const filename = `instrument-sans-${f.weight.replace(/\s+/g, '-')}.woff2`;
      console.log(`Downloading ${filename} from ${f.url}...`);
      await downloadBinary(f.url, path.join(fontsDir, filename));
    }
  }

  if (geistFonts.length > 0) {
    for (let i = 0; i < geistFonts.length; i++) {
      const f = geistFonts[i];
      const filename = `geist-${f.weight.replace(/\s+/g, '-')}.woff2`;
      console.log(`Downloading ${filename} from ${f.url}...`);
      await downloadBinary(f.url, path.join(fontsDir, filename));
    }
  }

  console.log('All fonts downloaded to', fontsDir);
  console.log('Files:', fs.readdirSync(fontsDir));
}

run().catch(console.error);
