// Web Audio API Synthesizer - Refactored to Phase S2 Engine
// Delegates to src/audio/sound.js (procedural D/F pentatonic synthesis)
import { sound as engineSound, initSound as engineInitSound, type SoundState } from '../audio/sound.js';

export { engineInitSound as initSound };

export function migrateOldSoundStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToCheck = ['sound_enabled', 'mute', 'muted', 'sound_muted'];
    let detectedMuted: boolean | null = null;

    for (const key of keysToCheck) {
      const val = localStorage.getItem(key);
      if (val !== null) {
        if (key === 'sound_enabled') {
          if (val === 'false' || val === '0' || val === 'muted') {
            detectedMuted = true;
          } else if (val === 'true' || val === '1') {
            if (detectedMuted === null) detectedMuted = false;
          }
        } else {
          // 'mute', 'muted', 'sound_muted'
          if (val === 'true' || val === '1' || val === 'muted' || val === 'yes') {
            detectedMuted = true;
          } else if (val === 'false' || val === '0' || val === 'unmuted' || val === 'no') {
            if (detectedMuted === null) detectedMuted = false;
          }
        }
        localStorage.removeItem(key);
      }
    }

    if (detectedMuted !== null && localStorage.getItem('sound') === null) {
      localStorage.setItem('sound', detectedMuted ? 'off' : 'on');
    }
  } catch {
    // Private mode protection
  }
}

export const sound = {
  get state(): SoundState {
    return engineSound.state;
  },
  subscribe(fn: (state: SoundState) => void): () => void {
    return engineSound.subscribe(fn);
  },
  toggle(): Promise<boolean> | false {
    return engineSound.toggle();
  },
  enable(opts?: { quiet?: boolean }): Promise<boolean> {
    return engineSound.enable(opts);
  },
  disable(): void {
    return engineSound.disable();
  },
  setVolume(v: number): void {
    engineSound.setVolume(v);
  },
  setAmbient(on: boolean): void {
    engineSound.setAmbient(on);
  },
  play(name: 'pluck' | 'tick' | 'thump' | 'swish' | 'key' | 'chime' | 'toggle' | string, opts?: any): void {
    engineSound.play(name, opts);
  },
  section(name: string): void {
    engineSound.section(name);
  },
  theme(name: 'dark' | 'light'): void {
    engineSound.theme(name);
  },
  pointer(x: number = 0.5): void {
    engineSound.pointer(x);
  },
  ink: engineSound.ink,
  levels(n?: number): number[] | null {
    return engineSound.levels(n);
  },

  // Backward compatibility shims for existing call sites during migration
  isEnabled(): boolean {
    const s = engineSound.state;
    return s.on || s.armed;
  },
  playClick(_freq?: number, _duration?: number, _volume?: number): void {
    engineSound.play('tick');
  },
  playDrawer(): void {
    engineSound.play('swish');
  },
  playChirp(_startFreq?: number, _endFreq?: number, _duration?: number, _volume?: number): void {
    engineSound.play('chime');
  },
  playTick(): void {
    engineSound.play('tick');
  },
};
