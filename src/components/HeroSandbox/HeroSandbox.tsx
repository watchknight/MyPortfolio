import { useState, useEffect, useRef } from 'react';
import { sound } from '../../utils/audio';
import { projects } from '../../data/projects';
import { profileData } from '../../data/profile';
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

  // Live Clock (Dhaka Node Timezone)
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

    const now = Date.now().toString();
    const newLogs: TerminalLog[] = [
      ...logs,
      { id: `${now}-cmd`, type: 'cmd', text: `$ ${clean}` },
    ];

    if (clean === 'whoami') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: `NAME:      ${profileData.name} (@${profileData.handle})`,
      });
      newLogs.push({
        id: `${now}-role`,
        type: 'output',
        text: `ROLE:      ${profileData.role}`,
      });
      newLogs.push({
        id: `${now}-study`,
        type: 'output',
        text: `STUDY:     ${profileData.degree} @ ${profileData.institution}`,
      });
      newLogs.push({
        id: `${now}-loc`,
        type: 'output',
        text: `LOCATION:  ${profileData.location} [${profileData.timezone}]`,
      });
      newLogs.push({
        id: `${now}-status`,
        type: 'info',
        text: `STATUS:    ${profileData.status}`,
      });
      newLogs.push({
        id: `${now}-bio`,
        type: 'output',
        text: `SUMMARY:   ${profileData.summary}`,
      });
      newLogs.push({
        id: `${now}-links`,
        type: 'info',
        text: `PROFILE:   ${profileData.contact.github} • ${profileData.contact.linkedin}`,
      });
    } else if (clean === 'projects' || clean === 'ls' || clean === 'ls projects' || clean === 'dir') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: `ACTIVE SYSTEMS & ARCHITECTURAL LEDGER (${projects.length}):`,
      });
      newLogs.push({
        id: `${now}-div1`,
        type: 'info',
        text: '------------------------------------------------------------------------',
      });

      projects.forEach((p, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const metric = p.metric.value.padEnd(12, ' ');
        const stack = p.environment.slice(0, 3).join(', ');

        newLogs.push({
          id: `${now}-p${idx}-head`,
          type: 'output',
          text: `[${num}] ${p.title.padEnd(15, ' ')} ${metric} [${p.status}]`,
        });
        newLogs.push({
          id: `${now}-p${idx}-stack`,
          type: 'info',
          text: `     Stack: ${stack}`,
        });
        newLogs.push({
          id: `${now}-p${idx}-desc`,
          type: 'info',
          text: `     Desc:  ${p.shortDescription}`,
        });
        const targetUrl = p.liveUrl || p.repository || p.githubUrl;
        if (targetUrl) {
          newLogs.push({
            id: `${now}-p${idx}-link`,
            type: 'info',
            text: `     Link:  ${targetUrl.replace(/^https?:\/\//, '')}`,
          });
        }
      });

      newLogs.push({
        id: `${now}-div2`,
        type: 'info',
        text: '------------------------------------------------------------------------',
      });
      newLogs.push({
        id: `${now}-tip`,
        type: 'warn',
        text: "Tip: Run 'works' or click 'Table [T]' to inspect full interactive metrics.",
      });
    } else if (clean === 'skills' || clean === 'stack' || clean === 'tech') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: 'CORE ARCHITECTURE & TECHNICAL STACK:',
      });
      newLogs.push({
        id: `${now}-div1`,
        type: 'info',
        text: '------------------------------------------------------------------------',
      });
      newLogs.push({
        id: `${now}-s1`,
        type: 'output',
        text: `Languages:  ${profileData.skills.languages.join(', ')}`,
      });
      newLogs.push({
        id: `${now}-s2`,
        type: 'output',
        text: `Systems:    ${profileData.skills.systems.join(', ')}`,
      });
      newLogs.push({
        id: `${now}-s3`,
        type: 'output',
        text: `Frontend:   ${profileData.skills.frontend.join(', ')}`,
      });
      newLogs.push({
        id: `${now}-s4`,
        type: 'output',
        text: `Backend:    ${profileData.skills.backend.join(', ')}`,
      });
      newLogs.push({
        id: `${now}-s5`,
        type: 'output',
        text: `Tooling/OS: ${profileData.skills.tools.join(', ')}`,
      });
      newLogs.push({
        id: `${now}-div2`,
        type: 'info',
        text: '------------------------------------------------------------------------',
      });
      newLogs.push({
        id: `${now}-cw`,
        type: 'info',
        text: `Coursework: ${profileData.coursework.slice(0, 5).join(' • ')}`,
      });
    } else if (clean === 'contact' || clean === 'hire' || clean === 'email' || clean === 'cd /contact' || clean === 'cd contact') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: 'DIRECT COMMUNICATIONS & RECRUITER DISPATCH:',
      });
      newLogs.push({
        id: `${now}-div1`,
        type: 'info',
        text: '------------------------------------------------------------------------',
      });
      newLogs.push({
        id: `${now}-c1`,
        type: 'output',
        text: `Email:       ${profileData.contact.email}`,
      });
      newLogs.push({
        id: `${now}-c2`,
        type: 'output',
        text: `GitHub:      https://${profileData.contact.github}`,
      });
      newLogs.push({
        id: `${now}-c3`,
        type: 'output',
        text: `LinkedIn:    https://linkedin.com/${profileData.contact.linkedin}`,
      });
      newLogs.push({
        id: `${now}-c4`,
        type: 'output',
        text: `Location:    ${profileData.contact.location} (${profileData.contact.timezone})`,
      });
      newLogs.push({
        id: `${now}-c5`,
        type: 'info',
        text: `Turnaround:  Response guaranteed ${profileData.contact.responseWindow}`,
      });
      newLogs.push({
        id: `${now}-div2`,
        type: 'info',
        text: '------------------------------------------------------------------------',
      });
      newLogs.push({
        id: `${now}-tip`,
        type: 'warn',
        text: "Tip: Type 'cd /contact' to launch direct message transmission interface.",
      });

      if (clean === 'hire' || clean === 'cd /contact') {
        setTimeout(() => onNavigate('/contact'), 500);
      }
    } else if (clean === 'works' || clean === 'cd /works') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: 'Navigating to Selected Architectural Works...',
      });
      setTimeout(() => onNavigate('/works'), 350);
    } else if (clean === 'clear' || clean === 'cls') {
      setLogs([
        {
          id: `${now}-clr`,
          type: 'info',
          text: `${profileData.handle}@node-dhaka ~ console cleared. Ready for input.`,
        },
      ]);
      setInputVal('');
      return;
    } else if (clean === 'help') {
      newLogs.push({
        id: `${now}-help`,
        type: 'info',
        text: 'Available Commands: whoami, projects, skills, contact, works, clear, help',
      });
    } else {
      newLogs.push({
        id: `${now}-err`,
        type: 'warn',
        text: `Command not recognized: "${clean}". Try: whoami, projects, skills, contact, clear.`,
      });
    }

    setLogs(newLogs);
    setInputVal('');
    requestAnimationFrame(() => {
      if (outputContainerRef.current) {
        outputContainerRef.current.scrollTop = outputContainerRef.current.scrollHeight;
      }
    });
  };

  return (
    <div className={styles.sandboxContainer} data-lenis-prevent="true">
      {/* Top Window Bar */}
      <div className={styles.windowHeader}>
        <div className={styles.windowControls}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
          <span className={styles.windowTitle}>{profileData.handle}@node-dhaka ~ /workspace</span>
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
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
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
              <span className={styles.tcSub}>{profileData.timezone}</span>
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
              <h4 className={styles.matrixTitle}>{profileData.name}</h4>
              <span className={styles.matrixSub}>{profileData.degree}</span>
            </div>
            <span className={styles.matrixBadge}>{profileData.institution.toUpperCase()}</span>
          </div>

          <div className={styles.matrixList}>
            <div className={styles.matrixItem}>
              <span className={styles.miBullet}>01</span>
              <div>
                <span className={styles.miTitle}>{profileData.institution}</span>
                <span className={styles.miDesc}>{profileData.degree}</span>
              </div>
            </div>
            {profileData.distinctions.map((d, i) => (
              <div key={d.title + d.year} className={styles.matrixItem}>
                <span className={styles.miBullet}>{String(i + 2).padStart(2, '0')}</span>
                <div>
                  <span className={styles.miTitle}>{d.title}</span>
                  <span className={styles.miDesc}>{d.level} ({d.year})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
