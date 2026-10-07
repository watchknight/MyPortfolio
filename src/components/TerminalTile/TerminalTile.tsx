import { useState, useRef } from 'react';
import { sound } from '../../utils/audio';
import { projects } from '../../data/projects';
import { profileData } from '../../data/profile';
import styles from './TerminalTile.module.css';

interface TerminalLog {
  id: string;
  type: 'cmd' | 'output' | 'success' | 'warn' | 'info';
  text: string;
}

interface TerminalTileProps {
  onNavigate: (path: string) => void;
}

export function TerminalTile({ onNavigate }: TerminalTileProps) {
  const [inputVal, setInputVal] = useState('');
  const outputContainerRef = useRef<HTMLDivElement>(null);

  const [logs, setLogs] = useState<TerminalLog[]>([
    { id: '1', type: 'info', text: 'DHAKA_SENTINEL_NODE // v2.4.0-PROD INITIALIZED' },
    { id: '2', type: 'output', text: 'Type a command or click a quick action below:' },
  ]);

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
    } else if (clean === 'projects' || clean === 'ls' || clean === 'dir') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: `ACTIVE SYSTEMS & ARCHITECTURAL LEDGER (${projects.length}):`,
      });
      projects.forEach((p, idx) => {
        const num = String(idx + 1).padStart(2, '0');
        const metric = p.metric.value.padEnd(12, ' ');
        newLogs.push({
          id: `${now}-p${idx}`,
          type: 'output',
          text: `[${num}] ${p.title.padEnd(14, ' ')} ${metric} [${p.status}]`,
        });
      });
    } else if (clean === 'skills' || clean === 'stack' || clean === 'tech') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: 'CORE ARCHITECTURE & TECHNICAL STACK:',
      });
      newLogs.push({
        id: `${now}-s1`,
        type: 'output',
        text: `Languages:  ${profileData.skills.languages.slice(0, 5).join(', ')}`,
      });
      newLogs.push({
        id: `${now}-s2`,
        type: 'output',
        text: `Frontend:   ${profileData.skills.frontend.slice(0, 4).join(', ')}`,
      });
      newLogs.push({
        id: `${now}-s3`,
        type: 'output',
        text: `Backend:    ${profileData.skills.backend.slice(0, 4).join(', ')}`,
      });
    } else if (clean === 'contact' || clean === 'hire' || clean === 'email') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: `Email:       ${profileData.contact.email}`,
      });
      newLogs.push({
        id: `${now}-c1`,
        type: 'info',
        text: `Turnaround:  Response guaranteed ${profileData.contact.responseWindow}`,
      });
      if (clean === 'hire') {
        setTimeout(() => onNavigate('/contact'), 500);
      }
    } else if (clean === 'works' || clean === 'cd /works') {
      newLogs.push({
        id: `${now}-out`,
        type: 'success',
        text: 'Navigating to Selected Works...',
      });
      setTimeout(() => onNavigate('/works'), 350);
    } else if (clean === 'clear' || clean === 'cls') {
      setLogs([
        {
          id: `${now}-clr`,
          type: 'info',
          text: `${profileData.handle}@node-dhaka ~ console ready.`,
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
    <div className={styles.terminalContainer}>
      {/* Top Window Bar */}
      <div className={styles.windowHeader}>
        <div className={styles.macControls}>
          <span className={`${styles.dot} ${styles.dotRed}`} />
          <span className={`${styles.dot} ${styles.dotYellow}`} />
          <span className={`${styles.dot} ${styles.dotGreen}`} />
        </div>
        <span className={styles.windowTitle}>{profileData.handle}@node-dhaka ~ /workspace</span>
        <span className={styles.windowBadge}>BASH 5.2</span>
      </div>

      {/* Terminal Output */}
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
          <span className={styles.quickLabel}>RUN:</span>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => handleRunCommand('whoami')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            whoami
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => handleRunCommand('projects')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            projects
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => handleRunCommand('skills')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            skills
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => handleRunCommand('contact')}
            data-cursor="link"
            data-magnetic="0.3"
          >
            contact
          </button>
          <button
            type="button"
            className={styles.quickChip}
            onClick={() => handleRunCommand('clear')}
            data-cursor="link"
            data-magnetic="0.3"
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
            placeholder="Type command (whoami, projects, clear)..."
            aria-label="Terminal command input"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-cursor="hide"
          />
          <button
            type="submit"
            className={styles.execBtn}
            aria-label="Run command"
            data-cursor="link"
            data-magnetic="0.3"
          >
            ↵
          </button>
        </form>
      </div>
    </div>
  );
}
