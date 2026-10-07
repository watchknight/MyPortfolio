import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { sound } from '../../utils/audio';
import { CommandPalette } from '../CommandPalette/CommandPalette';
import { Magnetic } from '../Magnetic/Magnetic';
import { gsap, toggleTheme as toggleThemeMotion } from '../../motion/index';
import type { RoutePath } from '../../hooks/useRouter';
import styles from './Nav.module.css';

const navItems: { label: string; path: RoutePath }[] = [
  { label: 'Works', path: '/works' },
  { label: 'Foundation', path: '/foundation' },
  { label: 'Résumé', path: '/resume' },
  { label: 'Contact', path: '/contact' },
];

interface NavProps {
  currentPath: RoutePath;
  onNavigate: (path: string) => void;
}

export function Nav({ currentPath, onNavigate }: NavProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileMenuRendered, setMobileMenuRendered] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [controlsRendered, setControlsRendered] = useState(false);
  const [soundActive, setSoundActive] = useState(() => sound.isEnabled());
  const [grainActive, setGrainActive] = useState(() => {
    if (typeof window !== 'undefined') {
      const isTouch = window.matchMedia('(pointer: coarse)').matches;
      const savedGrain = localStorage.getItem('grain');
      return (savedGrain === 'true' || (savedGrain === null && !isTouch)) && !isTouch;
    }
    return false;
  });
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('view_mode') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const current = document.documentElement.getAttribute('data-theme') as 'dark' | 'light' | null;
      if (current === 'dark' || current === 'light') return current;
      const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    return 'dark';
  });

  const controlsRef = useRef<HTMLDivElement>(null);
  const controlsBtnRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const controlsExitTweenRef = useRef<gsap.core.Tween | null>(null);
  const mobileExitTweenRef = useRef<gsap.core.Tween | null>(null);

  // Nav active pill gliding refs
  const navLinksRef = useRef<HTMLDivElement>(null);
  const activePillRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const xToRef = useRef<((value: number) => void) | null>(null);
  const wToRef = useRef<((value: number) => void) | null>(null);

  const isFirstNavMount = useRef(true);

  // Setup GSAP quickTo for nav active pill
  useEffect(() => {
    if (typeof window === 'undefined' || !activePillRef.current) return;
    const pill = activePillRef.current;
    xToRef.current = gsap.quickTo(pill, 'x', { duration: 0.35, ease: 'power3.out' });
    wToRef.current = gsap.quickTo(pill, 'width', { duration: 0.35, ease: 'power3.out' });
  }, []);

  const movePillToTarget = useCallback((targetEl: HTMLElement | null, animate = true) => {
    const pill = activePillRef.current;
    const container = navLinksRef.current;
    if (!pill || !container) return;

    if (!targetEl) {
      gsap.to(pill, { opacity: 0, duration: 0.2, ease: 'power3.out', overwrite: 'auto' });
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const targetX = targetRect.left - containerRect.left;
    const targetWidth = targetRect.width;

    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!animate || reduce) {
      gsap.set(pill, { x: targetX, width: targetWidth, opacity: 1 });
    } else {
      const isCurrentlyHidden = parseFloat(pill.style.opacity || '0') === 0;
      if (isCurrentlyHidden) {
        gsap.set(pill, { x: targetX, width: targetWidth });
      } else {
        xToRef.current?.(targetX);
        wToRef.current?.(targetWidth);
      }
      gsap.to(pill, { opacity: 1, duration: 0.2, ease: 'power3.out', overwrite: 'auto' });
    }
  }, []);

  // Update pill position when currentPath changes
  useEffect(() => {
    const activeEl = linkRefs.current[currentPath];
    if (isFirstNavMount.current) {
      isFirstNavMount.current = false;
      movePillToTarget(activeEl || null, false);
    } else {
      movePillToTarget(activeEl || null, true);
    }
  }, [currentPath, movePillToTarget]);

  // Update pill position on window resize
  useEffect(() => {
    const handleResize = () => {
      const activeEl = linkRefs.current[currentPath];
      movePillToTarget(activeEl || null, false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [currentPath, movePillToTarget]);

  const handleNavHover = (path: string) => {
    const el = linkRefs.current[path];
    if (el) movePillToTarget(el, true);
  };

  const handleNavLeave = () => {
    const activeEl = linkRefs.current[currentPath];
    movePillToTarget(activeEl || null, true);
  };

  // Sync grain attribute to document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    document.documentElement.setAttribute('data-grain', grainActive ? 'true' : 'false');
  }, [grainActive]);

  // Listen for view-mode change events dispatched elsewhere
  useEffect(() => {
    const handleView = (e: Event) => {
      const custom = e as CustomEvent<'grid' | 'table'>;
      if (custom.detail) {
        setViewMode(custom.detail);
      }
    };
    window.addEventListener('set-view-mode', handleView);
    return () => window.removeEventListener('set-view-mode', handleView);
  }, []);

  // Sync theme changes with DOM and document meta
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  // Micro-interaction 7: Theme toggle with circular reveal and icon swap
  const handleToggleTheme = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'dark' ? 'light' : 'dark';
    let x = typeof window !== 'undefined' ? window.innerWidth / 2 : 0;
    let y = 24;

    if (e && e.currentTarget) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    } else if (typeof document !== 'undefined') {
      const btn = document.querySelector('[aria-label*="theme"]') as HTMLElement | null;
      if (btn) {
        const rect = btn.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      }
    }

    toggleThemeMotion(next, x, y, (newTheme: 'dark' | 'light') => {
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      const meta = document.querySelector('meta[name="theme-color"]:not([media])');
      const schemeMeta = document.querySelector(`meta[name="theme-color"][media*="${newTheme}"]`);
      if (meta && schemeMeta) {
        const color = schemeMeta.getAttribute('content');
        if (color) meta.setAttribute('content', color);
      }
    });

    sound.playClick(900, 0.03, 0.06);
  }, [theme]);

  const toggleSound = useCallback(() => {
    const active = sound.toggle();
    setSoundActive(active);
    sound.playClick(active ? 820 : 420, 0.02, 0.06);
  }, []);

  const toggleGrain = useCallback(() => {
    setGrainActive((prev) => {
      const next = !prev;
      document.documentElement.setAttribute('data-grain', next ? 'true' : 'false');
      localStorage.setItem('grain', next ? 'true' : 'false');
      sound.playChirp(600, 300, 0.03, 0.05);
      return next;
    });
  }, []);

  const changeViewMode = useCallback((mode: 'grid' | 'table') => {
    setViewMode(mode);
    localStorage.setItem('view_mode', mode);
    window.dispatchEvent(new CustomEvent('set-view-mode', { detail: mode }));
    sound.playClick(mode === 'grid' ? 650 : 720, 0.02, 0.06);
  }, []);

  const openSysDiagnostic = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-sys-diagnostic'));
    sound.playChirp(500, 900, 0.04, 0.06);
    setControlsOpen(false);
  }, []);

  // Global Keyboard Shortcuts (G, T, M, S, F, D, ⌘K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) return;

      // ⌘K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
        sound.playDrawer();
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();
      if (key === 'g') {
        e.preventDefault();
        changeViewMode('grid');
      } else if (key === 't') {
        e.preventDefault();
        changeViewMode('table');
      } else if (key === 'm') {
        e.preventDefault();
        toggleSound();
      } else if (key === 'd') {
        e.preventDefault();
        handleToggleTheme();
      } else if (key === 's') {
        e.preventDefault();
        openSysDiagnostic();
      } else if (key === 'f') {
        e.preventDefault();
        toggleGrain();
      } else if (key === 'escape') {
        if (controlsOpen) setControlsOpen(false);
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [changeViewMode, toggleSound, handleToggleTheme, openSysDiagnostic, toggleGrain, controlsOpen, mobileMenuOpen]);

  // Micro-Interaction 5: Controls Popover enter/exit animation
  if (controlsOpen && !controlsRendered) {
    setControlsRendered(true);
  }

  useLayoutEffect(() => {
    if (!controlsRendered || !controlsRef.current) return;
    const el = controlsRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (controlsExitTweenRef.current) {
      controlsExitTweenRef.current.kill();
      controlsExitTweenRef.current = null;
    }
    gsap.killTweensOf(el);

    if (controlsOpen) {
      if (reduce) {
        gsap.set(el, { opacity: 1, scale: 1, y: 0 });
      } else {
        gsap.fromTo(el, { opacity: 0, scale: 0.97, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'expo.out', overwrite: true });
      }
    } else {
      if (reduce) {
        gsap.set(el, { opacity: 0 });
        requestAnimationFrame(() => setControlsRendered(false));
      } else {
        controlsExitTweenRef.current = gsap.to(el, {
          opacity: 0,
          scale: 0.97,
          y: 8,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            setControlsRendered(false);
            controlsExitTweenRef.current = null;
          },
        });
      }
    }

    return () => {
      if (controlsExitTweenRef.current) {
        controlsExitTweenRef.current.kill();
        controlsExitTweenRef.current = null;
      }
      gsap.killTweensOf(el);
    };
  }, [controlsOpen, controlsRendered]);

  // Micro-Interaction 5: Mobile menu sheet enter/exit animation
  if (mobileMenuOpen && !mobileMenuRendered) {
    setMobileMenuRendered(true);
  }

  useLayoutEffect(() => {
    if (!mobileMenuRendered || !mobileMenuRef.current) return;
    const el = mobileMenuRef.current;
    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (mobileExitTweenRef.current) {
      mobileExitTweenRef.current.kill();
      mobileExitTweenRef.current = null;
    }
    gsap.killTweensOf(el);

    if (mobileMenuOpen) {
      if (reduce) {
        gsap.set(el, { opacity: 1, scale: 1, y: 0 });
      } else {
        gsap.fromTo(el, { opacity: 0, scale: 0.97, y: 8 }, { opacity: 1, scale: 1, y: 0, duration: 0.25, ease: 'expo.out', overwrite: true });
      }
    } else {
      if (reduce) {
        gsap.set(el, { opacity: 0 });
        requestAnimationFrame(() => setMobileMenuRendered(false));
      } else {
        mobileExitTweenRef.current = gsap.to(el, {
          opacity: 0,
          scale: 0.97,
          y: 8,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            setMobileMenuRendered(false);
            mobileExitTweenRef.current = null;
          },
        });
      }
    }

    return () => {
      if (mobileExitTweenRef.current) {
        mobileExitTweenRef.current.kill();
        mobileExitTweenRef.current = null;
      }
      gsap.killTweensOf(el);
    };
  }, [mobileMenuOpen, mobileMenuRendered]);

  // Click outside to close Controls Popover
  useEffect(() => {
    if (!controlsOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        controlsRef.current &&
        !controlsRef.current.contains(e.target as Node) &&
        controlsBtnRef.current &&
        !controlsBtnRef.current.contains(e.target as Node)
      ) {
        setControlsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [controlsOpen]);

  // Command palette toggle event listener
  useEffect(() => {
    const handleToggleCmd = () => setCommandOpen((prev) => !prev);
    window.addEventListener('toggle-command-palette', handleToggleCmd);
    return () => window.removeEventListener('toggle-command-palette', handleToggleCmd);
  }, []);

  return (
    <>
      <header className={styles.navWrapper}>
        <nav className={styles.pillContainer} aria-label="Primary navigation">
          {/* 1. Logo "Moayed" */}
          <Magnetic strength={0.3}>
            <a
              href="/"
              className={styles.brandLogo}
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
                sound.playTick();
                setMobileMenuOpen(false);
              }}
              data-cursor="link"
              data-magnetic="0.3"
            >
              Moayed
            </a>
          </Magnetic>

          <span className={styles.separatorDot} aria-hidden="true">·</span>

          {/* 2. Desktop Nav Links with GSAP quickTo background pill */}
          <div
            ref={navLinksRef}
            className={styles.navLinks}
            onMouseLeave={handleNavLeave}
          >
            <div
              ref={activePillRef}
              className={styles.navActivePill}
              data-nav-pill
              aria-hidden="true"
            />
            {navItems.map((item, idx) => {
              const isActive = currentPath === item.path;

              return (
                <Magnetic key={item.path} strength={0.25}>
                  <a
                    ref={(el) => {
                      linkRefs.current[item.path] = el;
                    }}
                    href={item.path}
                    className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(item.path);
                      sound.playTick();
                      setMobileMenuOpen(false);
                    }}
                    onMouseEnter={() => {
                      handleNavHover(item.path);
                      sound.playClick(900 + idx * 75, 0.015, 0.03);
                    }}
                    data-cursor="link"
                    data-magnetic="0.3"
                  >
                    <span className={styles.navLinkLabel}>{item.label}</span>
                  </a>
                </Magnetic>
              );
            })}
          </div>

          <span className={`${styles.separatorDot} ${styles.hideMobile}`} aria-hidden="true">·</span>

          {/* 3. Availability Dot: CSS-only 2.4s opacity pulse */}
          <div
            className={styles.availabilityWrap}
            title="Available for Internships & Projects"
            aria-label="Available for Internships & Projects"
          >
            <span className={styles.availabilityDot} data-availability-dot />
          </div>

          <span className={styles.separatorDot} aria-hidden="true">·</span>

          {/* 4. ⌘K Search Trigger */}
          <Magnetic strength={0.3}>
            <button
              type="button"
              className={styles.cmdKButton}
              onClick={() => {
                setCommandOpen(true);
                sound.playDrawer();
              }}
              aria-label="Open command palette (⌘K)"
              title="Search and commands [⌘K]"
              data-cursor="link"
              data-magnetic="0.3"
            >
              <span className={styles.cmdKDesktopChip}>
                <span className={styles.cmdKText}>Command</span>
                <kbd className={styles.cmdKBadge}>⌘K</kbd>
              </span>
              <span className={styles.cmdKTouchIcon} aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
            </button>
          </Magnetic>

          <span className={styles.separatorDot} aria-hidden="true">·</span>

          {/* 5. Theme Toggle with Circular Reveal & Icon Swap */}
          <Magnetic strength={0.3}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={handleToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light theme (D)' : 'Switch to dark theme (D)'}
              title={`Theme: ${theme === 'dark' ? 'Dark' : 'Light'} [D]`}
              data-cursor="link"
              data-magnetic="0.3"
            >
              {theme === 'dark' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
          </Magnetic>

          <span className={styles.separatorDot} aria-hidden="true">·</span>

          {/* 6. Controls (Gear) Button */}
          <Magnetic strength={0.3}>
            <button
              ref={controlsBtnRef}
              type="button"
              className={`${styles.iconBtn} ${controlsOpen ? styles.iconBtnActive : ''}`}
              onClick={() => {
                setControlsOpen((prev) => !prev);
                sound.playClick(750, 0.02, 0.05);
              }}
              aria-label="Controls and layout options"
              aria-expanded={controlsOpen}
              aria-controls="controls-popover"
              title="Controls & Preferences [G, T, M, S, F]"
              data-cursor="link"
              data-magnetic="0.3"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>
          </Magnetic>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className={styles.mobileMenuToggle}
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </nav>

        {/* 7. Controls Popover */}
        {controlsRendered && (
          <div
            id="controls-popover"
            ref={controlsRef}
            className={styles.controlsPopover}
            role="dialog"
            aria-label="Controls and switches"
          >
            <div className={styles.controlsHeader}>
              <span className={styles.controlsTitle}>Controls &amp; Display</span>
              <button
                type="button"
                className={styles.controlsCloseBtn}
                onClick={() => setControlsOpen(false)}
                aria-label="Close controls"
              >
                ✕
              </button>
            </div>

            <div className={styles.controlsList}>
              {/* View Switch: Grid vs Table */}
              <div className={styles.controlRow}>
                <div className={styles.controlInfo}>
                  <span className={styles.controlLabel}>View</span>
                  <span className={styles.controlShortcut}>G / T</span>
                </div>
                <div className={styles.segmentedControl} role="group" aria-label="Project View Layout">
                  <button
                    type="button"
                    className={`${styles.segmentBtn} ${viewMode === 'grid' ? styles.segmentBtnActive : ''}`}
                    onClick={() => changeViewMode('grid')}
                    data-cursor="link"
                  >
                    Grid
                  </button>
                  <button
                    type="button"
                    className={`${styles.segmentBtn} ${viewMode === 'table' ? styles.segmentBtnActive : ''}`}
                    onClick={() => changeViewMode('table')}
                    data-cursor="link"
                  >
                    Table
                  </button>
                </div>
              </div>

              {/* Sound Toggle: On / Off */}
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

              {/* Grain Toggle: On / Off */}
              <div className={styles.controlRow}>
                <div className={styles.controlInfo}>
                  <span className={styles.controlLabel}>Grain</span>
                  <span className={styles.controlShortcut}>F</span>
                </div>
                <button
                  type="button"
                  className={`${styles.switchBtn} ${grainActive ? styles.switchBtnActive : ''}`}
                  onClick={toggleGrain}
                  aria-pressed={grainActive}
                  data-cursor="link"
                >
                  <span className={styles.switchKnob} />
                  <span className={styles.switchStateText}>{grainActive ? 'ON' : 'OFF'}</span>
                </button>
              </div>

              {/* System Diagnostics */}
              <div className={styles.controlRow}>
                <div className={styles.controlInfo}>
                  <span className={styles.controlLabel}>System</span>
                  <span className={styles.controlShortcut}>S</span>
                </div>
                <button
                  type="button"
                  className={styles.actionPillBtn}
                  onClick={openSysDiagnostic}
                  data-cursor="link"
                >
                  Diagnostics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Expanded Menu Dropdown */}
        {mobileMenuRendered && (
          <div
            ref={mobileMenuRef}
            className={styles.mobileDropdown}
            role="menu"
          >
            {navItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`${styles.mobileMenuItem} ${currentPath === item.path ? styles.mobileMenuItemActive : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate(item.path);
                  sound.playTick();
                  setMobileMenuOpen(false);
                }}
                role="menuitem"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Global Command Palette */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSelectProject={(id) => {
          window.dispatchEvent(new CustomEvent('open-project-modal', { detail: id }));
        }}
        onToggleTheme={handleToggleTheme}
        onToggleSound={toggleSound}
        onToggleView={changeViewMode}
        onOpenSysCheck={openSysDiagnostic}
        onNavigate={onNavigate}
        currentTheme={theme}
        isSoundActive={soundActive}
      />
    </>
  );
}
