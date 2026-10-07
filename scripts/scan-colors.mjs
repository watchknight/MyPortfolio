import fs from 'node:fs';
import path from 'node:path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

const files = walk('src').concat(['index.html']);
const hexRegex = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const rgbRegex = /rgba?\([^)]+\)/g;
const hslRegex = /hsla?\([^)]+\)/g;

let count = 0;
const fileSummary = {};

for (const f of files) {
  if (f.endsWith('tokens.css')) continue;
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const hexMatches = line.match(hexRegex) || [];
    const rgbMatches = line.match(rgbRegex) || [];
    const hslMatches = line.match(hslRegex) || [];
    const all = [...hexMatches, ...rgbMatches, ...hslMatches];
    if (all.length > 0) {
      if (!fileSummary[f]) fileSummary[f] = [];
      fileSummary[f].push({ line: idx + 1, content: line.trim(), matches: all });
      count += all.length;
    }
  });
}

console.log('Files with color matches:');
for (const [file, items] of Object.entries(fileSummary)) {
  console.log(`\n=== ${file} (${items.length} lines) ===`);
  items.slice(0, 10).forEach(i => console.log(`  L${i.line}: ${i.content}`));
  if (items.length > 10) console.log(`  ... and ${items.length - 10} more lines`);
}
console.log(`\nTotal occurrences: ${count}`);
