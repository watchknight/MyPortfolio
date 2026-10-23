import { useState, useEffect } from 'react';
import { sound } from '../../audio/sound.js';
import styles from './ProjectSimulator.module.css';

interface ProjectSimulatorProps {
  projectId: string;
  isRunning?: boolean;
}

const BLOCKED_DOMAINS = [
  'facebook.com',
  'instagram.com',
  'reddit.com',
  'tiktok.com',
];

const PANTRY_ITEMS = [
  { id: 'Hilsha', name: 'Hilsha (ইলিশ)' },
  { id: 'Mustard Paste', name: 'Mustard Paste (সরিষা বাটা)' },
  { id: 'Green Chili', name: 'Green Chili (কাঁচা মরিচ)' },
  { id: 'Aubergine', name: 'Aubergine (বেগুন)' },
  { id: 'Rui Fish', name: 'Rui Fish (রুই মাছ)' },
  { id: 'Potato', name: 'Potato (আলু)' },
];

export function ProjectSimulator({ projectId, isRunning = false }: ProjectSimulatorProps) {
  // PureFeed state
  const [pureFeedEnabled, setPureFeedEnabled] = useState(true);
  const [pfLatency, setPfLatency] = useState('11.4ms');

  // FocusGuard state
  const [testedDomain, setTestedDomain] = useState<string>('facebook.com');

  // DocLensBD state
  const [selectedFrame, setSelectedFrame] = useState<'wayfarer' | 'aviator' | 'titanium'>('wayfarer');
  const [meshAngle, setMeshAngle] = useState(0);
  const [meshPupilShift, setMeshPupilShift] = useState(0);

  // Rannabanna state
  const [selectedPantry, setSelectedPantry] = useState<string[]>(['Hilsha', 'Mustard Paste']);
  const [rbSimQuery, setRbSimQuery] = useState('0.8ms SQL');

  // POSHRA state
  const [activeStep, setActiveStep] = useState(1);

  // Portfolio DSP state
  const [dspFreqBar, setDspFreqBar] = useState([35, 60, 45, 80, 55, 90, 70, 40]);

  // 1. PureFeed animation loop (runs only when isRunning is true)
  useEffect(() => {
    if (!isRunning || projectId !== 'purefeed') {
      return;
    }

    let animId: number;
    let lastUpdate = performance.now();

    const loop = (now: number) => {
      if (now - lastUpdate >= 400) {
        lastUpdate = now;
        const jitter = (10.5 + Math.random() * 2.8).toFixed(1);
        setPfLatency(`${jitter}ms`);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      setPfLatency('11.4ms');
    };
  }, [isRunning, projectId]);

  // 2. DocLensBD 3D head/glasses sway animation loop (runs only when isRunning is true)
  useEffect(() => {
    if (!isRunning || projectId !== 'doclensbd') {
      return;
    }

    let animId: number;
    const start = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - start) / 1000;
      const angle = Math.sin(elapsed * 1.8) * 5;
      const shift = Math.sin(elapsed * 2.2) * 2;
      setMeshAngle(angle);
      setMeshPupilShift(shift);
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      setMeshAngle(0);
      setMeshPupilShift(0);
    };
  }, [isRunning, projectId]);

  // 3. FocusGuard domain cycling timer (runs only when isRunning is true)
  useEffect(() => {
    if (!isRunning || projectId !== 'focusguard') return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % BLOCKED_DOMAINS.length;
      setTestedDomain(BLOCKED_DOMAINS[index]);
    }, 2400);

    return () => clearInterval(interval);
  }, [isRunning, projectId]);

  // 4. Rannabanna query time simulation (runs only when isRunning is true)
  useEffect(() => {
    if (!isRunning || projectId !== 'rannabanna') {
      return;
    }

    const interval = setInterval(() => {
      const times = ['0.7ms SQL', '0.8ms SQL', '0.9ms SQL', '0.6ms SQL'];
      setRbSimQuery(times[Math.floor(Math.random() * times.length)]);
    }, 1800);

    return () => {
      clearInterval(interval);
      setRbSimQuery('0.8ms SQL');
    };
  }, [isRunning, projectId]);

  // 5. POSHRA pipeline step cycling (runs only when isRunning is true)
  useEffect(() => {
    if (!isRunning || projectId !== 'poshra') {
      return;
    }

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev % 3) + 1);
    }, 1500);

    return () => {
      clearInterval(interval);
      setActiveStep(1);
    };
  }, [isRunning, projectId]);

  // 6. Portfolio DSP waveform animation (runs only when isRunning is true)
  useEffect(() => {
    if (!isRunning || projectId !== 'myportfolio') {
      return;
    }

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (now - lastTime >= 120) {
        lastTime = now;
        setDspFreqBar([
          Math.floor(25 + Math.random() * 50),
          Math.floor(40 + Math.random() * 55),
          Math.floor(30 + Math.random() * 60),
          Math.floor(50 + Math.random() * 45),
          Math.floor(35 + Math.random() * 55),
          Math.floor(60 + Math.random() * 38),
          Math.floor(40 + Math.random() * 50),
          Math.floor(20 + Math.random() * 45),
        ]);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      setDspFreqBar([35, 60, 45, 80, 55, 90, 70, 40]);
    };
  }, [isRunning, projectId]);

  const handleTestDomain = (domain: string) => {
    setTestedDomain(domain);
  };

  const togglePantry = (item: string) => {
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
          </div>
          <div className={styles.simToggleWrap}>
            <span className={styles.toggleLabel}>PureFeed:</span>
            <button
              type="button"
              className={`${styles.toggleSwitch} ${pureFeedEnabled ? styles.toggleActive : ''}`}
              onClick={() => {
                const next = !pureFeedEnabled;
                setPureFeedEnabled(next);
                sound.play('toggle', { on: next });
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
                  <span className={styles.pfPillMeta}>LATENCY: {pfLatency} (MV3 MAIN-WORLD)</span>
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
          </div>
          <span className={styles.simTag}>OS Sinkhole</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.fgInstruction}>
            Click a domain to test live OS socket routing:
          </div>

          <div className={styles.fgDomainPills}>
            {BLOCKED_DOMAINS.map((dom) => (
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
            <span className={styles.simUrl}>doclensbd.onrender.com</span>
          </div>
          <span className={styles.simTag}>MediaPipe 3D</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.dlMeshContainer}>
            {/* Visual face wireframe representation */}
            <div className={styles.dlFaceGraphic}>
              <div className={styles.dlMeshLines}>
                <span
                  className={styles.dlPupilL}
                  style={{ transform: `translateX(${meshPupilShift}px)` }}
                />
                <span
                  className={styles.dlPupilR}
                  style={{ transform: `translateX(${meshPupilShift}px)` }}
                />
                <span className={styles.dlNoseBridge} />
              </div>
              {/* Virtual glasses overlay */}
              <div
                className={`${styles.dlGlasses} ${styles['frame_' + selectedFrame]}`}
                style={{
                  transform: `rotate(${meshAngle}deg) translate(${meshPupilShift}px, 0)`,
                  transformOrigin: 'center center',
                }}
              >
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
            <span className={styles.simUrl}>rannabanna.onrender.com</span>
          </div>
          <span className={styles.simTag}>SQLite Heuristics</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.rbPantryHead}>
            <span>Select Available Pantry Items:</span>
            <span className={styles.rbCount}>{selectedPantry.length} Selected</span>
          </div>

          <div className={styles.rbPantryGrid}>
            {PANTRY_ITEMS.map((item) => (
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
              <span className={styles.rbQueryTime}>{rbSimQuery}</span>
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
            <span className={styles.simUrl}>poshra.onrender.com</span>
          </div>
          <span className={styles.simTag}>SSLCommerz</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.poshraPipeline}>
            <div className={`${styles.poshraStep} ${activeStep === 1 ? styles.stepActive : ''}`}>
              <span className={styles.stepNum}>1</span>
              <span className={styles.stepTitle}>Cart State</span>
              <span className={styles.stepSub}>3 Items (৳ 4,250)</span>
            </div>
            <span className={styles.stepArrow}>&rarr;</span>
            <div className={`${styles.poshraStep} ${activeStep === 2 ? styles.stepActive : ''}`}>
              <span className={styles.stepNum}>2</span>
              <span className={styles.stepTitle}>Zod Validation</span>
              <span className={styles.stepSub}>100% Type-Safe</span>
            </div>
            <span className={styles.stepArrow}>&rarr;</span>
            <div className={`${styles.poshraStep} ${activeStep === 3 ? styles.stepActive : ''}`}>
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
            <span className={styles.simUrl}>watchknight-dev.onrender.com</span>
          </div>
          <span className={styles.simTag}>Web Audio DSP</span>
        </div>

        <div className={styles.simBody}>
          <div className={styles.dspHeader}>
            <span>Interactive Frequency Synthesizer Pads:</span>
            <span className={styles.dspStatus}>
              {sound.state.on ? '● Audio Online' : '○ Sound Muted (Turn on via M)'}
            </span>
          </div>

          <div className={styles.dspPadGrid}>
            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                sound.play('toggle', { on: true });
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>Voice</span>
              <span className={styles.dspName}>Toggle</span>
            </button>

            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                sound.play('chime');
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>Voice</span>
              <span className={styles.dspName}>Chime</span>
            </button>

            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                sound.play('swish', { dir: 1 });
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>Voice</span>
              <span className={styles.dspName}>Swish</span>
            </button>

            <button
              type="button"
              className={styles.dspPadBtn}
              onClick={() => {
                sound.play('tick');
              }}
              data-cursor="link"
            >
              <span className={styles.dspFreq}>Voice</span>
              <span className={styles.dspName}>Tick</span>
            </button>
          </div>

          <div className={styles.dspTelemetry}>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '18px', margin: '4px 0' }} aria-hidden="true">
              {dspFreqBar.map((h, idx) => (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${h}%`,
                    background: 'var(--accent)',
                    borderRadius: '1px',
                    opacity: 0.8,
                    transition: isRunning ? 'height 0.12s ease' : 'none',
                  }}
                />
              ))}
            </div>
            <span className={styles.dspBadge}>DSP HARDWARE SYNTHESIS</span>
            <span className={styles.dspDesc}>
              Pure Web Audio pentatonic synthesis oscillators with dynamic filters. Zero external audio downloads.
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
