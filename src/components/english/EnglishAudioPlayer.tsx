import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { englishTts } from '../../services/englishApi';

interface EnglishAudioPlayerProps {
  text: string;
  speed?: number;
  compact?: boolean;
}

const EnglishAudioPlayer: React.FC<EnglishAudioPlayerProps> = ({
  text,
  speed = 1,
  compact = false,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setPlaying(false);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const browserFallback = () => {
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find((v) => v.lang.startsWith('en'));
    if (en) u.voice = en;
    u.onend = () => setPlaying(false);
    window.speechSynthesis.speak(u);
    setPlaying(true);
  };

  const play = async () => {
    if (!text.trim()) return;
    if (playing) {
      stop();
      return;
    }
    // Cleanup audio cũ trước khi tạo mới — tránh memory leak
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setLoading(true);
    try {
      const result = await englishTts(text, speed);
      if (result.audioBase64 && !result.fallback) {
        const audio = new Audio(`data:${result.format || 'audio/mpeg'};base64,${result.audioBase64}`);
        audio.playbackRate = speed;
        audio.onended = () => setPlaying(false);
        audioRef.current = audio;
        await audio.play();
        setPlaying(true);
      } else browserFallback();
    } catch {
      browserFallback();
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        type="button"
        onClick={play}
        disabled={loading}
        className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700"
      >
        {loading ? (
          <span className="block w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        ) : playing ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={play}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium"
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : playing ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4" />
        )}
        {playing ? 'Pause' : 'Play'}
      </button>
      <button type="button" onClick={() => { stop(); setTimeout(play, 80); }} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700">
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );
};

export default EnglishAudioPlayer;
