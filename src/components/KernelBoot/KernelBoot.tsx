import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../../audio/sound.js';
import styles from './KernelBoot.module.css';

const BOOT_STEPS = [
  { id: 'node', text: 'DHAKA_NODE // V8 KERNEL INITIALIZE', percent: 20 },
  { id: 'sec', text: 'CHROMIUM MV3 SECPOLICY: ENFORCED', percent: 45 },
  { id: 'dsp', text: 'SYNTHESIZER CALIBRATED (D-MIN PENTATONIC)', percent: 70 },
  { id: 'ast', text: 'AST POLYHEDRAL LATTICE: ONLINE', percent: 90 },
  { id: 'ready', text: 'SYSTEM ONLINE 100% // ALL SUBSYSTEMS NOMINAL', percent: 100 },
];

export const KernelBoot: React.FC = () => {
  const [isClient, setIsClient] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLeaving, setIsLeaving] = useState(false);
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef = useRef(false);

  const completeBoot = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    if (stepTimerRef.current) {
      clearTimeout(stepTimerRef.current);
      stepTimerRef.current = null;
    }
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('kernel_boot_done', '1');
      } catch {
        // Private browsing exception handling
      }
      window.dispatchEvent(new CustomEvent('kernel-ready'));
    }
    setIsLeaving(true);
    setTimeout(() => {
      setShouldRender(false);
    }, 280);
  }, []);

  // Initial check on mount
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setIsClient(true);
    if (typeof window === 'undefined') return;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    let alreadyDone = false;
    try {
      alreadyDone = sessionStorage.getItem('kernel_boot_done') === '1';
    } catch {
      alreadyDone = false;
    }

    if (alreadyDone || reduceMotion) {
      if (!alreadyDone) {
        try {
          sessionStorage.setItem('kernel_boot_done', '1');
        } catch {}
      }
      window.dispatchEvent(new CustomEvent('kernel-ready'));
      return;
    }

    setShouldRender(true);
  }, []);

  // Progression sequence
  useEffect(() => {
    if (!shouldRender || isLeaving) return;

    if (currentStep < BOOT_STEPS.length) {
      sound.play('tick', { vel: 0.2 });
      const delay = currentStep === BOOT_STEPS.length - 1 ? 260 : 200;

      stepTimerRef.current = setTimeout(() => {
        if (currentStep + 1 < BOOT_STEPS.length) {
          setCurrentStep((prev) => prev + 1);
        } else {
          sound.play('chime');
          completeBoot();
        }
      }, delay);
    }

    return () => {
      if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
    };
  }, [shouldRender, currentStep, isLeaving, completeBoot]);

  // Keyboard shortcut listener (Escape or Space to bypass)
  useEffect(() => {
    if (!shouldRender || isLeaving) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        sound.play('swish', { vel: 0.3 });
        completeBoot();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shouldRender, isLeaving, completeBoot]);

  if (!isClient || !shouldRender) return null;

  const currentPercent = BOOT_STEPS[currentStep]?.percent ?? 100;

  return (
    <div
      className={`${styles.overlay} ${isLeaving ? styles.overlayLeaving : ''}`}
      onClick={completeBoot}
      role="dialog"
      aria-modal="true"
      aria-label="Systems Kernel Boot Sequence"
    >
      <div className={styles.hudCard}>
        <div className={styles.hudHeader}>
          <div className={styles.hudBrand}>
            <span className={styles.statusDot} />
            <span className={styles.hudTitle}>Sentinel Kernel // v2.6.4</span>
          </div>
          <span className={styles.hudPercent}>{currentPercent}%</span>
        </div>

        <div className={styles.terminalLog}>
          {BOOT_STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isActive = idx === currentStep;
            if (idx > currentStep) return null;

            return (
              <div
                key={step.id}
                className={`${styles.logLine} ${
                  isActive ? styles.logLineActive : isDone ? styles.logLineDone : ''
                }`}
              >
                <span
                  className={`${styles.logPrefix} ${
                    isDone ? styles.logPrefixSuccess : ''
                  }`}
                >
                  {isDone ? '✓' : '›'}
                </span>
                <span>{step.text}</span>
              </div>
            );
          })}
        </div>

        <div className={styles.progressTrack}>
          <div
            className={styles.progressBar}
            style={{ width: `${currentPercent}%` }}
          />
        </div>

        <div className={styles.hudFooter}>
          <span>NODE: ASIA_DHK</span>
          <span className={styles.skipHint}>[ ESC or Click anywhere to bypass ]</span>
        </div>
      </div>
    </div>
  );
};
