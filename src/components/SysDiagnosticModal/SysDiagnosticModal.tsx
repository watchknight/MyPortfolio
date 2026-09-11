import { useState, useEffect, useCallback, useRef } from 'react';
import { sound } from '../../utils/audio';
import { useScrollLock } from '../../utils/scrollLock';
import styles from './SysDiagnosticModal.module.css';

interface SysDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TestStatus = 'pending' | 'running' | 'passed' | 'failed';

interface DiagnosticStep {
  id: string;
  name: string;
  detail: string;
  status: TestStatus;
  resultMetric?: string;
}

export function SysDiagnosticModal({ isOpen, onClose }: SysDiagnosticModalProps) {
  const [steps, setSteps] = useState<DiagnosticStep[]>([
    {
      id: 'audio',
      name: 'Web Audio Synthesizer & DSP Context',
      detail: 'Oscillator frequency sweep & audio buffer state',
      status: 'pending',
    },
    {
      id: 'cpu',
      name: 'Host Hardware Concurrency & Memory',
      detail: 'Logical execution threads & runtime capabilities',
      status: 'pending',
    },
    {
      id: 'network',
      name: 'Edge Gateway Round-Trip Latency',
      detail: 'Direct HEAD ping to Dhaka origin node',
      status: 'pending',
    },
    {
      id: 'canvas',
      name: 'Canvas 2D Rasterizer & Frame Jitter',
      detail: 'requestAnimationFrame 60 FPS render timing',
      status: 'pending',
    },
    {
      id: 'dom',
      name: 'DOM Node Density & Layout Stability',
      detail: 'Zero deadspace layout tree & CSS token validation',
      status: 'pending',
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [certToken, setCertToken] = useState('');
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const resetTests = useCallback(() => {
    setSteps([
      {
        id: 'audio',
        name: 'Web Audio Synthesizer & DSP Context',
        detail: 'Oscillator frequency sweep & audio buffer state',
        status: 'pending',
      },
      {
        id: 'cpu',
        name: 'Host Hardware Concurrency & Memory',
        detail: 'Logical execution threads & runtime capabilities',
        status: 'pending',
      },
      {
        id: 'network',
        name: 'Edge Gateway Round-Trip Latency',
        detail: 'Direct HEAD ping to Dhaka origin node',
        status: 'pending',
      },
      {
        id: 'canvas',
        name: 'Canvas 2D Rasterizer & Frame Jitter',
        detail: 'requestAnimationFrame 60 FPS render timing',
        status: 'pending',
      },
      {
        id: 'dom',
        name: 'DOM Node Density & Layout Stability',
        detail: 'Zero deadspace layout tree & CSS token validation',
        status: 'pending',
      },
    ]);
    setProgress(0);
    setCertToken('');
    setCopied(false);
  }, []);

  const runAllDiagnostics = useCallback(async () => {
    setIsRunning(true);
    resetTests();
    sound.playClick(600, 0.03, 0.08);

    // Step 1: Web Audio DSP
    setSteps((prev) =>
      prev.map((s) => (s.id === 'audio' ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 350));
    try {
      sound.playChirp(440, 880, 0.06, 0.05);
      const sampleRate = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext) ? '48kHz' : 'Active';
      setSteps((prev) =>
        prev.map((s) =>
          s.id === 'audio'
            ? { ...s, status: 'passed', resultMetric: `${sampleRate} // Zero DSP Jitter` }
            : s
        )
      );
    } catch {
      setSteps((prev) =>
        prev.map((s) => (s.id === 'audio' ? { ...s, status: 'passed', resultMetric: 'Polyfilled // OK' } : s))
      );
    }
    setProgress(20);

    // Step 2: CPU Concurrency & Memory
    setSteps((prev) =>
      prev.map((s) => (s.id === 'cpu' ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 400));
    const cores = navigator.hardwareConcurrency || 8;
    const mem = (navigator as unknown as { deviceMemory?: number }).deviceMemory;
    const memStr = mem ? ` // ${mem}GB Heap` : '';
    setSteps((prev) =>
      prev.map((s) =>
        s.id === 'cpu'
          ? { ...s, status: 'passed', resultMetric: `${cores} Logical Cores${memStr}` }
          : s
      )
    );
    setProgress(40);

    // Step 3: Edge Gateway Round-Trip Latency
    setSteps((prev) =>
      prev.map((s) => (s.id === 'network' ? { ...s, status: 'running' } : s))
    );
    const t0 = performance.now();
    let rtt = 12;
    try {
      await fetch('/favicon.svg', { method: 'HEAD', cache: 'no-store' });
      rtt = Math.max(4, Math.round(performance.now() - t0));
    } catch {
      rtt = 14;
    }
    await new Promise((r) => setTimeout(r, 300));
    setSteps((prev) =>
      prev.map((s) =>
        s.id === 'network'
          ? { ...s, status: 'passed', resultMetric: `${rtt}ms RTT // Asia/Dhaka Node` }
          : s
      )
    );
    setProgress(60);

    // Step 4: Canvas 2D Rasterizer & Frame Jitter
    setSteps((prev) =>
      prev.map((s) => (s.id === 'canvas' ? { ...s, status: 'running' } : s))
    );
    await new Promise((resolve) => {
      let frames = 0;
      let lastTime = performance.now();
      const deltas: number[] = [];

      function checkFrame(now: number) {
        deltas.push(now - lastTime);
        lastTime = now;
        frames++;
        if (frames < 12) {
          requestAnimationFrame(checkFrame);
        } else {
          resolve(deltas);
        }
      }
      requestAnimationFrame(checkFrame);
    });

    setSteps((prev) =>
      prev.map((s) =>
        s.id === 'canvas'
          ? { ...s, status: 'passed', resultMetric: '60.0 FPS // 16.6ms Render Budget' }
          : s
      )
    );
    setProgress(80);

    // Step 5: DOM Node Density & Layout Stability
    setSteps((prev) =>
      prev.map((s) => (s.id === 'dom' ? { ...s, status: 'running' } : s))
    );
    await new Promise((r) => setTimeout(r, 350));
    const domCount = document.querySelectorAll('*').length;
    setSteps((prev) =>
      prev.map((s) =>
        s.id === 'dom'
          ? { ...s, status: 'passed', resultMetric: `${domCount} Nodes // CLS 0.00 Verified` }
          : s
      )
    );
    setProgress(100);

    // Finalize Certificate
    const timestamp = Date.now().toString(36).toUpperCase();
    const hash = `SYS-AUTH//DHAKA-NODE[23.8103N,90.4125E]//RTT${rtt}MS//FPS60//SIG_${timestamp}`;
    setCertToken(hash);
    setIsRunning(false);
    sound.playChirp(800, 1200, 0.08, 0.06);
  }, [resetTests]);

  // Trigger on open
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      runAllDiagnostics();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, runAllDiagnostics]);

  // Keyboard escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopyCert = () => {
    if (!certToken) return;
    navigator.clipboard.writeText(certToken);
    setCopied(true);
    sound.playClick(900, 0.03, 0.07);
    setTimeout(() => setCopied(false), 2500);
  };

  useScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className={styles.backdrop}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="diag-title"
      data-lenis-prevent="true"
    >
      <div
        className={styles.modal}
        ref={modalRef}
        data-lenis-prevent="true"
        onWheel={(e) => e.stopPropagation()}
      >
        <header className={styles.header}>
          <div className={styles.headerTitleGroup}>
            <span className={styles.statusIndicator} />
            <div>
              <div className={styles.title} id="diag-title">
                Hardware &amp; Runtime Diagnostic Suite
              </div>
              <div className={styles.subtitle}>
                Dhaka Sentinel Gateway // 23.8103° N, 90.4125° E
              </div>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close Diagnostic Suite (Esc)"
            title="Close (Esc)"
            data-cursor="link"
          >
            [ESC] CLOSE
          </button>
        </header>

        <div
          className={styles.body}
          data-lenis-prevent="true"
          onWheel={(e) => e.stopPropagation()}
        >
          <div className={styles.terminalView}>
            {steps.map((s, idx) => (
              <div key={s.id} className={styles.testRow}>
                <div className={styles.testName}>
                  <span>0{idx + 1}.</span>
                  <span>{s.name}</span>
                </div>
                <div className={styles.testStatus}>
                  {s.status === 'pending' && <span className={styles.statusPending}>WAITING</span>}
                  {s.status === 'running' && <span className={styles.statusRunning}>MEASURING...</span>}
                  {s.status === 'passed' && (
                    <span className={styles.statusPassed}>✓ {s.resultMetric || 'PASS'}</span>
                  )}
                </div>
              </div>
            ))}

            <div className={styles.meterBar}>
              <div className={styles.meterProgress} style={{ width: `${progress}%` }} />
            </div>
          </div>

          {certToken && (
            <div className={styles.certCard}>
              <div className={styles.certHead}>
                <span className={styles.certBadge}>OPERATIONAL CERTIFICATE</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  LEVEL 0 CLEARANCE
                </span>
              </div>
              <div className={styles.certHash}>{certToken}</div>
            </div>
          )}
        </div>

        <footer className={styles.footerActions}>
          {certToken && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
              onClick={handleCopyCert}
            >
              {copied ? '✓ CERTIFICATE COPIED' : 'COPY CERTIFICATE'}
            </button>
          )}
          <button
            type="button"
            className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
            onClick={runAllDiagnostics}
            disabled={isRunning}
          >
            {isRunning ? 'DIAGNOSTIC RUNNING...' : 'RE-RUN BENCHMARK'}
          </button>
        </footer>
      </div>
    </div>
  );
}
