import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { MathText } from '../utils/mathRender';
import 'katex/dist/katex.min.css';
import {
  ClipboardList,
  Loader2,
  RotateCcw,
  Send,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import GradeSubjectSelector from './GradeSubjectSelector';
import { useGradeStore } from '../store/gradeStore';
import { useSubjectStore } from '../store/subjectStore';
import {
  fetchTopics,
  generatePracticeQuestions,
  type CurriculumTopic,
  type PracticeQuestion,
  type PracticeSubject,
} from '../services/api';

const PRACTICE_STORAGE_KEY = 'giasu-practice-session';

interface PracticeSession {
  grade: number;
  subject: PracticeSubject;
  topic: string;
  topicLabel: string;
  questions: PracticeQuestion[];
  answers: (number | null)[];
  submitted: boolean;
  score: number | null;
}

function loadSession(): PracticeSession | null {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PracticeSession;
  } catch {
    return null;
  }
}

function saveSession(session: PracticeSession | null) {
  if (!session) {
    localStorage.removeItem(PRACTICE_STORAGE_KEY);
    return;
  }
  localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(session));
}

function formatOptionLabel(opt: string, idx: number): string {
  const letter = String.fromCharCode(65 + idx);
  if (/^[A-D][.)]\s/i.test(opt) || /^[A-D]\.\s/.test(opt)) return opt;
  return `${letter}. ${opt}`;
}

const PracticeMode: React.FC = () => {
  const { grade } = useGradeStore();
  const { subject } = useSubjectStore();

  const [topics, setTopics] = useState<CurriculumTopic[]>([]);
  const [topicId, setTopicId] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [source, setSource] = useState<'ai' | 'fallback' | null>(null);

  const topicLabel = topics.find((t) => t.id === topicId)?.label || topicId;

  const persist = useCallback(
    (
      qs: PracticeQuestion[],
      ans: (number | null)[],
      sub: boolean,
      sc: number | null
    ) => {
      if (qs.length === 0) {
        saveSession(null);
        return;
      }
      saveSession({
        grade,
        subject,
        topic: topicId,
        topicLabel,
        questions: qs,
        answers: ans,
        submitted: sub,
        score: sc,
      });
    },
    [grade, subject, topicId, topicLabel]
  );

  useEffect(() => {
    const saved = loadSession();
    if (saved && saved.grade === grade && saved.subject === subject) {
      setTopicId(saved.topic);
      setQuestions(saved.questions);
      setAnswers(saved.answers);
      setSubmitted(saved.submitted);
      setScore(saved.score);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTopics(true);
      try {
        const data = await fetchTopics(subject, grade);
        if (cancelled) return;
        setTopics(data.topics);
        setTopicId((prev) => {
          if (prev && data.topics.some((t) => t.id === prev)) return prev;
          return data.topics[0]?.id || '';
        });
      } catch (err) {
        if (!cancelled) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 404) {
            toast.error(
              'API /topics chưa có trên server. Deploy Backend mới lên Render hoặc dùng VITE_API_URL=/api (local).',
              { duration: 8000 }
            );
          } else {
            toast.error('Không tải được danh sách chủ đề');
          }
        }
      } finally {
        if (!cancelled) setLoadingTopics(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [subject, grade]);

  const handleGenerate = async () => {
    if (!topicId) {
      toast.error('Vui lòng chọn chủ đề');
      return;
    }
    setGenerating(true);
    setSubmitted(false);
    setScore(null);
    setSource(null);
    try {
      const result = await generatePracticeQuestions({
        grade,
        subject,
        topic: topicId,
        numberOfQuestions: 5,
      });
      const qs = result.questions;
      const emptyAnswers = qs.map(() => null);
      setQuestions(qs);
      setAnswers(emptyAnswers);
      setSource(result.source);
      persist(qs, emptyAnswers, false, null);
      if (result.warning) toast(result.warning, { icon: '⚠️' });
      else if (result.demo) toast('Chế độ demo — câu hỏi mẫu', { icon: '📚' });
      else toast.success('Đã tạo đề luyện tập!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không tạo được đề';
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const setAnswer = (qIndex: number, optionIndex: number) => {
    if (submitted) return;
    const next = [...answers];
    next[qIndex] = optionIndex;
    setAnswers(next);
    persist(questions, next, submitted, score);
  };

  const handleSubmit = () => {
    if (questions.length === 0) {
      toast.error('Hãy tạo đề trước');
      return;
    }
    if (answers.some((a) => a === null)) {
      toast.error('Vui lòng chọn đáp án cho tất cả câu');
      return;
    }
    let correct = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct) correct += 1;
    });
    setScore(correct);
    setSubmitted(true);
    persist(questions, answers, true, correct);
    toast.success(`Điểm: ${correct}/${questions.length}`);
  };

  const handleReset = () => {
    setQuestions([]);
    setAnswers([]);
    setSubmitted(false);
    setScore(null);
    setSource(null);
    saveSession(null);
  };

  return (
    <div className="space-y-6 practice-katex">
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Luyện tập trắc nghiệm</h2>
            <p className="text-xs text-slate-500">
              AI sinh 5 câu theo lớp và chủ đề — có đáp án & giải thích
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <GradeSubjectSelector />

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Chủ đề
            </span>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              disabled={loadingTopics || topics.length === 0}
              className="input-field py-2.5 text-sm font-medium"
            >
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || !topicId}
            className="btn-primary w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5" />
            )}
            {generating ? 'Đang tạo đề...' : 'Tạo đề'}
          </button>

          {source && (
            <p className="text-xs text-slate-500">
              Nguồn đề: {source === 'ai' ? 'AI Hugging Face' : 'Câu hỏi mẫu (fallback)'}
            </p>
          )}
        </div>
      </div>

      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 px-1">
            {subject === 'math' ? 'Toán' : 'Tiếng Anh'} · Lớp {grade} · {topicLabel}
          </p>

          {questions.map((q, qIndex) => {
            const userAnswer = answers[qIndex];
            const isCorrect = submitted && userAnswer === q.correct;
            const isWrong = submitted && userAnswer !== q.correct;

            return (
              <div
                key={`q-${qIndex}-${q.question.slice(0, 20)}`}
                className={`card p-5 sm:p-6 border-2 transition ${
                  submitted
                    ? isCorrect
                      ? 'border-emerald-400/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-rose-400/60 bg-rose-50/50 dark:bg-rose-950/20'
                    : 'border-transparent'
                }`}
              >
                <div className="flex items-start gap-2 mb-4">
                  <span className="shrink-0 w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-bold">
                    {qIndex + 1}
                  </span>
                  <MathText
                    text={q.question}
                    as="p"
                    className="font-semibold text-base leading-snug pt-1 flex-1 min-w-0"
                  />
                  {submitted && (
                    <span className="ml-auto shrink-0">
                      {isCorrect ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-rose-500" />
                      )}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-10">
                  {q.options.map((opt, optIndex) => {
                    const selected = userAnswer === optIndex;
                    const showCorrect = submitted && optIndex === q.correct;
                    return (
                      <label
                        key={optIndex}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition text-sm ${
                          submitted
                            ? showCorrect
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                              : selected && isWrong
                                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                                : 'border-slate-200 dark:border-slate-700 opacity-80'
                            : selected
                              ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                              : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${qIndex}`}
                          checked={selected}
                          onChange={() => setAnswer(qIndex, optIndex)}
                          disabled={submitted}
                          className="accent-brand-600 w-4 h-4 shrink-0"
                        />
                        <MathText
                          text={formatOptionLabel(opt, optIndex)}
                          className="flex-1 min-w-0"
                        />
                      </label>
                    );
                  })}
                </div>

                {submitted && isWrong && (
                  <div className="mt-4 ml-10 text-sm text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/60 rounded-xl p-3">
                    <span className="font-semibold text-brand-600">Giải thích: </span>
                    <MathText text={q.explanation} className="inline" />
                  </div>
                )}
                {submitted && isCorrect && q.explanation && (
                  <div className="mt-3 ml-10 text-xs text-emerald-700 dark:text-emerald-400">
                    <MathText text={q.explanation} />
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex flex-wrap items-center justify-between gap-4 card p-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitted || generating}
                className="btn-primary flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Nộp bài
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Làm lại
              </button>
            </div>
            <p className="text-lg font-bold text-brand-600">
              Điểm:{' '}
              {submitted && score !== null
                ? `${score}/${questions.length}`
                : `—/${questions.length}`}
            </p>
          </div>
        </motion.div>
      )}

      {questions.length === 0 && !generating && (
        <div className="card p-12 text-center text-slate-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">Chưa có đề luyện tập</p>
          <p className="text-sm mt-1">Chọn lớp, môn, chủ đề rồi nhấn Tạo đề</p>
        </div>
      )}
    </div>
  );
};

export default PracticeMode;
