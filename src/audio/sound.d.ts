export interface SoundState {
  on: boolean;
  armed: boolean;
  volume: number;
  ambient: boolean;
}

export interface SoundVoiceOpts {
  note?: number;
  when?: number;
  x?: number;
  vel?: number;
  dur?: number;
  degree?: number;
  dir?: number;
  on?: boolean;
}

export declare function initSound(): void;

export declare const sound: {
  readonly state: SoundState;
  subscribe(fn: (state: SoundState) => void): () => void;
  toggle(): Promise<boolean> | false;
  enable(opts?: { quiet?: boolean }): Promise<boolean>;
  disable(): void;
  setVolume(v: number): void;
  setAmbient(on: boolean): void;
  play(name: 'pluck' | 'tick' | 'thump' | 'swish' | 'key' | 'chime' | 'toggle' | string, opts?: SoundVoiceOpts): void;
  section(name: string): void;
  theme(name: 'dark' | 'light'): void;
  pointer(x?: number): void;
  ink: {
    start(y?: number): void;
    move(y?: number, speed?: number): void;
    end(): void;
  };
  levels(n?: number): number[] | null;
  readonly voices: number;
  readonly introCount: number;
  readonly ctx: AudioContext | null;
};
