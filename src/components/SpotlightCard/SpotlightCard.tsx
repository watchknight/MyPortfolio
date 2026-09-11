import React, { useRef, useState, useCallback } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './SpotlightCard.module.css';

interface SpotlightCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  tiltIntensity?: number;
}

export function SpotlightCard({
  children,
  className = '',
  tiltIntensity = 10,
  ...rest
}: SpotlightCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [spotlightPos, setSpotlightPos] = useState({ x: 0, y: 0 });
  const [transformStyle, setTransformStyle] = useState('');
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const card = cardRef.current;
      if (!card) return;

      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setSpotlightPos({ x, y });

      if (prefersReducedMotion) return;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -tiltIntensity;
      const rotateY = ((x - centerX) / centerX) * tiltIntensity;

      setTransformStyle(
        `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(4px)`
      );
    },
    [prefersReducedMotion, tiltIntensity]
  );

  const handleMouseLeave = useCallback(() => {
    setTransformStyle('');
  }, []);

  return (
    <div
      ref={cardRef}
      className={`${styles.cardWrapper} ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: transformStyle }}
      {...rest}
    >
      <div
        className={styles.spotlightOverlay}
        style={{
          background: `radial-gradient(420px circle at ${spotlightPos.x}px ${spotlightPos.y}px, var(--color-accent-glow), transparent 65%)`,
        }}
        aria-hidden="true"
      />
      <div className={styles.innerContent}>{children}</div>
    </div>
  );
}
