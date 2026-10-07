# Portfolio Architecture & Design Audit

**Audit Date**: October 2026  
**Audited Target**: [watchknight-dev.onrender.com](https://watchknight-dev.onrender.com/)  
**Auditor**: Senior Product Designer & Creative Frontend Engineer  
**Reference Specification**: `/DESIGN.md`  

---

## 1. Technical Stack & Deployment Architecture

| Dimension | Implementation | Technical Details |
| :--- | :--- | :--- |
| **Framework** | React 19 (`react` 19.2.8, `react-dom` 19.2.8) | Modern React architecture, functional components, hooks, React Server DOM ready. |
| **Bundler & Tooling** | Vite 8.3.0 + TypeScript 6.0.2 + Oxlint 1.81.0 | Fast ESM development; production client + SSR builds via Rollup engine. |
| **Router** | Custom Client Router (`src/hooks/useRouter.ts`) | Lightweight zero-dependency router utilizing `window.history.pushState` and `popstate` event listeners. Handles routes: `/`, `/works`, `/foundation`, `/resume`, `/contact`, `/404`. |
| **Styling Paradigm** | CSS Modules (`*.module.css`) + Plain CSS | Scoped styling per component, global primitives in `src/styles/` (`global.css`, `tokens.css`, `reset.css`, `fonts.css`). **Zero Tailwind CSS** configured or installed. |
| **Animation Libraries** | `motion` 13.2.0 (`motion/react`) + `lenis` 1.3.26 | Framer Motion / Motion One primitives combined with Lenis smooth-scrolling runtime and custom HTML5 Canvas / RAF loops. |
| **Build & Scripts** | `npm run build` | Chain: `tsc -b && vite build && node scripts/prerender.mjs`. |
| **SSG Prerendering** | Two-pass Node pipeline (`scripts/prerender.mjs`) | Builds client bundle to `dist/`, builds SSR bundle to `dist-ssr/` via `src/entry-server.tsx`, renders static HTML for all 6 routes, injects SEO meta into `dist/index.html`, outputs both flat `.html` and route folders, then removes `dist-ssr/`. |
| **Deploy Target** | Render Static Site (`render.yaml`) | Service type: `web`, environment: `static`, publish path: `./dist`, rewrites `/*` &rarr; `/index.html`. Strict CSP, HSTS, and security headers declared. |

*(Note: There is no native `/browser` tool in this agent environment; visual audit was conducted by driving headless Chrome via automation against the live production URL https://watchknight-dev.onrender.com/ at 1440×900 and 390×844 viewports).*

---

## 2. Visual & Section-by-Section Inspection

Audit conducted directly on live deployment `https://watchknight-dev.onrender.com/` across desktop (1440×900) and mobile (390×844).

```
Captured Screenshots Archive:
├── screenshots/audit_live/00_full_page_1440.png
├── screenshots/audit_live/00_full_page_390.png
├── screenshots/audit_live/01_hero_1440.png
├── screenshots/audit_live/01_hero_390.png
├── screenshots/audit_live/02_featured_work_1440.png
├── screenshots/audit_live/02_featured_work_390.png
├── screenshots/audit_live/03_education_1440.png
├── screenshots/audit_live/03_education_390.png
├── screenshots/audit_live/04_guestbook_1440.png
├── screenshots/audit_live/04_guestbook_390.png
├── screenshots/audit_live/05_contact_1440.png
└── screenshots/audit_live/05_contact_390.png
```

### Section 1: Hero & Introduction (`01_hero_1440.png`, `01_hero_390.png`)
- **Dated / Unpolished Elements**:
  - **Particle Text Deflection**: "Hi, This is Moayed. I build fast, reliable software." is rendered as a noisy grid of cyan and emerald dots. It is illegible on initial render, distracting to recruiters, and feels like a 2018 WebGL gimmick rather than high-end product typography.
  - **Cyan Overload**: Neon cyan (`#3FBFA0`) is heavily applied to CTA buttons, live text clauses, dots, and borders.
  - **Text Color Misuse**: The rotating typewriter clause is displayed directly in bright cyan text ("blocks deep digital distraction."), violating the cardinal rule: signal color is strictly fill, dot, ring, or underline—never text.
  - **Sci-Fi Chrome**: Strings like `DHAKA_SENTINEL_NODE // v2.4.0-PROD INITIALIZED`, `QUICK RUN:`, and `HUD [⌘K]` give the site a robotic AI-generated look rather than an intentional engineer's portfolio.
  - **Competing Badges**: Dual status pills ("Available for Internships" in nav, "Available for Internships & Projects" in hero) create visual clutter.

### Section 2: Featured Projects (`02_featured_work_1440.png`, `02_featured_work_390.png`)
- **Dated / Unpolished Elements**:
  - **Banned Eyebrow**: Monospace tracked-out uppercase eyebrow `[ selected projects ]` above the heading.
  - **Banned Serial Identifiers**: `SYS_01 // MV3` and `SYS_03 // 3D_TRYON` chip labels.
  - **Homogeneous Cards**: Both project cards share identical dark card backgrounds with cyan borders and heavy box-shadows. The 4 material archetypes (surface, inverted, accent, media) are absent.
  - **Mobile Header Collision**: On 390px mobile, the `Grid [G] / Table [T]` toggle and `View all 6 projects ->` wrap abruptly, colliding with the section title.
  - **Strong Foundations (To Preserve)**: The PureFeed YouTube live simulator and the DocLensBD MediaPipe 3D webcam try-on widget are high-proof demos that showcase real capability.

### Section 3: Education & Academic Record (`03_education_1440.png`, `03_education_390.png`)
- **Dated / Unpolished Elements**:
  - **Banned Eyebrow**: `[ academic record ]` label.
  - **Sci-Fi Radar Sweep**: Background has animated concentric radar rings with GPS coordinates (`DHAKA [23.8103°N, 90.4125°E]`) and sweep sweeps, cluttering the background.
  - **Monospace Link Text**: `Explore my skills & coursework ->` in monospace font with trailing arrow.
  - **Corner Chamfers**: Cutout mechanical card corners on the container card look dated.

### Section 4: Visitor Guestbook Canvas (`04_guestbook_1440.png`, `04_guestbook_390.png`)
- **Dated / Unpolished Elements**:
  - **Banned Eyebrow & Copy**: `[ interactive guestbook ]` and "Sign or sketch with neon digital ink".
  - **Arbitrary Ink Palette**: Presets use "Verdigris", "Celadon", "Copper", and "Sage" instead of token colors (Text, Accent, Control).
  - **Footer Chrome**: Monospace telemetry string `VIRTUAL HARDWARE RASTERIZER // 60 FPS` and `WAITING FOR INPUT`.
  - **Strong Foundations (To Preserve)**: Interactive signature drawing canvas, clear, and "Save Badge" PNG download work reliably.

### Section 5: Contact Strip (`05_contact_1440.png`, `05_contact_390.png`)
- **Dated / Unpolished Elements**:
  - **Static & Generic**: Lacks urgency or tactile polish. Missing local Dhaka time display and one-click "Copy Email" active state.
  - **Overlap with Floating Dock**: The bottom shortcuts dock directly covers the CTA button on smaller laptop screens and mobile viewports.

---

## 3. Inventory of Animations, Effects & Interactive Widgets

| Component | File | Trigger | What It Does | Status under DESIGN.md |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Typewriter** | `src/components/RotatingClause/` | Mount / Interval | Cycles 4 capability clauses with zero-CLS grid stack. | **KEEP** (Restyle typography and color; amber signal underline/dot) |
| **Command Palette** | `src/components/CommandPalette/` | `⌘K` or click | Keyboard navigation palette for all routes, actions, and projects. | **KEEP** (Restyle to deep-ink tokens) |
| **Terminal Sandbox** | `src/components/HeroSandbox/` | Mount / User Input | Interactive terminal with quick-run chips (`whoami`, `projects`, etc.). | **KEEP** (Restyle, strip `SYS_` strings, retain chips) |
| **Telemetry / Matrix** | `src/components/HeroSandbox/` | Tab Click | Real-time FPS counter, Dhaka clock, ping jitter, verified matrix readout. | **KEEP** (Restyle to JetBrains Mono & deep-ink) |
| **View Toggle (Grid/Table)** | `src/pages/Home/`, `src/pages/Works/` | `G` / `T` / Button | Toggles project cards between 3D Grid and Data Ledger Table. | **KEEP** (Preserve 1:1 including shortcuts) |
| **Shortcuts Dock** | `src/components/ShortcutsDock/` | Keyboard / Fixed HUD | Global shortcuts: `D` (Theme), `M` (Mute), `S` (Sys), `F` (Grain), `⌘K` (Palette). | **KEEP** (Restyle to calm floating pill) |
| **Project Simulators** | `src/components/ProjectSimulator/` | User interaction | PureFeed YouTube adblock toggle + DocLensBD 3D frame selector. | **KEEP** (Preserve 1:1) |
| **Guestbook Canvas** | `src/components/SignatureCanvas/` | Pointer drag / Click | Digital ink signature pad + "Save Badge" PNG export. | **KEEP** (Switch ink presets to Text, Accent, Control tokens) |
| **Audio Feedback** | `src/utils/audio.ts` | User actions / `M` key | Synthesized Web Audio API sound fx on click, tick, toggle. | **KEEP** (Preserve sound system) |
| **Prerender / No-JS** | `scripts/prerender.mjs`, `index.html` | Build time / No JS | Static HTML prerendering for all 6 routes + `<noscript>` fallback. | **KEEP** (Preserve 1:1) |
| **ParticleText** | `src/components/ParticleText/` | Canvas RAF / Mouse | Deflects text into thousands of pixel particles on mouse move. | **REMOVE / BANNED** (Replace with bold Bricolage Grotesque) |
| **SignalSweep** | `src/components/SignalSweep/` | Mount | Blurs entire viewport with 6px blur and sweeps horizontal line. | **REMOVE / BANNED** (Violates motion budget; causes LCP/CLS regressions) |
| **RadarSweep** | `src/components/RadarSweep/` | Scroll / Observer | Animated rotating radar sweep with sci-fi grid overlay. | **REMOVE / BANNED** |
| **ScrambleText** | `src/components/ScrambleText/` | Mount / Hover | Matrix-style character scrambling effect on headings. | **REMOVE / BANNED** (Violates "Signal over noise" clarity) |
| **CanvasGrid** | `src/components/CanvasGrid/` | Canvas RAF / Mouse | Floating interactive node constellation on global background. | **REMOVE / BANNED** (Unnecessary GPU overhead and visual noise) |
| **SpotlightCard** | `src/components/SpotlightCard/` | Mouse move / Tilt | 3D perspective tilt and radial mouse gradient on cards. | **REPLACE** with 4 borders-only bento tile materials |
| **Lenis Smooth Scroll** | `src/App.tsx`, `package.json` | Global scroll | Virtual smooth scrolling library. | **REMOVE / BANNED** ("No smooth-scroll library in this pass") |

---

## 4. Hardcoded Styling Values to Replace

A comprehensive static grep across `src/` revealed significant token fragmentation:

### Hardcoded Hex Colors (151 occurrences across 28 files)
- **Cyan / Teal / Emerald Legacy Accents**: `#3FBFA0` (22 files), `#7EC9B5`, `#2A8C74`, `#1F7A62`, `#237A65`, `#00FF00`
- **Copper / Amber**: `#C48850`, `#8B5A2E`, `#D4A24B`, `#A07830`
- **Near-Blacks & Grays**: `#101114`, `#0C0D10`, `#090A0D`, `#0E0F13`, `#18191E`, `#1E1F24`, `#26272D`, `#2C2D33`, `#3D3D39`, `#5C5C57`, `#626260`, `#8C8C84`, `#95958D`, `#B0B0AB`, `#E5E5E1`, `#EDEDEA`, `#EFEFE9`, `#F7F7F5`, `#ffffff`, `#000`
- **Error / Danger**: `#D45B5B`, `#B84040`, `#D63031`

### Hardcoded Alpha Overlays (222 occurrences of `rgba()`)
- Heavy usage of `rgba(63, 191, 160, ...)` (cyan glow washes)
- Heavy usage of `rgba(0, 0, 0, 0.45)` to `0.85` (multi-layered card drop shadows)
- Heavy usage of `rgba(229, 229, 225, 0.13)` (border lines)

### Hardcoded Box Shadows (96 rules)
- Drop shadows on cards (`--card-shadow`, `--card-shadow-hover`, `0 20px 40px -15px rgba(0,0,0,0.65)`).
- DESIGN.md mandate: **"No box-shadows on tiles; borders only."**

### Hardcoded Border Radii (192 rules)
- Random arbitrary radii across components: `3px`, `4px`, `6px`, `7px`, `8px`, `10px`, `12px`, `14px`, `16px`, `18px`, `24px`.
- Must be unified into the DESIGN.md 4-tier radius system:
  - `--r-xl: 28px` (feature tiles)
  - `--r-lg: 20px` (standard tiles)
  - `--r-md: 12px` (inner media, inputs)
  - `--r-pill: 999px` (buttons, chips)

---

## 5. Baseline Performance & Web Vitals Audit

Audited via Lighthouse 13.5.0 Mobile (`--form-factor=mobile --screenEmulation.mobile`) directly against production endpoints.

### Route: `/` (Home Page)
- **Performance Score**: **76 / 100** *(Quality Floor: &ge; 90)*
- **Largest Contentful Paint (LCP)**: **2.4 s** *(Quality Floor: &lt; 2.5 s)*
- **Cumulative Layout Shift (CLS)**: **0.397** ⚠️ **FAIL** *(Quality Floor: &lt; 0.05)*
- **Total Blocking Time (TBT)**: **50 ms** *(Quality Floor: &lt; 200 ms)*
- **Accessibility**: **100 / 100**
- **Best Practices**: **100 / 100**
- **SEO**: **100 / 100**

### Route: `/works` (Selected Works Page)
- **Performance Score**: **49 / 100** ⚠️ **CRITICAL FAIL** *(Quality Floor: &ge; 90)*
- **Largest Contentful Paint (LCP)**: **2.6 s** *(Quality Floor: &lt; 2.5 s)*
- **Cumulative Layout Shift (CLS)**: **1.055** ⚠️ **SEVERE REGRESSION** *(Quality Floor: &lt; 0.05)*
- **Total Blocking Time (TBT)**: **750 ms** ⚠️ **HIGH LATENCY** *(Quality Floor: &lt; 200 ms)*
- **Accessibility**: **100 / 100**
- **Best Practices**: **100 / 100**
- **SEO**: **100 / 100**

### Bundle Size Analysis
- **Main Client Bundle (`dist/assets/index-*.js`)**:
  - Raw uncompressed: `463.12 KB`
  - Gzip compressed: `143.24 KB` *(Target: &le; ~200 KB gzip &check;)*
- **CSS Bundle (`dist/assets/index-*.css`)**:
  - Raw: `94.16 KB`
  - Gzip: `18.79 KB`

### Causes of Layout Shifts (CLS = 0.397 & 1.055)
1. **SignalSweep blur filter and animated curtain on mount** shifts the rendered document geometry.
2. **ParticleText canvas container** reflows when dot-matrix layout recalculates after font metrics load.
3. **Card Spotlight tilt transforms** trigger compositing recalculations during mobile touch initialization.
4. **Font swaps** between fallback system fonts and un-subsetted webfonts.

---

## 6. Document `<head>` & Metadata Audit

Inspection of `index.html` and `scripts/prerender.mjs`:

| Tag / Property | Current Value | Discrepancy / Problem |
| :--- | :--- | :--- |
| **`canonical`** | `https://moayed.onrender.com/` | **Domain Mismatch**: Live production domain is `https://watchknight-dev.onrender.com/`. |
| **`og:url`** | `https://moayed.onrender.com/` | **Domain Mismatch**: Points to legacy domain. |
| **`og:image`** | `https://moayed.onrender.com/og-image.png` | Points to nonexistent asset on legacy host. |
| **`description`** | *"Software engineer specializing in browser internals, systems-level security, and high-performance web architecture. B.Sc. in Computer Science & Engineering at East West University."* | Mentions university credentials. |
| **`og:description`** | *"Software engineer specializing in browser internals, systems-level security, and high-performance web architecture. Creator of PureFeed, FocusGuard, and Rannabanna."* | Disagrees with `description`; mentions `Rannabanna`. |
| **`twitter:description`** | Same as `og:description` | Disagrees with standard meta description. |
| **`prerender.mjs` root description** | *"...Creator of PureFeed, FocusGuard, and DocLensBD."* | Disagrees with `index.html`; lists `DocLensBD` instead of `Rannabanna`. |

---

## 7. Ranked Problems

### Priority 0: Critical Performance Regressions
1. **Massive Cumulative Layout Shift (CLS 0.397 on `/`, 1.055 on `/works`)**: Completely breaches Google Core Web Vitals and Quality Floor (&lt; 0.05). Caused by `SignalSweep` blur curtain, particle text canvas mounting, and unconstrained image/mock containers.
2. **Mobile CPU Throttling on `/works` (Score 49, TBT 750ms)**: Multiple canvas/RAF loops and heavy 3D card tilt event listeners destroy mobile rendering frame rates.

### Priority 1: Visual Language & Brand Tells
3. **Pervasive AI/Sci-Fi Template Tropes**: Bracketed tracked-out eyebrows (`[ selected projects ]`, `[ academic record ]`), `SYS_01 //` serial numbers, radar sweeping lines, and GPS coordinates make the portfolio look like a generic sci-fi template rather than an authentic engineer's portfolio.
4. **Color & Typography Fragmentation**: Monospace used indiscriminately across headings and links; bright cyan text on dark titanium creates harsh, uncalibrated contrast; amber signal color is entirely absent.
5. **Metadata & Domain Inconsistencies**: Canonical, OpenGraph, and Twitter tags point to `moayed.onrender.com` rather than `watchknight-dev.onrender.com`, with conflicting project descriptions.

### Priority 2: Interaction & Accessibility Polish
6. **Smooth Scroll Hijack (Lenis)**: Lenis smooth scroll delays touch responsiveness on mobile and degrades INP. Must be removed per DESIGN.md.
7. **Dock Overlap on Viewport**: The fixed keyboard shortcuts dock hovers over footer buttons on short viewports and mobile devices.
8. **Recruiter Path Friction**: Above-the-fold does not provide an immediate 10-second recruiter path (Who he is &rarr; Proof &rarr; How to contact). It is blocked by particle scattering and terminal gizmos.

---

## 8. Risks for Upcoming Phases

1. **Prerender Pipeline Fragility**: Removing components or altering route templates could break `scripts/prerender.mjs` or cause SSR hydration mismatches. Every phase must verify both client and SSR build passes.
2. **CLS Regression During Font Switch**: Switching to Bricolage Grotesque and JetBrains Mono could cause layout shifts if `font-display: swap` is unmanaged or line-heights are uncalibrated.
3. **Keyboard Shortcut Preservation**: Stripping dated dock styles must preserve all shortcut listeners (`G`, `T`, `D`, `M`, `S`, `F`, `⌘K`) without regression.
4. **Signal Amber Color Discipline**: High risk of accidentally using amber (`--accent: #FFB224`) on body text or secondary labels. Must strictly enforce: amber is fill, dot, ring, or underline only.

---

*(Phase 1 Audit Complete. No redesign code changes proposed. Awaiting Phase 2 brief).*
