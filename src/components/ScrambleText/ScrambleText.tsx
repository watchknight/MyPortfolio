import { useState, useRef, useEffect, useCallback } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { sound } from '../../utils/audio';

interface ScrambleTextProps {
  text: string;
  as?: 'span' | 'h1' | 'h2' | 'h3' | 'p' | 'div';
  className?: string;
  triggerOnHover?: boolean;
  scrambleSpeed?: number;
}

const GLYPHS = '01#%*+/<>[]_{}~XYZ01';

export function ScrambleText({
  text,
  as: Component = 'span',
  className = '',
  triggerOnHover = true,
  scrambleSpeed = 24,
}: ScrambleTextProps) {
  const [displayText, setDisplayText] = useState(text);
  const [prevText, setPrevText] = useState(text);
  const prefersReducedMotion = useReducedMotion();
  const animatingRef = useRef(false);
  const intervalRef = useRef<number | null>(null);

  if (text !== prevText) {
    setPrevText(text);
    setDisplayText(text);
  }

  const startScramble = useCallback(() => {
    if (prefersReducedMotion || animatingRef.current) return;
    animatingRef.current = true;
    sound.playTick();

    let iteration = 0;
    const maxIterations = text.length * 3;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = window.setInterval(() => {
      setDisplayText(() =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration / 3) {
              return text[index];
            }
            return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          })
          .join('')
      );

      if (iteration >= maxIterations) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setDisplayText(text);
        animatingRef.current = false;
      }

      iteration += 1;
    }, scrambleSpeed);
  }, [text, prefersReducedMotion, scrambleSpeed]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (triggerOnHover) {
      startScramble();
    }
  };

  return (
    <Component
      className={className}
      onMouseEnter={handleMouseEnter}
      style={{ willChange: 'contents' }}
    >
      {displayText}
    </Component>
  );
}
