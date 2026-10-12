import { readFileSync } from "node:fs";

// usage: node scripts/check-atmosphere.mjs [atmosphere.css] [tokens.css]
const atmoCss = readFileSync(process.argv[2] ?? "src/styles/atmosphere.css", "utf8");
const tokCss = readFileSync(process.argv[3] ?? "src/styles/tokens.css", "utf8");

const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lin = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (base, top, a) => base.map((v, i) => v * (1 - a) + top[i] * a);
const vars = (body) =>
  Object.fromEntries([...body.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(([, k, v]) => [k, v.trim()]));

const phases = {};
for (const [, sel, body] of atmoCss.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (sel.trim().startsWith("@") || !/--sky-bot\s*:/.test(body)) continue;
  const m = sel.match(/data-phase="(\w+)"/);
  phases[m ? m[1] : "night"] = { ...(m ? phases.night : {}), ...vars(body) };
}
const dark = vars(tokCss.match(/:root,\s*\[data-theme="dark"\]\s*\{([^}]*)\}/)?.[1] ?? "");
if (!phases.night || !dark.text || !dark.muted) {
  console.error("Could not read the night phase or the --text/--muted tokens");
  process.exit(2);
}

// Text on the bare atmosphere must stay readable at the brightest point of each glow (full alpha, full pulse).
// Use --text or --muted on bare background; --subtle is for tiles only.
let failed = 0;
for (const [name, p] of Object.entries(phases)) {
  for (const g of ["a", "b", "c"]) {
    const spot = over(rgb(p["sky-bot"]), rgb(p[`glow-${g}`]), Number(p[`alpha-${g}`]));
    for (const [tok, min] of [["text", 7], ["muted", 4.5]]) {
      const r = ratio(rgb(dark[tok]), spot);
      if (r < min) failed++;
      console.log(`${r >= min ? "PASS" : "FAIL"} ${name.padEnd(5)} glow-${g} ${tok.padEnd(5)} ${r.toFixed(2)} (min ${min})`);
    }
  }
}
console.log(failed ? `\n${failed} failing check(s)` : "\nAll atmosphere contrast checks passed");
process.exit(failed ? 1 : 0);
