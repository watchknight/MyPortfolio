ROLE
You are a senior product designer and creative frontend engineer working at Awwwards level. You are redesigning my live developer portfolio (https://watchknight-dev.onrender.com/ — the repo is this workspace). I'm a CS student in Dhaka applying for international remote internships. A recruiter gives the site about 10 seconds: who he is → proof (projects) → how to contact. The redesign must make that path obvious, look expensive, and feel alive, without getting slow or gimmicky.

HOW WE WORK
- One phase per prompt. Never start the next phase on your own.
- Start of each phase: post a short plan (files you'll touch). End of each phase: run the build, open the site in the browser tool at 1440px and 390px, screenshot it, fix what you see, then `git commit -m "phase-N: <summary>"`.
- Work on a branch: `git checkout -b redesign/v3`.
- Edit existing files. Do not rewrite the app in one pass. Do not migrate frameworks or change the router or build tooling. Put new code in `src/styles/` and `src/motion/` (adapt names to the real structure).
- Save this entire brief as /DESIGN.md. Re-read it at the start of every phase. If a later prompt conflicts with it, DESIGN.md wins unless I say otherwise.

KEEP — functional, must survive 1:1 (restyle only, never remove)
- Hero typewriter rotator and its four lines
- ⌘K command palette; terminal widget with quick-run chips; telemetry / "verified matrix" readouts
- Grid/Table project view toggle (G / T), Theme (D), Mute (M), Sys (S), Grain (F) — including keyboard shortcuts
- Project mock previews (PureFeed YouTube overlay, MediaPipe try-on)
- Guestbook signature canvas + "Save Badge" (ink presets switch to token colors: text, accent, control)
- Routes /works /foundation /resume /contact and the résumé PDF download
- The static prerendered / no-JS fallback
- All existing copy. Only exceptions: the template-chrome strings listed in Phase 3, and the new local-time and copy-email states.

CONCEPT
"Signal over noise." A calm deep-ink interface where one amber signal color marks what matters. Boldness lives in exactly two places: the hero type and the cursor's inspector behavior. Everything else stays quiet and disciplined.

TOKENS (dark is default; light via [data-theme="light"]; first visit follows prefers-color-scheme; persist the choice)
```css
:root, [data-theme="dark"] {
  color-scheme: dark;
  --bg:#0E1A36; --surface:#14244A; --raised:#1B2F5E;
  --line:#263A6A; --control:#5F78B2;
  --text:#F1EDE4; --muted:#A9B4CC; --subtle:#94A2C2;
  --accent:#FFB224; --accent-hover:#FFC247; --on-accent:#0E1A36;
  --invert-bg:#F1EDE4; --invert-text:#0E1A36;
  --focus:#FFB224; --ok:#5BD6A0;
}
[data-theme="light"] {
  color-scheme: light;
  --bg:#EEF1F7; --surface:#F8F9FC; --raised:#FFFFFF;
  --line:#D3DAE9; --control:#7684A6;
  --text:#0E1A36; --muted:#46557A; --subtle:#5A688F;
  --accent:#FFB224; --accent-hover:#FFC247; --on-accent:#0E1A36;
  --invert-bg:#0E1A36; --invert-text:#F1EDE4;
  --focus:#0E1A36; --ok:#0B7A4B;
}
:root {
  --font-sans:"Bricolage Grotesque Variable", system-ui, sans-serif;
  --font-mono:"JetBrains Mono Variable", ui-monospace, monospace;
  --r-xl:28px; --r-lg:20px; --r-md:12px; --r-pill:999px;
}
```
Amber (--accent) is a fill, dot, ring or underline. Never a text color.

TYPE
Bricolage Grotesque for everything (variable weight). JetBrains Mono only inside the terminal, telemetry and real numbers/metrics. Self-host with @fontsource-variable packages. Display: weight 700, letter-spacing -0.035em, line-height 0.95. Body: line-height 1.6, measure ≤ 62ch.

LAYOUT SYSTEM
- Grid: 12 cols ≥ 1024px, 6 cols 640–1023px, 1 col < 640px. Gap 16px (12px on mobile). Max width 1280px, side padding clamp(16px, 4vw, 48px).
- Tile materials — use all four, never a page of identical tiles: surface (--surface + 1px --line border), inverted (--invert-bg / --invert-text), accent (--accent / --on-accent, max ONE in view), media (edge-to-edge preview with 12px inner radius). No box-shadows on tiles; borders only.
- Radii: --r-xl feature tiles, --r-lg standard tiles, --r-md inner media and inputs, pill for buttons and chips. Never one radius for everything.
- Section titles are plain sentence-case h2s ("Selected work").

BANNED — these are the tells of a generated page, and exactly what my site looks like now
- bracketed or tracked-out ALL-CAPS eyebrow labels above headings ("[ selected projects ]"), "SYS_01 //" style meta strings, spaced em-dash labels, middle-dot meta strings
- monospace for anything except terminal, telemetry and real metrics
- near-black or pure-black backgrounds, cyan, neon, purple, gradient washes, glows
- grids of identical rounded cards with the same shadow
- fade-up on every section, hover animation on every card, "→" on every link, 01/02/03 numbering unless the content is a real sequence, coloring one word of a headline

MOTION BUDGET — five moments; nothing else moves on its own
1. Hero intro (≤ 1.4s, once per session).
2. Bento tiles reveal once on scroll (one batched stagger).
3. Cursor: trailing ring, magnetic pull, inspector snap (desktop pointer only).
4. Theme switch (circular reveal).
5. Feedback for user actions (copy, toggles, open/close, view switch).
Allowed ambient loops: the existing typewriter and terminal, plus one slow opacity pulse on the availability dot. prefers-reduced-motion removes everything except instant state changes. No smooth-scroll library (Lenis, ScrollSmoother) in this pass.

QUALITY FLOOR
- Lighthouse mobile: Performance ≥ 90; Accessibility, Best Practices, SEO ≥ 95 (aim for 100). LCP < 2.5s, CLS < 0.05, INP < 200ms. Initial JS ≤ ~200 KB gzip.
- WCAG AA contrast, visible focus (2px --focus ring, 2px offset), full keyboard parity, tap targets ≥ 44px, no hover-only functionality.
- Content is never hidden if JS fails. Animate transform and opacity only (exception: the desktop cursor ring).
