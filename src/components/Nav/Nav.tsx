import { useState, useEffect, useCallback } from 'react';
import { sound } from '../../utils/audio';
import styles from './Nav.module.css';

const links = [
  { label: 'Works', href: '#engineering' },
  { label: 'Foundation', href: '#foundation' },
  { label: 'Résumé', href: '/resume.pdf', external: true },
  { label: 'Contact', href: '#contact' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [soundActive, setSoundActive] = useState(() => sound.isEnabled());
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
      return saved || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.documentElement.dataset.theme = theme;

    return () => window.removeEventListener('scroll', onScroll);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    sound.playClick(900, 0.03, 0.06);
  };

  const toggleSound = () => {
    const active = sound.toggle();
    setSoundActive(active);
  };

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`${styles.nav} ${scrolled ? styles.navScrolled : ''}`}
        aria-label="Primary navigation"
      >
        <div className={styles.navInner}>
          <div className={styles.brandGroup}>
            <a href="#" className={styles.navBrand} onClick={closeMobile} data-cursor="link">
              <span>Abdur Rahman Moayed</span>
              <span className={styles.breadcrumbSlash}>/</span>
              <span className={styles.breadcrumbSub}>Systems</span>
            </a>

            <div className={styles.statusPill} title="East West University CSE (5.0 GPA)">
              <span className={styles.statusDot} />
              <span>Available for Internships</span>
            </div>
          </div>

          <div className={styles.navRight}>
            {/* Desktop Navigation */}
            <div className={styles.navLinks}>
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={styles.navLink}
                  onClick={() => sound.playTick()}
                  data-cursor="link"
                  {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Quick Action Switches (Sound & Theme) */}
            <div className={styles.actionGroup}>
              <button
                type="button"
                className={styles.iconBtn}
                onClick={toggleSound}
                aria-label={soundActive ? 'Mute audio synthesizer' : 'Enable tactile audio synthesizer'}
                title={soundActive ? 'Sound Synthesizer: Active' : 'Sound Synthesizer: Muted'}
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

              <button
                type="button"
                className={styles.iconBtn}
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to Studio Light' : 'Switch to Obsidian Dark'}
                title={theme === 'dark' ? 'Theme: Obsidian Dark' : 'Theme: Studio Light'}
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
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className={styles.mobileLink}
            onClick={closeMobile}
            {...(link.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
          >
            {link.label}
          </a>
        ))}
      </div>
    </>
  );
}
