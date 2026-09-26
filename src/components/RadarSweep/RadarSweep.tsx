import { useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './RadarSweep.module.css';

/**
 * RadarSweep — Concentric Ring Section Entrance
 *
 * Five concentric rings with varied dash patterns expand
 * outward with staggered timing, accompanied by a radar
 * sweep arm and center ping. Plays strictly ONCE when the
 * host section scrolls into view.
 *
 * Architecture:
 *   - IntersectionObserver triggers → 'animate' phase
 *   - After expansion + stagger completes → 'settle' phase
 *   - After settle → 'done' (static, no further work)
 *
 * Performance:
 *   - Compositor-only: transform(scale) + opacity
 *   - will-change hints on animated elements
 *   - Observer disconnected after first trigger
 *   - No RAF loops, no JS-driven animation frames
 *
 * Accessibility:
 *   - prefers-reduced-motion: observer never fires,
 *     component renders immediately in muted resting state
 *   - aria-hidden="true", role="presentation" (decorative)
 */

interface RingDef {
  r: number;
  dash: string;
  sw: number;
  rest: number;
}

const RINGS: RingDef[] = [
  { r: 22,  dash: '1.5 5',       sw: 1.2,  rest: 0.22 },
  { r: 44,  dash: '3 7',         sw: 1.0,  rest: 0.16 },
  { r: 70,  dash: '1 4 2.5 4',   sw: 0.85, rest: 0.12 },
  { r: 100, dash: '5 9',         sw: 0.7,  rest: 0.09 },
  { r: 134, dash: '1.5 3.5 4 3.5', sw: 0.55, rest: 0.06 },
];

const CX = 280;
const CY = 160;

/** Expansion phase duration + max stagger + buffer */
const SETTLE_AFTER_MS = 1100 + 280 + 300;
/** Settle phase duration */
const SETTLE_DURATION_MS = 1800;

// Small tick marks at cardinal positions on outermost ring
const TICK_LENGTH = 8;
const OUTER_R = RINGS[RINGS.length - 1].r;

interface TickDef {
  x1: number; y1: number;
  x2: number; y2: number;
}

const TICKS: TickDef[] = [
  // Top
  { x1: CX, y1: CY - OUTER_R + TICK_LENGTH, x2: CX, y2: CY - OUTER_R - TICK_LENGTH },
  // Right
  { x1: CX + OUTER_R - TICK_LENGTH, y1: CY, x2: CX + OUTER_R + TICK_LENGTH, y2: CY },
  // Bottom
  { x1: CX, y1: CY + OUTER_R - TICK_LENGTH, x2: CX, y2: CY + OUTER_R + TICK_LENGTH },
  // Left
  { x1: CX - OUTER_R + TICK_LENGTH, y1: CY, x2: CX - OUTER_R - TICK_LENGTH, y2: CY },
];

export function RadarSweep() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<'idle' | 'animate' | 'settle' | 'done'>('idle');
  const reducedMotion = useReducedMotion();
  const triggered = useRef(false);

  // Phase transition: animate → settle → done
  const scheduleSettle = useCallback(() => {
    const t1 = setTimeout(() => setPhase('settle'), SETTLE_AFTER_MS);
    const t2 = setTimeout(() => setPhase('done'), SETTLE_AFTER_MS + SETTLE_DURATION_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (phase === 'animate') return scheduleSettle();
  }, [phase, scheduleSettle]);

  // IntersectionObserver — single trigger, then disconnect
  useEffect(() => {
    if (reducedMotion || triggered.current) return;

    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            triggered.current = true;
            setPhase('animate');
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25, rootMargin: '0px 0px -40px 0px' }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [reducedMotion]);

  // CSS class composition
  const cls = [
    styles.radarContainer,
    phase === 'animate' ? styles.animate : '',
    phase === 'settle' || phase === 'done' ? styles.settle : '',
  ].filter(Boolean).join(' ');

  return (
    <div ref={containerRef} className={cls} aria-hidden="true" role="presentation">
      <svg
        className={styles.radarSvg}
        viewBox={`0 0 ${CX * 2} ${CY * 2}`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial gradient for the sweep cone glow */}
          <radialGradient id="sweepGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-accent-primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--color-accent-primary)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Concentric rings */}
        {RINGS.map((ring, i) => (
          <circle
            key={i}
            className={styles.ring}
            cx={CX}
            cy={CY}
            r={ring.r}
            stroke="var(--color-accent-primary)"
            strokeWidth={ring.sw}
            strokeDasharray={ring.dash}
            style={{ '--ring-rest': ring.rest } as React.CSSProperties}
          />
        ))}

        {/* Cardinal crosshair ticks */}
        {TICKS.map((t, i) => (
          <line
            key={`tick-${i}`}
            className={styles.crosshairTick}
            x1={t.x1} y1={t.y1}
            x2={t.x2} y2={t.y2}
            stroke="var(--color-accent-primary)"
            strokeWidth={0.8}
            strokeLinecap="round"
          />
        ))}

        {/* Sweep cone — 30° pie wedge that rotates with the arm */}
        <path
          className={styles.sweepCone}
          d={`M ${CX} ${CY} L ${CX} ${CY - OUTER_R} A ${OUTER_R} ${OUTER_R} 0 0 1 ${CX + OUTER_R * Math.sin(Math.PI / 6)} ${CY - OUTER_R * Math.cos(Math.PI / 6)} Z`}
          fill="url(#sweepGlow)"
        />

        {/* Sweep arm — the rotating radar line */}
        <line
          className={styles.sweepLine}
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - OUTER_R}
          stroke="var(--color-accent-primary)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        {/* Center origin dot */}
        <circle
          className={styles.centerDot}
          cx={CX}
          cy={CY}
          r={2.5}
          fill="var(--color-accent-primary)"
        />
      </svg>
    </div>
  );
}
