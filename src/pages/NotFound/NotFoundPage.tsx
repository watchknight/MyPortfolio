import { useEffect, useState } from 'react';
import { SpotlightCard } from '../../components/SpotlightCard/SpotlightCard';
import { sound } from '../../utils/audio';
import styles from './NotFoundPage.module.css';

interface NotFoundPageProps {
  onNavigate?: (path: string) => void;
}

export function NotFoundPage({ onNavigate }: NotFoundPageProps) {
  const [currentPath] = useState<string>(() => {
    if (typeof window !== 'undefined') return window.location.pathname;
    return '/unknown';
  });

  useEffect(() => {
    document.title = 'Page Not Found — Abdur Rahman Moayed';
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        sound.playTick();
        if (onNavigate) {
          onNavigate('/');
        } else if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate]);

  const handleRoute = (target: string) => {
    sound.playTick();
    if (onNavigate) {
      onNavigate(target);
    } else if (typeof window !== 'undefined') {
      window.location.href = target;
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <div className={styles.badgeRow}>
          <span className={styles.statusDot} />
          <span className={styles.eyebrow}>Page not found</span>
        </div>
        <h1 className={styles.title} data-cursor="inspect" data-cursor-label="404">
          Page Not Found
        </h1>
        <p className={styles.subtitle}>
          The requested coordinate or ledger record does not exist on this node.
          It may have been relocated, filtered by edge security rules, or never initialized.
        </p>
      </header>

      <SpotlightCard
        className={styles.diagnosticCard}
        contentClassName={styles.diagnosticCardContent}
        tiltIntensity={4}
      >
        <div className={styles.diagnosticHeader}>
          <span className={styles.termTitle}>ORIGIN_NODE_DIAGNOSTIC</span>
          <span className={styles.termCode}>ERR_SECTOR_UNMAPPED</span>
        </div>

        <div className={styles.telemetryGrid}>
          <div className={styles.telemetryRow}>
            <span className={styles.telemetryLabel}>DIAG_STATUS:</span>
            <span className={styles.telemetryValueDanger}>404 NOT FOUND // ZERO TELEMETRY</span>
          </div>
          <div className={styles.telemetryRow}>
            <span className={styles.telemetryLabel}>TARGET_VECTOR:</span>
            <span className={styles.telemetryValue}>{currentPath}</span>
          </div>
          <div className={styles.telemetryRow}>
            <span className={styles.telemetryLabel}>GATEWAY_NODE:</span>
            <span className={styles.telemetryValue}>Dhaka Sentinel [23.8103° N, 90.4125° E]</span>
          </div>
          <div className={styles.telemetryRow}>
            <span className={styles.telemetryLabel}>RESOLUTION:</span>
            <span className={styles.telemetryValueSuccess}>Reroute to primary ledger recommended</span>
          </div>
        </div>
      </SpotlightCard>

      <div className={styles.actionsGroup}>
        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
          onClick={() => handleRoute('/')}
          data-cursor="link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span>Reroute to Main Ledger [H]</span>
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={() => handleRoute('/works')}
          data-cursor="link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Explore Selected Works</span>
        </button>

        <button
          type="button"
          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
          onClick={() => handleRoute('/contact')}
          data-cursor="link"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <span>Contact Terminal</span>
        </button>
      </div>

      <p className={styles.hintText}>
        Tip: Press <kbd className={styles.kbd}>H</kbd> anywhere on this page to jump home, or <kbd className={styles.kbd}>⌘K</kbd> / <kbd className={styles.kbd}>Ctrl+K</kbd> to open the global command palette.
      </p>
    </div>
  );
}
