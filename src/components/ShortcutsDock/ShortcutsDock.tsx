import { useEffect, useState } from 'react';
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

  const shortcuts: ShortcutDef[] = [
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
        window.dispatchEvent(new CustomEvent('set-view-mode', { detail: 'grid' }));
        sound.playClick(650, 0.02, 0.06);
      },
    },
    {
      keyId: 't',
      displayKey: 'T',
      label: 'Table',
      onTrigger: () => {
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
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const key = e.key.toLowerCase();
      if (['k', 'g', 't', 'm', 'd'].includes(key)) {
        setActiveKeys((prev) => ({ ...prev, [key]: true }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['k', 'g', 't', 'm', 'd'].includes(key)) {
        setActiveKeys((prev) => ({ ...prev, [key]: false }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <aside className={styles.dockContainer} aria-label="Keyboard Shortcuts Micro-Dock">
      <div className={styles.dockLabel}>HUD</div>
      {shortcuts.map((s) => {
        const isActive = activeKeys[s.keyId];
        return (
          <button
            key={s.keyId}
            type="button"
            className={styles.shortcutItem}
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
