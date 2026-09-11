import { useState, useEffect, useCallback } from 'react';
import { sound } from '../../utils/audio';
import { useScrollLock } from '../../utils/scrollLock';
import { CommandPalette } from '../CommandPalette/CommandPalette';
import { Magnetic } from '../Magnetic/Magnetic';
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(() => sound.isEnabled());
  const [dhakaTime, setDhakaTime] = useState('');
  const [latency, setLatency] = useState(14);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
      return saved || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setDhakaTime(formatted);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const measurePing = () => {
      const start = performance.now();
      fetch('/favicon.svg', { method: 'HEAD', cache: 'no-store' })
        .then(() => {
          const rtt = Math.round(performance.now() - start);
          setLatency(Math.max(6, Math.min(rtt, 95)));
        })
        .catch(() => {
          setLatency(Math.floor(11 + Math.random() * 6));
        });
    };

    measurePing();
    const pingInterval = setInterval(measurePing, 12000);
    return () => clearInterval(pingInterval);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = nextTheme;
      localStorage.setItem('theme', nextTheme);
      sound.playClick(900, 0.03, 0.06);
      return nextTheme;
    });
  }, []);

  const toggleSound = useCallback(() => {
    const active = sound.toggle();
    setSoundActive(active);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      } else if ((e.key === 'm' || e.key === 'M') && !commandOpen) {
        e.preventDefault();
        toggleSound();
      } else if ((e.key === 'd' || e.key === 'D') && !commandOpen) {
        e.preventDefault();
        toggleTheme();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandOpen, toggleSound, toggleTheme]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.documentElement.dataset.theme = theme;

    return () => window.removeEventListener('scroll', onScroll);
  }, [theme]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useScrollLock(mobileOpen);

  useEffect(() => {
    const handleToggleCmd = () => setCommandOpen((prev) => !prev);
    window.addEventListener('toggle-command-palette', handleToggleCmd);
    return () => window.removeEventListener('toggle-command-palette', handleToggleCmd);
  }, []);

  return (
    <>
      <nav
        className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}
        aria-label="Primary navigation"
      >
        <div className={styles.navInner}>
          <div className={styles.brandGroup}>
            <a
              href="/"
              className={styles.navBrand}
              onClick={(e) => {
                e.preventDefault();
                onNavigate('/');
                sound.playTick();
                closeMobile();
              }}
              data-cursor="link"
            >
              <span>Abdur Rahman Moayed</span>
              <span className={styles.breadcrumbSlash}>/</span>
              <span className={styles.breadcrumbSub}>Software</span>
            </a>

            <div className={styles.statusPill} title="East West University CSE">
              <span className={styles.statusDot} />
              <span>Available for Internships</span>
            </div>
          </div>

          <div className={styles.navRight}>
            {/* Desktop Navigation */}
            <div className={styles.navLinks}>
              {navItems.map((item) => (
                <a
                  key={item.path}
                  href={item.path}
                  className={`${styles.navLink} ${currentPath === item.path ? styles.navLinkActive : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onNavigate(item.path);
                    sound.playTick();
                  }}
                  data-cursor="link"
                >
                  {item.label}
                </a>
              ))}
            </div>

            {/* Quick Action Switches (Clock & Ping, Command Palette, Sound & Theme) */}
            <div className={styles.actionGroup}>
              {dhakaTime && (
                <div className={styles.dhakaClock} title={`Origin Node: Dhaka (UTC+6) • Client Ping: ${latency}ms`}>
                  <span className={styles.dhakaPulse} />
                  <span className={styles.pingMetric}>{latency}ms</span>
                  <span className={styles.timeDivider}>•</span>
                  <span>{dhakaTime}</span>
                </div>
              )}

              <Magnetic strength={0.35}>
                <button
                  type="button"
                  className={styles.cmdKPill}
                  onClick={() => setCommandOpen(true)}
                  title="Open Command Deck (Ctrl+K or ⌘K)"
                  aria-label="Open Command Deck"
                  data-cursor="link"
                >
                  <span>Command</span>
                  <kbd className={styles.cmdKBadge}>⌘K</kbd>
                </button>
              </Magnetic>

              <Magnetic strength={0.35}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={toggleSound}
                  aria-label={soundActive ? 'Mute audio synthesizer' : 'Enable tactile audio synthesizer'}
                  title={soundActive ? 'Sound: Active [M]' : 'Sound: Muted [M]'}
                  data-cursor="link"
                >
                  {soundActive ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  )}
                </button>
              </Magnetic>

              <Magnetic strength={0.35}>
                <button
                  type="button"
                  className={styles.iconBtn}
                  onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to Studio Light' : 'Switch to Obsidian Dark'}
                  title={theme === 'dark' ? 'Theme: Obsidian Dark [D]' : 'Theme: Studio Light [D]'}
                  data-cursor="link"
                >
                  {theme === 'dark' ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                    </svg>
                  )}
                </button>
              </Magnetic>

              {/* Mobile hamburger */}
              <button
                type="button"
                className={styles.menuToggle}
                onClick={() => setMobileOpen((o) => !o)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? 'Close navigation' : 'Open navigation'}
              >
                {mobileOpen ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="6" y1="18" x2="18" y2="6" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="7" x2="20" y2="7" />
                    <line x1="4" y1="17" x2="20" y2="17" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}
        aria-hidden={!mobileOpen}
      >
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`${styles.mobileLink} ${currentPath === item.path ? styles.mobileLinkActive : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(item.path);
              sound.playTick();
              closeMobile();
            }}
          >
            {item.label}
          </a>
        ))}
      </div>

      {/* Global Interactive Command Palette */}
      <CommandPalette
        isOpen={commandOpen}
        onClose={() => setCommandOpen(false)}
        onSelectProject={(id) => {
          window.dispatchEvent(new CustomEvent('open-project-modal', { detail: id }));
        }}
        onToggleTheme={toggleTheme}
        onToggleSound={toggleSound}
        onToggleView={(view) => {
          window.dispatchEvent(new CustomEvent('set-view-mode', { detail: view }));
        }}
        onOpenSysCheck={() => {
          window.dispatchEvent(new CustomEvent('open-sys-diagnostic'));
        }}
        onNavigate={onNavigate}
        currentTheme={theme}
        isSoundActive={soundActive}
      />
    </>
  );
}
