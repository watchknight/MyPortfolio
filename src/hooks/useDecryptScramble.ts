import { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../audio/sound.js';

interface UseDecryptScrambleOptions {
  speed?: number; // ms per glyph change
  duration?: number; // total duration in ms
  chars?: string;
  triggerOnMount?: boolean;
  playSound?: boolean;
}

const DEFAULT_CHARS = '0123456789ABCDEF!#§%&//<>[]{}';

export function useDecryptScramble(
  targetText: string,
  options: UseDecryptScrambleOptions = {}
) {
  const {
    speed = 36,
    duration = 320,
    chars = DEFAULT_CHARS,
    triggerOnMount = false,
    playSound = false,
  } = options;

  const [displayText, setDisplayText] = useState(targetText);
  const [isScrambling, setIsScrambling] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const lastSoundRef = useRef<number>(0);
  const lastGlyphRef = useRef<number>(0);

  const trigger = useCallback(() => {
    if (typeof window === 'undefined') return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduceMotion) {
      setDisplayText(targetText);
      setIsScrambling(false);
      return;
    }

    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
    }

    setIsScrambling(true);
    const startTime = performance.now();
    lastGlyphRef.current = 0;
    const len = targetText.length;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Play subtle tick sound throttled to ~75ms (respecting audio engine rate limit)
      if (playSound && now - lastSoundRef.current > 75) {
        lastSoundRef.current = now;
        sound.play('tick', { vel: 0.15 });
      }

      if (progress < 1) {
        // Throttle glyph update to speed ms (avoids 120Hz/144Hz render storms)
        if (now - lastGlyphRef.current >= speed) {
          lastGlyphRef.current = now;
          const resolvedCount = Math.floor(progress * len);
          let scrambled = '';
          for (let i = 0; i < len; i++) {
            const char = targetText[i];
            if (char === ' ' || char === '\n' || char === '\t') {
              scrambled += char;
            } else if (i < resolvedCount) {
              scrambled += char;
            } else {
              const randIndex = Math.floor(Math.random() * chars.length);
              scrambled += chars[randIndex];
            }
          }
          setDisplayText(scrambled);
        }
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayText(targetText);
        setIsScrambling(false);
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [targetText, duration, speed, chars, playSound]);

  useEffect(() => {
    if (triggerOnMount) {
      // oxlint-disable-next-line react/set-state-in-effect
      trigger();
    } else {
      // oxlint-disable-next-line react/set-state-in-effect
      setDisplayText(targetText);
    }

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [targetText, triggerOnMount, trigger]);

  return { displayText, isScrambling, trigger };
}
