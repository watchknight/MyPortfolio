export interface PreviewRegisterOptions {
  start?: () => void;
  stop?: () => void;
  auto?: boolean;
}

export interface PreviewManagerInstance {
  register(el: HTMLElement | null, options?: PreviewRegisterOptions): () => void;
  start(el: HTMLElement | null): void;
  stop(el: HTMLElement | null): void;
  stopAll(): void;
  isRunning(el: HTMLElement | null): boolean;
}

export declare const previews: PreviewManagerInstance;
export default previews;
