import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { fetchPronunciationPractice, scorePronunciation } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { PronunciationResult, PronunciationUnit } from '../../types/english';

const PronunciationModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [units, setUnits] = useState<PronunciationUnit[]>([]);
  const [unitId, setUnitId] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const [sentences, setSentences] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [result, setResult] = useState<PronunciationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef<{ stop: () => void; start: () => void } | null>(null);
  const { effectiveLevel, addXp, updateScores } = useEnglishStore();
  const level = effectiveLevel();

  useEffect(() => {
    setUnitId('');
  }, [grade]);

  useEffect(() => {
    fetchPronunciationPractice(grade as Grade, unitId || undefined).then((p) => {
      setUnits(p.units || []);
      if (!unitId) {
        setUnitId(p.unitId || p.units?.[0]?.id || '');
      }
      setUnitTitle(p.unitTitle || p.units?.[0]?.title || '');
      setSentences(p.sentences.length ? p.sentences : ['Hello, how are you?']);
      setDescription(p.description);
      setSentenceIdx(0);
      setResult(null);
      setTranscript('');
    });
  }, [grade, unitId]);

  const expected = sentences[sentenceIdx] ?? '';

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
      gradeAnswer(text);
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

  const gradeAnswer = async (spoken: string) => {
    setLoading(true);
    try {
      const res = await scorePronunciation(expected, spoken, grade as Grade, level);
      setResult(res);
      updateScores({ pronunciation: res.score });
      addXp(Math.round(res.score / 5));
    } catch {
      toast.error('Không chấm được phát âm');
    } finally {
      setLoading(false);
    }
  };

  if (!expected) return <p className="text-slate-500">Đang tải...</p>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {units.length > 1 && (
        <div className="flex flex-wrap gap-2 justify-center">
          {units.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                setUnitId(u.id);
                setUnitTitle(u.title);
              }}
              className={`chip text-xs ${unitId === u.id ? 'ring-2 ring-emerald-500' : ''}`}
            >
              {u.title}
            </button>
          ))}
        </div>
      )}

      <p className="text-sm text-slate-500 text-center">{description}</p>
      <div className="card p-8 text-center border-2 border-emerald-200/50">
        <p className="text-xs uppercase tracking-wider text-emerald-600 font-bold mb-2">
          Lớp {grade} · {unitTitle || 'Phát âm'}
        </p>
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
        {sentences.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setSentenceIdx(i); setResult(null); setTranscript(''); }}
            className={`w-3 h-3 rounded-full ${i === sentenceIdx ? 'bg-emerald-500' : 'bg-slate-300'}`}
            aria-label={`Câu ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default PronunciationModule;
