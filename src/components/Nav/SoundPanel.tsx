import React, { useState, useEffect } from 'react';
import { sound } from '../../utils/audio';
import styles from './SoundPanel.module.css';

interface SoundPanelProps {
  isMobile?: boolean;
}

export function SoundPanel({ isMobile = false }: SoundPanelProps) {
  const [soundState, setSoundState] = useState(() => sound.state);

  useEffect(() => {
    return sound.subscribe((s) => {
      setSoundState(s);
    });
  }, []);

  const isSoundActive = soundState.on || soundState.armed;

  const handleToggleSound = () => {
    sound.toggle();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    sound.setVolume(val / 100);
  };

  const handleToggleAmbient = () => {
    const next = !soundState.ambient;
    sound.setAmbient(next);
    sound.play('toggle', { on: next });
  };


  const handlePlayVoice = (voice: string) => {
    if (!soundState.on) return;
    if (voice === 'keys') {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => {
          sound.play('key');
        }, i * 70);
      }
    } else {
      sound.play(voice);
    }
  };

  const chips = [
    { label: 'Tick', voice: 'tick' },
    { label: 'Thump', voice: 'thump' },
    { label: 'Pluck', voice: 'pluck' },
    { label: 'Swish', voice: 'swish' },
    { label: 'Keys', voice: 'keys' },
    { label: 'Chime', voice: 'chime' },
  ];

  const volumePercent = Math.round(soundState.volume * 100);

  return (
    <div className={styles.soundPanel} data-sound-panel>
      {/* 1. Master Sound Switch */}
      <div className={styles.controlRow}>
        <div className={styles.controlInfo}>
          <span className={styles.controlLabel}>{isMobile ? 'Sound Effects' : 'Sound'}</span>
          {!isMobile && <span className={styles.controlShortcut}>M</span>}
        </div>
        <button
          type="button"
          data-sound-toggle
          className={`${styles.switchBtn} ${isSoundActive ? styles.switchBtnActive : ''}`}
          onClick={handleToggleSound}
          aria-pressed={isSoundActive}
          aria-label={isSoundActive ? 'Mute sound effects' : 'Enable sound effects'}
          data-cursor="link"
        >
          <span className={styles.switchKnob} />
          <span className={styles.switchStateText}>{isSoundActive ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 2. Master Volume Slider */}
      <div className={styles.volumeRow}>
        <div className={styles.volumeHeader}>
          <label htmlFor={`vol-range-${isMobile ? 'mobile' : 'desktop'}`} className={styles.controlLabel}>
            Master Volume
          </label>
          <span className={styles.volumePercent}>{volumePercent}%</span>
        </div>
        <input
          id={`vol-range-${isMobile ? 'mobile' : 'desktop'}`}
          type="range"
          min="0"
          max="100"
          step="5"
          value={volumePercent}
          onChange={handleVolumeChange}
          className={styles.volumeSlider}
          aria-label="Master volume"
        />
      </div>

      {/* 3. Ambient Switch */}
      <div className={styles.controlRow}>
        <div className={styles.controlInfo}>
          <span className={styles.controlLabel}>Ambient Pad</span>
          <span className={styles.controlSubLabel}>Pentatonic drone</span>
        </div>
        <button
          type="button"
          className={`${styles.switchBtn} ${soundState.ambient ? styles.switchBtnActive : ''}`}
          onClick={handleToggleAmbient}
          aria-pressed={soundState.ambient}
          aria-label="Toggle ambient pad"
          data-cursor="link"
        >
          <span className={styles.switchKnob} />
          <span className={styles.switchStateText}>{soundState.ambient ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 4. Preview Chips */}
      <div className={styles.chipsSection}>
        <span className={styles.chipsLabel}>Preview Audio</span>
        <div className={styles.chipsGrid}>
          {chips.map(({ label, voice }) => (
            <div
              key={voice}
              className={styles.chipWrapper}
              tabIndex={!soundState.on ? 0 : undefined}
              aria-label={!soundState.on ? `${label} (disabled: turn sound on to preview)` : undefined}
            >
              <button
                type="button"
                className={styles.previewChip}
                disabled={!soundState.on}
                tabIndex={!soundState.on ? -1 : undefined}
                onClick={() => handlePlayVoice(voice)}
                aria-label={!soundState.on ? `${label} (disabled: turn sound on to preview)` : `Preview ${label}`}
                data-cursor="link"
              >
                {label}
              </button>
              {!soundState.on && (
                <span className={styles.chipTooltip} role="tooltip">
                  Turn sound on to preview
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
