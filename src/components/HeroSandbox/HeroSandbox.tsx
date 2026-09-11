import { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import styles from './HeroSandbox.module.css';

interface TerminalLog {
  id: string;
  type: 'cmd' | 'output' | 'success' | 'warn' | 'info';
  text: string;
}

export function HeroSandbox({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'telemetry' | 'matrix'>('terminal');
  const [inputVal, setInputVal] = useState('');
  const [dhakaTime, setDhakaTime] = useState('');
  const [ping, setPing] = useState(14);
  const [fps, setFps] = useState(60);
  const outputContainerRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<TerminalLog[]>([
    { id: '1', type: 'info', text: 'DHAKA_SENTINEL_NODE // v2.4.0-PROD INITIALIZED' },
    { id: '2', type: 'output', text: 'Type a command or click a quick action below:' },
  ]);

  // Clock
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

  // Ping jitter
  useEffect(() => {
    const interval = setInterval(() => {
      setPing(Math.floor(12 + Math.random() * 5));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleRunCommand = (cmd: string) => {
    const clean = cmd.trim().toLowerCase();
    if (!clean) return;

    sound.playClick(750, 0.02, 0.05);

    const newLogs: TerminalLog[] = [
      ...logs,
      { id: Date.now() + '-cmd', type: 'cmd', text: `$ ${clean}` },
    ];

    if (clean === 'whoami') {
      newLogs.push({
        id: Date.now() + '-out',
        type: 'success',
        text: 'Abdur Rahman Moayed — Software Engineer & Systems Builder (EWU B.Sc. CSE)',
      });
      newLogs.push({
        id: Date.now() + '-sub',
        type: 'output',
        text: 'Specializing in browser internals, OS-level security countermeasures, and high-performance web systems.',
      });
    } else if (clean === 'projects' || clean === 'ls projects') {
      newLogs.push({
        id: Date.now() + '-out',
        type: 'success',
        text: '6 Production & Research Systems Found:',
      });
      newLogs.push({
        id: Date.now() + '-p1',
        type: 'info',
        text: '1. PureFeed — Chromium MV3 Main-World Anti-Adblock Engine (<16ms)',
      });
      newLogs.push({
        id: Date.now() + '-p2',
        type: 'info',
        text: '2. FocusGuard — OS-Level Windows Registry & DNS Sinkhole (580+ hosts)',
      });
      newLogs.push({
        id: Date.now() + '-p3',
        type: 'info',
        text: '3. DocLensBD — MediaPipe 468-Point 3D Virtual Eyewear Try-On (60 FPS)',
      });
      newLogs.push({
        id: Date.now() + '-p4',
        type: 'info',
        text: '4. Rannabanna — Heuristic Recipe Scaling & SQLite Matchmaker (0.8ms)',
      });
      newLogs.push({
        id: Date.now() + '-act',
        type: 'warn',
        text: 'Tip: Run "works" to inspect full code architectures and live demos.',
      });
    } else if (clean === 'skills' || clean === 'stack') {
      newLogs.push({
        id: Date.now() + '-out',
        type: 'success',
        text: 'Core Architecture Stack:',
      });
      newLogs.push({
        id: Date.now() + '-s1',
        type: 'output',
        text: 'Languages: TypeScript, JavaScript (ESNext), C++, HTML5/CSS3',
      });
      newLogs.push({
        id: Date.now() + '-s2',
        type: 'output',
        text: 'Systems: Chromium MV3, Windows Registry APIs, OS DNS Sockets, Web Audio DSP',
      });
      newLogs.push({
        id: Date.now() + '-s3',
        type: 'output',
        text: 'Frameworks: React 19, Next.js, Node.js, Express, MediaPipe 3D, SQLite',
      });
    } else if (clean === 'works' || clean === 'cd /works') {
      newLogs.push({ id: Date.now() + '-out', type: 'success', text: 'Navigating to Selected Works...' });
      setTimeout(() => onNavigate('/works'), 500);
    } else if (clean === 'contact' || clean === 'hire') {
      newLogs.push({ id: Date.now() + '-out', type: 'success', text: 'Opening Direct Communications Channel...' });
      setTimeout(() => onNavigate('/contact'), 500);
    } else if (clean === 'clear' || clean === 'cls') {
      setLogs([{ id: Date.now().toString(), type: 'info', text: 'Console cleared. Ready for input.' }]);
      setInputVal('');
      return;
    } else if (clean === 'help') {
      newLogs.push({
        id: Date.now() + '-help',
        type: 'info',
        text: 'Available commands: whoami, projects, skills, works, contact, clear',
      });
    } else {
      newLogs.push({
        id: Date.now() + '-err',
        type: 'warn',
        text: `Command not recognized: "${clean}". Try: whoami, projects, skills, works, contact, clear.`,
      });
    }

    setLogs(newLogs);
    setInputVal('');
    setTimeout(() => {
      if (outputContainerRef.current) {
        outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
      }
    }, 40);
  };

  return (
    <div className={styles.sandboxContainer} data-lenis-prevent="true">
      {/* Top Window Bar */}
      <div className={styles.windowHeader}>
        <div className={styles.windowControls}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
          <span className={styles.windowTitle}>moayed@node-dhaka ~ /workspace</span>
        </div>

        {/* Tab Controls */}
        <div className={styles.tabGroup} role="tablist">
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'terminal' ? styles.tabBtnActive : ''}`}
            onClick={() => {
              setActiveTab('terminal');
              sound.playClick(600, 0.02, 0.04);
            }}
            role="tab"
            aria-selected={activeTab === 'terminal'}
            data-cursor="link"
          >
            &gt;_ Terminal
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
            Verified Matrix
          </button>
        </div>
      </div>

      {/* Tab 1: Interactive Terminal */}
      {activeTab === 'terminal' && (
        <div className={styles.terminalBody}>
          <div className={styles.terminalOutput} ref={outputContainerRef}>
            {logs.map((log) => (
              <div key={log.id} className={`${styles.logRow} ${styles['log_' + log.type]}`}>
                {log.text}
              </div>
            ))}
          </div>

          {/* Quick Trigger Chips */}
          <div className={styles.quickBar}>
            <span className={styles.quickLabel}>QUICK RUN:</span>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => handleRunCommand('whoami')}
              data-cursor="link"
            >
              whoami
            </button>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => handleRunCommand('projects')}
              data-cursor="link"
            >
              projects
            </button>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => handleRunCommand('skills')}
              data-cursor="link"
            >
              skills
            </button>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => handleRunCommand('contact')}
              data-cursor="link"
            >
              contact
            </button>
            <button
              type="button"
              className={styles.quickChip}
              onClick={() => handleRunCommand('clear')}
              data-cursor="link"
            >
              clear
            </button>
          </div>

          {/* Input Form */}
          <form
            className={styles.inputBar}
            onSubmit={(e) => {
              e.preventDefault();
              handleRunCommand(inputVal);
            }}
          >
            <span className={styles.promptArrow}>$&nbsp;</span>
            <input
              type="text"
              className={styles.cmdInput}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Type command (e.g. whoami, projects, clear)..."
              aria-label="Terminal command input"
            />
            <button type="submit" className={styles.execBtn} aria-label="Run command" data-cursor="link">
              ↵ RUN
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Telemetry Node */}
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
              <span className={styles.tcSub}>Direct HEAD Ping</span>
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

      {/* Tab 3: Verified Matrix */}
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
