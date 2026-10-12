# Sound System Audit (`/AUDIT-SOUND.md`)

**Initiative**: `/boost SOUND` — Phase S1: Contract and Audit  
**Date**: October 2026  
**Project**: Developer Portfolio ([watchknight-dev.onrender.com](https://watchknight-dev.onrender.com/))  
**Target Reference**: `/DESIGN.md` (Sound Contract)  

---

## 1. Codebase Grep Audit Results

An exhaustive audit of the codebase was conducted searching for standard HTML5 audio APIs, Web Audio API primitives, third-party audio packages, media elements, and static audio files:

| Search Pattern | Target / Scope | Matches Found | Detailed Audit Finding |
| :--- | :--- | :--- | :--- |
| `new Audio(` | Entire workspace | **0 matches** | No HTML5 `Audio` constructor instances exist. |
| `AudioContext` | Entire workspace | **4 occurrences across 2 files** | 1. `src/utils/audio.ts` (lines 5, 15, 64): Web Audio API synthesis engine singleton (`SoundEngine`).<br>2. `src/components/SysDiagnosticModal/SysDiagnosticModal.tsx` (line 112): Feature-detection check inspecting `window.AudioContext \|\| window.webkitAudioContext` to display sample rate (`48kHz` vs `Active`) without instantiating an engine. |
| `Howl` | Entire workspace | **0 matches in code** | Neither `howler` nor `Howl` is installed in `package.json` or referenced in source code. |
| `<audio` | Entire workspace | **0 matches** | No HTML `<audio>` elements or JSX tags exist in the project. |
| `.mp3`, `.wav`, `.ogg` | Entire workspace | **0 matches** | Zero static audio files exist anywhere in `public/`, `src/assets/`, or root assets. All audio is 100% synthesized procedurally via Web Audio API. |

---

## 2. Current Mute (M) Toggle Architecture

### A. Owning Components
Audio state is governed by a singleton instance in `src/utils/audio.ts` and toggled from three distinct user-facing touchpoints:

1. **Primary Component — `Nav` (`src/components/Nav/Nav.tsx`)**
   - **Desktop Controls Popover** (lines 643–659):
     ```tsx
     <div className={styles.controlRow}>
       <div className={styles.controlInfo}>
         <span className={styles.controlLabel}>Sound</span>
         <span className={styles.controlShortcut}>M</span>
       </div>
       <button
         type="button"
         className={`${styles.switchBtn} ${soundActive ? styles.switchBtnActive : ''}`}
         onClick={toggleSound}
         aria-pressed={soundActive}
         data-cursor="link"
       >
         <span className={styles.switchKnob} />
         <span className={styles.switchStateText}>{soundActive ? 'ON' : 'OFF'}</span>
       </button>
     </div>
     ```
   - **Mobile Drawer Quick Controls** (lines 843–855):
     ```tsx
     <div className={styles.mobileControlItem}>
       <span className={styles.controlLabel}>Sound Effects</span>
       <button
         type="button"
         className={`${styles.switchBtn} ${soundActive ? styles.switchBtnActive : ''}`}
         onClick={toggleSound}
         aria-pressed={soundActive}
       >
         <span className={styles.switchKnob} />
         <span className={styles.switchStateText}>{soundActive ? 'ON' : 'OFF'}</span>
       </button>
     </div>
     ```
   - **Toggle Handler** (`Nav.tsx`, lines 202–206):
     ```tsx
     const toggleSound = useCallback(() => {
       const active = sound.toggle();
       setSoundActive(active);
       sound.playClick(active ? 820 : 420, 0.02, 0.06);
     }, []);
     ```

2. **Secondary Component — `CommandPalette` (`src/components/CommandPalette/CommandPalette.tsx`)**
   - Registered command item `'toggle-sound'` (lines 170–178):
     - Title: `isSoundActive ? 'Mute Tactile Web Audio Synthesizer' : 'Enable Tactile Web Audio Synthesizer'`
     - Category: `'Preferences & Controls'`
     - Badge: `isSoundActive ? 'Active' : 'Muted'`
     - Action: Calls `onToggleSound?.()` bound to `toggleSound` in `Nav.tsx`.

3. **Tertiary Auto-Activation — `ProjectSimulator` (`src/components/ProjectSimulator/ProjectSimulator.tsx`)**
   - Lines 458, 471, 484, 497: The four Sentinel DSP test pads automatically turn audio on if disabled:
     ```tsx
     if (!sound.isEnabled()) sound.toggle();
     ```

### B. Keyboard Shortcut
- **Key**: `m` or `M` (case-insensitive).
- **Implementation**: Bound in `Nav.tsx` global `keydown` event listener (lines 232–274):
  ```tsx
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;

  const key = e.key.toLowerCase();
  if (key === 'm') {
    e.preventDefault();
    toggleSound();
  }
  ```
- **Guards**: Suppressed when focus is inside text inputs (`INPUT`, `TEXTAREA`, `isContentEditable`) or when modifier keys (`metaKey`, `ctrlKey`, `altKey`) are pressed.

### C. LocalStorage Key
- **Storage Key**: `'sound_enabled'`.
- **Stored Values**: `'true'` or `'false'` (serialized string).
- **Initialization**: Evaluated synchronously upon class instantiation in `SoundEngine` (`src/utils/audio.ts`, lines 8–11):
  ```ts
  constructor() {
    this.enabled = typeof window !== 'undefined' && localStorage.getItem('sound_enabled') === 'true';
  }
  ```
  - **Default**: On first visit with an empty `localStorage`, `getItem('sound_enabled')` returns `null`, resolving `this.enabled` to `false` (muted / silent).
- **Persistence**: Written on every call to `sound.toggle()` (`localStorage.setItem('sound_enabled', String(this.enabled))`).

### D. Audio Toggle Behavior (Dual-Sound Artifact)
When the user toggles sound ON:
1. `sound.toggle()` runs: sets `this.enabled = true`, writes localStorage, creates/resumes `AudioContext`, and triggers `this.playChirp(800, 1200, 0.04, 0.08)`.
2. `toggleSound()` in `Nav.tsx` immediately proceeds to line 205: executes `sound.playClick(active ? 820 : 420, 0.02, 0.06)`.
3. Consequently, turning sound ON fires two simultaneous audio nodes (a chirp and a click), producing a layered chord. Turning sound OFF plays a single 420 Hz click.

---

## 3. Audio Synthesizer Primitives (`src/utils/audio.ts`)

All audio in the application is generated procedurally by `SoundEngine` using four core methods:

1. **`playClick(freq = 600, duration = 0.02, volume = 0.05)`**
   - **Waveform**: Sine oscillator (`osc.type = 'sine'`).
   - **Frequency Envelope**: Starts at `freq`, exponentially ramps down to `freq * 0.3` over `duration`.
   - **Gain Envelope**: Starts at `volume`, exponentially ramps down to `0.0001` over `duration`.
   - **Usage**: Tactile switch clicks, theme toggles, modal tab switches, button presses.

2. **`playDrawer()`**
   - **Waveform**: Triangle oscillator (`osc.type = 'triangle'`).
   - **Frequency Envelope**: Ramps up from `240 Hz` to `420 Hz` over `0.08s`.
   - **Gain Envelope**: Starts at `0.04`, exponentially ramps down to `0.0001` over `0.08s`.
   - **Usage**: Modal drawer entry/exit, ⌘K command palette triggers, project inspection expansions.

3. **`playChirp(startFreq = 400, endFreq = 900, duration = 0.05, volume = 0.04)`**
   - **Waveform**: Sine oscillator (`osc.type = 'sine'`).
   - **Frequency Envelope**: Ramps from `startFreq` up to `endFreq` over `duration`.
   - **Gain Envelope**: Starts at `volume`, exponentially ramps down to `0.0001` over `duration`.
   - **Usage**: Success states, clipboard copy affirmations, diagnostic milestone passes.

4. **`playTick()`**
   - **Waveform**: Square oscillator (`osc.type = 'square'`).
   - **Frequency**: Fixed static frequency of `1400 Hz`.
   - **Gain Envelope**: Starts at `0.015`, exponentially ramps down to `0.0001` over `0.008s`.
   - **Usage**: Navigation links, filter chips, keyboard shortcuts, canvas clear, external anchor clicks.

---

## 4. Comprehensive Inventory: What Plays, When, and Where

Across 15 consumer files, exactly **116 sound invocations** occur. Below is the complete catalog:

### 1. `src/components/Nav/Nav.tsx` (16 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 199 | Theme toggle ('D' key / button) | `sound.playClick` | `(900, 0.03, 0.06)` | Circular theme reveal animation |
| 203 | Sound toggle ('M' key / button) | `sound.toggle` | Internal chirp `(800, 1200, 0.04, 0.08)` | Toggling sound engine state |
| 205 | Sound toggle feedback | `sound.playClick` | `(active ? 820 : 420, 0.02, 0.06)` | Tonal click feedback on toggle |
| 213 | Grain toggle ('F' key / button) | `sound.playChirp` | `(600, 300, 0.03, 0.05)` | SVG noise grain overlay toggle |
| 222 | View mode toggle ('G' / 'T') | `sound.playClick` | `(mode === 'grid' ? 650 : 720, 0.02, 0.06)` | Grid vs Table layout switch |
| 227 | Sys diagnostic open ('S' key) | `sound.playChirp` | `(500, 900, 0.04, 0.06)` | Telemetry modal shortcut launch |
| 241 | Command Palette hotkey ('⌘K' / 'Ctrl+K') | `sound.playDrawer` | Defaults | Keyboard opening of command palette |
| 412 | Brand logo click (Desktop) | `sound.playTick` | Defaults | Clicking "Moayed" header logo |
| 450 | Nav link click (Desktop) | `sound.playTick` | Defaults | Navigating to `/works`, `/foundation`, etc. |
| 455 | Nav link hover (Desktop) | `sound.playClick` | `(900 + idx * 75, 0.015, 0.03)` | Dynamic pitched hover click across nav items |
| 489 | Search button click (Desktop) | `sound.playDrawer` | Defaults | Clicking desktop ⌘K search trigger |
| 556 | Controls gear button click | `sound.playClick` | `(750, 0.02, 0.05)` | Opening quick controls popover |
| 715 | Brand logo click (Mobile) | `sound.playTick` | Defaults | Tapping mobile drawer brand logo |
| 746 | Nav link click (Mobile) | `sound.playTick` | Defaults | Tapping mobile drawer nav links |
| 803 | Command Palette tile click (Mobile) | `sound.playDrawer` | Defaults | Tapping mobile drawer search tile |

### 2. `src/components/CommandPalette/CommandPalette.tsx` (9 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 206 | 'action-copy-email' command | `sound.playChirp` | `(700, 1100, 0.05, 0.06)` | Clipboard copy confirmation |
| 260 | Drawer entrance (`isOpen === true`) | `sound.playDrawer` | Defaults | Modal slide-in opening transition |
| 271 | Escape key press | `sound.playTick` | Defaults | Dismissing command palette overlay |
| 275 | ArrowDown key press | `sound.playClick` | `(600, 0.015, 0.04)` | Stepping selection downward |
| 279 | ArrowUp key press | `sound.playClick` | `(650, 0.015, 0.04)` | Stepping selection upward |
| 285 | Enter key press | `sound.playClick` | `(850, 0.03, 0.08)` | Executing selected palette command |
| 394 | Header ESC button click | `sound.playTick` | Defaults | Clicking header close button |
| 426 | Command row click | `sound.playClick` | `(850, 0.03, 0.08)` | Mouse click on command item |
| 458 | Footer ESC button click | `sound.playTick` | Defaults | Clicking footer legend close button |

### 3. `src/components/CaseStudy/ProjectLedger.tsx` (8 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 236 | Project like button | `sound.playClick` | `(hasLiked ? 450 : 850, 0.03, 0.08)` | Toggling project like heart counter |
| 249 | Category filter pill click | `sound.playClick` | `(720, 0.02, 0.05)` | Filtering ledger table by category |
| 408 | Mobile 2nd tap on project row | `sound.playDrawer` | Defaults | Opening full case study modal |
| 411 | Mobile 1st tap on project row | `sound.playClick` | `(650, 0.02, 0.06)` | Expanding inline accordion preview |
| 415 | Desktop row click | `sound.playDrawer` | Defaults | Selecting project to open case study |
| 495 | Row Enter / Space key press | `sound.playDrawer` | Defaults | Keyboard activation of ledger row |
| 563 | Desktop "Inspect" button click | `sound.playDrawer` | Defaults | Clicking row inspect button |
| 600 | Mobile "Inspect Full Architecture" button | `sound.playDrawer` | Defaults | Tapping mobile inline inspect button |

### 4. `src/components/CaseStudyModal/CaseStudyModal.tsx` (9 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 33 | Escape key press | `sound.playDrawer` | Defaults | Dismissing case study drawer |
| 52 | Copy code snippet (`copyCode`) | `sound.playChirp` | `(600, 1000, 0.05, 0.06)` | Copying AST sandbox snippet to clipboard |
| 62 | Modal backdrop click | `sound.playDrawer` | Defaults | Clicking outside drawer to close |
| 92 | Header close button click | `sound.playDrawer` | Defaults | Clicking ESC close button |
| 114 | Tab switch: "Anatomy & Architecture" | `sound.playClick` | `(600, 0.02, 0.04)` | Switching active modal tab |
| 127 | Tab switch: "Engineering Challenges" | `sound.playClick` | `(700, 0.02, 0.04)` | Switching active modal tab |
| 141 | Tab switch: "Code AST Sandbox" | `sound.playClick` | `(800, 0.02, 0.04)` | Switching active modal tab |
| 254 | "Launch Live Site" link click | `sound.playClick` | `(850, 0.03, 0.08)` | Opening external live project URL |
| 273 | "GitHub Repo" link click | `sound.playTick` | Defaults | Opening external GitHub repository URL |

### 5. `src/components/DeveloperAST/DeveloperASTCard.tsx` (1 call)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 40 | "Copy Schema" button (`handleCopy`) | `sound.playClick` | `(900, 0.03, 0.08)` | Copying TypeScript type definition |

### 6. `src/components/ProjectSimulator/ProjectSimulator.tsx` (10 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 60 | Domain test chip click (`handleTestDomain`) | `sound.playClick` | `(800, 0.02, 0.05)` | Switching simulated test domain |
| 65 | Pantry item toggle (`togglePantry`) | `sound.playClick` | `(650, 0.02, 0.04)` | Adding/removing recipe ingredient chip |
| 140 | PureFeed countermeasure switch toggle | `sound.playClick` | `(next ? 850 : 450, 0.03, 0.06)` | Toggling purefeed filter engine on/off |
| 287 | Frame button: Classic Wayfarer | `sound.playClick` | `(600, 0.02, 0.04)` | Selecting 3D virtual glasses frame |
| 298 | Frame button: Aviator Titanium | `sound.playClick` | `(700, 0.02, 0.04)` | Selecting 3D virtual glasses frame |
| 309 | Frame button: Round Minimalist | `sound.playClick` | `(800, 0.02, 0.04)` | Selecting 3D virtual glasses frame |
| 459 | DSP Pad 1: Switch Click | `sound.playClick` | `(850, 0.02, 0.08)` | Testing 850 Hz click pad (auto-unmutes) |
| 472 | DSP Pad 2: Chirp Ramp | `sound.playChirp` | `(400, 1100, 0.06, 0.08)` | Testing chirp ramp pad (auto-unmutes) |
| 485 | DSP Pad 3: Drawer Whoosh | `sound.playDrawer` | Defaults | Testing drawer whoosh pad (auto-unmutes) |
| 498 | DSP Pad 4: Subtle Tick | `sound.playTick` | Defaults | Testing subtle tick pad (auto-unmutes) |

### 7. `src/components/SignatureCanvas/SignatureCanvas.tsx` (7 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 119 | Drawing start (`handlePointerDown`) | `sound.playClick` | `(600, 0.015, 0.03)` | Touch/pointer down on canvas |
| 173 | "Clear" button (`clearCanvas`) | `sound.playTick` | Defaults | Clearing canvas strokes |
| 183 | "Save Badge" button (`downloadSignature`) | `sound.playChirp` | `(700, 1100, 0.05, 0.06)` | Exporting canvas signature PNG |
| 188 | Mobile "Draw ✍️" button (`openDrawSheet`) | `sound.playClick` | `(750, 0.02, 0.05)` | Opening mobile drawing bottom sheet |
| 193 | Mobile sheet close button (`closeDrawSheet`)| `sound.playClick` | `(650, 0.02, 0.05)` | Closing mobile drawing bottom sheet |
| 232 | Ink preset color click (Desktop) | `sound.playClick` | `(800, 0.01, 0.03)` | Selecting drawing stroke color token |
| 386 | Ink preset color click (Mobile Sheet) | `sound.playClick` | `(800, 0.01, 0.03)` | Selecting drawing stroke color token |

### 8. `src/components/SysDiagnosticModal/SysDiagnosticModal.tsx` (4 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 103 | Diagnostic benchmark start (`runAllDiagnostics`) | `sound.playClick` | `(600, 0.03, 0.08)` | Starting telemetry verification run |
| 111 | Step 1 DSP test completion | `sound.playChirp` | `(440, 880, 0.06, 0.05)` | Audio DSP benchmark pass tone |
| 223 | Diagnostic benchmark finish | `sound.playChirp` | `(800, 1200, 0.08, 0.06)` | All tests passed; cert generated |
| 250 | "Copy Token" button (`handleCopyCert`) | `sound.playClick` | `(900, 0.03, 0.07)` | Copying diagnostic cert token |

### 9. `src/components/TerminalTile/TerminalTile.tsx` (1 call)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 30 | Terminal command run (`handleRunCommand`) | `sound.playClick` | `(750, 0.02, 0.05)` | Running command via enter or chip click |

### 10. `src/pages/Home/HomePage.tsx` (28 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 55 | Hero CTA: "View My Works" | `sound.playTick` | Defaults | Smooth scrolling to `#selected-work` |
| 60 | Hero CTA: "Get in Touch" | `sound.playTick` | Defaults | Smooth scrolling to `#contact` |
| 65 | Scroll to top action | `sound.playTick` | Defaults | Smooth scrolling back to top |
| 106 | View mode switch (Grid/Table) | `sound.playClick` | `(mode === 'grid' ? 650 : 720, 0.02, 0.06)` | Toggling layout mode on home |
| 189 | "Copy Email" button (`handleCopyEmail`) | `sound.playClick` | `(900, 0.03, 0.06)` | Copying email to clipboard |
| 264 | Hero "Download Résumé" link | `sound.playTick` | Defaults | Opening resume PDF |
| 400 | PureFeed card header click | `sound.playClick` | Defaults | Opening PureFeed modal |
| 406 | PureFeed "Inspect Deeply" button | `sound.playClick` | Defaults | Opening PureFeed modal |
| 445 | PureFeed "Explore Full Case Study" | `sound.playClick` | Defaults | Opening PureFeed modal |
| 463 | PureFeed live site link click | `sound.playTick` | Defaults | Opening external live project URL |
| 487 | DocLensBD card header click | `sound.playClick` | Defaults | Opening DocLensBD modal |
| 493 | DocLensBD "Inspect Deeply" button | `sound.playClick` | Defaults | Opening DocLensBD modal |
| 535 | DocLensBD live site link click | `sound.playTick` | Defaults | Opening external live project URL |
| 553 | DocLensBD GitHub source link | `sound.playTick` | Defaults | Opening external GitHub repository |
| 578 | Secondary project card header click | `sound.playClick` | Defaults | Opening project modal |
| 584 | Secondary project "Inspect Deeply" | `sound.playClick` | Defaults | Opening project modal |
| 624 | Secondary project live site link | `sound.playTick` | Defaults | Opening external live project URL |
| 638 | Secondary project "Inspect Full Case Study" | `sound.playClick` | Defaults | Opening project modal |
| 657 | Secondary project GitHub source link | `sound.playTick` | Defaults | Opening external GitHub repository |
| 674 | "View All 5 Projects" link click | `sound.playTick` | Defaults | Navigating to `/works` |
| 680 | "Explore Architecture Ledger" link | `sound.playTick` | Defaults | Navigating to `/works` |
| 739 | Telemetry ping test button | `sound.playClick` | Defaults | Triggering telemetry latency test |
| 811 | Tech stack skill chip click | `sound.playTick` | Defaults | Interacting with tech stack pill |
| 868 | Contact "Copy Email Address" card button | `sound.playTick` | Defaults | Copying primary email |
| 882 | Contact "Send Direct Mail" card button | `sound.playTick` | Defaults | Launching mail client |
| 931 | Footer "Back to top" button | `sound.playClick` | Defaults | Scrolling to top |
| 962 | Footer navigation link (Works) | `sound.playTick` | Defaults | Navigating to `/works` |
| 975 | Footer navigation link (Foundation) | `sound.playTick` | Defaults | Navigating to `/foundation` |
| 988 | Footer navigation link (Contact) | `sound.playTick` | Defaults | Navigating to `/contact` |

### 11. `src/pages/Works/WorksPage.tsx` (5 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 67 | Filter tab click (`handleFilterClick`) | `sound.playTick` | Defaults | Filtering projects (all/Web App/Tool/Commercial) |
| 73 | View mode switch (Grid/Table) | `sound.playClick` | `(mode === 'grid' ? 650 : 720, 0.02, 0.06)` | Toggling layout mode |
| 221 | "Visit Live Site" link click | `sound.playTick` | Defaults | Opening external live project URL |
| 233 | "Explore Architecture" button click | `sound.playClick` | Defaults | Opening case study modal |
| 248 | "Source" GitHub link click | `sound.playTick` | Defaults | Opening external GitHub repository |

### 12. `src/pages/Foundation/FoundationPage.tsx` (2 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 124 | Milestone item hover (`onMouseEnter`) | `sound.playTick` | Defaults | Hovering academic milestone timeline item |
| 163 | Skill category card hover (`onMouseEnter`) | `sound.playTick` | Defaults | Hovering skill category card |

### 13. `src/pages/Resume/ResumePage.tsx` (2 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 9 | "Print Résumé" button (`handlePrint`) | `sound.playClick` | Defaults | Triggering `window.print()` dialog |
| 30 | "Download PDF" resume link click | `sound.playTick` | Defaults | Opening `/resume.pdf` in new tab |

### 14. `src/pages/Contact/ContactPage.tsx` (6 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 109 | "Copy Email" button (`handleCopyEmail`) | `sound.playClick` | `(900, 0.03, 0.08)` | Copying primary email to clipboard |
| 129 | "Copy Draft" button (`handleCopyDraft`) | `sound.playClick` | `(900, 0.03, 0.08)` | Copying message draft to clipboard |
| 141 | Form validation failure (`handleSubmit`) | `sound.playClick` | `(320, 0.04, 0.08)` | Error sound on invalid submission |
| 147 | Form validation success (`handleSubmit`) | `sound.playChirp` | `(600, 1100, 0.06, 0.08)` | Success sound before mailto launch |
| 263 | GitHub profile link button click | `sound.playTick` | Defaults | Opening external GitHub profile |
| 276 | "Download CV" link button click | `sound.playTick` | Defaults | Opening `/resume.pdf` in new tab |

### 15. `src/pages/NotFound/NotFoundPage.tsx` (2 calls)
| Line | Trigger Event | Method Called | Parameters | Interaction Context |
| :--- | :--- | :--- | :--- | :--- |
| 28 | Keyboard shortcut 'H' / 'h' | `sound.playTick` | Defaults | Returning home via hotkey |
| 42 | "Return to Base" button / link | `sound.playTick` | Defaults | Returning to home route |

---

## 5. Sound Contract Compliance Gap Analysis

The 8 architectural rules defined in the Sound Contract (`/DESIGN.md`) establish a strict standard. The current implementation exhibits several architectural and design gaps:

| Contract Rule | Current Implementation State | Compliance Gap & Phase S2 Action Plan |
| :--- | :--- | :--- |
| **1. Opt-in** (Silent on first visit, no AudioContext before opt-in, re-armed on return without intro sound) | Sound defaults to OFF (`sound_enabled === 'true'`). However, if previously turned on, `AudioContext` is created eagerly on the next interaction via `initCtx()`. Toggling sound ON immediately plays an intro chirp (`playChirp(800, 1200...)`) plus a click. | **High Severity Gap**:<br>• Ensure `AudioContext` is never instantiated on first visit.<br>• For returning visitors with saved `"on"`, audio must only re-arm on their next click/tap/key *without* playing an intro sound. |
| **2. Synthesized only** (Web Audio API in `engine.js` and `sound.js`, no audio files) | 100% Web Audio API synthesized, 0 external audio files. However, all audio code is currently located in `src/utils/audio.ts`. | **Architectural Gap**:<br>• Refactor and split the synthesizer into dedicated `engine.js` and `sound.js` files as dictated by the contract. |
| **3. One key** (D/F pentatonic `D F G A C`: Dark = tonal centre D, Light = tonal centre F) | Frequencies are hardcoded arbitrary integers (1400, 1200, 1100, 900, 850, 820, 750, 720, 700, 650, 600, 500, 450, 440, 420, 400, 320, 240 Hz, plus index offsets). | **Harmonic Gap**:<br>• Restrict all pitches strictly to notes of the D minor / F major pentatonic scale (`D, F, G, A, C`).<br>• Dynamically switch tonal center from D (dark mode, low/warm) to F (light mode, bright) based on theme state. |
| **4. Fixed vocabulary** (`tick`, `thump`, `pluck`, `swish`, `key`, `chime`, `ink`, `pad`) | Existing vocabulary consists of 4 ad-hoc methods: `playClick`, `playDrawer`, `playChirp`, `playTick`. | **Vocabulary Gap**:<br>• Replace existing methods with the 8 canonical sound verbs (`tick`, `thump`, `pluck`, `swish`, `key`, `chime`, `ink`, `pad`). No other sounds permitted. |
| **5. Space** (Shared synthetic reverb + screen x-position panning) | Mono only. No reverb node; zero stereo panning. | **Spatial Gap**:<br>• Implement a shared synthetic reverb bus.<br>• Implement a `StereoPannerNode` calculating trigger `x / window.innerWidth * 2 - 1` from click/tap coordinates. |
| **6. Quiet & safe** (Master limiter, anti-pop fades, voice cap, rate limits, tab visibility suspension, fine pointer check, reduced motion check) | Direct oscillator to gain to destination. No limiter (`DynamicsCompressorNode`), no voice limiter, no visibility suspension listener, no pointer check, no reduced-motion check. | **Safety & Robustness Gap**:<br>• Add master limiter (`DynamicsCompressorNode`).<br>• Add anti-pop micro fades on enable/disable.<br>• Implement voice concurrency cap and rate limiting.<br>• Suspend `AudioContext` when document is hidden (`visibilitychange`) or sound is off.<br>• Restrict hover sounds to `(pointer: fine)`.<br>• Disable ambient pad on touch devices and under `prefers-reduced-motion`. |
| **7. Never the only feedback** (Visual twin for every sound, `aria-live` state announcements) | Sounds mirror visual actions, but toggling sound state (Mute / Unmute) does not notify assistive technologies via `aria-live`. | **Accessibility Gap**:<br>• Add `aria-live="polite"` announcements when sound is enabled or disabled. |
| **8. Silence is design** (No sound for page load, scroll, focus, plain text hover, or typing outside terminal) | `FoundationPage.tsx` lines 124 and 163 play `sound.playTick()` on `onMouseEnter` of academic milestone cards and skill cards. `Nav.tsx` line 455 plays `sound.playClick()` on nav link hover. | **Design Gap**:<br>• Eliminate hover sounds on plain content elements to uphold the strict silence policy. |
