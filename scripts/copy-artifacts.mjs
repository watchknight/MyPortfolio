import fs from 'fs';
import path from 'path';

const destDir = 'C:\\Users\\Moayed\\.gemini\\antigravity\\brain\\e7ab17d9-d8ee-4733-9165-319bc25e47a3\\screenshots';
fs.mkdirSync(destDir, { recursive: true });

const files = [
  '01_hero_waypoint_dock.png',
  '02_foundation_ast_schema.png',
  '03_sys_diagnostic_modal.png',
  '04_command_palette_sys.png'
];

for (const f of files) {
  const src = path.join('screenshots', 'features', f);
  const dst = path.join(destDir, `features_${f}`);
  fs.copyFileSync(src, dst);
  console.log(`Copied ${src} -> ${dst}`);
}
