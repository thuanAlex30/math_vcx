import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Send, Loader2 } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import {
  generateExam,
  submitExam,
  getStudentSessionId,
  type PracticeQuestion,
} from '../services/api';
import { MathText } from '../utils/mathRender';

const EXAM_HISTORY_KEY = 'giasu-exam-history';

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

const ExamPage: React.FC = () => {
  const { grade } = useGradeStore();
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(90 * 60);

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
    const results = questions.map((q, i) => ({
      topicId: q.topicId,
      correct: answers[i] === q.correct,
    }));
    const correctCount = results.filter((r) => r.correct).length;
    setScore(correctCount);
    setSubmitted(true);

    try {
      const res = await submitExam(getStudentSessionId(), results);
      const history = JSON.parse(localStorage.getItem(EXAM_HISTORY_KEY) || '[]');
      history.unshift({
        date: new Date().toISOString(),
        score: res.scoreOutOf10,
        correct: correctCount,
        total: questions.length,
      });
      localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(history.slice(0, 20)));
      toast.success(`Điểm: ${res.scoreOutOf10}/10`);
    } catch {
      toast.error('Không lưu được kết quả');
    }
  }, [questions, answers]);

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
              Điểm /10: {Math.round((score / questions.length) * 10 * 10) / 10}
            </p>
          </motion.div>
        )}

        <div className="space-y-6">
          {questions.map((q, i) => (
            <div key={q.id ?? i} className="card p-5">
              <p className="font-semibold mb-3">
                Câu {i + 1}. <MathText text={q.question} />
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
                    <MathText text={opt} />
                  </label>
                ))}
              </div>
              {submitted && q.explanation && (
                <p className="text-sm text-slate-500 mt-3">{q.explanation}</p>
              )}
            </div>
          ))}
        </div>

        {!submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            className="btn-primary w-full mt-8 flex items-center justify-center gap-2 py-4"
          >
            <Send className="w-5 h-5" /> Nộp bài
          </button>
        )}
      </div>
    </div>
  );
};

export default ExamPage;
