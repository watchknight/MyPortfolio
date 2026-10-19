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

SOUND CONTRACT
Concept: "Silence is the default; sound marks what matters." Same idea as the visuals: one signal, no noise.
1. Opt-in. Sound is OFF on every first visit. Nothing plays and no AudioContext exists until the visitor turns sound on (click, tap or M). A saved "on" is only re-armed: audio resumes on the visitor's next click, tap or key, without the intro sound.
2. Synthesized only. All audio comes from the Web Audio API in the files engine.js and sound.js. No audio files, no Howler, no Tone.js. Zero network cost, no licensing.
3. One key. Every pitch comes from D F G A C (D minor pentatonic = F major pentatonic). Dark theme = tonal centre D, low and warm. Light theme = tonal centre F, brighter. Same notes in both, so nothing clashes and a theme switch changes mood, not harmony.
4. Fixed vocabulary: tick, thump, pluck, swish, key, chime, ink, pad. No other sounds.
5. Space: all sounds share one synthesized reverb and pan to the on-screen x-position of whatever triggered them.
6. Quiet and safe: master limiter, fades on enable/disable (no pops), voice cap, rate limits. The audio context is suspended when the tab is hidden or sound is off. Hover sounds only for fine pointers. The ambient pad is off by default on touch devices and under prefers-reduced-motion.
7. Never the only feedback: every sound has a visual twin, and sound state changes are announced via aria-live.
8. Silence is design: no sound for page load, scrolling itself, keyboard focus, plain text hover, or typing in form fields outside the terminal.

ATMOSPHERE CONTRACT (dark theme)
Concept: "Blue hour." The page is a living blue field: ink-navy base, three slow pools of ultramarine, cobalt and azure light, fine grain. Amber is the only warm light.
1. Blues only. Every background color sits between hue 205° and 240°. No purple, magenta, green-teal or neon cyan.
2. Slow. Ambient motion cycles last 50 to 100 seconds. Nothing flickers or pulses quickly; only the pointer light reacts to the user.
3. Cheap. Only transform and opacity animate. No blur filters, no backdrop-filter, no animated gradient stops. At most 3 large composited layers (2 on touch) plus the pointer light.
4. Readable. Text on the bare atmosphere is --text or --muted only; --subtle is for tiles. scripts/check-atmosphere.mjs must pass.
5. Honest about time. The palette follows Dhaka time (night, dawn, day, dusk). ?phase=… forces one for testing.
6. Section-aware. The glow balance changes per section (hero, work, about, guestbook, contact) over 2.2 s.
7. Respectful. prefers-reduced-motion gives a static composition. A Controls switch ("Atmosphere") turns the motion off. Animation pauses when the tab is hidden. Dark theme only; the light theme is untouched.
8. Tiles stay opaque (--surface). Nothing over the atmosphere is translucent or blurred.
9. Media is graded blue: blacks lifted to the page navy, highlights warm to bone (SVG filter classes, media only).

PAGES CONTRACT (/works, /foundation, /resume, /contact)
Concept: "Same room, different corridors." Every inner page is built from the home page's parts. No page invents its own look.
1. One shell. All routes render inside the same layout: nav pill, atmosphere (mounted once, never restarted on navigation), <main data-section="…">, footer CTA band.
2. One header pattern: H1 at --fs-h1, weight 700, one color; a one-line intro (existing text); optional action row. Eyebrow labels above headings ("Portfolio & case studies", "Education & credentials", "Verified credentials", "Direct communication") are removed from the UI; the information stays in <title> and meta.
3. Bento everywhere: 12 cols ≥ 1024px, 6 cols 640–1023px, 1 col below; gap 16 (12 on mobile). Four tile materials (surface, inverted, accent — max one per viewport — media). Four radii. Hairlines, not shadows. One exception: the résumé sheet (a fixed bone "paper" tile with a soft shadow).
4. One signature moment per page and nothing else new: /works poster-first previews (one live at a time) plus Flip on filter and view change; /foundation a timeline line that draws with scroll; /resume the paper sheet and a perfect print; /contact copy-email feedback and form focus states.
5. Same behaviors as home: `data-tile` reveal (once), `data-magnetic` on buttons and links, `data-cursor="inspect"` on clickable tiles, sound hooks (copy and form success = chime, route change = swish, tile hover = tick with data-degree), grade classes on media.
6. Atmosphere by route through data-section on <main>: /works → work, /foundation → about, /resume → hero, /contact → contact.
7. Content survives. Removed as template chrome: eyebrow labels, the fake "system.local/preview" URL bars, and the repeated "Interactive Mock / Simulation ready / Tap or scroll…" lines. One dedup on /resume (JSC and PSC stay under Honors only). Nothing else is rewritten.
8. Print is a first-class output: /resume prints as clean black-on-white A4 with no site chrome.
9. Dark and light themes both work. No new dependencies unless a prompt names one.

