import { useState, useEffect } from 'react';
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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // Under reduced motion, lock strictly to the first clause with no active timers
    if (prefersReducedMotion || clauses.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % clauses.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [prefersReducedMotion, clauses.length, intervalMs]);

  return (
    <span className={`${styles.container} ${className}`.trim()}>
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
