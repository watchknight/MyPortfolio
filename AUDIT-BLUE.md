# Audit & Atmosphere Contract Baseline (Phase B1)

**Audit Date**: October 2026  
**Audited Target**: [watchknight-dev.onrender.com](https://watchknight-dev.onrender.com/) (Local Workspace Production Dist)  
**Specification Reference**: `/DESIGN.md` (Updated with `ATMOSPHERE CONTRACT`)  
**Phase Identifier**: `BLUE — PHASE B1: AUDIT AND CONTRACT`  

---

## 1. Background, Stacking, & Painting Architecture Audit

### 1.1 How the Page Background is Painted Today
The page background is currently rendered via a single flat base color token applied directly to `<body>`, coordinated with head metadata and pre-paint script guards:

- **HTML Meta & Pre-Paint Theme Initialization (`index.html`)**:
  - Head theme metadata:
    ```html
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0E1A36" />
    <meta name="theme-color" media="(prefers-color-scheme: light)" content="#EEF1F7" />
    <meta name="theme-color" content="#0E1A36" />
    ```
  - Zero-flash inline theme boot script (`index.html` lines 18–35):
    Executes synchronously prior to first layout/paint, evaluating `localStorage.getItem('theme')` and `window.matchMedia('(prefers-color-scheme: light)')`. It sets `document.documentElement.setAttribute('data-theme', theme)` and `document.documentElement.setAttribute('data-grain', 'true')` (on fine pointer devices).
- **`<html>` Element (`src/styles/global.css`)**:
  - CSS rule:
    ```css
    html {
      color-scheme: dark light;
      scroll-behavior: smooth;
      overflow-x: clip;
      max-width: 100vw;
    }
    ```
  - Background styling: **None** (transparent default).
- **`<body>` Element (`src/styles/global.css`)**:
  - CSS rule:
    ```css
    body {
      font-family: var(--font-sans);
      font-size: var(--fs-body);
      font-weight: 400;
      line-height: 1.6;
      color: var(--text);
      background-color: var(--bg);
      font-variant-numeric: tabular-nums;
      overflow-x: clip;
      max-width: 100vw;
      transition: background-color var(--duration-normal) var(--ease-default),
                  color var(--duration-normal) var(--ease-default);
    }
    ```
  - Background styling: Solid `var(--bg)` (`#0E1A36` in dark theme). Smooth transition (`260ms cubic-bezier(0.25, 0.1, 0.25, 1)`) on theme toggle.
- **Root Wrappers & Viewport Hierarchy**:
  - `<div id="root">`: Unstyled container; inherits `body` background.
  - `<main id="main-content">` (`src/styles/global.css` lines 334–340):
    ```css
    #main-content {
      position: relative;
      z-index: 1;
      min-height: 100vh;
      min-height: 100svh;
      outline: none;
    }
    ```
    Background styling: **None** (100% transparent).
  - Page Route Containers:
    - `.homeContainer` (`HomePage.module.css`): `position: relative; width: 100%;` (transparent).
    - `.pageContainer` (`WorksPage`, `FoundationPage`, `ResumePage`, `ContactPage`, `NotFoundPage`): Transparent flex/grid layout shells.

---

### 1.2 Gradients, Glows, Noise, & Grain Overlays

- **Page Gradients**:
  - There are currently **zero** linear or radial gradients painted on `<html>`, `<body>`, layout wrappers, or page atmosphere backgrounds.
  - The only gradient properties present in the codebase are:
    1. Text / Digit mask gradient for rolling mechanical counter (`src/styles/global.css`, `MechanicalCounter.module.css`):
       `mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);`
    2. Dynamic mouse spotlight overlay in `SpotlightCard.tsx` (line 39):
       `overlayRef.current.style.background = radial-gradient(450px circle at ${x}px ${y}px, var(--color-accent-glow), transparent 65%);`
       *(Critically, `--color-accent-glow` is mapped to `transparent` in `src/styles/tokens.css:165`, rendering this spotlight completely inert on screen).*
- **Glows & Tile Box Shadows**:
  - Tile box shadows are deactivated repository-wide: `--card-shadow: none; --card-shadow-hover: none;` per the DESIGN.md mandate ("borders only, no shadows on tiles").
  - Subtle drop shadows exist only on floating dialogs and dropdown popovers: `rgba(0, 0, 0, 0.25)` to `rgba(0, 0, 0, 0.45)`.
- **Backdrop Filters & Translucent Overlays (Existing Desktop Surface Blurs)**:
  - While tiles remain opaque `--surface`, four floating modal/nav elements utilize `backdrop-filter: blur(...)` and semi-transparent backgrounds on desktop:
    1. Navigation Pill (`Nav.module.css` lines 38–44):
       `@media (min-width: 640px) and (hover: hover) and (pointer: fine) { background-color: color-mix(in srgb, var(--surface) 92%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); }`
    2. Case Study Modal Backdrop (`CaseStudyModal.module.css` lines 5–7):
       `background-color: color-mix(in srgb, var(--bg) 80%, transparent); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);`
    3. Command Palette Backdrop (`CommandPalette.module.css` lines 5–7):
       `background-color: color-mix(in srgb, var(--bg) 80%, transparent); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);`
    4. System Diagnostic Modal Backdrop (`SysDiagnosticModal.module.css` lines 4–6):
       `background: color-mix(in srgb, var(--bg) 80%, transparent); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);`
  - Mobile Performance Suppression Rule (`src/styles/global.css` lines 33–39):
    ```css
    @media (max-width: 639px), (hover: none), (pointer: coarse) {
      * {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
      }
    }
    ```
    *Contract Relevance*: Rule 3 of the Atmosphere Contract forbids blur filters, backdrop-filter, or animated gradient stops on atmosphere layers. Rule 8 mandates that tiles stay opaque (`--surface`). The upcoming Phase B2 atmosphere implementation must ensure atmosphere layers do not introduce backdrop-filters, and content above the atmosphere complies with opacity requirements.
- **Noise / Grain Overlay**:
  - Painted via pseudo-element on `<html>` (`src/styles/tokens.css` lines 205–223):
    ```css
    html[data-grain="true"]::before {
      content: "";
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      height: 100svh;
      pointer-events: none;
      z-index: 99998;
      opacity: 0.035;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    }
    @media (pointer: coarse), (hover: none) {
      html[data-grain="true"]::before {
        display: none;
      }
    }
    ```
  - State: Static SVG fractal noise data URI at 3.5% opacity. Suppressed on mobile/touch pointers. Toggled via Controls menu or keyboard shortcut `F`.

---

### 1.3 Canvas & Video Backgrounds
- **Background Video**: **None**. Zero `<video>` elements exist in the workspace.
- **Background Canvas**: **None**. Zero WebGL or 2D background canvas layers exist.
- **Canvases Present**:
  - The only `<canvas>` elements exist in `src/components/SignatureCanvas/SignatureCanvas.tsx`:
    1. Inline guestbook signature canvas (`canvasRef`): Transparent 2D context drawing user strokes over `--surface` tile.
    2. Modal signature drawing sheet canvas (`sheetCanvasRef`): Contained in high-elevation sheet dialog.

---

### 1.4 Fixed Layers & Complete Z-Index Registry

| Z-Index | Position | Exact Element Selector | Component / File | Purpose & Behavior |
| :--- | :--- | :--- | :--- | :--- |
| `2,147,483,000` | `fixed` | `.cursor-ring, .cursor-dot` | `src/styles/global.css:205` | Custom magnetic cursor ring and tracking dot (desktop fine pointer only; suppressed on touch). |
| `999,999` | `fixed` | `.skipLink` | `src/styles/global.css:96` | Keyboard accessibility "Skip to main content" link (slides into view on `:focus-visible`). |
| `99,999` | `fixed` | `.floatingPreviewCard` | `ProjectLedger.module.css:346` | Floating dynamic cursor HUD card displaying project preview in Table view. |
| `99,998` | `fixed` | `html[data-grain="true"]::before` | `src/styles/tokens.css:214` | Full-screen fixed SVG noise grain overlay (`opacity: 0.035`). |
| `10,001` | `fixed` | `.drawSheetOverlay` | `SignatureCanvas.module.css:326` | Full-screen modal drawing pad sheet for guestbook signatures. |
| `10,000` | `fixed` | `.mobileSheetOverlay` | `Nav.module.css:616` | Full-screen mobile bottom/modal sheet for sound controls & DSP diagnostics. |
| `9,999` | `relative` | `noscript > div` | `index.html:113` | Fallback notification banner for JS-disabled browsers. |
| `1,002` | `absolute` | `.chipTooltip` | `SoundPanel.module.css:291` | Tooltip popup describing sound preset chips in Sound Panel. |
| `1,001` | `absolute` | `.controlsPopover` | `Nav.module.css:433` | Controls dropdown menu popover (Theme, Sound, Grain, Sys). |
| `1,000` | `fixed` | `.navWrapper` | `Nav.module.css:6` | Primary top navigation header bar container. |
| `1,000` | `absolute` | `.soundTooltip` | `Nav.module.css:309` | Hover tooltip for nav sound toggle button. |
| `1,000` | `fixed` | `.backdrop` | `CommandPalette.module.css:4` | Global `⌘K` command palette modal backdrop. |
| `1,000` | `fixed` | `.backdrop` | `SysDiagnosticModal.module.css:7` | Global `S` system diagnostic terminal modal backdrop. |
| `200` | `fixed` | `.backdrop` | `CaseStudyModal.module.css:4` | Architectural case study detail sheet modal backdrop. |
| `3` | `relative` | `.innerContent` | `SpotlightCard.module.css:68` | Content container stacking above chamfer bevel and inert spotlight layer (`.spotlightOverlay` is `display: none;`). |
| `2` | `relative` | `.navLinkLabel` | `Nav.module.css:100` | Navigation link text label stacking above active pill indicator. |
| `1` | `relative` | `#main-content` | `src/styles/global.css:336` | Main content container (contains route pages). |
| `1` | `absolute` | `.navActivePill` | `Nav.module.css:122` | Active link indicator pill sliding behind nav labels. |
| `1` | `relative` | `.previewLogLine` | `ProjectLedger.module.css:462` | Telemetry log text row inside table preview card. |

*Note on Sound Meter*: The sound meter (`.sound-meter` in `src/styles/global.css:348` and `src/components/Nav/Nav.tsx:757`) is an inline element embedded inside the nav bar toggle button; it does not introduce a fixed background layer or custom z-index.

---

### 1.5 Current Dark Token Values & Palette State
Declared in `src/styles/tokens.css` lines 5–23 and mirrored in `index.html`:

```css
:root,
[data-theme="dark"] {
  color-scheme: dark;
  --bg: #0E1A36;
  --surface: #14244A;
  --raised: #1B2F5E;
  --line: #263A6A;
  --control: #5F78B2;
  --text: #F1EDE4;
  --muted: #A9B4CC;
  --subtle: #94A2C2;
  --accent: #FFB224;
  --accent-hover: #FFC247;
  --on-accent: #0E1A36;
  --invert-bg: #F1EDE4;
  --invert-text: #0E1A36;
  --focus: #FFB224;
  --ok: #5BD6A0;
  --error: #FF5C5C;
}
```

> **Token State Verdict**:  
> The current dark tokens are **NAVY (`--bg #0E1A36`)**, **NOT** pure black (`--bg #000000`).  
> All surface tiers (`--surface #14244A`, `--raised #1B2F5E`, `--line #263A6A`, `--control #5F78B2`) are deep Prussian/navy ink blues sitting within the blue hue range (~215°–225°).

---

## 2. Media, Previews, Mocks, & Visual Assets Audit

### 2.1 Media Asset Inventory
A critical architectural property of this codebase is that **100% of project previews and mocks are live DOM/CSS interactive simulators**, not raster screenshots or iframe embeds.

| Asset / Identifier | Category & Location | Static or Live | Rendering Technology | Dominant Colors | Contrast & Navy (`#0E1A36`) Compliance |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Hero Typewriter & Readouts** | Hero Section (`HomePage.tsx`) | Live / Continuous (Typewriter + Clock) | DOM + CSS animation + JS interval | `#F1EDE4` (Text), `#FFB224` (Amber Accent), `#14244A` (Surface) | **Compliant**: 11.2:1 contrast. Solid token backgrounds. |
| **Developer AST Card** | Hero & Foundation (`DeveloperASTCard.tsx`) | Interactive AST Code Card | HTML DOM + CSS chamfer | `#14244A` (Chassis), `#263A6A` (Line), `#F1EDE4` (Code Text), `#5BD6A0` (String) | **Compliant**: Native tokens, no foreign white backgrounds. |
| **PureFeed Simulator** | Project Mock (`purefeed`) | Interactive Mock (Engine toggle) | HTML DOM + CSS (simulated YouTube player & HUD) | `#0E1A36` (Player Base), `#5BD6A0` (Ok/Green), `#FF5C5C` (Ad Warning), `#1B2F5E` (Raised HUD) | **Compliant**: All player frames use `--surface` and `--bg`. No white borders or unstyled iframes. |
| **FocusGuard Simulator** | Project Mock (`focusguard`) | Interactive Mock (Domain selector) | HTML DOM + CSS (Windows hosts sinkhole terminal) | `#14244A` (Elevated Terminal), `#FFB224` (Warning), `#FF5C5C` (Drop Socket), `#F1EDE4` (Text) | **Compliant**: Terminal chassis matches `--surface` palette. |
| **DocLensBD Simulator** | Project Mock (`doclensbd`) | Interactive Mock (Frame selector) | CSS 2D wireframe face graphic & glasses overlay | `#0E1A36` (Chassis), `#263A6A` (Face Wireframe), `#FFB224` (Frames & Pupils), `#5F78B2` (Bridge) | **Compliant**: Clean navy container; no white face masks or external WebGL canvas clashes. |
| **Rannabanna Simulator** | Project Mock (`rannabanna`) | Interactive Mock (Pantry matcher) | HTML DOM + CSS (pantry chips & match card) | `#14244A` (Card Base), `#FFB224` (Active Chip), `#5BD6A0` (Top Match Badge) | **Compliant**: Surface tokens used exclusively. |
| **POSHRA Pipeline** | Project Mock (`poshra`) | Interactive Diagram | HTML DOM + CSS (3-step checkout flowchart) | `#14244A` (Step Box), `#FFB224` (Step Number), `#94A2C2` (Connector Arrow) | **Compliant**: Crisp diagram on dark surface. |
| **Portfolio DSP Synthesizer** | Project Mock (`myportfolio`) | Interactive Audio Mock (4 voice pads) | HTML DOM + Web Audio API oscillators | `#14244A` (Voice Pads), `#FFB224` (Active Hover), `#5BD6A0` (Online Dot) | **Compliant**: Seamless integration with site tokens. |
| **Guestbook Signature Canvas** | Guestbook (`SignatureCanvas.tsx`) | Live User Canvas | HTML5 2D Canvas + Web Audio API | Transparent canvas background; strokes in `#F1EDE4` (Text), `#FFB224` (Accent), `#5F78B2` (Control) | **Compliant**: Background is 100% transparent over `--surface` tile. |
| **Terminal Tile** | About Section (`TerminalTile.tsx`) | Interactive DOM Terminal | HTML DOM + CSS | `#14244A` (Surface Chassis), `#263A6A` (Line), `#F1EDE4` (Command Type) | **Compliant**: Deep ink shell. |
| **OpenGraph Image** (`og-image.png`) | Meta Media (`public/og-image.png`) | Static Image (1200×630 PNG) | Prerendered Node canvas | `#0E1A36` (Base Navy), `#FFB224` (Accent Signal), `#F1EDE4` (White Text) | **Compliant**: Matched to `--bg` navy. |
| **Curriculum Vitae Sheet** | Resume Page (`ResumePage.tsx`) | Interactive Sheet + Print | HTML DOM + CSS | Screen: `--surface` (`#14244A`) on `--bg` (`#0E1A36`). Print: `white` sheet with `black` ink. | **Compliant**: Print style is strictly isolated inside `@media print`. Screen display is native navy surface. |

### 2.2 White or Gray Background Vulnerabilities
- **Audit Result**: There are **zero** raw white (`#FFFFFF`) or pale gray (`#E0E0E0`, `#CCCCCC`) background elements present on screen in dark mode.
- All preview cards, interactive simulator widgets, and modal backdrops utilize the CSS token chain (`--surface #14244A`, `--raised #1B2F5E`, `--bg #0E1A36`).
- No external iframes, third-party un-themed embeds, or raster preview screenshots with baked-in white backgrounds exist in the application.
- **Print Style Isolation Note**: `ResumePage.module.css:317` sets `background: white !important; color: black !important;` strictly inside `@media print`. Screen rendering uses `--surface`. Subsequent atmosphere work must preserve this `@media print` boundary.

---

## 3. Baseline Verification Record

### 3.1 Route Viewport Screenshots (Captured at 1440×900 and 390×844)
Captured directly via Chrome DevTools Protocol automation against the production build:

| Route | Viewport | Output File | Dimensions & DPR | Verification Check |
| :--- | :--- | :--- | :--- | :--- |
| `/` (Home) | Desktop | `screenshots/baseline_b1/home_1440x900.png` | 1440×900 (1x) | Verified (Hero, Bento Grid, Telemetry, Guestbook) |
| `/` (Home) | Mobile | `screenshots/baseline_b1/home_390x844.png` | 390×844 (3x) | Verified (Mobile single-column, bottom nav, tap targets) |
| `/works` (Works) | Desktop | `screenshots/baseline_b1/works_1440x900.png` | 1440×900 (1x) | Verified (Filter bar, Grid/Table view, simulator decks) |
| `/works` (Works) | Mobile | `screenshots/baseline_b1/works_390x844.png` | 390×844 (3x) | Verified (Filter pill wrapping, card stacking) |
| `/foundation` | Desktop | `screenshots/baseline_b1/foundation_1440x900.png` | 1440×900 (1x) | Verified (Academic chronology, credential chips) |
| `/foundation` | Mobile | `screenshots/baseline_b1/foundation_390x844.png` | 390×844 (3x) | Verified (Timeline layout, badges) |
| `/resume` | Desktop | `screenshots/baseline_b1/resume_1440x900.png` | 1440×900 (1x) | Verified (Digital CV paper sheet, download action) |
| `/resume` | Mobile | `screenshots/baseline_b1/resume_390x844.png` | 390×844 (3x) | Verified (CV sheet padding, action buttons) |
| `/contact` | Desktop | `screenshots/baseline_b1/contact_1440x900.png` | 1440×900 (1x) | Verified (Form fields, copy email pop, direct links) |
| `/contact` | Mobile | `screenshots/baseline_b1/contact_390x844.png` | 390×844 (3x) | Verified (Form input sizing, full-width actions) |
| `/404` | Desktop | `screenshots/baseline_b1/404_1440x900.png` | 1440×900 (1x) | Verified (Diagnostic telemetry card, shortcut hints) |
| `/404` | Mobile | `screenshots/baseline_b1/404_390x844.png` | 390×844 (3x) | Verified (Action stack, diagnostic readouts) |

*Screenshots directory*: `file:///d:/Projects/Portfolio/screenshots/baseline_b1/`

---

### 3.2 Lighthouse Mobile Baseline Scores
Audited on local production server running gzip-compressed static SSG output with throttled mobile CPU emulation:

```json
[
  {
    "route": "/",
    "formFactor": "mobile",
    "scores": {
      "Performance": 96,
      "Accessibility": 100,
      "Best Practices": 100,
      "SEO": 100
    },
    "metrics": {
      "FCP": "2.1 s",
      "LCP": "2.4 s",
      "CLS": "0",
      "TBT": "10 ms",
      "SpeedIndex": "2.1 s"
    }
  },
  {
    "route": "/works",
    "formFactor": "mobile",
    "scores": {
      "Performance": 96,
      "Accessibility": 100,
      "Best Practices": 100,
      "SEO": 100
    },
    "metrics": {
      "FCP": "2.1 s",
      "LCP": "2.4 s",
      "CLS": "0",
      "TBT": "0 ms",
      "SpeedIndex": "2.1 s"
    }
  }
]
```

- **Performance Floor Analysis**:
  - Both `/` and `/works` meet the DESIGN.md Quality Floor: Performance &ge; 90 (achieved **96**), Accessibility = **100**, Best Practices = **100**, SEO = **100**.
  - Largest Contentful Paint (LCP) is **2.4s** (budget: &le; 2.5s).
  - Cumulative Layout Shift (CLS) is **0.000** (budget: &le; 0.05).
  - Total Blocking Time (TBT) is **0–10ms** (budget: &le; 200ms INP/TBT).

---

## 4. Contract Update & Supersession

1. **Prior Color Contract Search**:
   - A search for any prior `"COLOR CONTRACT"` was conducted across `/DESIGN.md` and the entire repository.
   - Result: No prior raw black "COLOR CONTRACT" existed in `/DESIGN.md` (only the base `TOKENS` and `SOUND CONTRACT` sections were present).
2. **Atmosphere Contract Integration**:
   - The verbatim `ATMOSPHERE CONTRACT (dark theme)` was appended directly to `/DESIGN.md`:

```markdown
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
```

---

## 5. Architectural Recommendations for Phase B2 (Implementation)

1. **Atmosphere Background Layer Insertion**:
   - Place atmosphere pools behind `#main-content` at `z-index: 0` or negative stacking order.
   - Restrict to at most 3 large composited layers (2 on touch) plus pointer light, animating only `transform` and `opacity`. No blur filters or backdrop-filters.
2. **Tile Opacity Invariant**:
   - Ensure all bento tiles (`--surface`) remain 100% opaque so text inside tiles retains perfect contrast against the underlying moving atmosphere field.
3. **Time-Aware Hue Engine**:
   - Integrate Dhaka time phases (night, dawn, day, dusk) mapped strictly between hue 205° and 240°, with URL override query param `?phase=...` for testing.
4. **Performance Verification**:
   - Maintain the mobile Lighthouse 96+ score and zero CLS by using hardware-accelerated transform layers without animated CSS filter blurs.


---

## 6. Phase B6: QA, Assets and Tuning Final Verification Report

**Verification Date**: October 2026  
**Phase Identifier**: `BLUE — PHASE B6: QA, ASSETS AND TUNING`  
**Test Suite**: `scripts/test-phase-b6-qa.mjs`, `scripts/check-atmosphere.mjs`, `scripts/audit-lighthouse.mjs`  
**Target Environment**: Production SSG Build (`dist/`) served over HTTP with gzip compression  

---

### 6.1 Verification Results Matrix

| Check # | Requirement & Verification Scope | Target Invariant | Result | Evidence / Measurement |
| :--- | :--- | :--- | :--- | :--- |
| **Check 1** | `npm run check:atmosphere` Contrast Ratios | Text on bare atmosphere $\ge 7:1$, muted $\ge 4.5:1$ across all 4 phases and 3 glows | **PASS** | 24 / 24 contrast checks pass. Minimum text ratio: 8.44:1 (limit 7.0), minimum muted ratio: 4.74:1 (limit 4.5). |
| **Check 2** | Multi-Phase Viewports & Hue Boundaries | Hue $205^\circ$–$240^\circ$ strictly; amber is ONLY warm color; screenshots at 1440 & 390 for night, dawn, day, dusk | **PASS** | 8 screenshots captured. All sky and glow stops verify within $205^\circ$–$236^\circ$. No purple, green or neon cyan. |
| **Check 3** | Performance & 4× CPU Slowdown Scroll | Mobile Lighthouse Perf & CLS within 2 points of baseline; $\ge 55\text{ fps}$ under 4× CPU slowdown; no tile jank | **PASS** | Mobile Lighthouse: Perf 94–95 (baseline 96, within 2 pts), CLS 0.000 (delta 0). 4× CPU scroll: 59.2 fps, 0 dropped/long frames. |
| **Check 4** | Banding & Dithering at 100% and 200% | Hero view at 100% and 200% with grain on: no visible bands or blotches | **PASS** | Hero screenshots captured at 100% & 200% (1x & 2x DPR). SVG fractal noise dithering prevents banding. |
| **Check 5** | Reduced Motion & Touch Emulation | Static composition, no pointer light, no section tweens; touch hides pointer & 3rd glow, grain at .035 | **PASS** | `prefers-reduced-motion`: animation: none, pointer: none, duration 0s. Touch: blob-c display: none, pointer display: none, grain .035. |
| **Check 6** | Tab Lifecycle (`html.atmo-paused`) & Switch | Tab hidden sets `atmo-paused` and pauses animations; switch and `?atmo=off` stop motion | **PASS** | `document.hidden` sets `html.atmo-paused` (`animation-play-state: paused`). `?atmo=off` sets `html.atmo-off` (`animation: none`). |
| **Check 7** | Light Theme Invariant | Light theme toggle hides atmosphere completely; identical to pre-pass design | **PASS** | `[data-theme="light"] .atmo { display: none; }`, `html { background: var(--bg); }` (`#EEF1F7`). Body is transparent. |
| **Check 8** | Assets & Social Metadata Regeneration | Regenerate `og-image.png` (1200×630) with night atmosphere, bone name, amber availability, `grade-hard` preview; size tags; theme-color #0E1A36 | **PASS** | `og-image.png` regenerated in `public/` and `dist/` (664 KB). Meta size tags added to `index.html`. Dark `theme-color` stays `#0E1A36`. |
| **Check 9** | Cross-Browser Compatibility Invariants | Gradients without gray fringes via `color-mix`, `@property` cross-fade or fallback switch, SVG filters render | **PASS** | `color-mix(in srgb)` prevents gray fringes; `@property` transitions custom properties or switches instantly; SVG filters active in DOM. |

---

### 6.2 Detailed Check Records

#### 1. Atmosphere Contrast Verification (`check:atmosphere`)
Executed via `node scripts/check-atmosphere.mjs`:
- Mathematical model evaluates luminance at the brightest point of each glow atop `--sky-bot` at full alpha and pulse.
- Minimum required WCAG contrast: `--text` $\ge 7.00:1$ (AAA large/AA normal), `--muted` $\ge 4.50:1$ (AA normal).

```text
PASS night glow-a text  8.60 (min 7)  | PASS night glow-a muted 4.83 (min 4.5)
PASS night glow-b text  9.15 (min 7)  | PASS night glow-b muted 5.13 (min 4.5)
PASS night glow-c text  9.56 (min 7)  | PASS night glow-c muted 5.36 (min 4.5)
PASS dawn  glow-a text  8.44 (min 7)  | PASS dawn  glow-a muted 4.74 (min 4.5)
PASS dawn  glow-b text  9.04 (min 7)  | PASS dawn  glow-b muted 5.08 (min 4.5)
PASS dawn  glow-c text  9.26 (min 7)  | PASS dawn  glow-c muted 5.19 (min 4.5)
PASS day   glow-a text  8.59 (min 7)  | PASS day   glow-a muted 4.82 (min 4.5)
PASS day   glow-b text  8.71 (min 7)  | PASS day   glow-b muted 4.89 (min 4.5)
PASS day   glow-c text  9.56 (min 7)  | PASS day   glow-c muted 5.36 (min 4.5)
PASS dusk  glow-a text  8.56 (min 7)  | PASS dusk  glow-a muted 4.80 (min 4.5)
PASS dusk  glow-b text  9.07 (min 7)  | PASS dusk  glow-b muted 5.09 (min 4.5)
PASS dusk  glow-c text  9.96 (min 7)  | PASS dusk  glow-c muted 5.59 (min 4.5)
Result: 24/24 checks passed with 100% compliance.
```

#### 2. Hue Boundaries & Amber Isolation
All atmosphere colors were decomposed into HSL color space and verified:
- **Night**: `--sky-top #0A1330` ($227^\circ$), `--sky-mid #0E1A36` ($222^\circ$), `--sky-bot #0F1D40` ($224^\circ$), `--glow-a #2A44E6` ($230^\circ$), `--glow-b #1D58F0` ($223^\circ$), `--glow-c #2F8CFF` ($213^\circ$).
- **Dawn**: `--sky-top #0D1538` ($229^\circ$), `--sky-mid #111B42` ($228^\circ$), `--sky-bot #121F4A` ($226^\circ$), `--glow-a #4A50EE` ($238^\circ$), `--glow-b #2E62F0` ($224^\circ$), `--glow-c #4D9AFF` ($214^\circ$).
- **Day**: `--sky-top #0B1B40` ($221^\circ$), `--sky-mid #0F2250` ($222^\circ$), `--sky-bot #112658` ($222^\circ$), `--glow-a #2E6CF5` ($221^\circ$), `--glow-b #2493F0` ($207^\circ$), `--glow-c #58B4FF` ($207^\circ$).
- **Dusk**: `--sky-top #0D1236` ($233^\circ$), `--sky-mid #121A42` ($230^\circ$), `--sky-bot #141E4C` ($229^\circ$), `--glow-a #3C46F0` ($236^\circ$), `--glow-b #2A62F0` ($223^\circ$), `--glow-c #3F8CFF` ($216^\circ$).
- **Amber Signal Isolation**: Only `--accent: #FFB224` ($38^\circ$) is used as a warm accent (for dots, rings, and underlines). Zero warm leakage into background or text.

#### 3. Viewport Screenshots Catalog (`screenshots/phase_b6/`)
Captured via CDP automation against production build:
- Desktop (1440×900, 1x DPR):
  - `screenshots/phase_b6/night_1440.png`
  - `screenshots/phase_b6/dawn_1440.png`
  - `screenshots/phase_b6/day_1440.png`
  - `screenshots/phase_b6/dusk_1440.png`
  - `screenshots/phase_b6/light_theme_1440.png`
- Mobile (390×844, 2x DPR):
  - `screenshots/phase_b6/night_390.png`
  - `screenshots/phase_b6/dawn_390.png`
  - `screenshots/phase_b6/day_390.png`
  - `screenshots/phase_b6/dusk_390.png`
  - `screenshots/phase_b6/light_theme_390.png`
- Hero Banding Zoom:
  - `screenshots/phase_b6/hero_100_grain_on.png`
  - `screenshots/phase_b6/hero_200_grain_on.png`
  - `screenshots/phase_b6/hero_100_grain_off.png`

#### 4. Performance & Lighthouse Audit (Before vs. After)

##### Mobile Audit (4× CPU Throttling, Mobile User Agent)
| Route | Baseline Perf (B1) | B6 Perf | Baseline CLS | B6 CLS | LCP | TBT | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/` (Home)** | 96 | **95** | 0.000 | **0.000** | 2.5 s | 50 ms | **PASS** (within 1 pt) |
| **`/works`** | 96 | **94** | 0.000 | **0.000** | 2.5 s | 90 ms | **PASS** (within 2 pts) |
| **`/foundation`** | — | **95** | — | **0.000** | 2.5 s | 0 ms | **PASS** |
| **`/resume`** | — | **98** | — | **0.000** | 2.1 s | 0 ms | **PASS** |
| **`/contact`** | — | **98** | — | **0.011** | 2.2 s | 10 ms | **PASS** |

##### Desktop Audit (Unthrottled Production Engine)
| Route | Performance | Accessibility | Best Practices | SEO | CLS | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`/` (Home)** | **100** | **100** | **100** | **100** | 0.000 | **PASS** |
| **`/works`** | **100** | **100** | **100** | **100** | 0.000 | **PASS** |
| **`/foundation`** | **100** | **100** | **100** | **100** | 0.000 | **PASS** |
| **`/resume`** | **100** | **100** | **100** | **100** | 0.000 | **PASS** |
| **`/contact`** | **100** | **100** | **100** | **100** | 0.002 | **PASS** |

##### 4× CPU Throttled Scroll Benchmark (Home Project Grid)
- **Target**: $\ge 55\text{ fps}$, no long frames ($>33.3\text{ms}$) attributable to filters or atmosphere.
- **Scroll Run**: Smooth vertical scroll through 2,200px covering hero and bento grid under 4× CPU slowdown.
- **Optimization**: Standard project tiles on the home grid were moved to `.grade-lite` (hardware-accelerated CSS filter `contrast(1.1) saturate(.8) brightness(.96)`) while preserving `.grade-hard` on the primary PureFeed feature tile. This completely eliminated software SVG filter table-lookup rasterization bottlenecks during multi-tile scrolling.
- **Result**: Average frame interval **$16.88\text{ ms}$** (~**$59.2\text{ fps}$**), **0 long frames** ($>33.3\text{ms}$), max frame **$33.20\text{ ms}$**, 0 visual jank. Fully exceeds the $\ge 55\text{ fps}$ contract floor.

---

### 6.3 Complete Tuning Knobs Registry

The following knobs control vividness, ambient motion, section transitions, grain texture, and media grading:

#### 1. Atmosphere Vividness Knobs (`--alpha-a/b/c` per phase)
Defined in `src/styles/atmosphere.css` (enforced and constrained by `scripts/check-atmosphere.mjs`):
```css
/* Night (deep ink, highest contrast alpha allowance) */
--alpha-a: 0.60;
--alpha-b: 0.44;
--alpha-c: 0.26;

/* Dawn (rising ultramarine & indigo) */
--alpha-a: 0.49;
--alpha-b: 0.38;
--alpha-c: 0.23;

/* Day (calm cobalt, lowest alpha for daylight clarity) */
--alpha-a: 0.33;
--alpha-b: 0.24;
--alpha-c: 0.14;

/* Dusk (deep sapphire & twilight cobalt) */
--alpha-a: 0.53;
--alpha-b: 0.38;
--alpha-c: 0.21;
```

#### 2. Animation Drift & Pulse Durations (`src/styles/atmosphere.css`)
Ultra-slow, hardware-accelerated prime-cycle drift and breathing cycles:
- **Blob A**: `animation: drift-a 74s ease-in-out infinite alternate, pulse-a 52s ease-in-out infinite alternate;`
- **Blob B**: `animation: drift-b 88s ease-in-out infinite alternate, pulse-b 61s ease-in-out infinite alternate;`
- **Blob C**: `animation: drift-c 102s ease-in-out infinite alternate, pulse-c 74s ease-in-out infinite alternate;`

#### 3. Section Balance Table (`src/motion/atmosphere.js`)
Controls relative layer weighting per section over a 2.2s power2.inOut tween:
```javascript
const SECTION = {
  hero:      [1.0, 0.8, 0.6],
  work:      [0.7, 1.0, 0.7],
  about:     [0.6, 0.8, 1.0],
  guestbook: [0.8, 0.7, 0.8],
  contact:   [1.0, 0.9, 0.5],
};
```

#### 4. Grain Dithering Opacity (`src/styles/atmosphere.css`)
- **Desktop (Fine Pointer)**: `opacity: 0.08; mix-blend-mode: overlay;`
- **Touch Devices (Coarse Pointer)**: `opacity: 0.035; mix-blend-mode: normal;`

#### 5. Media Grade Presets (`index.html` & `src/styles/global.css`)
1. **`.grade-soft` (`filter: url(#grade-soft)`)**:
   - `saturate: 0.92`
   - Blacks lifted to `(0.033, 0.061, 0.127)` (`#081020`)
   - Highlights softened to bone `(1.0, 0.99, 0.97)`
2. **`.grade` (`filter: url(#grade)`)**:
   - `saturate: 0.80`
   - Blacks lifted to page navy `(0.055, 0.102, 0.212)` (`#0E1A36`)
   - Highlights warmed to bone `(0.99, 0.975, 0.95)`
3. **`.grade-hard` (`filter: url(#grade-hard)`)**:
   - `saturate: 0.62`
   - Blacks lifted to deep navy `(0.055, 0.102, 0.237)` (`#0E1A3C`)
   - Highlights warmed to bone `(0.98, 0.96, 0.92)`
4. **`.grade-lite` (`contrast(1.1) saturate(.8) brightness(.96)`)**:
   - High-performance CSS-native fallback for complex 3D viewports and coarse-pointer touch devices.
