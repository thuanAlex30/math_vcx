import React, { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { scorePronunciation } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { PronunciationResult } from '../../types/english';

const SENTENCES = [
  'Hello, how are you today?',
  'I love learning English every day.',
  'The weather is beautiful this morning.',
  'Can you help me with this exercise?',
];

const PronunciationModule: React.FC = () => {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const { level, updateScores, addXp } = useEnglishStore();

  const expected = SENTENCES[sentenceIdx];

  const startListen = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      toast.error('Trình duyệt không hỗ trợ nhận dạng giọng nói');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.onresult = (e: { results: { [key: number]: { [key: number]: { transcript: string } } } }) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setListening(false);
      grade(text);
    };
    rec.onerror = () => {
      setListening(false);
      toast.error('Không nghe được — thử lại');
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
    setTranscript('');
    setResult(null);
  };

  const stopListen = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const grade = async (spoken: string) => {
    setLoading(true);
    try {
      const res = await scorePronunciation(expected, spoken, level);
      setResult(res);
      updateScores({ pronunciation: res.score });
      addXp(Math.round(res.score / 5));
    } catch {
      toast.error('Không chấm được phát âm');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="card p-8 text-center border-2 border-emerald-200/50">
        <p className="text-xs uppercase tracking-wider text-emerald-600 font-bold mb-2">Đọc câu này</p>
        <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">{expected}</p>
        <EnglishAudioPlayer text={expected} />
      </div>

      <div className="flex justify-center gap-4">
        <button
          type="button"
          onClick={listening ? stopListen : startListen}
          className={`flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-white shadow-lg transition ${
            listening ? 'bg-red-500 hover:bg-red-600' : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          {listening ? 'Dừng ghi âm' : 'Bắt đầu đọc'}
        </button>
      </div>

      {transcript && (
        <div className="card p-4">
          <p className="text-sm text-slate-500 mb-1">Bạn đã đọc:</p>
          <p className="font-medium">{transcript}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center gap-2 text-emerald-600">
          <Loader2 className="animate-spin" /> AI đang chấm...
        </div>
      )}

      {result && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold">Điểm phát âm</span>
            <span className="text-3xl font-extrabold text-emerald-600">{result.score}/100</span>
          </div>
          {result.wrongWords?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-red-500 mb-2">Từ cần luyện thêm:</p>
              <div className="flex flex-wrap gap-2">
                {result.wrongWords.map((w) => (
                  <span key={w} className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 text-sm font-medium">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-sm text-slate-600 dark:text-slate-400">{result.feedback}</p>
          <ul className="text-sm list-disc pl-5 text-slate-500 space-y-1">
            {result.tips?.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-center gap-2">
        {SENTENCES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setSentenceIdx(i); setResult(null); setTranscript(''); }}
            className={`w-3 h-3 rounded-full ${i === sentenceIdx ? 'bg-emerald-500' : 'bg-slate-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PronunciationModule;
