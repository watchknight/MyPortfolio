import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './CustomCursor.module.css';

export function CustomCursor() {
  const prefersReducedMotion = useReducedMotion();
  const cursorRef = useRef<HTMLDivElement | null>(null);

  const [visible, setVisible] = useState(false);
  const [hoverType, setHoverType] = useState<string | null>(null);
  const [hoverLabel, setHoverLabel] = useState<string>('');

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let targetX = -100;
    let targetY = -100;
    let currentX = -100;
    let currentY = -100;
    let rafId: number;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (!visible) setVisible(true);

      // Check cursor data attribute on element under pointer
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const cursorTarget = target.closest('[data-cursor]') as HTMLElement | null;
      if (cursorTarget) {
        const type = cursorTarget.getAttribute('data-cursor');
        const label = cursorTarget.getAttribute('data-cursor-label') || '';
        setHoverType(type);
        setHoverLabel(label);
      } else if (target.closest('a, button, [role="button"]')) {
        setHoverType('link');
        setHoverLabel('');
      } else {
        setHoverType(null);
        setHoverLabel('');
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    const updatePosition = () => {
      // Lerp smoothing
      currentX += (targetX - currentX) * 0.2;
      currentY += (targetY - currentY) * 0.2;

      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }

      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [prefersReducedMotion, visible]);

  if (prefersReducedMotion) return null;

  const stateClass =
    hoverType === 'inspect'
      ? styles.hoverInspect
      : hoverType === 'link'
      ? styles.hoverLink
      : hoverType === 'repel'
      ? styles.hoverRepel
      : '';

  return (
    <div
      ref={cursorRef}
      className={`${styles.cursorContainer} ${stateClass}`}
      aria-hidden="true"
    >
      <div className={`${styles.reticle} ${visible ? styles.visible : ''}`}>
        {hoverLabel ? (
          <span className={styles.label}>{hoverLabel}</span>
        ) : (
          <div className={styles.dot} />
        )}
      </div>
    </div>
  );
}
