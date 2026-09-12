import { useState } from 'react';
import { sound } from '../../utils/audio';
import styles from './ProjectSimulator.module.css';

interface ProjectSimulatorProps {
  projectId: string;
}

export function ProjectSimulator({ projectId }: ProjectSimulatorProps) {
  // PureFeed state
  const [pureFeedEnabled, setPureFeedEnabled] = useState(true);

  // FocusGuard state
  const [testedDomain, setTestedDomain] = useState<string | null>(null);
  const blockedDomains = [
    'facebook.com',
    'instagram.com',
    'reddit.com',
    'tiktok.com',
  ];

  // DocLensBD state
  const [selectedFrame, setSelectedFrame] = useState<'wayfarer' | 'aviator' | 'titanium'>('wayfarer');

  // Rannabanna state
  const [selectedPantry, setSelectedPantry] = useState<string[]>(['Hilsha', 'Mustard Paste']);

  const pantryItems = [
    { id: 'Hilsha', name: 'Hilsha (ইলিশ)' },
    { id: 'Mustard Paste', name: 'Mustard Paste (সরিষা বাটা)' },
    { id: 'Green Chili', name: 'Green Chili (কাঁচা মরিচ)' },
    { id: 'Aubergine', name: 'Aubergine (বেগুন)' },
    { id: 'Rui Fish', name: 'Rui Fish (রুই মাছ)' },
    { id: 'Potato', name: 'Potato (আলু)' },
  ];

  const handleTestDomain = (domain: string) => {
    sound.playClick(800, 0.02, 0.05);
    setTestedDomain(domain);
  };

  const togglePantry = (item: string) => {
    sound.playClick(650, 0.02, 0.04);
    setSelectedPantry((prev) =>
      prev.includes(item) ? prev.filter((p) => p !== item) : [...prev, item]
    );
  };

  // PureFeed Simulator
  if (projectId === 'purefeed') {
    return (
      <div className={styles.simWrapper} data-lenis-prevent="true">
        <div className={styles.simHeader}>
          <div className={styles.macControls}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.simUrl}>youtube.com/watch?v=system_mesh</span>
          </div>
          <div className={styles.simToggleWrap}>
            <span className={styles.toggleLabel}>PureFeed Engine:</span>
            <button
              type="button"
              className={`${styles.toggleSwitch} ${pureFeedEnabled ? styles.toggleActive : ''}`}
              onClick={() => {
                const next = !pureFeedEnabled;
                setPureFeedEnabled(next);
                sound.playClick(next ? 850 : 450, 0.03, 0.06);
              }}
              aria-label="Toggle PureFeed Countermeasure"
              data-cursor="link"
            >
              <span className={styles.switchTrack}>
                <span className={styles.switchKnob} />
              </span>
            </button>
          </div>
        </div>

        <div className={styles.simCanvasArea}>
          {pureFeedEnabled ? (
            <div className={styles.pfCleanScreen}>
              <div className={styles.pfPlayer}>
                <div className={styles.pfCenterIcon}>▶</div>
                <div className={styles.pfHudOverlay}>
                  <span className={styles.pfPillSuccess}>✓ STREAM LIVE — 0 ADS</span>
                  <span className={styles.pfPillMeta}>LATENCY: 11.4ms (MV3 MAIN-WORLD)</span>
                </div>
              </div>
              <div className={styles.pfStatusBar}>
                <span>✓ YouTube Anti-Adblock Detection Bypassed</span>
                <span>DOM Observers: 0 Mutation Warnings</span>
              </div>
            </div>
          ) : (
            <div className={styles.pfAdScreen}>
              <div className={styles.pfAdBlocked}>
                <span className={styles.pfWarnIcon}>⚠️</span>
                <span className={styles.pfAdTitle}>Ad blockers violate YouTube Terms of Service</span>
                <p className={styles.pfAdSub}>Video playback blocked. Video will resume after 30s ad.</p>
                <div className={styles.pfAdTimer}>Ad 1 of 2 · 0:15 remaining</div>
              </div>
              <div className={styles.pfStatusBarWarn}>
                <span>❌ Native Player Trapped in Anti-Adblock Script</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // FocusGuard Simulator
  if (projectId === 'focusguard') {
    return (
      <div className={styles.simWrapper} data-lenis-prevent="true">
        <div className={styles.simHeader}>
          <div className={styles.macControls}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.simUrl}>C:\Windows\System32\drivers\etc\hosts</span>
          </div>
          <span className={styles.simTag}>OS KERNEL SINKHOLE</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.fgInstruction}>
            Click a domain to test live OS socket routing:
          </div>

          <div className={styles.fgDomainPills}>
            {blockedDomains.map((dom) => (
              <button
                key={dom}
                type="button"
                className={`${styles.fgPill} ${testedDomain === dom ? styles.fgPillActive : ''}`}
                onClick={() => handleTestDomain(dom)}
                data-cursor="link"
              >
                {dom}
              </button>
            ))}
          </div>

          <div className={styles.fgTerminal}>
            <div className={styles.fgTermHead}>DNS RESOLVER DIAGNOSTIC // NULL SOCKETS</div>
            {testedDomain ? (
              <div className={styles.fgTermLogs}>
                <span className={styles.logText}>DNS Query: {testedDomain}</span>
                <span className={styles.logIntercept}>
                  INTERCEPT: Windows Registry Machine Policy Matched
                </span>
                <span className={styles.logBlocked}>
                  RESOLVED: 127.0.0.1 (NULL Sinkhole) // 0.1ms // ACCESS TERMINATED
                </span>
              </div>
            ) : (
              <div className={styles.fgTermLogs}>
                <span className={styles.logMuted}>Select an addictive domain above to inspect DNS sinkhole intercept...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // DocLensBD Simulator
  if (projectId === 'doclensbd') {
    return (
      <div className={styles.simWrapper} data-lenis-prevent="true">
        <div className={styles.simHeader}>
          <div className={styles.macControls}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.simUrl}>doclensbd.onrender.com/virtual-tryon</span>
          </div>
          <span className={styles.simTag}>MEDIAPIPE 3D // 60 FPS</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.dlMeshContainer}>
            {/* Visual face wireframe representation */}
            <div className={styles.dlFaceGraphic}>
              <div className={styles.dlMeshLines}>
                <span className={styles.dlPupilL} />
                <span className={styles.dlPupilR} />
                <span className={styles.dlNoseBridge} />
              </div>
              {/* Virtual glasses overlay */}
              <div className={`${styles.dlGlasses} ${styles['frame_' + selectedFrame]}`}>
                <span className={styles.dlLensL} />
                <span className={styles.dlBridge} />
                <span className={styles.dlLensR} />
              </div>
            </div>

            <div className={styles.dlTelemetryOverlay}>
              <span>MESH POINTS: 468</span>
              <span>PUPIL DIST: 62.4mm</span>
              <span>FPS: 60 LOCKED</span>
            </div>
          </div>

          <div className={styles.dlFrameControls}>
            <span className={styles.dlFrameLabel}>Select Virtual Frame:</span>
            <div className={styles.dlButtonRow}>
              <button
                type="button"
                className={`${styles.dlBtn} ${selectedFrame === 'wayfarer' ? styles.dlBtnActive : ''}`}
                onClick={() => {
                  setSelectedFrame('wayfarer');
                  sound.playClick(600, 0.02, 0.04);
                }}
                data-cursor="link"
              >
                Classic Wayfarer
              </button>
              <button
                type="button"
                className={`${styles.dlBtn} ${selectedFrame === 'aviator' ? styles.dlBtnActive : ''}`}
                onClick={() => {
                  setSelectedFrame('aviator');
                  sound.playClick(700, 0.02, 0.04);
                }}
                data-cursor="link"
              >
                Aviator Titanium
              </button>
              <button
                type="button"
                className={`${styles.dlBtn} ${selectedFrame === 'titanium' ? styles.dlBtnActive : ''}`}
                onClick={() => {
                  setSelectedFrame('titanium');
                  sound.playClick(800, 0.02, 0.04);
                }}
                data-cursor="link"
              >
                Round Minimalist
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rannabanna Simulator
  if (projectId === 'rannabanna') {
    const isShorsheIlish = selectedPantry.includes('Hilsha') && selectedPantry.includes('Mustard Paste');
    const isBegunIlish = selectedPantry.includes('Hilsha') && selectedPantry.includes('Aubergine');

    return (
      <div className={styles.simWrapper} data-lenis-prevent="true">
        <div className={styles.simHeader}>
          <div className={styles.macControls}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.simUrl}>rannabanna.onrender.com/matcher</span>
          </div>
          <span className={styles.simTag}>SQLITE HEURISTIC ENGINE</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.rbPantryHead}>
            <span>Select Available Pantry Items:</span>
            <span className={styles.rbCount}>{selectedPantry.length} Selected</span>
          </div>

          <div className={styles.rbPantryGrid}>
            {pantryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`${styles.rbItemBtn} ${selectedPantry.includes(item.id) ? styles.rbItemActive : ''}`}
                onClick={() => togglePantry(item.id)}
                data-cursor="link"
              >
                {item.name}
              </button>
            ))}
          </div>

          <div className={styles.rbResultCard}>
            <div className={styles.rbResultHead}>
              <span className={styles.rbBadge}>Top Heuristic Match</span>
              <span className={styles.rbQueryTime}>0.8ms SQL</span>
            </div>

            <div className={styles.rbRecipeName}>
              {isShorsheIlish
                ? 'Shorshe Ilish (সরিষা ইলিশ) — 100% Match'
                : isBegunIlish
                ? 'Ilish Macher Jhol with Begun — 92% Match'
                : selectedPantry.includes('Hilsha')
                ? 'Fried Hilsha (ইলিশ ভাজা) — 80% Match'
                : selectedPantry.includes('Aubergine')
                ? 'Begun Bhorta (বেগুন ভর্তা) — 95% Match'
                : 'Select Hilsha or Mustard Paste to see instant recipe matchmaking...'}
            </div>

            <div className={styles.rbMetrics}>
              <span>Scale: Auto 4 Servings</span>
              <span>Spice Curve: Non-Linear Adjusted</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // POSHRA Simulator
  if (projectId === 'poshra') {
    return (
      <div className={styles.simWrapper} data-lenis-prevent="true">
        <div className={styles.simHeader}>
          <div className={styles.macControls}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.simUrl}>poshra.onrender.com/checkout</span>
          </div>
          <span className={styles.simTag}>NEXT.JS 16 // SSLCOMMERZ</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.poshraPipeline}>
            <div className={styles.poshraStep}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepTitle}>Cart State</span>
              <span className={styles.stepSub}>3 Items (৳ 4,250)</span>
            </div>
            <span className={styles.stepArrow}>&rarr;</span>
            <div className={styles.poshraStep}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepTitle}>Zod Validation</span>
              <span className={styles.stepSub}>100% Type-Safe</span>
            </div>
            <span className={styles.stepArrow}>&rarr;</span>
            <div className={styles.poshraStep}>
              <span className={styles.stepNum}>3</span>
              <span className={styles.stepTitle}>SSLCommerz</span>
              <span className={styles.stepSub}>Regional Gateway</span>
            </div>
          </div>

          <div className={styles.poshraStatus}>
            <span className={styles.poshraBadge}>COMMERCE PIPELINE VERIFIED</span>
            <span className={styles.poshraDesc}>Full Bangladeshi payment ecosystem integration</span>
          </div>
        </div>
      </div>
    );
  }

  // Portfolio DSP Synthesizer Simulator
  if (projectId === 'myportfolio') {
    return (
      <div className={styles.simWrapper} data-lenis-prevent="true">
        <div className={styles.simHeader}>
          <div className={styles.macControls}>
            <span className={`${styles.dot} ${styles.dotRed}`} />
            <span className={`${styles.dot} ${styles.dotYellow}`} />
            <span className={`${styles.dot} ${styles.dotGreen}`} />
            <span className={styles.simUrl}>audio.ts // Web Audio DSP Synthesizer</span>
          </div>
          <span className={styles.simTag}>0 AUDIO ASSETS // REALTIME</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.dspHeader}>
            <span>Interactive Frequency Synthesizer Pads:</span>
            <span className={styles.dspStatus}>
              {sound.isEnabled() ? '● Audio Online' : '○ Click to Test Audio'}
            </span>
          </div>

          <div className={styles.dspPadGrid}>
            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                if (!sound.isEnabled()) sound.toggle();
                sound.playClick(850, 0.02, 0.08);
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>850 Hz</span>
              <span className={styles.dspName}>Switch Click</span>
            </button>

            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                if (!sound.isEnabled()) sound.toggle();
                sound.playChirp(400, 1100, 0.06, 0.08);
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>400&rarr;1.1k Hz</span>
              <span className={styles.dspName}>Chirp Ramp</span>
            </button>

            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                if (!sound.isEnabled()) sound.toggle();
                sound.playDrawer();
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>240&rarr;420 Hz</span>
              <span className={styles.dspName}>Drawer Whoosh</span>
            </button>

            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                if (!sound.isEnabled()) sound.toggle();
                sound.playTick();
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>1.2 kHz</span>
              <span className={styles.dspName}>Subtle Tick</span>
            </button>
          </div>

          <div className={styles.dspTelemetry}>
            <span className={styles.dspBadge}>DSP HARDWARE SYNTHESIS</span>
            <span className={styles.dspDesc}>
              Pure Web Audio triangle and sine oscillators with exponential decay. Zero external audio downloads.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
