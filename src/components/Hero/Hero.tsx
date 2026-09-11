import { ScrambleText } from '../ScrambleText/ScrambleText';
import { HeroTerminal } from './HeroTerminal';
import { Magnetic } from '../Magnetic/Magnetic';
import { sound } from '../../utils/audio';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} id="hero">
      <div className="container" style={{ position: 'relative' }}>
        <div className={styles.heroGrid}>
          {/* Left Column: Typography, Narrative, Actions */}
          <div className={styles.heroLeft}>
            <div className={styles.eyebrow} data-cursor="link">
              <span className={styles.eyebrowDot} />
              <ScrambleText text="SYS://0xMOAYED // DHAKA.NODE // CSE.EWU" />
            </div>

            <h1 className={styles.heroTitle} data-cursor="inspect" data-cursor-label="ENGINEER">
              <ScrambleText text="Systems Architect &" />
              <br />
              <span className={styles.heroTitleHighlight}>Ad-Block Engine</span> Specialist
            </h1>

            <p className={styles.heroSubtitle}>
              Engineering low-overhead, resilient digital countermeasures and distributed web architectures
              built to thrive under real-world network friction. Grounded in East West University, Dhaka — architected
              for global systems scale.
            </p>

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
