import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { sound } from '../../utils/audio';
import styles from './CommandPalette.module.css';

export interface CommandItem {
  id: string;
  category: 'Navigation' | 'Systems & Case Studies' | 'Controls & Preferences' | 'Direct Actions';
  title: string;
  subtitle?: string;
  badge?: string;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject?: (projectId: string) => void;
  onToggleTheme?: () => void;
  onToggleSound?: () => void;
  onToggleView?: (view: 'grid' | 'table') => void;
  onOpenSysCheck?: () => void;
  currentTheme?: 'dark' | 'light';
  isSoundActive?: boolean;
}

export function CommandPalette({
  isOpen,
  onClose,
  onSelectProject,
  onToggleTheme,
  onToggleSound,
  onToggleView,
  onOpenSysCheck,
  currentTheme = 'dark',
  isSoundActive = true,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = useMemo(() => [
    {
      id: 'nav-works',
      category: 'Navigation',
      title: 'Jump to Curated Systems & Countermeasures',
      subtitle: 'Browser internals, AST unmasking, systems engineering',
      shortcut: '1',
      action: () => {
        document.getElementById('engineering')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'nav-foundation',
      category: 'Navigation',
      title: 'Jump to Engineering Foundation & CS Rigor',
      subtitle: 'East West University, Board Merit scholarships, core coursework',
      shortcut: '2',
      action: () => {
        document.getElementById('foundation')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'nav-contact',
      category: 'Navigation',
      title: 'Jump to Direct Communication Dispatch',
      subtitle: 'Initiate email, check UTC+6 availability window',
      shortcut: '3',
      action: () => {
        document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'inspect-purefeed',
      category: 'Systems & Case Studies',
      title: 'Inspect PureFeed Architecture',
      subtitle: 'Chromium MV3 Main-World Bridge & anti-adblock countermeasures',
      badge: '<16ms Latency',
      action: () => onSelectProject?.('purefeed'),
    },
    {
      id: 'inspect-focusguard',
      category: 'Systems & Case Studies',
      title: 'Inspect FocusGuard Architecture',
      subtitle: 'Multi-layer Windows Registry & OS-level hosts DNS sinkhole',
      badge: '580+ Hosts',
      action: () => onSelectProject?.('focusguard'),
    },
    {
      id: 'inspect-rannabanna',
      category: 'Systems & Case Studies',
      title: 'Inspect Rannabanna Heuristic Engine',
      subtitle: 'Non-linear Bengali cooking scaling & SQLite matchmaking',
      badge: '0.8ms SQL',
      action: () => onSelectProject?.('rannabanna'),
    },
    {
      id: 'inspect-doclensbd',
      category: 'Systems & Case Studies',
      title: 'Inspect DocLensBD Optical Try-On',
      subtitle: 'MediaPipe 468-point 3D Face Mesh client-side virtual try-on',
      badge: '60 FPS',
      action: () => onSelectProject?.('doclensbd'),
    },
    {
      id: 'inspect-poshra',
      category: 'Systems & Case Studies',
      title: 'Inspect POSHRA Commerce Architecture',
      subtitle: 'Next.js 16 App Router, Zod validation, SSLCommerz regional payment',
      badge: 'Zod Safe',
      action: () => onSelectProject?.('poshra'),
    },
    {
      id: 'inspect-portfolio',
      category: 'Systems & Case Studies',
      title: 'Inspect Sentinel Portfolio Architecture',
      subtitle: 'Canvas coordinate grid, Web Audio synthesizer, zero deadspace',
      badge: '60 FPS / 0.4s',
      action: () => onSelectProject?.('myportfolio'),
    },
    {
      id: 'view-grid',
      category: 'Controls & Preferences',
      title: 'Switch View: Packed Bento Grid Mode',
      subtitle: 'Interactive 3D tilt cards with telemetry and AST code peeks',
      shortcut: 'G',
      action: () => onToggleView?.('grid'),
    },
    {
      id: 'view-table',
      category: 'Controls & Preferences',
      title: 'Switch View: Data Ledger Table Mode',
      subtitle: 'High-density sortable systems engineering matrix (Brian Lovin style)',
      shortcut: 'T',
      action: () => onToggleView?.('table'),
    },
    {
      id: 'toggle-sound',
      category: 'Controls & Preferences',
      title: isSoundActive ? 'Mute Tactile Web Audio Synthesizer' : 'Enable Tactile Web Audio Synthesizer',
      subtitle: 'Oscillator click, chirp, and drawer frequency synthesizers',
      shortcut: 'M',
      badge: isSoundActive ? 'Active' : 'Muted',
      action: () => onToggleSound?.(),
    },
    {
      id: 'toggle-theme',
      category: 'Controls & Preferences',
      title: currentTheme === 'dark' ? 'Switch to Studio Light Theme' : 'Switch to Obsidian Dark Theme',
      subtitle: 'Architectural high-contrast technical aesthetic',
      shortcut: 'D',
      badge: currentTheme.toUpperCase(),
      action: () => onToggleTheme?.(),
    },
    {
      id: 'action-cv',
      category: 'Direct Actions',
      title: 'Download Verified Résumé (PDF)',
      subtitle: 'Print-ready engineering credentials and project verification',
      shortcut: 'R',
      action: () => {
        window.open('/resume.pdf', '_blank', 'noopener,noreferrer');
      },
    },
    {
      id: 'action-copy-email',
      category: 'Direct Actions',
      title: 'Copy Primary Email Address',
      subtitle: 'armabdur.rahman04@gmail.com (Instant clipboard copy)',
      shortcut: 'C',
      action: () => {
        navigator.clipboard.writeText('armabdur.rahman04@gmail.com');
        sound.playChirp(700, 1100, 0.05, 0.06);
      },
    },
    {
      id: 'action-github',
      category: 'Direct Actions',
      title: 'Open GitHub Engineering Workspace',
      subtitle: 'github.com/watchknight (Full repository codebases)',
      shortcut: 'H',
      action: () => {
        window.open('https://github.com/watchknight', '_blank', 'noopener,noreferrer');
      },
    },
    {
      id: 'run-sys-check',
      category: 'Direct Actions',
      title: 'Run Automated Hardware & Runtime Diagnostic Suite',
      subtitle: 'Live Web Audio sweep, Canvas 60 FPS, Edge latency RTT benchmark',
      shortcut: 'S',
      badge: 'Benchmark',
      action: () => {
        onClose();
        if (onOpenSysCheck) {
          onOpenSysCheck();
        } else {
          window.dispatchEvent(new CustomEvent('open-sys-diagnostic'));
        }
      },
    },
  ], [currentTheme, isSoundActive, onClose, onOpenSysCheck, onSelectProject, onToggleSound, onToggleTheme, onToggleView]);

  const filteredCommands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q) ||
        (c.shortcut && c.shortcut.toLowerCase() === q)
    );
  }, [commands, query]);

  const handleClose = useCallback(() => {
    setQuery('');
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      sound.playDrawer();
      setTimeout(() => inputRef.current?.focus(), 40);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
        sound.playTick();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
        sound.playClick(600, 0.015, 0.04);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
        sound.playClick(650, 0.015, 0.04);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          handleClose();
          sound.playClick(850, 0.03, 0.08);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, handleClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={handleClose} role="dialog" aria-modal="true" aria-label="Command Deck">
      <div className={styles.palette} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Bar */}
        <div className={styles.searchBar}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.searchInput}
            placeholder="Type a command or search systems... (Esc to close)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            aria-autocomplete="list"
          />
          <kbd className={styles.escKey}>ESC</kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className={styles.resultsList} role="listbox">
          {filteredCommands.length === 0 ? (
            <div className={styles.noResults}>No commands matching &quot;{query}&quot;</div>
          ) : (
            filteredCommands.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  className={`${styles.commandItem} ${isSelected ? styles.selected : ''}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => {
                    item.action();
                    handleClose();
                    sound.playClick(850, 0.03, 0.08);
                  }}
                  role="option"
                  aria-selected={isSelected}
                  data-cursor="link"
                >
                  <div className={styles.itemLeft}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    {item.subtitle && <span className={styles.itemSubtitle}>{item.subtitle}</span>}
                  </div>

                  <div className={styles.itemRight}>
                    {item.badge && <span className={styles.badge}>{item.badge}</span>}
                    {item.shortcut && <kbd className={styles.shortcutKey}>{item.shortcut}</kbd>}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Hotkey Legend */}
        <footer className={styles.paletteFooter}>
          <div className={styles.footerHints}>
            <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
            <span><kbd>↵</kbd> Select</span>
            <span><kbd>ESC</kbd> Close</span>
          </div>
          <span className={styles.footerNode}>DHAKA_NODE // ACTIVE</span>
        </footer>
      </div>
    </div>
  );
}
