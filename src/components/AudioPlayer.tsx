import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Volume2, Mic } from 'lucide-react';
import { textToSpeech } from '../services/api';

export type VoiceChoice = 'female' | 'male';

interface AudioPlayerProps {
  text: string;
  speechRate?: number;
  voice?: VoiceChoice;
  compact?: boolean;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  text,
  speechRate = 1,
  voice = 'female',
  compact = false,
  className = '',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);

  const stopAll = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setPlaying(false);
  }, []);

  useEffect(() => () => stopAll(), [stopAll]);

  const playBrowserFallback = useCallback(() => {
    if (!text || !window.speechSynthesis) return;
    stopAll();
    const voices = window.speechSynthesis.getVoices();
    const vi =
      voices.find((v) => v.name.includes('HoaiMy')) ||
      voices.find((v) => v.name.includes('NamMinh')) ||
      voices.find((v) => v.lang.startsWith('vi'));
    const u = new SpeechSynthesisUtterance(text.slice(0, 2000));
    u.lang = 'vi-VN';
    if (vi) u.voice = vi;
    u.rate = Math.min(1.4, Math.max(0.8, speechRate));
    u.pitch = voice === 'female' ? 1.05 : 0.95;
    u.onend = () => setPlaying(false);
    u.onerror = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
    setProvider('browser');
  }, [text, speechRate, voice, stopAll]);

  const handlePlay = async () => {
    if (!text.trim()) return;
    if (playing) {
      stopAll();
      return;
    }

    setLoading(true);
    try {
      const result = await textToSpeech(text, speechRate, voice);
      if (result.audioBase64 && !result.fallback) {
        const mime = result.format || 'audio/mpeg';
        const audio = new Audio(`data:${mime};base64,${result.audioBase64}`);
        audio.playbackRate = speechRate;
        audio.onended = () => setPlaying(false);
        audio.onerror = () => playBrowserFallback();
        audioRef.current = audio;
        await audio.play();
        setPlaying(true);
        setProvider(result.provider || 'edge');
      } else {
        playBrowserFallback();
      }
    } catch {
      playBrowserFallback();
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = () => {
    stopAll();
    setTimeout(() => handlePlay(), 80);
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={handlePlay}
        disabled={loading || !text}
        className={`p-2 rounded-xl bg-brand-100 dark:bg-brand-900/40 text-brand-600 hover:bg-brand-200 transition ${className}`}
        title="Nghe bước này"
      >
        {loading ? (
          <span className="block w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        ) : playing ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border border-brand-200/60 dark:border-brand-800/50 bg-gradient-to-br from-brand-50/90 to-indigo-50/50 dark:from-brand-950/40 dark:to-indigo-950/30 p-4 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
          <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-md">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold">Giọng gia sư AI</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {provider === 'edge'
                ? 'Microsoft Neural · Tiếng Việt'
                : playing
                  ? 'Đang đọc...'
                  : 'Edge TTS chất lượng cao'}
            </p>
          </div>
        </div>

        {playing && (
          <div className="flex items-end gap-0.5 h-6 ml-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="audio-bar" />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          type="button"
          onClick={handlePlay}
          disabled={loading || !text}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm shadow-md transition disabled:opacity-50"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : playing ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {playing ? 'Tạm dừng' : 'Nghe giải thích'}
        </button>
        <button
          type="button"
          onClick={handleReplay}
          disabled={!text}
          className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition"
          title="Phát lại"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export default AudioPlayer;
