import React, { useRef, useCallback } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './SpotlightCard.module.css';

export interface SpotlightCardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  tiltIntensity?: number;
  as?: 'div' | 'article' | 'section' | 'form' | React.ElementType;
  onSubmit?: React.FormEventHandler<HTMLElement>;
}

export function SpotlightCard({
  children,
  className = '',
  contentClassName = '',
  tiltIntensity = 10,
  as: Component = 'div',
  ...rest
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const rafId = useRef<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Update spotlight overlay position directly without React re-render
      if (overlayRef.current) {
        overlayRef.current.style.background = `radial-gradient(450px circle at ${x}px ${y}px, var(--color-accent-glow), transparent 65%)`;
        overlayRef.current.style.opacity = '1';
      }

      if (prefersReducedMotion) return;

      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }

      rafId.current = requestAnimationFrame(() => {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
        const rotateY = ((x - centerX) / centerX) * tiltIntensity;

        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px)`;
      });
    },
    [prefersReducedMotion, tiltIntensity]
  );

  const handleMouseEnter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transition = 'transform 0.08s ease-out, filter var(--duration-normal) var(--ease-default)';
  }, []);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;

    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }

    // Smooth physics-based settling transition back to flat level
    card.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1), filter var(--duration-normal) var(--ease-default)';
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';

    if (overlayRef.current) {
      overlayRef.current.style.opacity = '0';
    }
  }, []);

  return (
    <div className={`${styles.cardShell} ${className}`}>
      <Component
        ref={cardRef as unknown as React.Ref<HTMLDivElement>}
        className={styles.cardBevel}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={handleMouseLeave}
        onTouchCancel={handleMouseLeave}
        {...rest}
      >
        <div className={styles.chamferCanvas}>
          <div
            ref={overlayRef}
            className={styles.spotlightOverlay}
            aria-hidden="true"
          />

          <div className={`${styles.innerContent} ${contentClassName}`}>{children}</div>
        </div>
      </Component>
    </div>
  );
}
