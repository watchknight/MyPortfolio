import { useState, useEffect, useRef } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './RotatingClause.module.css';

interface RotatingClauseProps {
  clauses?: string[];
  intervalMs?: number;
  className?: string;
}

const DEFAULT_CLAUSES = [
  'blocks deep digital distraction.',
  'strips invasive algorithmic ads.',
  'runs 60 FPS vision in the browser.',
  'computes scaled meals from pantry items.',
];

/**
 * RotatingClause
 *
 * Implements a dynamic inline clause rotation with Zero Cumulative Layout Shift (Zero CLS).
 *
 * Architectural Guarantees:
 * 1. Zero CLS: All clauses occupy the same CSS Grid cell (grid-area: clause). Inactive
 *    clauses use `visibility: hidden` so they contribute their intrinsic width and height
 *    to the container, locking bounding dimensions to max(clauses) and preventing
 *    subsequent sentence punctuation or following elements from jittering.
 * 2. Lifecycle Safety: Full `clearInterval` cleanup on unmount prevents memory leaks.
 * 3. Accessibility & A11y: Screen readers receive a single static announcement via
 *    a dedicated srOnly element (`aria-live="polite"`), avoiding repetitive read-out loops.
 * 4. Reduced Motion: Respects `prefers-reduced-motion` by freezing on the first clause
 *    with zero animation or timers.
 */
export function RotatingClause({
  clauses = DEFAULT_CLAUSES,
  intervalMs = 3500,
  className = '',
}: RotatingClauseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);
  const [isVisible, setIsVisible] = useState(true);
  const prefersReducedMotion = useReducedMotion();

  // Monitor off-screen visibility and tab visibility state
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    let isIntersecting = true;
    const updateVisibility = () => {
      const isDocVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;
      setIsVisible(isIntersecting && isDocVisible);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        isIntersecting = entry.isIntersecting;
        updateVisibility();
      },
      { rootMargin: '100px' }
    );
    observer.observe(el);

    const handleVisibilityChange = () => {
      updateVisibility();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    // Under reduced motion or when off-screen/tab hidden, pause timer
    if (prefersReducedMotion || clauses.length <= 1 || !isVisible) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % clauses.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [prefersReducedMotion, clauses.length, intervalMs, isVisible]);

  return (
    <span ref={containerRef} className={`${styles.container} ${className}`.trim()}>
      {/* Accessible text for screen readers — read once, no infinite loop */}
      <span className={styles.srOnly} aria-live="polite">
        {clauses[0]}
      </span>

      {/* Visual stacked crossfade presentation (hidden from screen reader repetitive queue) */}
      <span className={styles.visualStack} aria-hidden="true">
        {clauses.map((clause, idx) => (
          <span
            key={clause}
            className={`${styles.clauseTrack} ${idx === activeIndex ? styles.clauseActive : ''}`}
          >
            {clause}
          </span>
        ))}
      </span>
    </span>
  );
}
