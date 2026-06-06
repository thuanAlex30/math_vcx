import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, Loader2, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedQs, setExpandedQs] = useState<Set<number>>(new Set());
  const { effectiveLevel, addXp, updateScores } = useEnglishStore();
  const level = effectiveLevel();

  const toggleQ = useCallback((i: number) => {
    setExpandedQs((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }, []);

  const generate = async () => {
    setLoading(true);
    setShowResults(false);
    setAnswers([]);
    setExpandedQs(new Set());
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
      setExpandedQs(new Set(lesson.questions.map((_, i) => i)));
      updateScores({ reading: res.score });
      addXp(Math.round(res.score / 2));
      setLesson((prev) =>
        prev
          ? {
              ...prev,
              questions: prev.questions.map((q, i) => ({
                ...q,
                answer: res.results[i]?.isCorrect ? q.answer : q.answer,
              })),
            }
          : prev
      );
      setAnswers((prev) =>
        prev.map((a, i) => (res.results[i]?.isCorrect ? a : (a ?? 0)))
      );
    } catch {
      toast.error('Không chấm được bài đọc');
    } finally {
      setLoading(false);
    }
  };

  const progress = lesson
    ? Math.round((answers.filter((a) => a != null).length / lesson.questions.length) * 100)
    : 0;

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-1">
      {/* Header info — compact on mobile */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>Lớp {grade}</span>
        {lesson?.targetLength ? (
          <span className="hidden sm:inline">~{lesson.targetLength} từ</span>
        ) : null}
        {lesson?.newWordsPercent != null ? (
          <span>Từ mới ≤{lesson.newWordsPercent}%</span>
        ) : null}
      </div>

      {/* Progress bar */}
      {lesson && (
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="btn-primary w-full bg-emerald-600 active:bg-emerald-700"
      >
        {loading ? (
          <Loader2 className="animate-spin mx-auto w-5 h-5" />
        ) : (
          'Tạo bài đọc mới'
        )}
      </button>

      {loading && !lesson && (
        <div className="card p-4 sm:p-6 space-y-4">
          <LoadingSkeleton />
        </div>
      )}

      {lesson && (
        <div className="card p-4 sm:p-6 space-y-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold flex items-center gap-2 text-emerald-600 text-sm sm:text-base">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span className="truncate">{lesson.title}</span>
            </h3>
            <EnglishAudioPlayer text={lesson.passage} compact />
          </div>

          {/* Passage — readable font size on mobile */}
          <p className="leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap text-sm sm:text-base">
            {lesson.passage}
          </p>

          {/* Questions — accordion on mobile */}
          {lesson.questions.map((q, i) => {
            const isExpanded = expandedQs.has(i);
            return (
              <div key={i} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                {/* Question header — tappable */}
                <button
                  type="button"
                  className="w-full text-left px-4 py-3 flex items-start gap-3 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  onClick={() => toggleQ(i)}
                >
                  <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 leading-snug mt-0.5">
                    {i + 1}. {q.question}
                  </span>
                  <span className="ml-auto shrink-0 text-slate-400 mt-0.5">
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </span>
                </button>

                {/* Options — collapsible */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 space-y-2">
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
                            if (showResults) return;
                            const a = [...answers];
                            a[i] = j;
                            setAnswers(a);
                          }}
                          className={`w-full text-left p-3 rounded-xl border text-sm transition-all ${
                            correct
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200'
                              : wrong
                              ? 'border-red-400 bg-red-50 dark:bg-red-900/30 dark:border-red-500 text-red-800 dark:text-red-200'
                              : selected
                              ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 dark:border-emerald-600'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            {showResults && correct && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                            )}
                            {wrong && (
                              <XCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            )}
                            <span className="leading-snug">{opt}</span>
                          </span>
                        </button>
                      );
                    })}
                    {showResults && q.explanation && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 px-1 leading-relaxed">
                        {q.explanation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {!showResults && (
            <button
              type="button"
              onClick={submit}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-sm sm:text-base transition-colors"
            >
              Kiểm tra đáp án
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingModule;
