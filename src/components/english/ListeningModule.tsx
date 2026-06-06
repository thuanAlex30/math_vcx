import React, { useState, useRef, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Headphones, Loader2, CheckCircle2, XCircle, RefreshCw,
  Play, Pause, SkipForward, ChevronDown, ChevronUp,
} from 'lucide-react';
import { generateListening, gradeListening } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { ListeningQuestion } from '../../types/english';
import LoadingSkeleton from '../LoadingSkeleton';

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
const REPLAY_LIMIT = 3;

const ListeningModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [lesson, setLesson] = useState<{
    title: string;
    audioScript: string;
    questions: ListeningQuestion[];
    playbackSpeed?: number;
    durationSec?: number;
  } | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [graded, setGraded] = useState<{
    score: number;
    results: (ListeningQuestion & { userAnswer: number; isCorrect: boolean })[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState<0.75 | 1 | 1.25 | 1.5>(1);
  const [replayCount, setReplayCount] = useState(0);
  const [showTranscript, setShowTranscript] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const { effectiveLevel, recordAdaptiveScore, setAdaptiveLevel, updateScores, addXp } =
    useEnglishStore();
  const level = effectiveLevel();

  // Waveform visualizer via Web Audio API
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const drawWaveform = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const bars = 60;
    const barW = w / bars - 1;
    for (let i = 0; i < bars; i++) {
      const barH = Math.random() * h * 0.7 + h * 0.1;
      const x = i * (barW + 1);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, (h - barH) / 2, barW, barH);
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(drawWaveform, 150);
    return () => clearInterval(interval);
  }, [drawWaveform]);

  const generate = async () => {
    setLoading(true);
    setGraded(null);
    setAnswers([]);
    setReplayCount(0);
    setShowTranscript(false);
    setExpandedQ(null);
    try {
      const data = await generateListening(grade as Grade, undefined, level);
      setLesson(data);
    } catch {
      toast.error('Không tạo được bài nghe');
    } finally {
      setLoading(false);
    }
  };

  const handleReplay = () => {
    if (replayCount >= REPLAY_LIMIT) {
      toast.error(`Đã hết lượt phát lại (${REPLAY_LIMIT} lần max)`);
      return;
    }
    setReplayCount((n) => n + 1);
  };

  const submit = async () => {
    if (!lesson) return;
    const unanswered = lesson.questions.findIndex((_, i) => answers[i] == null);
    if (unanswered !== -1) {
      toast.error(`Chưa trả lời câu ${unanswered + 1}`);
      return;
    }
    try {
      const res = await gradeListening(lesson.questions, answers.filter((a) => a != null));
      setGraded(res);
      updateScores({ listening: res.score });
      addXp(Math.round(res.score / 2));
      const currentLevel = effectiveLevel();
      const suggestion = recordAdaptiveScore(res.score);
      if (suggestion === 'up') {
        const next = currentLevel === 'beginner' ? 'intermediate' : 'advanced';
        toast.success('Làm tốt lắm! Thử mức khó hơn nhé');
        setAdaptiveLevel(next);
      } else if (suggestion === 'down') {
        toast('Ôn lại mức dễ hơn sẽ giúp em vững hơn');
        const prev = currentLevel === 'advanced' ? 'intermediate' : 'beginner';
        setAdaptiveLevel(prev);
      }
    } catch {
      toast.error('Không chấm được');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Lớp {grade}
          {lesson?.durationSec ? ` · ~${lesson.durationSec}s` : ''}
        </p>
        <button type="button" onClick={generate} disabled={loading} className="btn-primary bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {loading ? 'Đang tạo...' : 'Bài mới'}
        </button>
      </div>

      {loading && !lesson && (
        <div className="card p-6 space-y-4"><LoadingSkeleton /></div>
      )}

      {lesson && (
        <div className="card p-6 space-y-5">
          {/* Title */}
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
            <Headphones className="w-5 h-5" />
            {lesson.title}
          </div>

          {/* Waveform visualizer */}
          <div className="relative rounded-xl overflow-hidden bg-emerald-950/20 dark:bg-emerald-900/20">
            <canvas
              ref={canvasRef}
              width={600}
              height={80}
              className="w-full h-20"
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                onClick={handleReplay}
                disabled={replayCount >= REPLAY_LIMIT}
                className="p-4 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
                title={`Phát lại (${REPLAY_LIMIT - replayCount} lần còn lại)`}
              >
                {replayCount >= REPLAY_LIMIT ? (
                  <span className="text-xs font-bold">Hết lượt</span>
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Speed controls */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">Tốc độ:</span>
            <div className="flex gap-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                    speed === s
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-400 ml-auto">
              Phát lại: {replayCount}/{REPLAY_LIMIT}
            </span>
          </div>

          {/* Audio player */}
          <EnglishAudioPlayer text={lesson.audioScript || lesson.title} speed={speed} compact />

          {/* Transcript toggle */}
          <button
            type="button"
            onClick={() => setShowTranscript((v) => !v)}
            className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            {showTranscript ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showTranscript ? 'Ẩn bản ghi' : 'Hiện bản ghi'}
          </button>

          {showTranscript && (
            <p className="text-sm text-slate-600 dark:text-slate-300 italic border-l-4 border-emerald-400 pl-3">
              {lesson.audioScript}
            </p>
          )}

          <hr className="border-slate-200 dark:border-slate-700" />

          {/* Questions */}
          <div className="space-y-4">
            {lesson.questions.map((q, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 text-left"
                  onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                >
                  <span className="font-semibold text-sm">
                    Câu {i + 1}. {q.question}
                  </span>
                  {expandedQ === i ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {expandedQ === i && (
                  <div className="px-4 pb-4 space-y-2">
                    {q.options.map((opt, j) => {
                      const isCorrectOpt = graded ? j === q.answer : null;
                      const isSelected = answers[i] === j;
                      const isGraded = !!graded;
                      let cls = 'border-slate-200 dark:border-slate-700';
                      if (isGraded) {
                        if (isCorrectOpt) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                        else if (isSelected && !isCorrectOpt) cls = 'border-red-400 bg-red-50 dark:bg-red-950/20';
                      } else if (isSelected) {
                        cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20';
                      }
                      return (
                        <button
                          key={j}
                          type="button"
                          disabled={isGraded}
                          onClick={() => {
                            if (isGraded) return;
                            const a = [...answers];
                            a[i] = j;
                            setAnswers(a);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-sm transition-colors ${cls}`}
                        >
                          <span className="font-semibold mr-1">{String.fromCharCode(65 + j)}.</span>
                          {opt}
                          {isGraded && isCorrectOpt && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 float-right" />
                          )}
                          {isGraded && isSelected && !isCorrectOpt && (
                            <XCircle className="w-4 h-4 text-red-400 float-right" />
                          )}
                        </button>
                      );
                    })}
                    {graded && (
                      <p className="text-xs text-slate-500 italic mt-1">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Submit */}
          {!graded && (
            <button
              type="button"
              onClick={submit}
              disabled={answers.some((a) => a == null)}
              className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold disabled:opacity-50 hover:bg-emerald-700 transition-colors"
            >
              Nộp bài
            </button>
          )}
          {graded && (
            <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {graded.score} điểm
              </p>
              <button
                type="button"
                onClick={() => { setGraded(null); setAnswers([]); setReplayCount(0); }}
                className="mt-2 text-sm text-emerald-600 underline"
              >
                Làm lại bài này
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListeningModule;
