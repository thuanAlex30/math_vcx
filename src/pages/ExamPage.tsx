import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Clock, Send, Loader2, ChevronLeft, ChevronRight, History, Eye } from 'lucide-react';
import { useGradeStore } from '../store/gradeStore';
import {
  generateExam,
  submitExam,
  analyzeExam,
  fetchExamHistory,
  fetchExamDetail,
  getStudentSessionId,
  type PracticeQuestion,
} from '../services/api';
import { MathContent } from '../components/MathContent';

const EXAM_HISTORY_KEY = 'giasu-exam-history';

interface ExamHistoryItem {
  id: string;
  type: string;
  grade: number;
  date: string;
  score: number;
  totalQuestions: number;
  scoreOutOf10: number;
  durationMinutes: number;
  timeSpentSeconds: number | null;
  createdAt: string;
}

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
  const [activeTab, setActiveTab] = useState<'exam' | 'history' | 'detail'>('exam');
  const [history, setHistory] = useState<ExamHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof fetchExamDetail>>['questions'] extends (infer T)[] ? T[] : never>([]);
  const [detailMeta, setDetailMeta] = useState<{ score: number; totalQuestions: number; scoreOutOf10: number; date: string } | null>(null);
  const startTimeRef = React.useRef<number>(Date.now());

  useEffect(() => {
    generateExam(grade)
      .then((res) => {
        setQuestions(res.questions);
        setAnswers(new Array(res.questions.length).fill(null));
        startTimeRef.current = Date.now();
      })
      .catch(() => toast.error('Không tạo được đề thi'))
      .finally(() => setLoading(false));
  }, [grade]);

  useEffect(() => {
    if (activeTab === 'history') {
      setLoadingHistory(true);
      fetchExamHistory(20)
        .then((res) => setHistory(res.submissions))
        .catch(() => toast.error('Không tải được lịch sử thi'))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab]);

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
      question: q.question,
      options: q.options,
      correctAnswer: q.correct,
      topicId: q.topicId,
      topicLabel: q.topicLabel,
      userAnswer: answers[i],
      correct: answers[i] === q.correct,
    }));
    const correctCount = results.filter((r) => r.correct).length;
    setScore(correctCount);
    setSubmitted(true);
    const timeSpentSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

    try {
      const res = await submitExam(getStudentSessionId(), results, grade, questions, timeSpentSeconds);
      setScoreOutOf10(res.scoreOutOf10);

      // Lưu local (cho offline fallback)
      const localHistory = JSON.parse(localStorage.getItem(EXAM_HISTORY_KEY) || '[]');
      localHistory.unshift({
        id: res.submissionId || `local-${Date.now()}`,
        date: new Date().toISOString(),
        score: res.scoreOutOf10,
        correct: correctCount,
        total: questions.length,
      });
      localStorage.setItem(EXAM_HISTORY_KEY, JSON.stringify(localHistory.slice(0, 20)));

      // Phân tích đề — gợi ý ôn tập
      try {
        const text = questions.map((q, i) => `Câu ${i + 1}: ${q.question}`).join('\n');
        const a = await analyzeExam(text, grade);
        setAnalysis(a);
      } catch { /* analysis optional */ }

      toast.success(`Điểm: ${res.scoreOutOf10}/10`);
    } catch {
      // Vẫn hiện điểm tính local
      const localScore = Math.round((correctCount / questions.length) * 10 * 10) / 10;
      setScoreOutOf10(localScore);
      toast.error('Không lưu được kết quả lên server');
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
          <div className="flex items-center gap-2">
            {!submitted && (
              <div className="font-mono text-lg font-bold text-brand-600 flex items-center gap-1">
                <Clock className="w-5 h-5" />
                {formatTime(secondsLeft)}
              </div>
            )}
            {/* Tab switcher */}
            <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-sm">
              {([['exam', 'Thi'], ['history', 'Lịch sử']] as const).map(([tab, label]) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab);
                    if (tab === 'exam') {
                      setSubmitted(false);
                      setScore(null);
                      setScoreOutOf10(null);
                      setAnalysis(null);
                      setDetail([]);
                      setDetailMeta(null);
                      setLoading(true);
                      generateExam(grade).then((res) => {
                        setQuestions(res.questions);
                        setAnswers(new Array(res.questions.length).fill(null));
                        startTimeRef.current = Date.now();
                      }).catch(() => toast.error('Không tạo được đề thi')).finally(() => setLoading(false));
                    }
                  }}
                  className={`px-3 py-1.5 font-semibold transition-colors ${
                    activeTab === tab
                      ? 'bg-brand-500 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {tab === 'exam' ? <Clock className="w-4 h-4 inline mr-1" /> : <History className="w-4 h-4 inline mr-1" />}
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div>
            {loadingHistory ? (
              <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-brand-500" /></div>
            ) : history.length === 0 ? (
              <div className="text-center py-16 text-slate-500">
                <History className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Chưa có bài thi nào.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={async () => {
                      try {
                        const d = await fetchExamDetail(h.id);
                        setDetail(d.questions);
                        setDetailMeta({ score: d.score, totalQuestions: d.totalQuestions, scoreOutOf10: d.scoreOutOf10, date: d.date });
                        setActiveTab('detail');
                      } catch {
                        toast.error('Không tải được chi tiết');
                      }
                    }}
                    className="card w-full p-4 flex items-center justify-between hover:shadow-md transition-shadow text-left"
                  >
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-100">
                        {new Date(h.createdAt).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-sm text-slate-500">Lớp {h.grade} · {h.totalQuestions} câu</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl font-extrabold text-brand-600">{h.scoreOutOf10}/10</span>
                      <Eye className="w-5 h-5 text-slate-400" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── DETAIL TAB ── */}
        {activeTab === 'detail' && detail.length > 0 && detailMeta && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-slate-500">{detailMeta.date}</p>
                <p className="text-xl font-extrabold text-brand-600">
                  {detailMeta.scoreOutOf10}/10
                  <span className="text-base font-normal text-slate-400 ml-2">
                    ({detailMeta.score}/{detailMeta.totalQuestions} đúng)
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className="flex items-center gap-1 text-sm text-brand-600 hover:underline"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            </div>
            <div className="space-y-4">
              {detail.map((q) => (
                <div key={q.questionNumber} className={`card p-4 border-l-4 ${
                  q.isCorrect ? 'border-emerald-500' : 'border-red-400'
                }`}>
                  <p className="font-semibold mb-2 text-sm">
                    Câu {q.questionNumber}.
                    {q.isCorrect ? (
                      <span className="ml-2 text-emerald-600 text-xs">✓ Đúng</span>
                    ) : (
                      <span className="ml-2 text-red-500 text-xs">
                        ✗ Sai — Đáp án: {String.fromCharCode(65 + (q.correctAnswer ?? 0))}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-2"><MathContent text={q.question} /></p>
                  {q.topicLabel && (
                    <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">{q.topicLabel}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EXAM TAB ── */}
        {activeTab === 'exam' && (

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
        )}
      </div>
    </div>
  );
};

export default ExamPage;
