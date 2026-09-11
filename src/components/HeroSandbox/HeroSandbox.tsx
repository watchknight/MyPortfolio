import { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import styles from './HeroSandbox.module.css';

interface TerminalLog {
  id: string;
  type: 'cmd' | 'output' | 'success' | 'warn' | 'info';
  text: string;
}

type BenchmarkType = 'purefeed' | 'focusguard' | 'doclens' | 'ping';

export function HeroSandbox({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [activeTab, setActiveTab] = useState<'overview' | 'telemetry' | 'matrix'>('overview');
  const [activeBenchmark, setActiveBenchmark] = useState<BenchmarkType | null>(null);
  const [dhakaTime, setDhakaTime] = useState('');
  const [ping, setPing] = useState(14);
  const [fps, setFps] = useState(60);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<TerminalLog[]>([
    { id: '1', type: 'info', text: 'SYSTEM_STATUS // ONLINE (Dhaka Edge Node v2.4)' },
    { id: '2', type: 'output', text: 'Click any benchmark tile above to stream live performance telemetry.' },
  ]);

  // Dhaka Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Dhaka',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(now);
      setDhakaTime(formatted);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Frame rate monitoring
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animId: number;

    const loop = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        setFps(Math.min(120, Math.max(30, frameCount)));
        frameCount = 0;
        lastTime = now;
      }
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Live Ping Jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(12 + Math.random() * 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll log stream on append
  const scrollToBottom = () => {
    setTimeout(() => {
      if (outputContainerRef.current) {
        outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
      }
    }, 40);
  };

  const runBenchmark = (type: BenchmarkType) => {
    sound.playClick(720, 0.02, 0.05);
    setActiveBenchmark(type);

    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });
    const newLogs: TerminalLog[] = [];

    if (type === 'purefeed') {
      newLogs.push({
        id: `${Date.now()}-1`,
        type: 'cmd',
        text: `[${now}] benchmark --target=PureFeed-MV3 --engine=chromium`,
      });
      newLogs.push({
        id: `${Date.now()}-2`,
        type: 'output',
        text: '→ Intercepting YouTube video DOM player lifecycle stream...',
      });
      newLogs.push({
        id: `${Date.now()}-3`,
        type: 'success',
        text: '✓ Ad-injection blocked in 11.4ms (Bypassed 100% video ads, 0 frame drops).',
      });
    } else if (type === 'focusguard') {
      newLogs.push({
        id: `${Date.now()}-1`,
        type: 'cmd',
        text: `[${now}] benchmark --target=FocusGuard-DNS --os=windows`,
      });
      newLogs.push({
        id: `${Date.now()}-2`,
        type: 'output',
        text: '→ Polling Windows Registry & OS-level hosts loopback table...',
      });
      newLogs.push({
        id: `${Date.now()}-3`,
        type: 'success',
        text: '✓ 580+ tracking hosts sinkholed in 0.1ms with 0.0% background CPU.',
      });
    } else if (type === 'doclens') {
      newLogs.push({
        id: `${Date.now()}-1`,
        type: 'cmd',
        text: `[${now}] benchmark --target=DocLensBD-3D --pipeline=mediapipe`,
      });
      newLogs.push({
        id: `${Date.now()}-2`,
        type: 'output',
        text: '→ Initializing WebGL canvas & 468-point 3D facial mesh tracker...',
      });
      newLogs.push({
        id: `${Date.now()}-3`,
        type: 'success',
        text: '✓ Real-time eyewear rendered at 60.0 FPS with pupillary auto-scale.',
      });
    } else if (type === 'ping') {
      newLogs.push({
        id: `${Date.now()}-1`,
        type: 'cmd',
        text: `[${now}] ping --host=dhaka.sentinel.internal --c=3`,
      });
      newLogs.push({
        id: `${Date.now()}-2`,
        type: 'output',
        text: `→ Route verified via Dhaka Edge: 23.8103° N, 90.4125° E.`,
      });
      newLogs.push({
        id: `${Date.now()}-3`,
        type: 'success',
        text: `✓ Round-Trip Time: ${ping}ms | Packet Loss: 0.0% | Status: Pristine.`,
      });
    }

    setLogs((prev) => [...prev.slice(-6), ...newLogs]);
    scrollToBottom();
  };

  const handleQuickAction = (action: string) => {
    sound.playClick(600, 0.02, 0.04);
    const now = new Date().toLocaleTimeString('en-GB', { hour12: false });

    if (action === 'whoami') {
      setLogs((prev) => [
        ...prev.slice(-5),
        { id: `${Date.now()}-cmd`, type: 'cmd', text: `[${now}] whoami` },
        { id: `${Date.now()}-out`, type: 'success', text: 'Abdur Rahman Moayed — Software Engineer & Systems Builder' },
        { id: `${Date.now()}-sub`, type: 'output', text: 'EWU B.Sc. CSE | High-Performance Web, Chromium MV3, OS Security' },
      ]);
    } else if (action === 'projects') {
      setLogs((prev) => [
        ...prev.slice(-5),
        { id: `${Date.now()}-cmd`, type: 'cmd', text: `[${now}] ls projects/` },
        { id: `${Date.now()}-out`, type: 'success', text: '6 Production Projects: PureFeed, FocusGuard, DocLensBD, Rannabanna, Poshra, Portfolio' },
      ]);
      setTimeout(() => onNavigate('/works'), 600);
    } else if (action === 'skills') {
      setLogs((prev) => [
        ...prev.slice(-5),
        { id: `${Date.now()}-cmd`, type: 'cmd', text: `[${now}] cat stack.spec` },
        { id: `${Date.now()}-out`, type: 'output', text: 'TypeScript, React 19, Chromium MV3, Windows Registry, MediaPipe 3D, SQLite, Web Audio DSP' },
      ]);
    } else if (action === 'contact') {
      setLogs((prev) => [
        ...prev.slice(-5),
        { id: `${Date.now()}-cmd`, type: 'cmd', text: `[${now}] open /contact` },
        { id: `${Date.now()}-out`, type: 'success', text: 'Opening direct communications...' },
      ]);
      setTimeout(() => onNavigate('/contact'), 500);
    }
    scrollToBottom();
  };

  return (
    <div className={styles.sandboxContainer} data-lenis-prevent="true">
      {/* Sleek Window Header */}
      <div className={styles.windowHeader}>
        <div className={styles.windowControls}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
          <span className={styles.fileBadge}>
            <span className={styles.tsIcon}>TS</span> moayed.config.ts
          </span>
        </div>

        {/* Minimal Tab Switcher */}
        <div className={styles.tabGroup} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'overview' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('overview');
              sound.playClick(600, 0.02, 0.04);
            }}
            role="tab"
            aria-selected={activeTab === 'overview'}
            data-cursor="link"
          >
            Overview
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'telemetry' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('telemetry');
              sound.playClick(650, 0.02, 0.04);
            }}
            role="tab"
            aria-selected={activeTab === 'telemetry'}
            data-cursor="link"
          >
            Telemetry
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'matrix' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('matrix');
              sound.playClick(700, 0.02, 0.04);
            }}
            role="tab"
            aria-selected={activeTab === 'matrix'}
            data-cursor="link"
          >
            Credentials
          </button>
        </div>
      </div>

      {/* Tab 1: Overview (Aesthetic Code Spec + Live Benchmarks + Stream) */}
      {activeTab === 'overview' && (
        <div className={styles.overviewBody}>
          {/* Syntax-Highlighted Spec Capsule */}
          <div className={styles.codeCapsule} aria-label="Developer configuration code snippet">
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>1</span>
              <code>
                <span className={styles.syntaxKeyword}>const</span> <span className={styles.syntaxVar}>engineer</span>: <span className={styles.syntaxType}>DeveloperSpec</span> = &#123;
              </code>
            </div>
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>2</span>
              <code>
                &nbsp;&nbsp;<span className={styles.syntaxKey}>name</span>: <span className={styles.syntaxString}>&quot;Abdur Rahman Moayed&quot;</span>,
              </code>
            </div>
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>3</span>
              <code>
                &nbsp;&nbsp;<span className={styles.syntaxKey}>role</span>: <span className={styles.syntaxString}>&quot;Software &amp; Systems Engineer&quot;</span>,
              </code>
            </div>
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>4</span>
              <code>
                &nbsp;&nbsp;<span className={styles.syntaxKey}>institution</span>: <span className={styles.syntaxString}>&quot;East West University (EWU CSE)&quot;</span>,
              </code>
            </div>
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>5</span>
              <code>
                &nbsp;&nbsp;<span className={styles.syntaxKey}>focus</span>: [<span className={styles.syntaxString}>&quot;High-Performance Web&quot;</span>, <span className={styles.syntaxString}>&quot;Chromium MV3&quot;</span>, <span className={styles.syntaxString}>&quot;OS Security&quot;</span>],
              </code>
            </div>
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>6</span>
              <code>
                &nbsp;&nbsp;<span className={styles.syntaxKey}>status</span>: <span className={styles.syntaxStatus}>&quot;🟢 Available for high-impact roles&quot;</span>
              </code>
            </div>
            <div className={styles.codeLine}>
              <span className={styles.lineNum}>7</span>
              <code>&#125;;</code>
            </div>
          </div>

          {/* Interactive Benchmark Tiles */}
          <div className={styles.benchmarkSection}>
            <div className={styles.sectionHeadingRow}>
              <span className={styles.sectionHeading}>LIVE SYSTEM BENCHMARKS</span>
              <span className={styles.headingBadge}>CLICK TO PROBE</span>
            </div>

            <div className={styles.tileGrid}>
              <button
                type="button"
                className={`${styles.tileBtn} ${activeBenchmark === 'purefeed' ? styles.tileBtnActive : ''}`}
                onClick={() => runBenchmark('purefeed')}
                data-cursor="link"
                title="Simulate PureFeed YouTube Adblock Bypass"
              >
                <div className={styles.tileTop}>
                  <span className={styles.tileIcon}>⚡</span>
                  <span className={styles.tileMetric}>11.4ms</span>
                </div>
                <span className={styles.tileTitle}>PureFeed Bypass</span>
                <span className={styles.tileDesc}>Chromium MV3 engine</span>
              </button>

              <button
                type="button"
                className={`${styles.tileBtn} ${activeBenchmark === 'focusguard' ? styles.tileBtnActive : ''}`}
                onClick={() => runBenchmark('focusguard')}
                data-cursor="link"
                title="Simulate FocusGuard DNS Sinkhole"
              >
                <div className={styles.tileTop}>
                  <span className={styles.tileIcon}>🛡️</span>
                  <span className={styles.tileMetric}>0.1ms</span>
                </div>
                <span className={styles.tileTitle}>FocusGuard Sinkhole</span>
                <span className={styles.tileDesc}>Windows DNS null-route</span>
              </button>

              <button
                type="button"
                className={`${styles.tileBtn} ${activeBenchmark === 'doclens' ? styles.tileBtnActive : ''}`}
                onClick={() => runBenchmark('doclens')}
                data-cursor="link"
                title="Simulate DocLensBD 3D Eyewear Engine"
              >
                <div className={styles.tileTop}>
                  <span className={styles.tileIcon}>👓</span>
                  <span className={styles.tileMetric}>60 FPS</span>
                </div>
                <span className={styles.tileTitle}>DocLensBD 3D</span>
                <span className={styles.tileDesc}>MediaPipe face mesh</span>
              </button>

              <button
                type="button"
                className={`${styles.tileBtn} ${activeBenchmark === 'ping' ? styles.tileBtnActive : ''}`}
                onClick={() => runBenchmark('ping')}
                data-cursor="link"
                title="Probe Dhaka Node Edge Latency"
              >
                <div className={styles.tileTop}>
                  <span className={styles.tileIcon}>📡</span>
                  <span className={styles.tileMetric}>{ping}ms</span>
                </div>
                <span className={styles.tileTitle}>Dhaka Edge Ping</span>
                <span className={styles.tileDesc}>Real-time RTT probe</span>
              </button>
            </div>
          </div>

          {/* Sleek Live Stream Console */}
          <div className={styles.streamCard}>
            <div className={styles.streamHeader}>
              <div className={styles.streamHeaderLeft}>
                <span className={styles.streamPulse} />
                <span className={styles.streamTitle}>TELEMETRY STREAM</span>
              </div>
              <div className={styles.streamHeaderRight}>
                {activeBenchmark && (
                  <button
                    type="button"
                    className={styles.viewProjectLink}
                    onClick={() => {
                      sound.playTick();
                      onNavigate('/works');
                    }}
                    data-cursor="link"
                  >
                    Inspect Architecture &rarr;
                  </button>
                )}
                <button
                  type="button"
                  className={styles.clearBtn}
                  onClick={() => {
                    sound.playTick();
                    setLogs([{ id: 'c-' + Date.now(), type: 'info', text: 'Telemetry cleared. Ready for next probe.' }]);
                    setActiveBenchmark(null);
                  }}
                  data-cursor="link"
                  title="Clear output"
                >
                  clear
                </button>
              </div>
            </div>

            <div className={styles.streamLogs} ref={outputContainerRef}>
              {logs.map((log) => (
                <div key={log.id} className={`${styles.logLine} ${styles['log_' + log.type]}`}>
                  {log.text}
                </div>
              ))}
            </div>

            {/* Quick Action Chips */}
            <div className={styles.quickBar}>
              <span className={styles.quickLabel}>QUICK:</span>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => handleQuickAction('whoami')}
                data-cursor="link"
              >
                whoami
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => handleQuickAction('projects')}
                data-cursor="link"
              >
                projects (6)
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => handleQuickAction('skills')}
                data-cursor="link"
              >
                skills
              </button>
              <button
                type="button"
                className={styles.quickChip}
                onClick={() => handleQuickAction('contact')}
                data-cursor="link"
              >
                contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Telemetry */}
      {activeTab === 'telemetry' && (
        <div className={styles.telemetryBody}>
          <div className={styles.telemetryGrid}>
            <div className={styles.telemetryCard}>
              <span className={styles.tcLabel}>DHAKA NODE ORIGIN</span>
              <span className={styles.tcValue}>{dhakaTime || '19:00:00'}</span>
              <span className={styles.tcSub}>Asia/Dhaka (GMT+6)</span>
            </div>

            <div className={styles.telemetryCard}>
              <span className={styles.tcLabel}>EDGE RTT LATENCY</span>
              <span className={styles.tcValue} style={{ color: 'var(--color-accent)' }}>
                {ping} ms
              </span>
              <span className={styles.tcSub}>Direct Edge Ping</span>
            </div>

            <div className={styles.telemetryCard}>
              <span className={styles.tcLabel}>CLIENT RENDER TIMING</span>
              <span className={styles.tcValue} style={{ color: 'var(--color-success)' }}>
                {fps} FPS
              </span>
              <span className={styles.tcSub}>16.6ms Render Budget</span>
            </div>

            <div className={styles.telemetryCard}>
              <span className={styles.tcLabel}>LOGICAL CONCURRENCY</span>
              <span className={styles.tcValue}>
                {typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 8 : 8} Cores
              </span>
              <span className={styles.tcSub}>Host Architecture</span>
            </div>
          </div>

          <div className={styles.telemetryFooter}>
            <div className={styles.livePulseGroup}>
              <span className={styles.radarPing} />
              <span className={styles.radarText}>DHAKA_SENTINEL_GATEWAY // 23.8103° N, 90.4125° E // ACTIVE</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Verified Academic Credentials */}
      {activeTab === 'matrix' && (
        <div className={styles.matrixBody}>
          <div className={styles.matrixHead}>
            <div className={styles.matrixTitleGroup}>
              <h4 className={styles.matrixTitle}>Abdur Rahman Moayed</h4>
              <span className={styles.matrixSub}>B.Sc. in Computer Science &amp; Engineering</span>
            </div>
            <span className={styles.matrixBadge}>EAST WEST UNIVERSITY</span>
          </div>

          <div className={styles.matrixList}>
            <div className={styles.matrixItem}>
              <span className={styles.miBullet}>01</span>
              <div>
                <span className={styles.miTitle}>East West University (EWU)</span>
                <span className={styles.miDesc}>Computer Science &amp; Engineering (2025—Present)</span>
              </div>
            </div>
            <div className={styles.matrixItem}>
              <span className={styles.miBullet}>02</span>
              <div>
                <span className={styles.miTitle}>Board General Merit Scholarship</span>
                <span className={styles.miDesc}>SSC Class 10 (2021) — Perfect GPA 5.0</span>
              </div>
            </div>
            <div className={styles.matrixItem}>
              <span className={styles.miBullet}>03</span>
              <div>
                <span className={styles.miTitle}>Board General Merit Scholarship</span>
                <span className={styles.miDesc}>JSC Class 8 (2018) — Perfect GPA 5.0</span>
              </div>
            </div>
            <div className={styles.matrixItem}>
              <span className={styles.miBullet}>04</span>
              <div>
                <span className={styles.miTitle}>National Distinction Recognition</span>
                <span className={styles.miDesc}>PSC Class 5 (2015) — Perfect GPA 5.0</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
