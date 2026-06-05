import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Headphones, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { generateListening, gradeListening } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { ListeningQuestion } from '../../types/english';

const ListeningModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [lesson, setLesson] = useState<{
    title: string;
    audioScript: string;
    questions: ListeningQuestion[];
    playbackSpeed?: number;
    durationSec?: number;
  } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [graded, setGraded] = useState<{
    score: number;
    results: (ListeningQuestion & { userAnswer: number; isCorrect: boolean })[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const { effectiveLevel, recordAdaptiveScore, setAdaptiveLevel, updateScores, addXp } =
    useEnglishStore();
  const level = effectiveLevel();

  const generate = async () => {
    setLoading(true);
    setGraded(null);
    setAnswers([]);
    try {
      const data = await generateListening(grade as Grade, undefined, level);
      setLesson(data);
    } catch {
      toast.error('Không tạo được bài nghe');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!lesson) return;
    try {
      const res = await gradeListening(lesson.questions, answers);
      setGraded(res);
      updateScores({ listening: res.score });
      addXp(res.score / 2);
      const suggestion = recordAdaptiveScore(res.score);
      if (suggestion === 'up') {
        const next = level === 'beginner' ? 'intermediate' : 'advanced';
        toast('Thử mức khó hơn nhé!', {
          icon: '🚀',
          duration: 5000,
        });
        if (window.confirm(`Em làm tốt 3 lần liên tiếp! Chuyển sang mức ${next}?`)) {
          setAdaptiveLevel(next);
        }
      } else if (suggestion === 'down') {
        const prev = level === 'advanced' ? 'intermediate' : 'beginner';
        toast('Ôn lại mức dễ hơn sẽ giúp em vững hơn', { icon: '📘' });
        if (window.confirm(`Điểm thấp 3 lần — thử mức ${prev}?`)) {
          setAdaptiveLevel(prev);
        }
      }
    } catch {
      toast.error('Không chấm được');
    }
  };

  const playbackSpeed = lesson?.playbackSpeed ?? 1;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <p className="text-sm text-slate-500 text-center">
        Lớp {grade}
        {lesson?.durationSec ? ` · ~${lesson.durationSec}s` : ''}
        {lesson?.playbackSpeed ? ` · Tốc độ ${playbackSpeed}x` : ''}
      </p>
      <button type="button" onClick={generate} disabled={loading} className="btn-primary w-full bg-emerald-600 hover:from-emerald-600">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Tạo bài luyện nghe mới'}
      </button>

      {lesson && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <Headphones className="w-5 h-5" />
            {lesson.title}
          </div>
          <EnglishAudioPlayer text={lesson.audioScript} speed={playbackSpeed} />
          <p className="text-sm text-slate-500 italic border-l-4 border-emerald-400 pl-3">
            {lesson.audioScript}
          </p>

          {lesson.questions.map((q, i) => (
            <div key={i} className="space-y-2">
              <p className="font-medium">{i + 1}. {q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, j) => (
                  <button
                    key={j}
                    type="button"
                    disabled={!!graded}
                    onClick={() => {
                      const a = [...answers];
                      a[i] = j;
                      setAnswers(a);
                    }}
                    className={`text-left p-3 rounded-xl border text-sm transition ${
                      answers[i] === j
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {graded?.results[i] && (
                <div className={`text-sm flex items-start gap-2 ${graded.results[i].isCorrect ? 'text-emerald-600' : 'text-red-500'}`}>
                  {graded.results[i].isCorrect ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
                  {graded.results[i].explanation}
                </div>
              )}
            </div>
          ))}

          {!graded && (
            <button type="button" onClick={submit} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold">
              Nộp bài
            </button>
          )}
          {graded && (
            <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
              <p className="text-2xl font-extrabold text-emerald-600">{graded.score} điểm</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ListeningModule;
