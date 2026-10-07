import { useState, useEffect, useCallback, useRef } from 'react';
import { gsap } from '../../motion/index';
import { RollText } from '../../components/RollText/RollText';
import { RotatingClause } from '../../components/RotatingClause/RotatingClause';
import { ProjectSimulator } from '../../components/ProjectSimulator/ProjectSimulator';
import { ProjectLedger } from '../../components/CaseStudy/ProjectLedger';
import { SignatureCanvas } from '../../components/SignatureCanvas/SignatureCanvas';
import { TerminalTile } from '../../components/TerminalTile/TerminalTile';
import { Magnetic } from '../../components/Magnetic/Magnetic';
import { projects } from '../../data/projects';
import { profileData } from '../../data/profile';
import { sound } from '../../utils/audio';
import styles from './HomePage.module.css';

interface HomePageProps {
  onNavigate: (path: string) => void;
  onSelectProject?: (projectId: string) => void;
}

export function HomePage({ onNavigate, onSelectProject }: HomePageProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('view_mode') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });

  const [dhakaTime, setDhakaTime] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [ping, setPing] = useState(14);
  const [fps, setFps] = useState(60);

  // Live Dhaka Clock (updates each minute, shows UTC+6)
  useEffect(() => {
    const updateTime = () => {
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date());
      setDhakaTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const viewContainerRef = useRef<HTMLDivElement>(null);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToSelectedWork = useCallback(() => {
    document.getElementById('selected-work')?.scrollIntoView({ behavior: 'smooth' });
    sound.playTick();
  }, []);

  const scrollToContact = useCallback(() => {
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
    sound.playTick();
  }, []);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sound.playTick();
  }, []);

  const applyViewMode = useCallback((mode: 'grid' | 'table') => {
    const container = viewContainerRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!container || reduce) {
      setViewMode(mode);
      localStorage.setItem('view_mode', mode);
      return;
    }

    gsap.killTweensOf(container);
    gsap.to(container, {
      opacity: 0,
      duration: 0.1,
      ease: 'power2.in',
      overwrite: true,
      onComplete: () => {
        setViewMode(mode);
        localStorage.setItem('view_mode', mode);
        gsap.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 0.1, ease: 'power2.out', overwrite: true });
      },
    });
  }, []);

  // Sync View Mode (Grid vs Table) from external events (Nav, ⌘K, G/T shortcuts)
  useEffect(() => {
    const handleView = (e: Event) => {
      const custom = e as CustomEvent<'grid' | 'table'>;
      if (custom.detail && custom.detail !== viewMode) {
        applyViewMode(custom.detail);
      }
    };
    window.addEventListener('set-view-mode', handleView);
    return () => window.removeEventListener('set-view-mode', handleView);
  }, [viewMode, applyViewMode]);

  const changeViewMode = useCallback((mode: 'grid' | 'table') => {
    if (mode === viewMode) return;
    sound.playClick(mode === 'grid' ? 650 : 720, 0.02, 0.06);
    applyViewMode(mode);
    window.dispatchEvent(new CustomEvent('set-view-mode', { detail: mode }));
  }, [viewMode, applyViewMode]);

  // Telemetry: FPS monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(120, Math.max(30, frameCount)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Telemetry: Ping jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(12 + Math.random() * 5));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyEmail = useCallback(() => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(profileData.contact.email).catch(() => {});
      }
    } catch {
      // ignore clipboard error in headless/restricted environments
    }
    setCopiedEmail(true);
    sound.playClick(900, 0.03, 0.06);
    if (copyTimeoutRef.current) {
      clearTimeout(copyTimeoutRef.current);
    }
    copyTimeoutRef.current = setTimeout(() => {
      setCopiedEmail(false);
      copyTimeoutRef.current = null;
    }, 1600); // exactly 1.6s per spec
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) {
        clearTimeout(copyTimeoutRef.current);
      }
    };
  }, []);

  // Featured and secondary project subsets
  const purefeed = projects.find((p) => p.id === 'purefeed');
  const doclensbd = projects.find((p) => p.id === 'doclensbd');
  const otherProjects = projects.filter(
    (p) => p.id === 'focusguard' || p.id === 'rannabanna' || p.id === 'poshra'
  );

  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8;

  return (
    <div className={styles.homeContainer}>
      {/* ── 2. HERO (min-height 100svh, content bottom-aligned, left-aligned) ── */}
      <section className={styles.heroSection} aria-label="Introduction">
        <div className={styles.heroGrid}>
          {/* Cols 1–8: Headline, typewriter, CTAs */}
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle} data-hero-title>
              Hi, this is Moayed.
              <br />
              I build fast, reliable software.
            </h1>

            <p className={styles.heroLead} data-hero-in>
              I build software that <RotatingClause />
            </p>

            <div className={styles.heroActions} data-hero-in>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  className={styles.primaryPillBtn}
                  onClick={scrollToSelectedWork}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <RollText>View My Works</RollText>
                </button>
              </Magnetic>

              <Magnetic strength={0.3}>
                <button
                  type="button"
                  className={styles.secondaryPillBtn}
                  onClick={scrollToContact}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <RollText>Get in Touch</RollText>
                </button>
              </Magnetic>

              <Magnetic strength={0.3}>
                <a
                  href="/resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.heroTextLink}
                  onClick={() => sound.playTick()}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <RollText>Download Résumé</RollText>
                </a>
              </Magnetic>
            </div>
          </div>

          {/* Cols 9–12: Two stacked tiles (ACCENT tile + Surface Dhaka tile) */}
          <div className={styles.heroTiles}>
            {/* ACCENT tile: The only accent tile in view */}
            <div className={styles.heroAccentTile} data-tile="accent">
              <div className={styles.heroAccentHeader}>
                <span className={styles.heroAccentDot} />
              </div>
              <h3 className={styles.heroAccentTitle}>
                Available for Internships &amp; Projects
              </h3>
              <p className={styles.heroAccentDesc}>
                East West University CSE • Remote Worldwide
              </p>
            </div>

            {/* Surface tile: Dhaka, Bangladesh + Live Local Time */}
            <div className={styles.heroSurfaceTile} data-tile="surface">
              <div className={styles.heroSurfaceHeader}>
                <span className={styles.dhakaLocation}>Dhaka, Bangladesh</span>
                <span className={styles.dhakaTzPill}>UTC+6</span>
              </div>
              <div className={styles.dhakaTimeDisplay}>
                <span className={styles.dhakaTimeDigits}>{dhakaTime || '14:32'}</span>
                <span className={styles.dhakaTimeSub}>Local Time</span>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll to explore chevron/label */}
        <div
          className={styles.scrollIndicator}
          onClick={scrollToSelectedWork}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              scrollToSelectedWork();
            }
          }}
          role="button"
          tabIndex={0}
          aria-label="Scroll to explore selected work"
          data-cursor="link"
        >
          <span>Scroll to explore</span>
          <svg
            className={styles.scrollChevron}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </section>

      {/* ── 3. SELECTED WORK (bento) ── */}
      <section id="selected-work" className={styles.section} aria-label="Selected Work">
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionEyebrow}>Selected projects</span>
            <h2 className={styles.sectionTitle}>Selected work</h2>
          </div>

          <div className={styles.headerRightControls}>
            <div className={styles.viewModeToggle} role="group" aria-label="Project view format">
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'grid' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => changeViewMode('grid')}
                title="Switch to Bento Grid View [G]"
                data-cursor="link"
                data-magnetic="0.3"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                <span>Grid [G]</span>
              </button>
              <button
                type="button"
                className={`${styles.viewToggleBtn} ${viewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => changeViewMode('table')}
                title="Switch to Data Ledger Table [T]"
                data-cursor="link"
                data-magnetic="0.3"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
                <span>Table [T]</span>
              </button>
            </div>
          </div>
        </header>

        <div ref={viewContainerRef}>
          {viewMode === 'table' ? (
          <div className={styles.tableWrapper}>
            <ProjectLedger
              projects={projects}
              onSelectProject={(p) => onSelectProject?.(p.id)}
            />
          </div>
        ) : (
          <div className={styles.workBentoGrid}>
            {/* Row 1: Feature Tile 1 — PureFeed (7×4, col span 7) */}
            {purefeed && (
              <article
                className={`${styles.bentoTile} ${styles.featureTilePurefeed}`}
                data-tile="feature"
                data-cursor="inspect"
                data-cursor-label="View project"
                tabIndex={0}
                onClick={() => {
                  sound.playClick();
                  onSelectProject?.(purefeed.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sound.playClick();
                    onSelectProject?.(purefeed.id);
                  }
                }}
              >
                <div className={styles.tileHeaderBar}>
                  <div className={styles.tileHeaderLeft}>
                    <span className={styles.categoryBadge}>{purefeed.category}</span>
                  </div>
                  <span className={styles.metricChip}>{purefeed.perf}</span>
                </div>

                <div className={styles.tileBody}>
                  <h3 className={styles.tileTitle}>{purefeed.title}</h3>
                  <p className={styles.tileDescClamped}>{purefeed.shortDescription}</p>

                  <div className={styles.stackChips}>
                    {purefeed.tech.map((t) => (
                      <span key={t} className={styles.stackPill}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className={styles.featureMediaInset}
                  data-tile="media"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProjectSimulator projectId="purefeed" />
                </div>

                <div className={styles.tileActionsRow}>
                  <button
                    type="button"
                    className={styles.tilePrimaryBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playClick();
                      onSelectProject?.(purefeed.id);
                    }}
                    data-cursor="link"
                    data-magnetic="0.3"
                  >
                    <span>Explore Architecture</span>
                    <span>&rarr;</span>
                  </button>

                  {purefeed.githubUrl && (
                    <a
                      href={purefeed.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.tileSecondaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playTick();
                      }}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                      <span>Source</span>
                    </a>
                  )}
                </div>
              </article>
            )}

            {/* Row 1: Feature Tile 2 — DocLensBD (5×4, col span 5) */}
            {doclensbd && (
              <article
                className={`${styles.bentoTile} ${styles.featureTileDoclens}`}
                data-tile="feature"
                data-cursor="inspect"
                data-cursor-label="View project"
                tabIndex={0}
                onClick={() => {
                  sound.playClick();
                  onSelectProject?.(doclensbd.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sound.playClick();
                    onSelectProject?.(doclensbd.id);
                  }
                }}
              >
                <div className={styles.tileHeaderBar}>
                  <div className={styles.tileHeaderLeft}>
                    <span className={styles.categoryBadge}>{doclensbd.category}</span>
                  </div>
                  <span className={styles.metricChip}>{doclensbd.perf}</span>
                </div>

                <div className={styles.tileBody}>
                  <h3 className={styles.tileTitle}>{doclensbd.title}</h3>
                  <p className={styles.tileDescClamped}>{doclensbd.shortDescription}</p>

                  <div className={styles.stackChips}>
                    {doclensbd.tech.map((t) => (
                      <span key={t} className={styles.stackPill}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className={styles.featureMediaInset}
                  data-tile="media"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProjectSimulator projectId="doclensbd" />
                </div>

                <div className={styles.tileActionsRow}>
                  {doclensbd.liveUrl && (
                    <a
                      href={doclensbd.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.tilePrimaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playTick();
                      }}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      <span>Visit Live Site</span>
                      <span>&rarr;</span>
                    </a>
                  )}

                  {doclensbd.githubUrl && (
                    <a
                      href={doclensbd.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.tileSecondaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playTick();
                      }}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                      <span>Source</span>
                    </a>
                  )}
                </div>
              </article>
            )}

            {/* Row 2: Standard Tiles (4×3 each: FocusGuard, Rannabanna, POSHRA) */}
            {otherProjects.map((p) => (
              <article
                key={p.id}
                className={`${styles.bentoTile} ${styles.standardWorkTile}`}
                data-tile="standard"
                data-cursor="inspect"
                data-cursor-label="View project"
                tabIndex={0}
                onClick={() => {
                  sound.playClick();
                  onSelectProject?.(p.id);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sound.playClick();
                    onSelectProject?.(p.id);
                  }
                }}
              >
                <div className={styles.tileHeaderBar}>
                  <span className={styles.categoryBadge}>{p.category}</span>
                  <span className={styles.metricChip}>{p.perf}</span>
                </div>

                <div className={styles.tileBody}>
                  <h3 className={styles.tileTitle}>{p.title}</h3>
                  <p className={styles.tileDescClamped}>{p.shortDescription}</p>

                  <div className={styles.stackChips}>
                    {p.tech.slice(0, 3).map((t) => (
                      <span key={t} className={styles.stackPill}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div
                  className={styles.standardMediaInset}
                  data-tile="media"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ProjectSimulator projectId={p.id} />
                </div>

                <div className={styles.tileActionsRow}>
                  {p.liveUrl ? (
                    <a
                      href={p.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.tilePrimaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playTick();
                      }}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      <span>Live Site</span>
                      <span>&rarr;</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      className={styles.tilePrimaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playClick();
                        onSelectProject?.(p.id);
                      }}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      <span>Inspect</span>
                      <span>&rarr;</span>
                    </button>
                  )}

                  {p.githubUrl && (
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.tileSecondaryBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playTick();
                      }}
                      data-cursor="link"
                      data-magnetic="0.3"
                    >
                      <span>Source</span>
                    </a>
                  )}
                </div>
              </article>
            ))}

            {/* Row 3: Full-Width INVERTED Tile (12×1): View all N projects */}
            <div
              className={styles.invertedViewAllTile}
              data-tile="inverted"
              onClick={() => {
                sound.playTick();
                onNavigate('/works');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  sound.playTick();
                  onNavigate('/works');
                }
              }}
              role="button"
              tabIndex={0}
              aria-label="View all projects in detail"
              data-cursor="link"
            >
              <div className={styles.invertedContent}>
                <span className={styles.invertedHeading}>
                  View all {projects.length} architectural projects
                </span>
                <span className={styles.invertedSub}>
                  Inspect comprehensive case studies, problem statements, and system telemetry &rarr;
                </span>
              </div>
              <Magnetic strength={0.3}>
                <span className={styles.invertedBtn} data-magnetic="0.3">
                  Explore Works
                </span>
              </Magnetic>
            </div>
          </div>
        )}
        </div>
      </section>

      {/* ── 4. ABOUT AND TOOLS (bento) ── */}
      <section id="about" className={styles.section} aria-label="About & Tools">
        <header className={styles.sectionHeader}>
          <div className={styles.sectionTitleGroup}>
            <span className={styles.sectionEyebrow}>Background and capabilities</span>
            <h2 className={styles.sectionTitle}>About and tools</h2>
          </div>
        </header>

        <div className={styles.aboutBentoGrid}>
          {/* Row 1: About tile (5×3, surface) */}
          <article className={`${styles.bentoTile} ${styles.aboutTile}`} data-tile="surface">
            <div className={styles.aboutBody}>
              <h3 className={styles.aboutHeading}>About Moayed</h3>
              <p className={styles.aboutParagraph}>
                I am a Computer Science and Engineering undergraduate at{' '}
                <strong>East West University</strong> in Dhaka, Bangladesh.
                I specialize in browser engine internals (Chromium MV3), operating-system policy enforcement,
                real-time 3D computer vision (MediaPipe), and low-overhead web architectures.
              </p>
              <p className={styles.aboutParagraph}>
                I focus on solving real technical challenges with fast, clean, and reliable software designed for low bandwidth and latency-critical environments.
              </p>
            </div>
            <div className={styles.aboutFooter}>
              <Magnetic strength={0.3}>
                <a
                  href="/resume"
                  className={styles.tilePrimaryBtn}
                  onClick={(e) => {
                    e.preventDefault();
                    sound.playClick();
                    onNavigate('/resume');
                  }}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <span>View Résumé</span>
                  <span>&rarr;</span>
                </a>
              </Magnetic>
            </div>
          </article>

          {/* Row 1: Terminal tile (7×3, surface, mono) */}
          <div className={`${styles.bentoTile} ${styles.terminalBentoTile}`} data-tile="surface">
            <TerminalTile onNavigate={onNavigate} />
          </div>

          {/* Row 2: Stack tile (3×2, surface) */}
          <article className={`${styles.bentoTile} ${styles.stackTile}`} data-tile="surface">
            <h3 className={styles.smallTileTitle}>Core Technologies</h3>
            <div className={styles.stackPillCloud}>
              {profileData.skills.languages.slice(0, 5).map((s) => (
                <span key={s} className={styles.techChip}>
                  {s}
                </span>
              ))}
              {profileData.skills.frontend.slice(0, 4).map((s) => (
                <span key={s} className={styles.techChip}>
                  {s}
                </span>
              ))}
              {profileData.skills.backend.slice(0, 3).map((s) => (
                <span key={s} className={styles.techChip}>
                  {s}
                </span>
              ))}
              {profileData.skills.systems.slice(0, 2).map((s) => (
                <span key={s} className={styles.techChip}>
                  {s}
                </span>
              ))}
            </div>
          </article>

          {/* Row 2: Education tile (3×2, surface) */}
          <article className={`${styles.bentoTile} ${styles.educationTile}`} data-tile="surface">
            <div className={styles.tileHeaderBar}>
              <span className={styles.tileEyebrow}>Academic record</span>
            </div>
            <h3 className={styles.smallTileTitle}>Education</h3>
            <div className={styles.eduChronology}>
              <div className={styles.eduItem}>
                <span className={styles.eduDegree}>East West University</span>
                <span className={styles.eduDetails}>B.Sc. CSE (2025–Present)</span>
              </div>
              <div className={styles.eduItem}>
                <span className={styles.eduDegree}>SSC Class 10 (GPA 5.0)</span>
                <span className={styles.eduDetails}>Board General Merit Scholarship</span>
              </div>
              <div className={styles.eduItem}>
                <span className={styles.eduDegree}>JSC Class 8 (GPA 5.0)</span>
                <span className={styles.eduDetails}>Board General Merit Scholarship</span>
              </div>
            </div>
            <div className={styles.eduFooter}>
              <Magnetic strength={0.3}>
                <a
                  href="/foundation"
                  className={styles.inlineTimelineLink}
                  onClick={(e) => {
                    e.preventDefault();
                    sound.playTick();
                    onNavigate('/foundation');
                  }}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  Full timeline
                </a>
              </Magnetic>
            </div>
          </article>

          {/* Row 2: Telemetry tile (3×2, surface) */}
          <article className={`${styles.bentoTile} ${styles.telemetryTile}`} data-tile="surface">
            <div className={styles.tileHeaderBar}>
              <span className={styles.tileEyebrow}>Telemetry</span>
              <span className={styles.telemetryPulseDot} />
            </div>
            <h3 className={styles.smallTileTitle}>Verified Readouts</h3>
            <div className={styles.telemetryList}>
              <div className={styles.telemetryItem}>
                <span className={styles.telemLabel}>EDGE RTT:</span>
                <span className={styles.telemVal}>{ping} ms</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemLabel}>BUDGET:</span>
                <span className={styles.telemVal}>{fps} FPS</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemLabel}>CONCURRENCY:</span>
                <span className={styles.telemVal}>{cores} Cores</span>
              </div>
              <div className={styles.telemetryItem}>
                <span className={styles.telemLabel}>NODE:</span>
                <span className={styles.telemVal}>Dhaka (UTC+6)</span>
              </div>
            </div>
          </article>

          {/* Row 2: Links tile (3×2, INVERTED) */}
          <article className={`${styles.bentoTile} ${styles.linksInvertedTile}`} data-tile="inverted">
            <h3 className={styles.invertedTileTitle}>Direct Dispatch</h3>
            <p className={styles.invertedTileDesc}>
              Available for software engineering internships and projects.
            </p>

            <div className={styles.linksRow}>
              <Magnetic strength={0.3}>
                <a
                  href="https://github.com/watchknight"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.invertedIconLink}
                  onClick={() => sound.playTick()}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  GitHub
                </a>
              </Magnetic>

              <Magnetic strength={0.3}>
                <a
                  href="https://linkedin.com/in/abdur-rahman-moayed-9225b5389"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.invertedIconLink}
                  onClick={() => sound.playTick()}
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  LinkedIn
                </a>
              </Magnetic>
            </div>

            <div className={styles.copyEmailWrapper}>
              <Magnetic strength={0.3}>
                <button
                  type="button"
                  className={`${styles.copyEmailBtn} ${copiedEmail ? 'btn-copied' : ''}`}
                  onClick={handleCopyEmail}
                  aria-live="polite"
                  data-cursor="link"
                  data-magnetic="0.3"
                >
                  <RollText>{copiedEmail ? 'Copied' : 'Copy email'}</RollText>
                </button>
              </Magnetic>
            </div>
          </article>
        </div>
      </section>

      {/* ── 5. GUESTBOOK BAND (one full-width surface tile, radius --r-xl) ── */}
      <section id="guestbook" className={styles.section} aria-label="Digital Guestbook">
        <div className={styles.guestbookTileContainer} data-tile="surface">
          <SignatureCanvas />
        </div>
      </section>

      {/* ── 6. CONTACT AND FOOTER ── */}
      <section id="contact" className={styles.section} aria-label="Contact and Footer">
        <div className={styles.contactCard} data-tile="surface">
          <h2 className={styles.contactHeading}>Interested in working together?</h2>
          <p className={styles.contactSubtext}>
            I&apos;m currently open for software engineering internships and freelance web projects.
            Feel free to reach out anytime.
          </p>

          <div className={styles.contactActions}>
            <Magnetic strength={0.3}>
              <button
                type="button"
                className={styles.primaryPillBtn}
                onClick={() => {
                  sound.playClick();
                  onNavigate('/contact');
                }}
                data-cursor="link"
                data-magnetic="0.3"
              >
                <RollText>Send me a message</RollText>
              </button>
            </Magnetic>

            <Magnetic strength={0.3}>
              <button
                type="button"
                className={`${styles.secondaryPillBtn} ${copiedEmail ? 'btn-copied' : ''}`}
                onClick={handleCopyEmail}
                aria-live="polite"
                data-cursor="link"
                data-magnetic="0.3"
              >
                <RollText>{copiedEmail ? 'Copied' : 'Copy email'}</RollText>
              </button>
            </Magnetic>
          </div>

          <div className={styles.socialLinksRow}>
            <Magnetic strength={0.3}>
              <a
                href="https://github.com/watchknight"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={() => sound.playTick()}
                data-cursor="link"
                data-magnetic="0.3"
              >
                GitHub
              </a>
            </Magnetic>
            <Magnetic strength={0.3}>
              <a
                href="https://linkedin.com/in/abdur-rahman-moayed-9225b5389"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={() => sound.playTick()}
                data-cursor="link"
                data-magnetic="0.3"
              >
                LinkedIn
              </a>
            </Magnetic>
            <Magnetic strength={0.3}>
              <a
                href="/resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialLink}
                onClick={() => sound.playTick()}
                data-cursor="link"
                data-magnetic="0.3"
              >
                Résumé (PDF)
              </a>
            </Magnetic>
          </div>
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <div className={styles.footerInner}>
            <span className={styles.footerCopyright}>
              &copy; {new Date().getFullYear()} Abdur Rahman Moayed
            </span>
            <span className={styles.footerLocation}>
              Dhaka, Bangladesh ({dhakaTime || '14:32'} UTC+6)
            </span>
            <Magnetic strength={0.3}>
              <button
                type="button"
                className={styles.backToTopBtn}
                onClick={scrollToTop}
                aria-label="Scroll back to top"
                data-cursor="link"
                data-magnetic="0.3"
              >
                Back to top &uarr;
              </button>
            </Magnetic>
          </div>
        </footer>
      </section>
    </div>
  );
}
