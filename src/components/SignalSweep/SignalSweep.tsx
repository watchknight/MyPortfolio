import { useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import styles from './SignalSweep.module.css';

/**
 * The Signal Sweep — the single orchestrated moment on this site.
 *
 * Engineering choreography:
 * 1. On mount, an opaque chassis-colored overlay hides unstyled layout shifts.
 * 2. A 1px gradient beam sweeps from top (0%) to bottom (100%) in 550ms.
 * 3. As the beam sweeps, the overlay dissolves and the content transitions
 *    synchronously from optical blur (5px, low opacity) to razor-sharp signal
 *    (0px blur, full opacity) in a single calibrated sweep.
 * 4. Once complete, the overlay and filter wrappers unmount cleanly so there
 *    is zero permanent compositing or stacking context penalty.
 * 5. Full prefers-reduced-motion support: renders immediately sharp with zero delays.
 */

interface SignalSweepProps {
  children: ReactNode;
}

export function SignalSweep({ children }: SignalSweepProps) {
  const [complete, setComplete] = useState(false);
  const prefersReduced = useReducedMotion();

  const handleSweepEnd = useCallback(() => {
    setComplete(true);
  }, []);

  if (prefersReduced || complete) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Content layer: transitions directly from blur to sharp signal on mount */}
      <motion.div
        className={styles.contentWrap}
        initial={{ filter: 'blur(6px)', opacity: 0.2 }}
        animate={{ filter: 'blur(0px)', opacity: 1 }}
        transition={{
          filter: { duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] },
          opacity: { duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] },
        }}
      >
        {children}
      </motion.div>

      {/* The scanning light beam and disappearing chassis curtain */}
      <AnimatePresence>
        {!complete && (
          <motion.div
            key="sweep-curtain"
            className={styles.sweepOverlay}
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.5,
              delay: 0.25,
              ease: [0.16, 1, 0.3, 1],
            }}
            onAnimationComplete={handleSweepEnd}
            aria-hidden="true"
          >
            <motion.div
              className={styles.sweepLine}
              initial={{ top: '0%' }}
              animate={{ top: '100%' }}
              transition={{
                duration: 0.55,
                delay: 0.05,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
