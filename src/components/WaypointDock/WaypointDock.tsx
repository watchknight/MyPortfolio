import { useEffect, useState } from 'react';
import { sound } from '../../utils/audio';
import styles from './WaypointDock.module.css';

interface Waypoint {
  id: string;
  code: string;
  label: string;
}

const waypoints: Waypoint[] = [
  { id: 'hero', code: '00', label: 'RADAR' },
  { id: 'engineering', code: '01', label: 'SYSTEMS' },
  { id: 'foundation', code: '02', label: 'FOUNDATION' },
  { id: 'contact', code: '03', label: 'COMMS' },
];

interface WaypointDockProps {
  onOpenSysCheck?: () => void;
}

export function WaypointDock({ onOpenSysCheck }: WaypointDockProps) {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight * 0.35;

      for (let i = waypoints.length - 1; i >= 0; i--) {
        const wp = waypoints[i];
        const el = document.getElementById(wp.id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveSection(wp.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleWaypointClick = (id: string) => {
    sound.playTick();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const triggerSysCheck = () => {
    sound.playDrawer();
    if (onOpenSysCheck) {
      onOpenSysCheck();
    } else {
      window.dispatchEvent(new CustomEvent('open-sys-diagnostic'));
    }
  };

  return (
    <nav className={styles.dock} aria-label="Tactical Waypoint Dock">
      <button
        type="button"
        className={styles.sysCheckTrigger}
        onClick={triggerSysCheck}
        title="Execute Live Hardware & Runtime Benchmark"
        aria-label="Run Systems Check"
      >
        <span className={styles.sysCheckPulse} />
        <span>&gt;_ RUN_SYS_CHECK</span>
      </button>

      <div className={styles.dockTrack}>
        {waypoints.map((wp) => {
          const isActive = activeSection === wp.id;
          return (
            <button
              key={wp.id}
              type="button"
              className={`${styles.waypointButton} ${isActive ? styles.waypointActive : ''}`}
              onClick={() => handleWaypointClick(wp.id)}
              aria-label={`Scroll to ${wp.label} (${wp.code})`}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className={styles.waypointLabel}>
                {wp.code} // {wp.label}
              </span>
              <span className={styles.waypointNode} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
