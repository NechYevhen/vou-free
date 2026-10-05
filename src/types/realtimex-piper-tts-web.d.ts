declare module '@realtimex/piper-tts-web' {
  interface TtsSessionConfig {
    voiceId: string;
  }

  interface TtsSession {
    predict(text: string): Promise<Blob>;
  }

  export const TtsSession: {
    create(config: TtsSessionConfig): Promise<TtsSession>;
  };
}
