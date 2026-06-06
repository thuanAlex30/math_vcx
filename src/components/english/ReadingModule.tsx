import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { generateReading, gradeReading } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import EnglishAudioPlayer from './EnglishAudioPlayer';
import type { ListeningQuestion } from '../../types/english';
import LoadingSkeleton from '../LoadingSkeleton';

const ReadingModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [lesson, setLesson] = useState<{
    title: string;
    passage: string;
    questions: ListeningQuestion[];
    targetLength?: number;
    newWordsPercent?: number;
  } | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const { effectiveLevel, addXp, updateScores } = useEnglishStore();
  const level = effectiveLevel();

  const generate = async () => {
    setLoading(true);
    setShowResults(false);
    setAnswers([]);
    try {
      setLesson(await generateReading(grade as Grade, level));
    } catch {
      toast.error('Không tạo được bài đọc');
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!lesson) return;
    const unanswered = lesson.questions.findIndex((_, i) => answers[i] == null);
    if (unanswered !== -1) {
      toast.error(`Chưa trả lời câu ${unanswered + 1}`);
      return;
    }
    setLoading(true);
    try {
      const res = await gradeReading(lesson.questions, answers);
      setShowResults(true);
      updateScores({ reading: res.score });
      addXp(Math.round(res.score / 2));
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q, i) => ({
                ...q,
                answer: res.results[i]?.isCorrect
                  ? q.answer
                  : q.answer,
              })),
            }
          : prev
      );
      // Hiện kết quả bằng kết quả backend
      setAnswers((prev) =>
        prev.map((a, i) => (res.results[i]?.isCorrect ? a : (a ?? 0)))
      );
    } catch {
      toast.error('Không chấm được bài đọc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <p className="text-sm text-slate-500 text-center">
        Lớp {grade}
        {lesson?.targetLength ? ` · ~${lesson.targetLength} từ` : ''}
        {lesson?.newWordsPercent != null ? ` · Từ mới ≤${lesson.newWordsPercent}%` : ''}
      </p>
      <button type="button" onClick={generate} disabled={loading} className="btn-primary w-full bg-emerald-600">
        {loading ? <Loader2 className="animate-spin mx-auto" /> : 'Tạo bài đọc hiểu mới'}
      </button>

      {loading && !lesson && (
        <div className="card p-6 space-y-4">
          <LoadingSkeleton />
        </div>
      )}

      {lesson && (
        <div className="card p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold flex items-center gap-2 text-emerald-600">
              <BookOpen className="w-5 h-5" /> {lesson.title}
            </h3>
            <EnglishAudioPlayer text={lesson.passage} compact />
          </div>
          <p className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
            {lesson.passage}
          </p>

          {lesson.questions.map((q, i) => (
            <div key={i}>
              <p className="font-medium mb-2 dark:text-slate-200">{i + 1}. {q.question}</p>
              <div className="grid gap-2">
                {q.options.map((opt, j) => {
                  const selected = answers[i] === j;
                  const correct = showResults && j === q.answer;
                  const wrong = showResults && selected && j !== q.answer;
                  return (
                    <button
                      key={j}
                      type="button"
                      disabled={showResults}
                      onClick={() => {
                        const a = [...answers];
                        a[i] = j;
                        setAnswers(a);
                      }}
                      className={`text-left p-3 rounded-xl border text-sm flex items-center gap-2 ${
                        correct ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600' : wrong ? 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-500' : selected ? 'border-emerald-400' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {showResults && correct && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {wrong && <XCircle className="w-4 h-4 text-red-500" />}
                      {opt}
                    </button>
                  );
                })}
              </div>
              {showResults && (
                <p className="text-sm text-slate-500 mt-1">{q.explanation}</p>
              )}
            </div>
          ))}

          {!showResults && (
            <button type="button" onClick={submit} className="w-full py-3 rounded-xl bg-emerald-600 text-white font-semibold">
              Kiểm tra đáp án
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingModule;
