import { useEffect } from 'react';
import type Lenis from 'lenis';

let lenisInstance: Lenis | null = null;
let activeLocks = 0;

/**
 * Registers the global active Lenis smooth scroll instance.
 */
export function registerLenis(instance: Lenis | null): void {
  lenisInstance = instance;
}

/**
 * Locks page and window scroll, pausing Lenis and disabling body/html scroll.
 * Re-entrant / reference-counted to support multiple concurrent overlays safely.
 */
export function lockScroll(): void {
  activeLocks++;
  if (activeLocks === 1) {
    lenisInstance?.stop();
    if (typeof document !== 'undefined') {
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    }
  }
}

/**
 * Unlocks page scroll once all active locks have been released.
 */
export function unlockScroll(): void {
  activeLocks = Math.max(0, activeLocks - 1);
  if (activeLocks === 0) {
    if (typeof document !== 'undefined') {
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    lenisInstance?.start();
  }
}

/**
 * React hook to automatically lock and unlock scroll based on a boolean condition.
 */
export function useScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (!isLocked) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
}
