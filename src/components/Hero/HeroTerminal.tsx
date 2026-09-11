import { useState } from 'react';
import { sound } from '../../utils/audio';
import styles from './HeroTerminal.module.css';

interface LogItem {
  id: string;
  time: string;
  type: 'init' | 'skip' | 'unmask' | 'status';
  text: string;
}

export function HeroTerminal() {
  const [logs, setLogs] = useState<LogItem[]>([
    {
      id: '1',
      time: '00:00.12',
      type: 'init',
      text: 'SENTINEL_DAEMON // Attached to Chromium Blink (MV3)',
    },
    {
      id: '2',
      time: '00:00.28',
      type: 'status',
      text: 'Main-World bridge registered via document.dataset',
    },
    {
      id: '3',
      time: '00:01.04',
      type: 'skip',
      text: 'HTML5 Video playhead guard active (15s Black Screen trap neutralizer)',
    },
  ]);

  const addLog = (type: 'skip' | 'unmask', text: string) => {
    const now = new Date();
    const time = `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(Math.floor(now.getMilliseconds() / 10)).padStart(2, '0')}`;
    setLogs((prev) => [...prev.slice(-4), { id: Math.random().toString(), time, type, text }]);
  };

  const handleSimulateSkip = () => {
    sound.playChirp(700, 1200, 0.04, 0.07);
    addLog('skip', '[FAST-FORWARD] 14.99s duration reached -> Dispatched native HTML5 ended event (12ms)');
  };

  const handleSimulateUnmask = () => {
    sound.playClick(850, 0.02, 0.06);
    addLog('unmask', "[DOM_WALKER] Anagram 'ddenoorpss' matched -> Scrambled 'Sponsored' node purged");
  };

  return (
    <div className={styles.terminalWrapper} aria-label="Sentinel Runtime Telemetry HUD">
      <div className={styles.terminalBar}>
        <div className={styles.barLeft}>
          <div className={styles.dots} aria-hidden="true">
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={`${styles.dot} ${styles.dotPulse}`} />
          </div>
          <span className={styles.terminalTitle}>SENTINEL_CORE // PUREFEED_V3</span>
        </div>

        <div className={styles.pingBadge}>
          <span>● 14ms</span>
        </div>
      </div>

      <div className={styles.matrixGrid}>
        <div className={styles.matrixCell}>
          <span className={styles.cellLabel}>Runtime Context</span>
          <span className={styles.cellValue}>Chromium MV3</span>
        </div>
        <div className={styles.matrixCell}>
          <span className={styles.cellLabel}>Execution Bridge</span>
          <span className={styles.cellValue}>Main World Hook</span>
        </div>
        <div className={styles.matrixCell}>
          <span className={styles.cellLabel}>Observer Engine</span>
          <span className={styles.cellValue}>MutationObserver</span>
        </div>
        <div className={styles.matrixCell}>
          <span className={styles.cellLabel}>LRU Node Cache</span>
          <span className={styles.cellValue}>300 FIFO Slots</span>
        </div>
      </div>

      <div className={styles.actionToolbar}>
        <span className={styles.toolbarLabel}>Live Simulation:</span>
        <button
          type="button"
          className={styles.triggerBtn}
          onClick={handleSimulateSkip}
          data-cursor="link"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 4 15 12 5 20 5 4" />
            <line x1="19" y1="5" x2="19" y2="19" />
          </svg>
          <span>Test Ad Fast-Forward</span>
        </button>

        <button
          type="button"
          className={styles.triggerBtn}
          onClick={handleSimulateUnmask}
          data-cursor="link"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Unmask Sponsored DOM</span>
        </button>
      </div>

      <div className={styles.consoleLog} role="log" aria-live="polite">
        {logs.map((log) => (
          <div key={log.id} className={styles.logEntry}>
            <span className={styles.logTime}>[{log.time}]</span>
            <span
              className={
                log.type === 'skip'
                  ? styles.logSuccess
                  : log.type === 'unmask'
                  ? styles.logAccent
                  : styles.logPrompt
              }
            >
              {log.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
