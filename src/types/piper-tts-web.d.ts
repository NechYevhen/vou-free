declare module '@mintplex-labs/piper-tts-web' {
  interface ProgressInfo {
    loaded: number;
    total: number;
    url?: string;
  }

  type ProgressCallback = (progress: ProgressInfo) => void;

  interface PredictOptions {
    text: string;
    voiceId: string;
  }

  export function predict(
    options: PredictOptions,
    onProgress?: ProgressCallback
  ): Promise<Blob>;

  export function download(
    voiceId: string,
    onProgress?: ProgressCallback
  ): Promise<void>;

  export function stored(): Promise<string[]>;

  export function remove(voiceId: string): Promise<void>;

  export function flush(): Promise<void>;

  export function voices(): Promise<Record<string, {
    key: string;
    language: string;
    gender: string;
    name: string;
  }>>;
}
