# Pages Architecture, Visual Audit & Contract Baseline

**Audit Date**: October 2026  
**Audited Target**: [watchknight-dev.onrender.com](https://watchknight-dev.onrender.com/)  
**Auditor**: Senior Product Designer & Creative Frontend Systems Investigator  
**Reference Specification**: `/DESIGN.md` (including PAGES CONTRACT)  
**Output Document**: `/AUDIT-PAGES.md`  

---

## 1. Executive Summary & Environment Notes

This audit evaluates all four inner pages (`/works`, `/foundation`, `/resume`, `/contact`) in comparison to the canonical Home page (`/`) across desktop (1440×900) and mobile (390×844) viewports.

### Environment & Tooling Verification Note
* **Browser Tool Status**: There is **no native `/browser` tool** present in this execution environment. External network access to `https://watchknight-dev.onrender.com/` was restricted by security policy.
* **Audit Methodology**: The audit was conducted through deep static code analysis of React component trees, CSS modules, prerendering pipelines, and local automated browser driving using Google Chrome Headless via the Chrome DevTools Protocol (CDP) on the production-built static output (`dist/`).
* **Screenshot Artifacts**: Full-page screenshots across both 1440×900 desktop and 390×844 mobile viewports have been generated and archived in `/screenshots/`:
  - `desktop_dark_1440.png`, `desktop_light_1440.png`
  - `mobile_dark_390.png`, `mobile_light_390.png`
  - `works_desktop_1440.png`, `works_mobile_390.png`
  - `foundation_desktop_1440.png`, `foundation_mobile_390.png`
  - `resume_desktop_1440.png`, `resume_mobile_390.png`
  - `contact_desktop_1440.png`, `contact_mobile_390.png`

---

## 2. Comparative Differences Matrix: Inner Pages vs. Home

The design philosophy mandates: *"Same room, different corridors. Every inner page is built from the home page's parts. No page invents its own look."* Currently, each inner page exhibits significant design fragmentation:

| Dimension | Home Page (`/`) [Reference] | `/works` | `/foundation` | `/resume` | `/contact` |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nav Shell** | Top-level `<Nav>` floating pill with glided active indicator | Shared `<Nav>` pill; glides to active link | Shared `<Nav>` pill; glides to active link | Shared `<Nav>` pill; glides to active link | Shared `<Nav>` pill; glides to active link |
| **Container Width** | `max-width: 1280px`, `padding-inline: clamp(16px, 4vw, 48px)` | `max-width: 1040px` (narrower, inconsistent) | `max-width: 1040px` (narrower, inconsistent) | `max-width: 1040px` (narrower, inconsistent) | `max-width: 960px` (strictest constraint) |
| **Header Pattern** | Hero: `clamp(2.5rem, 6.5vw, 4.25rem)`, wt 700, line-height 1.05; left-aligned, bottom-docked | Header container (`max-width: 720px`); H1 `clamp(2rem, 5vw, 3rem)`; uppercase mono eyebrow | Header container (`max-width: 720px`); H1 `clamp(2rem, 5vw, 3rem)`; uppercase mono eyebrow | Flex row with right-aligned action buttons; H1 `clamp(2rem, 5vw, 2.75rem)`; mono eyebrow | Header container (`max-width: 680px`); H1 `clamp(2rem, 5vw, 3rem)`; uppercase mono eyebrow |
| **Banned Eyebrow Labels** | Present in JSX (`[ selected projects ]`), hidden/styled | `Portfolio & case studies` (monospace, tracked out) | `Education & credentials` + `Developer profile manifest` | `Verified credentials` (monospace, tracked out) | `Direct communication` (monospace, tracked out) |
| **Section Headings** | Plain sentence-case h2s ("Selected work", "About and tools") | Card titles are h2 (`.projectTitle`), violating hierarchy | Section titles are h2 (`.cardTitle`, `.catTitle`, inline style) | Candidate name is h2; sections are h3 with uppercase tracking | Form title is h2 (`.formTitle`); info cards use uppercase mono |
| **Layout & Tile Material** | 12-col Bento; 4 materials (`surface`, `inverted`, `accent`, `media`); borders only | 2-col CSS Grid; uses `SpotlightCard` with 3D mouse tilt (9°); no 4 materials | 2-col layout (`1.15fr 1fr`); uses `SpotlightCard` with tilt (4° & 6°) | Single large `SpotlightCard` with tilt (2°); dark tile instead of bone paper | 2-col layout (`1fr 1.3fr`); 3 left `SpotlightCard`s + 1 right form card |
| **Border Radii** | Strict 4 tiers: `--r-xl: 28px`, `--r-lg: 20px`, `--r-md: 12px`, `--r-pill: 999px` | Arbitrary radii (`--radius-pill`, `--radius-lg`, `--radius-sm`) | Arbitrary radii (`--radius-sm`, circular 50% dot, `--radius-md`) | Arbitrary radii (`--radius-xs`, `--radius-sm`, card default) | Arbitrary radii (`--radius-sm`, 7px circular dot, card default) |
| **Color Tokens** | Strict deep-ink tokens (`--bg`, `--surface`, `--raised`, `--line`, `--accent`, `--text`) | Legacy tokens (`--color-text-primary`, `--color-bg-card`, `--color-border-hairline`) | Legacy tokens (`--color-bg-base`, `--color-bg-subtle`, `--color-text-tertiary`) | Legacy tokens (`--color-text-secondary`, `--color-border-hairline`) | Legacy tokens (`--color-text-tertiary`, `--color-border-subtle`, `--color-bg-subtle`) |
| **Grid Spacing & Gaps** | Gap 16px desktop / 12px mobile; section margin `clamp(4rem, 8vw, 7rem)` | Container gap 3.5rem; grid gap 2rem | Container gap 3.5rem; two-column gap 2rem | Container gap 3.5rem; sheet padding 3rem 3.5rem | Container gap 3.5rem; layout gap 2rem |
| **Footer CTA & Site Footer** | Included: "Interested in working together?" CTA card + site footer bar | **MISSING**. Page terminates abruptly after project cards | **MISSING**. Page terminates abruptly after AST schema | **MISSING**. Page terminates abruptly after paper sheet | **MISSING**. Page terminates abruptly after contact form |
| **Atmosphere Sync** | Full: Section observer updates pools across hero, work, about, guestbook, contact | **INERT**. `<main>` lacks `data-section="work"`; atmo remains on default/hero | **INERT**. `<main>` lacks `data-section="about"`; atmo remains on default/hero | **INERT**. `<main>` lacks `data-section="hero"`; atmo remains on default/hero | **INERT**. `<main>` lacks `data-section="contact"`; atmo remains on default/hero |
| **Motion Budget** | GSAP batched stagger reveal, typewriter loop, cursor ring | 3D perspective tilt on hover; lacks Flip animation on filter/view toggle | 3D card tilt; timeline line is static (lacks scroll-draw animation) | 3D tilt on document sheet; lacks physical paper feel | 3D tilt on form; lacks tactical copy feedback & form focus motion |
| **Cursor & Magnetics** | Magnetic pull on buttons (`[data-magnetic]`), `data-cursor="inspect"` on tiles | Some `data-cursor="inspect"`, but buttons lack `data-magnetic="0.3"` | Lacks `data-cursor="inspect"` on milestone/skill cards; no magnetics | Action buttons have cursor link but lack `data-magnetic="0.3"` | Form inputs hide cursor (`data-cursor="hide"`); buttons lack magnetic |
| **Sound System** | Full: Tile hover `tick` (with `data-degree`), `pluck`, `swish`, `chime` | `pluck` on architecture button, `swish` on view toggle; missing tile hover `tick` | Schema copy button missing `chime` hook; no tile hover `tick` | Print and PDF buttons lack audio feedback hooks | Copy email has `chime`; form submit and input focus lack audio hooks |

---

## 3. Route Inventory & Behaviors to Keep

### 3.1 Route: `/works`
* **Components**: `WorksPage.tsx`, `SpotlightCard.tsx` (to be refactored to bento tile), `ProjectSimulator.tsx`, `ProjectLedger.tsx`, `RollText.tsx`.
* **Data Sources**: `src/data/projects.ts` (`projects` array of `ProjectData`).
* **Behaviors to KEEP**:
  1. **Filter Chips**: Filter pills (`All Works`, `Web Applications`, `Tools & Extensions`, `E-Commerce`) filtering project items by `categoryType` without page reload.
  2. **Grid / Table View Toggle**: Toggling between visual cards and Brian Lovin-style data ledger table (`ProjectLedger`), including keyboard shortcuts `G` (Grid) and `T` (Table), and state persistence via `localStorage.getItem('view_mode')`.
  3. **Interactive Mock Previews**: In-tile interactive project simulators (`ProjectSimulator`):
     - PureFeed YouTube adblock bypass simulation.
     - DocLensBD MediaPipe 3D face mesh virtual try-on frame switcher.
     - FocusGuard DNS sinkhole simulator.
     - Rannabanna recipe matcher.
     - POSHRA mobile checkout simulation.
  4. **"Explore Architecture" Action**: Opens deep architectural case study modal (`LazyCaseStudyModal`) via `onSelectProject(id)` or `open-project-modal` custom event.
  5. **Direct Outbound Links**: "Visit Live Site" (external URL) and "Source" (GitHub repository).

### 3.2 Route: `/foundation`
* **Components**: `FoundationPage.tsx`, `DeveloperASTCard.tsx`, `SpotlightCard.tsx`.
* **Data Sources**:
  - `academicMilestones` (chronological education records).
  - `skillCategories` (Programming Languages, Frontend & UI, Backend & Data, Tools & Practices).
  - `coursework` (array of core computer science subjects).
  - `src/data/profile.ts` (`profileData`).
* **Behaviors to KEEP**:
  1. **Academic Timeline**: Chronological record covering East West University (EWU) B.Sc. CSE, HSC, SSC (Class 10 GPA 5.0), JSC (Class 8 GPA 5.0), and PSC (Class 5 GPA 5.0).
  2. **Distinction Badges**: Merit scholarship chips and board distinction indicators.
  3. **Core Coursework Matrix**: Theoretical foundation tags (Data Structures, Operating Systems, Computer Networks, DBMS, Discrete Math, Theory of Computation).
  4. **Skill Groups**: Grouped technology categories.
  5. **TypeScript Schema Card (`DeveloperASTCard`)**: Formatted TypeScript AST interface representation of engineering competencies, including the one-click copy button (`handleCopy`) that copies raw TypeScript to clipboard.

### 3.3 Route: `/resume`
* **Components**: `ResumePage.tsx`, `RollText.tsx`, `SpotlightCard.tsx`.
* **Data Sources**: `src/data/profile.ts` (`profileData`), `src/data/projects.ts`.
* **Behaviors to KEEP**:
  1. **Download PDF Action**: Direct link pointing to `/resume.pdf` (served from `/public/resume.pdf`).
  2. **Print Résumé Action**: Button invoking native `window.print()` with zero print dialogue distortion.
  3. **Complete Résumé Information**: Candidate header, contact metadata, professional summary, education history, production software records with live demo URLs, technical skill inventory, and verified honors.
  4. **Mandated Content Dedup**: Deduplicate JSC (Class 8) and PSC (Class 5) from the Education list—they must reside exclusively under Honors & Awards.

### 3.4 Route: `/contact`
* **Components**: `ContactPage.tsx`, `RollText.tsx`, `SpotlightCard.tsx`.
* **Data Sources**: `src/data/profile.ts` (`profileData.contact`).
* **Behaviors to KEEP & Submission Analysis**:
  1. **Copy Email Button**: One-click clipboard copy of `armabdur.rahman04@gmail.com` with active state (`Copied`) for 1.6s and auditory feedback (`sound.play('chime')`).
  2. **Availability Indicator**: Dynamic status readout ("Open for Internships & Freelance Projects") with glowing pulse dot.
  3. **Dhaka Local Clock**: Real-time clock formatted in `Asia/Dhaka` time (UTC+6) updating each second.
  4. **Social Links**: Direct links to GitHub profile and Résumé PDF.
  5. **Form Behavior & "Draft & Send Message" Analysis**:
     - **Mechanism**: The form submission **does NOT call a backend API endpoint**; there is no REST, GraphQL, or serverless function handler.
     - **Execution Flow**:
       1. Validates client-side constraints (Name ≥ 2 chars, valid Email format, Message ≥ 10 chars).
       2. Sets `isSubmitting: true` and displays an animated button loading spinner for 450ms.
       3. Assembles a standard `mailto:` protocol URL:
          `mailto:armabdur.rahman04@gmail.com?subject=<EncodedSubject>&body=<EncodedName+Email+Message>`.
       4. Injects an invisible temporary `<a>` element into the DOM, invokes `.click()`, and removes it, falling back to `window.location.href = mailtoUrl`.
       5. Sets `dispatched: true`, which reveals the `dispatchBanner` ("Ready in Email Client") providing a secondary button (`handleCopyDraft`) to copy the full pre-formatted text draft to the clipboard if the local mail client failed to launch.

---

## 4. Build, Prerendering & Shared Architecture

### 4.1 Client Routing Architecture
* **Router Implementation**: Custom client-side history router in `src/hooks/useRouter.ts`.
* **Mechanics**: Zero external routing dependencies. Utilizes `window.history.pushState` and listens to `popstate` events. Manages route paths: `/`, `/works`, `/foundation`, `/resume`, `/contact`, `/404`.
* **Navigation Coordination**: Dispatches route changes through `navigate(path)`. In `App.tsx`, route transitions trigger a GSAP crossfade: `<main>` fades out to opacity 0 over 0.2s (`power2.in`), scrolls window to top instantly, switches `displayPath`, and fades `<main>` in over 0.3s (`power2.out`).

### 4.2 SSG Prerendering Pipeline (`scripts/prerender.mjs`)
* **Trigger**: Executed during `npm run build` (`tsc -b && vite build && node scripts/prerender.mjs`).
* **Execution Steps**:
  1. **Vite SSR Compilation**: Builds `src/entry-server.tsx` into temporary ESM bundle `dist-ssr/entry-server.js`.
  2. **Server DOM Rendering**: Loads `dist-ssr/entry-server.js` and invokes React 19's `renderToString(<App initialPath={url} routes={...} />)` for each defined route.
  3. **Template HTML Injection**: Loads `dist/index.html` (generated by client Vite build) and injects SSR HTML into `<div id="root">`.
  4. **Metadata Substitution**: Dynamically replaces `<title>`, `<meta name="title">`, `<meta name="description">`, `<link rel="canonical">`, `<meta property="og:title">`, `<meta property="og:description">`, `<meta property="og:url">`, and Twitter tags.
  5. **Static Artifact Output**: Generates both clean directory files (`dist/<route>/index.html`) and flat route files (`dist/<route>.html`) to support different web server rewrite rules.
  6. **Cleanup**: Automatically removes `dist-ssr/`.

### 4.3 Shared vs. Fragmented Layout Code
* **Shared Across All Routes**:
  - Global Atmosphere canvas container (`<div className="atmo">...</div>` in `App.tsx`), mounted once and persistent.
  - Global Navigation pill (`<Nav>` in `App.tsx`).
  - Accessibility skip link (`<a href="#main-content">` in `App.tsx`).
  - Global Modals (`SysDiagnosticModal`, `CaseStudyModal` in `App.tsx`).
* **Fragmented / Unshared Elements (Architecture Violations)**:
  - **Footer CTA Band & Site Footer**: Currently encapsulated **only inside `HomePage.tsx`** (`styles.contactCard` and `styles.footer`). `/works`, `/foundation`, `/resume`, and `/contact` lack a footer entirely.
  - **Section Atmosphere Attributes**: `<main>` in `App.tsx` lacks `data-section="..."`. Because inner pages lack section indicators, atmosphere color balance and audio ambient drones never adjust on route navigation.
  - **Container Widths**: `HomePage.tsx` uses `1280px` max-width; inner pages independently declare `1040px` and `960px`.

### 4.4 Built HTML Metadata & Canonical Audit
Inspected across all generated output files in `dist/`:

| Route | Built Output File | Canonical URL | OpenGraph URL (`og:url`) | Theme Color Metas |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `dist/index.html` | `https://watchknight-dev.onrender.com/` | `https://watchknight-dev.onrender.com/` | Dark `#0E1A36`, Light `#EEF1F7`, Default `#0E1A36` |
| `/works` | `dist/works/index.html` | `https://watchknight-dev.onrender.com/works` | `https://watchknight-dev.onrender.com/works` | Dark `#0E1A36`, Light `#EEF1F7`, Default `#0E1A36` |
| `/foundation` | `dist/foundation/index.html` | `https://watchknight-dev.onrender.com/foundation` | `https://watchknight-dev.onrender.com/foundation` | Dark `#0E1A36`, Light `#EEF1F7`, Default `#0E1A36` |
| `/resume` | `dist/resume/index.html` | `https://watchknight-dev.onrender.com/resume` | `https://watchknight-dev.onrender.com/resume` | Dark `#0E1A36`, Light `#EEF1F7`, Default `#0E1A36` |
| `/contact` | `dist/contact/index.html` | `https://watchknight-dev.onrender.com/contact` | `https://watchknight-dev.onrender.com/contact` | Dark `#0E1A36`, Light `#EEF1F7`, Default `#0E1A36` |

### 4.5 Self-Referential Domain Audit
A static search for all domains the project references for itself or sub-projects identified:
1. `watchknight-dev.onrender.com`: **Primary Canonical Domain**. Configured in `DESIGN.md`, `index.html`, `scripts/prerender.mjs`, `sitemap.xml`, and `robots.txt`.
2. `moayed-portfolio.onrender.com`: Render web service identifier in `render.yaml` (`name: moayed-portfolio`) and linked in `projects.ts` (line 430) and `scripts/resume-template.html` (lines 246-247) as the live demo for Sentinel Portfolio.
3. `moayed.onrender.com`: Legacy domain documented in `AUDIT.md` (lines 181-183, 200) where canonical and OG tags previously pointed prior to migration.
4. `doclensbd.onrender.com`: Sub-project live domain for DocLensBD eyewear shop (`projects.ts`, `ResumePage.tsx`, `ProjectSimulator.tsx`, `resume-template.html`).
5. `rannabanna.onrender.com`: Sub-project live domain for Rannabanna recipe matcher (`projects.ts`, `ResumePage.tsx`, `ProjectSimulator.tsx`, `resume-template.html`).
6. `poshra.onrender.com`: Sub-project live domain for POSHRA e-commerce storefront (`projects.ts`, `ProjectSimulator.tsx`, `resume-template.html`).
7. `api-render-5a59.onrender.com`: External benchmark endpoint referenced in `scripts/research-sites.mjs`.

---

## 5. Baseline Lighthouse Audits (Mobile & Desktop)

Audited via official Lighthouse 13.5.0 directly against production static distribution output (`dist/`) using Chrome DevTools Protocol (CDP) under standard mobile emulation:

### Mobile Baseline (`--form-factor=mobile`)

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`/` (Home)** | **94** | **100** | **100** | **100** | 2.6 s | 0.000 | 110 ms |
| **`/works`** | **95** | **100** | **100** | **100** | 2.5 s | 0.000 | 110 ms |
| **`/foundation`** | **95** | **100** | **100** | **100** | 2.5 s | 0.000 | 20 ms |
| **`/resume`** | **98** | **100** | **100** | **100** | 2.2 s | 0.000 | 0 ms |
| **`/contact`** | **95** | **100** | **100** | **100** | 2.5 s | 0.011 | 10 ms |

### Desktop Reference (`--preset=desktop`)

| Route | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **`/` (Home)** | **100** | **100** | **100** | **100** | 0.5 s | 0.000 | 0 ms |
| **`/works`** | **100** | **100** | **100** | **100** | 0.6 s | 0.000 | 0 ms |
| **`/foundation`** | **100** | **100** | **100** | **100** | 0.6 s | 0.000 | 0 ms |
| **`/resume`** | **100** | **100** | **100** | **100** | 0.5 s | 0.000 | 0 ms |
| **`/contact`** | **100** | **100** | **100** | **100** | 0.5 s | 0.002 | 0 ms |

*All five routes currently satisfy the Quality Floor (Performance ≥ 90; Accessibility, Best Practices, SEO ≥ 95; CLS < 0.05).*

---

## 6. Implementation Risks & Architectural Challenges

1. **Shell Extraction Risk**:
   - Extracting the footer CTA band and site footer from `HomePage.tsx` into the shared layout (`App.tsx`) must avoid double-rendering on the Home route or breaking existing scroll anchors (`#contact` and `#selected-work`).
2. **Atmosphere Synchronization via `<main data-section="…">`**:
   - `atmosphere.js` and `audio/hooks.js:initSections()` depend on `[data-section]`. Setting `data-section` dynamically on `<main>` (`/works` &rarr; `work`, `/foundation` &rarr; `about`, `/resume` &rarr; `hero`, `/contact` &rarr; `contact`) requires coordinating with the route crossfade transition to prevent abrupt background lighting jumps.
3. **Template Chrome Stripping without Breaking Selectors**:
   - Removing eyebrow labels (`Portfolio & case studies`, `Education & credentials`, etc.), simulated URL bars, and teaser text must be executed cleanly without breaking automated test suites (`scripts/test-phase*.mjs`) that may assert on specific DOM text nodes.
4. **Bento 12-Column Refactor**:
   - Converting the divergent widths (`1040px`, `960px`) and custom layouts (2-column grid in Works, 2-column flex in Foundation/Contact) into a unified 12-column bento system must maintain mobile responsive fidelity (<640px = 1 col, 640–1023px = 6 col, ≥1024px = 12 col).
5. **Print Stylesheet Isolation (`/resume`)**:
   - Guaranteeing that `/resume` prints cleanly as black-on-white A4 requires suppressing the Nav pill, atmosphere canvas blobs, cursor ring, skip links, and floating shortcut buttons via `@media print`.
6. **Sound Hook Consistency**:
   - Wiring sound hooks across all inner pages (`chime` on copy, `swish` on route change, `tick` with `data-degree` on tile hover, `thump` on buttons) must respect user opt-in audio settings and touch pointer guards (`pointer: coarse`).

---

*(Phase P1 Audit and Contract Complete. DESIGN.md updated with Pages Contract. AUDIT-PAGES.md written. Ready for Phase P2 Planning and Execution).*
