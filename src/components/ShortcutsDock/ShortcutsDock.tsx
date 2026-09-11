import { useEffect, useMemo, useState } from 'react';
import { sound } from '../../utils/audio';
import styles from './ShortcutsDock.module.css';

interface ShortcutDef {
  keyId: string;
  displayKey: string;
  label: string;
  onTrigger: () => void;
}

export function ShortcutsDock() {
  const [activeKeys, setActiveKeys] = useState<Record<string, boolean>>({});
  const [currentViewMode, setCurrentViewMode] = useState<'grid' | 'table'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('view_mode') as 'grid' | 'table') || 'grid';
    }
    return 'grid';
  });

  useEffect(() => {
    const handleView = (e: Event) => {
      const custom = e as CustomEvent<'grid' | 'table'>;
      if (custom.detail) {
        setCurrentViewMode(custom.detail);
        localStorage.setItem('view_mode', custom.detail);
      }
    };
    window.addEventListener('set-view-mode', handleView);
    return () => window.removeEventListener('set-view-mode', handleView);
  }, []);

  const shortcuts: ShortcutDef[] = useMemo(
    () => [
      {
        keyId: 'k',
        displayKey: '⌘K',
        label: 'Deck',
        onTrigger: () => {
          window.dispatchEvent(new CustomEvent('toggle-command-palette'));
          sound.playDrawer();
        },
      },
      {
        keyId: 'g',
        displayKey: 'G',
        label: 'Grid',
        onTrigger: () => {
          setCurrentViewMode('grid');
          localStorage.setItem('view_mode', 'grid');
          window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'grid' }));
          sound.playClick(650, 0.02, 0.06);
        },
      },
      {
        keyId: 't',
        displayKey: 'T',
        label: 'Table',
        onTrigger: () => {
          setCurrentViewMode('table');
          localStorage.setItem('view_mode', 'table');
          window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'table' }));
          sound.playClick(720, 0.02, 0.06);
        },
      },
      {
        keyId: 'm',
        displayKey: 'M',
        label: 'Mute',
        onTrigger: () => {
          const next = sound.toggle();
          sound.playClick(next ? 800 : 400, 0.03, 0.07);
        },
      },
      {
        keyId: 'd',
        displayKey: 'D',
        label: 'Theme',
        onTrigger: () => {
          const currentTheme = document.documentElement.getAttribute('data-theme');
          const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
          document.documentElement.setAttribute('data-theme', nextTheme);
          localStorage.setItem('theme', nextTheme);
          sound.playChirp(400, 800, 0.03, 0.05);
        },
      },
      {
        keyId: 's',
        displayKey: 'S',
        label: 'Sys',
        onTrigger: () => {
          window.dispatchEvent(new CustomEvent('open-sys-diagnostic'));
          sound.playChirp(500, 900, 0.04, 0.06);
        },
      },
      {
        keyId: 'f',
        displayKey: 'F',
        label: 'Grain',
        onTrigger: () => {
          const isGrain = document.documentElement.getAttribute('data-grain') === 'true';
          const next = !isGrain;
          document.documentElement.setAttribute('data-grain', next ? 'true' : 'false');
          localStorage.setItem('grain', next ? 'true' : 'false');
          sound.playChirp(600, 300, 0.03, 0.05);
        },
      },
    ],
    []
  );

  useEffect(() => {
    // Restore grain preference
    const savedGrain = localStorage.getItem('grain');
    if (savedGrain === 'true') {
      document.documentElement.setAttribute('data-grain', 'true');
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (['k', 'g', 't', 'm', 'd', 's', 'f'].includes(key)) {
        setActiveKeys((prev) => ({ ...prev, [key]: true }));
        const match = shortcuts.find((s) => s.keyId === key);
        if (match && key !== 'k') { // 'k' handled by command palette listener
          match.onTrigger();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['k', 'g', 't', 'm', 'd', 's', 'f'].includes(key)) {
        setActiveKeys((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [shortcuts]);

  return (
    <aside className={styles.dockContainer} aria-label="Keyboard Shortcuts Micro-Dock">
      <div className={styles.dockLabel}>HUD</div>
      {shortcuts.map((s) => {
        const isPressed = activeKeys[s.keyId];
        const isViewActive =
          (s.keyId === 'g' && currentViewMode === 'grid') ||
          (s.keyId === 't' && currentViewMode === 'table');
        const isActive = isPressed || isViewActive;

        return (
          <button
            key={s.keyId}
            type="button"
            className={`${styles.shortcutItem} ${isViewActive ? styles.shortcutItemActive : ''}`}
            onClick={s.onTrigger}
            title={`Trigger ${s.label} (${s.displayKey})`}
          >
            <span className={`${styles.keyCap} ${isActive ? styles.keyCapActive : ''}`}>
              {s.displayKey}
            </span>
            <span className={styles.shortcutName}>{s.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
