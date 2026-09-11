import { useState, useEffect, useCallback, type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScrambleText } from '../ScrambleText/ScrambleText';
import { HeroTerminal } from './HeroTerminal';
import { InsightNode } from './InsightNode';
import { Magnetic } from '../Magnetic/Magnetic';
import { sound } from '../../utils/audio';
import styles from './Hero.module.css';

interface Specialty {
  id: string;
  title: string;
  shortCode: string;
  badge: string;
}

const SPECIALTIES: Specialty[] = [
  {
    id: 'adblock',
    title: 'Ad-Block Specialist',
    shortCode: '01 // AD-BLOCK',
    badge: 'CHROMIUM MV3',
  },
  {
    id: 'network',
    title: 'OS Policy Architect',
    shortCode: '02 // KERNEL & NET',
    badge: 'REGISTRY & DNS',
  },
  {
    id: 'heuristics',
    title: 'Culinary Physicist',
    shortCode: '03 // HEURISTICS',
    badge: 'NON-LINEAR SCALING',
  },
  {
    id: 'scale',
    title: 'Systems Craftsman',
    shortCode: '04 // SCALE & VISION',
    badge: '60 FPS WEBASSEMBLY',
  },
];

export function Hero() {
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Auto-cycle through specialties every 5 seconds unless user manually interacts
  useEffect(() => {
    if (!isAutoPlaying) return;

    const timer = setInterval(() => {
      setActiveRoleIndex((prev) => (prev + 1) % SPECIALTIES.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [isAutoPlaying]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setMousePos(null);
  }, []);

  const currentSpecialty = SPECIALTIES[activeRoleIndex];

  return (
    <section className={styles.hero} id="hero">
      <div className="container" style={{ position: 'relative' }}>
        <div className={styles.heroGrid}>
          {/* Left Column: Typography, Dynamic Narrative, Actions */}
          <div
            className={styles.heroLeft}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={
              {
                '--mouse-x': `${mousePos?.x ?? 200}px`,
                '--mouse-y': `${mousePos?.y ?? 100}px`,
                '--spotlight-opacity': mousePos ? 1 : 0,
              } as CSSProperties
            }
          >
            {/* Ambient mouse spotlight */}
            <div className={styles.heroSpotlight} aria-hidden="true" />

            {/* Live Operational Status Eyebrow */}
            <div
              className={styles.eyebrow}
              data-cursor="link"
              onClick={() => sound.playTick()}
              title="Sentinel Core Node Active"
            >
              <span className={styles.eyebrowDot} />
              <ScrambleText text="SYS://0xMOAYED // DHAKA.NODE // CSE.EWU" />
            </div>

            {/* Kinetic Title Stack */}
            <div className={styles.titleContainer}>
              <h1 className={styles.heroTitle} data-cursor="inspect" data-cursor-label="SYSTEMS">
                <span className={styles.titleLine1}>
                  <ScrambleText text="Systems Architect" />
                </span>

                <span className={styles.titleLine2}>
                  <span className={styles.ampersand} aria-hidden="true">&amp;</span>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={currentSpecialty.id}
                      initial={{ opacity: 0, y: 14, filter: 'blur(3px)' }}
                      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                      exit={{ opacity: 0, y: -14, filter: 'blur(3px)' }}
                      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                      className={styles.heroTitleHighlight}
                    >
                      {currentSpecialty.title}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </h1>

              {/* Interactive Tactical Role Scrubber */}
              <div
                className={styles.roleScrubber}
                role="tablist"
                aria-label="Engineering Disciplines"
              >
                {SPECIALTIES.map((spec, idx) => {
                  const isActive = activeRoleIndex === idx;
                  return (
                    <button
                      key={spec.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      className={`${styles.roleTab} ${isActive ? styles.roleTabActive : ''}`}
                      onClick={() => {
                        setActiveRoleIndex(idx);
                        sound.playClick(650 + idx * 75, 0.02, 0.06);
                        setIsAutoPlaying(false);
                      }}
                      onMouseEnter={() => sound.playTick()}
                      title={`Inspect ${spec.title}`}
                      data-cursor="pointer"
                    >
                      <span className={styles.roleTabIndicator} />
                      <span className={styles.roleTabCode}>{spec.shortCode}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Interactive Living Bio Paragraph */}
            <p className={styles.heroSubtitle}>
              Engineering low-overhead, resilient{' '}
              <InsightNode
                keyword="digital countermeasures"
                tag="ENGINEERING // MV3"
                title="Chromium Blink & AST Countermeasures"
                description="Bypassing YouTube's recursive 20ms anti-adblock loops and sponsored DOM cloaking with Main-World bridges."
                metric="<16ms Loop // 0 FOUC"
                href="#engineering"
                icon="radar"
              />{' '}
              and distributed web architectures built to thrive under{' '}
              <InsightNode
                keyword="real-world network friction"
                tag="TELEMETRY // DHAKA"
                title="High-Friction Network Resilience"
                description="Engineered for metered cellular bandwidth in South Asia with local SHA-256 caching and 0-packet loss fallback."
                metric="0 Dropouts // 60 FPS"
                href="#engineering"
                icon="network"
              />. Grounded in{' '}
              <InsightNode
                keyword="East West University, Dhaka"
                tag="ACADEMIC CORPS // EWU"
                title="East West University (EWU) — CSE"
                description="Undergraduate study (2025–Present) in Systems Architecture, Operating Systems, and Distributed Computing."
                metric="Board Merit Scholar"
                href="#foundation"
                icon="academic"
              />{' '}
              — architected for{' '}
              <InsightNode
                keyword="global systems scale"
                tag="PRODUCTION CORE"
                title="Enterprise Systems Rigor"
                description="6 verified production web platforms deployed with 100% type safety and hardware-accelerated interfaces."
                metric="6 Live Systems"
                href="#engineering"
                icon="systems"
              />.
            </p>

            {/* Telemetry Grid */}
            <div className={styles.telemetryGrid} aria-label="Key Engineer Telemetry">
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Origin Node</span>
                <span className={styles.telemetryValue}>Dhaka (UTC+6)</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Academic Merit</span>
                <span className={styles.telemetryValue}>Board Merit Scholar</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Production Core</span>
                <span className={styles.telemetryValue}>6 Full Systems</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemetryLabel}>Engine Response</span>
                <span className={styles.telemetryValue}>&lt;16ms Latency</span>
              </div>
            </div>

            {/* Call to Actions */}
            <div className={styles.heroActions}>
              <Magnetic strength={0.25}>
                <a
                  href="#engineering"
                  className={styles.btnPrimary}
                  onClick={() => sound.playClick(750, 0.03, 0.08)}
                  data-cursor="link"
                >
                  <span>Explore Systems &amp; Case Studies</span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <polyline points="19 12 12 19 5 12" />
                  </svg>
                </a>
              </Magnetic>

              <Magnetic strength={0.25}>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                  onClick={() => sound.playTick()}
                  data-cursor="link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                  <span>Examine Résumé (PDF)</span>
                </a>
              </Magnetic>

              <Magnetic strength={0.25}>
                <a
                  href="https://github.com/watchknight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.btnSecondary}
                  onClick={() => sound.playTick()}
                  data-cursor="link"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                  <span>GitHub (watchknight)</span>
                </a>
              </Magnetic>
            </div>
          </div>

          {/* Right Column: Interactive Live Telemetry HUD */}
          <div className={styles.heroRight}>
            <HeroTerminal />
          </div>
        </div>
      </div>
    </section>
  );
}
