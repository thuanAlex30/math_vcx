import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Send, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import {
  generateExam,
  submitExam,
  analyzeExam,
  getStudentSessionId,
  type PracticeQuestion,
} from '../services/api';
import { MathContent } from '../components/MathContent';

const EXAM_HISTORY_KEY = 'giasu-exam-history';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ExamPage: React.FC = () => {
  const { grade } = useGradeStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [scoreOutOf10, setScoreOutOf10] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(90 * 60);
  const [analysis, setAnalysis] = useState<{ breakdown: { id: string; name: string; percent: number }[]; summary: string; recommendReview: string[] } | null>(null);
  const [currentQ, setCurrentQ] = useState(0);

  useEffect(() => {
    generateExam(grade)
      .then((res) => {
        setQuestions(res.questions);
        setAnswers(new Array(res.questions.length).fill(null));
      })
      .catch(() => toast.error('Không tạo được đề thi'))
      .finally(() => setLoading(false));
  }, [grade]);

  useEffect(() => {
    if (submitted || loading) return;
    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [submitted, loading]);

  const handleSubmit = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    const results = questions.map((q, i) => ({
      topicId: q.topicId,
      correct: answers[i] === q.correct,
    }));
    const correctCount = results.filter((r) => r.correct).length;
    setScore(correctCount);
    setSubmitted(true);

    try {
      const res = await submitExam(getStudentSessionId(), results);
      setScoreOutOf10(res.scoreOutOf10);
      const history = JSON.parse(localStorage.getItem(EXAM_HISTORY_KEY) || '[]');
      history.unshift({
        date: new Date().toISOString(),
        score: res.scoreOutOf10,
        correct: correctCount,
        total: questions.length,
      });
      localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));

      // Phân tích đề — gợi ý ôn tập
      try {
        const text = questions.map((q, i) => `Câu ${i + 1}: ${q.question}`).join('\n');
        const a = await analyzeExam(text, grade);
        setAnalysis(a);
      } catch { /* analysis optional */ }

      toast.success(`Điểm: ${res.scoreOutOf10}/10`);
    } catch {
      toast.error('Không lưu được kết quả');
    } finally {
      setSubmitting(false);
    }
  }, [questions, answers, submitted, submitting, grade]);

  if (loading) {
    return (
      <div className="pt-24 px-4 max-w-3xl mx-auto text-center">
        <Loader2 className="w-10 h-10 animate-spin mx-auto text-brand-600" />
        <p className="mt-4 text-slate-500">Đang tạo đề THPT 50 câu...</p>
      </div>
    );
  }

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-extrabold">Thi thử THPT Toán</h1>
          {!submitted && (
            <div className="flex items-center gap-2 font-mono text-lg font-bold text-brand-600">
              <Clock className="w-5 h-5" />
              {formatTime(secondsLeft)}
            </div>
          )}
        </div>

        {submitted && score !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-6 mb-6 text-center">
            <p className="text-4xl font-extrabold text-brand-600">
              {score}/{questions.length}
            </p>
            <p className="text-slate-500 mt-2">
              Điểm /10: {scoreOutOf10 ?? Math.round((score / questions.length) * 10 * 10) / 10}
            </p>
            {analysis && (
              <div className="mt-4 text-left bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm">
                <p className="font-semibold mb-2">Phân tích đề thi:</p>
                <p className="text-slate-700 dark:text-slate-300 mb-3">{analysis.summary}</p>
                {analysis.recommendReview.length > 0 && (
                  <p className="text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Nên ôn tập:</span>{' '}
                    {analysis.recommendReview.join(', ')}
                  </p>
                )}
                {analysis.breakdown.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {analysis.breakdown.slice(0, 5).map((b) => (
                      <div key={b.id} className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-brand-500 rounded-full" style={{ width: `${b.percent}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-24">{b.name}</span>
                        <span className="text-xs font-semibold text-brand-600">{b.percent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className="space-y-6">
          {!submitted && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-slate-500">
                  Câu {currentQ + 1} / {questions.length}
                </span>
                <span className="text-sm text-slate-500">
                  Đã trả lời: {answers.filter((a) => a !== null).length}
                </span>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {questions.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setCurrentQ(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentQ
                        ? 'bg-brand-500 ring-2 ring-brand-300'
                        : answers[i] !== null
                          ? 'bg-emerald-400'
                          : 'bg-slate-200 dark:bg-slate-700'
                    }`}
                    title={`Câu ${i + 1}${answers[i] !== null ? ' ✓' : ''}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={() => setCurrentQ((q) => Math.max(0, q - 1))}
                  disabled={currentQ === 0}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" /> Câu trước
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentQ((q) => Math.min(questions.length - 1, q + 1))}
                  disabled={currentQ === questions.length - 1}
                  className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 disabled:opacity-30"
                >
                  Câu sau <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {questions.map((q, i) => {
            const visible = submitted || i === currentQ;
            if (!visible) return null;
            return (
            <div key={q.id ?? i} className={`card p-5 ${i === currentQ && !submitted ? 'ring-2 ring-brand-300' : ''}`}>
              <p className="font-semibold mb-3">
                Câu {i + 1}. <MathContent text={q.question} />
              </p>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${
                      submitted
                        ? oi === q.correct
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                          : answers[i] === oi
                            ? 'border-red-400 bg-red-50 dark:bg-red-950/30'
                            : 'border-slate-200 dark:border-slate-700'
                        : answers[i] === oi
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/30'
                          : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={answers[i] === oi}
                      onChange={() => {
                        if (submitted) return;
                        const next = [...answers];
                        next[i] = oi;
                        setAnswers(next);
                      }}
                      disabled={submitted}
                      className="mt-1 accent-brand-600"
                    />
                    <MathContent text={opt} />
                  </label>
                ))}
              </div>
              {submitted && q.explanation && (
                <div className="mt-3 text-sm text-slate-500">
                  <MathContent text={q.explanation} />
                </div>
              )}
            </div>
            );
          })}
        </div>

        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-2 py-4 disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Đang nộp...</> : <><Send className="w-5 h-5" /> Nộp bài</>}
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamPage;
