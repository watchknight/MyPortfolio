import React, { useState, useEffect, useCallback } from 'react';
import { sound } from '../../audio/sound.js';
import styles from './TelemetryRail.module.css';

interface Sector {
  id: string;
  name: string;
  targetId: string;
}

const SECTORS: Sector[] = [
  { id: 'sec-hero', name: 'HERO', targetId: 'main-content' },
  { id: 'sec-work', name: 'WORK', targetId: 'selected-work' },
  { id: 'sec-about', name: 'ABOUT', targetId: 'about' },
  { id: 'sec-guestbook', name: 'LOG', targetId: 'guestbook' },
  { id: 'sec-contact', name: 'CONTACT', targetId: 'contact' },
];

export const TelemetryRail: React.FC = () => {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [activeSector, setActiveSector] = useState('sec-hero');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setIsClient(true);
    if (typeof window === 'undefined') return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const docEl = document.documentElement;
          const maxScroll = docEl.scrollHeight - window.innerHeight;
          const current = Math.max(0, window.scrollY);
          const pct = maxScroll > 0 ? Math.min(100, Math.round((current / maxScroll) * 100)) : 0;
          setScrollPercent(pct);

          // Determine active sector based on element viewport position
          if (current < 120) {
            setActiveSector('sec-hero');
          } else if (pct >= 95) {
            setActiveSector('sec-contact');
          } else {
            for (let i = SECTORS.length - 1; i >= 0; i--) {
              const el = document.getElementById(SECTORS[i].targetId);
              if (el) {
                const top = el.getBoundingClientRect().top;
                if (top <= window.innerHeight * 0.45) {
                  setActiveSector(SECTORS[i].id);
                  break;
                }
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const handleSectorClick = useCallback((targetId: string, sectorId: string) => {
    sound.play('tick', { vel: 0.25 });
    setActiveSector(sectorId);

    const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (targetId === 'main-content') {
      window.scrollTo({ top: 0, behavior: reduce ? 'instant' : 'smooth' });
      return;
    }

    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: reduce ? 'instant' : 'smooth' });
  }, []);

  if (!isClient) return null;

  return (
    <nav
      className={styles.rail}
      aria-label="Mission Control Telemetry Scroll Rail"
    >
      <div className={styles.railCard}>
        <span className={styles.percentTag}>{scrollPercent}%</span>

        <div className={styles.trackWrapper}>
          <div
            className={styles.trackProgress}
            style={{ height: `${scrollPercent}%` }}
          />
        </div>

        <div className={styles.sectorsList}>
          {SECTORS.map((sec) => {
            const isActive = activeSector === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                className={`${styles.sectorBtn} ${isActive ? styles.sectorBtnActive : ''}`}
                onClick={() => handleSectorClick(sec.targetId, sec.id)}
                aria-label={`Scroll to ${sec.name}`}
                aria-current={isActive ? 'location' : undefined}
                data-cursor="link"
                data-cursor-label={`GOTO // ${sec.name}`}
              >
                <span className={styles.sectorDot} />
                <span className={styles.sectorTooltip}>{sec.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
