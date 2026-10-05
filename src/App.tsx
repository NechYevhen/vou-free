import { useState, useRef, useCallback, useEffect } from 'react';

interface Voice {
  id: string;
  name: string;
  lang: string;
  gender: string;
}

const PIPER_VOICES: Voice[] = [
  { id: 'en_US-amy-medium', name: 'Amy', lang: 'en-US', gender: 'female' },
  { id: 'en_US-hfc_female-medium', name: 'HFC Female', lang: 'en-US', gender: 'female' },
  { id: 'en_US-lessac-medium', name: 'Lessac', lang: 'en-US', gender: 'female' },
  { id: 'en_US-ryan-medium', name: 'Ryan', lang: 'en-US', gender: 'male' },
  { id: 'en_GB-alan-medium', name: 'Alan', lang: 'en-GB', gender: 'male' },
  { id: 'en_GB-alba-medium', name: 'Alba', lang: 'en-GB', gender: 'female' },
  { id: 'de_DE-thorsten-medium', name: 'Thorsten', lang: 'de-DE', gender: 'male' },
  { id: 'de_DE-eva_k-x_low', name: 'Eva K.', lang: 'de-DE', gender: 'female' },
  { id: 'fr_FR-siwis-medium', name: 'Siwis', lang: 'fr-FR', gender: 'female' },
  { id: 'es_ES-davefx-medium', name: 'DaveFX', lang: 'es-ES', gender: 'male' },
  { id: 'es_ES-sharvard-medium', name: 'Sharvard', lang: 'es-ES', gender: 'male' },
  { id: 'it_IT-riccardo-x_low', name: 'Riccardo', lang: 'it-IT', gender: 'male' },
  { id: 'pt_BR-edresson-low', name: 'Edresson', lang: 'pt-BR', gender: 'male' },
  { id: 'pl_PL-gosia-medium', name: 'Gosia', lang: 'pl-PL', gender: 'female' },
  { id: 'pl_PL-darkman-medium', name: 'Darkman', lang: 'pl-PL', gender: 'male' },
  { id: 'uk_UA-lada-x_low', name: 'Lada', lang: 'uk-UA', gender: 'female' },
  { id: 'uk_UA-ukrainian_tts-medium', name: 'Ukrainian TTS (3 голоси)', lang: 'uk-UA', gender: 'female' },
  { id: 'ru_RU-denis-medium', name: 'Denis', lang: 'ru-RU', gender: 'male' },
  { id: 'ru_RU-irina-medium', name: 'Irina', lang: 'ru-RU', gender: 'female' },
  { id: 'zh_CN-huayan-medium', name: '华燕 (Huayan)', lang: 'zh-CN', gender: 'female' },
];

const LANG_NAMES: Record<string, string> = {
  'en-US': '🇺🇸 English (US)',
  'en-GB': '🇬🇧 English (UK)',
  'de-DE': '🇩🇪 Deutsch',
  'fr-FR': '🇫🇷 Français',
  'es-ES': '🇪🇸 Español',
  'it-IT': '🇮🇹 Italiano',
  'pt-BR': '🇧🇷 Português (BR)',
  'pl-PL': '🇵🇱 Polski',
  'uk-UA': '🇺🇦 Українська',
  'ru-RU': '🇷🇺 Русский',
  'zh-CN': '🇨🇳 中文',
};

function App() {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('uk_UA-lada-x_low');
  const [selectedLang, setSelectedLang] = useState('uk-UA');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [ttsModule, setTtsModule] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const loadModule = async () => {
      try {
        const tts = await import('@realtimex/piper-tts-web');
        setTtsModule(tts);
      } catch (err) {
        console.error('Failed to load TTS module:', err);
        setError('Не вдалося завантажити модуль TTS. Переконайтеся, що ваш браузер підтримує WebAssembly.');
      }
    };
    loadModule();
  }, []);

  const filteredVoices = PIPER_VOICES.filter(v => v.lang === selectedLang);
  const availableLanguages = [...new Set(PIPER_VOICES.map(v => v.lang))];

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    const voicesForLang = PIPER_VOICES.filter(v => v.lang === lang);
    if (voicesForLang.length > 0) {
      setSelectedVoice(voicesForLang[0].id);
    }
  };

  const handleGenerate = useCallback(async () => {
    if (!text.trim() || !ttsModule) return;

    setIsGenerating(true);
    setError(null);
    setAudioUrl(null);
    setDownloadProgress('Створення сесії...');

    try {
      console.log('Creating TTS session with voice:', selectedVoice);

      // Створюємо сесію з вибраним голосом
      const { TtsSession } = ttsModule;
      const session = await TtsSession.create({ voiceId: selectedVoice as any });

      console.log('Session created, generating audio...');
      setDownloadProgress('Генерація мовлення...');

      // Генеруємо аудіо
      const audioBlob = await session.predict(text);

      console.log('Audio generated successfully');
      const url = URL.createObjectURL(audioBlob);
      setAudioUrl(url);
      setDownloadProgress(null);

      const audio = new Audio(url);
      audio.onloadedmetadata = () => {
        setAudioDuration(audio.duration);
      };
    } catch (err) {
      console.error('TTS Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Невідома помилка';

      if (errorMessage.includes('Entry not found')) {
        setError('Голосова модель не знайдена. Спробуйте інший голос або очистіть кеш браузера.');
      } else if (errorMessage.includes('Failed to fetch')) {
        setError('Не вдалося завантажити модель. Перевірте підключення до інтернету.');
      } else if (errorMessage.includes('could not be read') || errorMessage.includes('permission')) {
        setError('Проблема з доступом до файлу. Очистіть кеш браузера (Ctrl+Shift+Delete) і спробуйте знову.');
      } else {
        setError(`Помилка генерації: ${errorMessage}`);
      }

      setDownloadProgress(null);
    } finally {
      setIsGenerating(false);
    }
  }, [text, selectedVoice, ttsModule]);

  const handlePlay = () => {
    if (!audioRef.current || !audioUrl) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleDownload = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `piper-tts-${selectedVoice}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  useEffect(() => {
    const update = () => {
      if (audioRef.current && isPlaying) {
        setCurrentTime(audioRef.current.currentTime);
        animationRef.current = requestAnimationFrame(update);
      }
    };
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="border-b border-white/10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Piper TTS</h1>
              <p className="text-xs text-purple-300">Синтез мовлення в браузері</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
              🔒 100% локально
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
              ⚡ WebAssembly
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Мова
              </h2>
              <select
                value={selectedLang}
                onChange={(e) => handleLangChange(e.target.value)}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
              >
                {availableLanguages.map(lang => (
                  <option key={lang} value={lang}>{LANG_NAMES[lang] || lang}</option>
                ))}
              </select>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Голос
              </h2>
              <div className="space-y-2">
                {filteredVoices.map(voice => (
                  <button
                    key={voice.id}
                    onClick={() => setSelectedVoice(voice.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                      selectedVoice === voice.id
                        ? 'bg-purple-500/20 border border-purple-500/50 text-white'
                        : 'bg-slate-800/30 border border-white/5 text-slate-300 hover:bg-slate-800/50 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{voice.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        voice.gender === 'female'
                          ? 'bg-pink-500/20 text-pink-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}>
                        {voice.gender === 'female' ? '♀' : '♂'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1">{voice.id}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6">
              <h3 className="text-sm font-semibold text-purple-300 mb-2">💡 Як це працює?</h3>
              <ul className="text-xs text-slate-400 space-y-1.5">
                <li>• Piper TTS працює повністю в браузері</li>
                <li>• Моделі завантажуються один раз і кешуються</li>
                <li>• Ваш текст ніколи не відправляється на сервер</li>
                <li>• Підтримує 13+ мов та 20+ голосів</li>
                <li>• Генерація через WebAssembly + ONNX</li>
              </ul>
            </div>

            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Порада
              </h3>
              <p className="text-xs text-slate-400">
                Перше завантаження голосової моделі може зайняти 10-60 секунд. Модель кешується в браузері і наступного разу завантажиться миттєво.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Якщо виникають помилки — очистіть кеш браузера (<code className="bg-slate-700 px-1 rounded">Ctrl+Shift+Delete</code>)
              </p>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Текст для озвучення
                </h2>
                <span className="text-xs text-slate-400">{text.length} символів</span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Введіть текст, який потрібно озвучити..."
                rows={6}
                className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all resize-none"
              />

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs text-slate-400">Приклади:</span>
                <button
                  onClick={() => setText('Hello! Welcome to Piper text to speech.')}
                  className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  English
                </button>
                <button
                  onClick={() => setText('Привіт! Ласкаво просимо до синтезу мовлення Piper.')}
                  className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Українська
                </button>
                <button
                  onClick={() => setText('Привет! Добро пожаловать в синтез речи Piper.')}
                  className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
                >
                  Русский
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!text.trim() || isGenerating || !ttsModule}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all flex items-center justify-center gap-3 ${
                !text.trim() || isGenerating || !ttsModule
                  ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 active:scale-[0.98]'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {downloadProgress || 'Обробка...'}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Генерація мовлення
                </>
              )}
            </button>

            {downloadProgress && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                  </div>
                  <span className="text-sm text-purple-300 whitespace-nowrap">{downloadProgress}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20 p-4 flex items-start gap-3">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-red-400 text-sm">{error}</p>
                  <p className="text-red-400/60 text-xs mt-1">Спробуйте інший голос або перевірте підключення до інтернету.</p>
                </div>
              </div>
            )}

            {audioUrl && (
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  Результат
                </h3>

                <div className="bg-slate-800/50 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-center h-16 gap-0.5">
                    {Array.from({ length: 50 }).map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all ${
                          isPlaying
                            ? 'bg-gradient-to-t from-purple-500 to-pink-500 animate-pulse'
                            : 'bg-slate-600'
                        }`}
                        style={{
                          height: `${Math.random() * 60 + 20}%`,
                          animationDelay: `${i * 50}ms`,
                          animationDuration: `${300 + Math.random() * 500}ms`
                        }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={handlePlay}
                    className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg shadow-purple-500/25"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  <button
                    onClick={handleStop}
                    className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h12v12H6z" />
                    </svg>
                  </button>

                  <div className="flex-1 flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-10">{formatTime(currentTime)}</span>
                    <input
                      type="range"
                      min={0}
                      max={audioDuration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-purple-500 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                    />
                    <span className="text-xs text-slate-400 w-10">{formatTime(audioDuration || 0)}</span>
                  </div>

                  <button
                    onClick={handleDownload}
                    className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors"
                    title="Завантажити WAV"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                </div>

                <audio
                  ref={audioRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium text-sm">Приватність</h3>
                <p className="text-xs text-slate-400 mt-1">Всі дані обробляються локально</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center">
                <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium text-sm">Швидкість</h3>
                <p className="text-xs text-slate-400 mt-1">Миттєва генерація без затримок</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-medium text-sm">Багатомовність</h3>
                <p className="text-xs text-slate-400 mt-1">13+ мов та 20+ голосів</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-sm text-slate-400">
            Працює на основі{' '}
            <a href="https://github.com/rhasspy/piper" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300 transition-colors">
              Piper TTS
            </a>
            {' '}• WebAssembly + ONNX Runtime • Повністю в браузері
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
