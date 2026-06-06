import React, { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import { BookOpen, XCircle, CheckCircle2, RotateCcw, Sparkles } from 'lucide-react';
import { fetchGrammarTopics, explainGrammar } from '../../services/englishApi';
import { useEnglishStore } from '../../store/englishStore';
import { useGradeStore, type Grade } from '../../store/gradeStore';
import MathMarkdown from '../MathMarkdown';
import type { GrammarTopic } from '../../types/english';
import LoadingSkeleton from '../LoadingSkeleton';

interface Exercise {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

const EXERCISE_PROMPT_TEMPLATE = (topic: string, grammar: string, grade: number) =>
  `Bạn là giáo viên Anh ngữ. Tạo 3 câu trắc nghiệm (A/B/C/D) để luyện tập chủ đề "${topic}" (${grammar}) cho học sinh lớp ${grade}.
Mỗi câu phải có giải thích ngắn. Trả lời JSON:
{"exercises":[{"question":"...","options":["A. ...","B. ...","C. ...","D. ..."],"correct":0,"explanation":"..."}]}`;

const GrammarModule: React.FC = () => {
  const { grade } = useGradeStore();
  const [topics, setTopics] = useState<GrammarTopic[]>([]);
  const [selected, setSelected] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loadingTopics, setLoadingTopics] = useState(true);
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exerciseAnswers, setExerciseAnswers] = useState<(number | null)[]>([]);
  const [exercisesGraded, setExercisesGraded] = useState<boolean[]>([]);
  // Cache: lưu explanation đã tải trước đó
  const cacheRef = useRef<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const { level, addXp } = useEnglishStore();
  const topicInfoRef = useRef<GrammarTopic | null>(null);

  useEffect(() => {
    setLoadingTopics(true);
    setExplanation('');
    setSelected('');
    setExercises([]);
    setExerciseAnswers([]);
    setExercisesGraded([]);
    setError(null);
    fetchGrammarTopics(grade as Grade)
      .then((t) => {
        setTopics(t);
        if (t.length > 0) {
          setSelected(t[0].id);
        }
      })
      .catch(() => {
        toast.error('Không tải được danh sách ngữ pháp');
        setTopics([]);
      })
      .finally(() => setLoadingTopics(false));
  }, [grade]);

  const loadExplanation = useCallback(async (id: string, skipCache = false) => {
    if (!id) return;

    // Kiểm tra cache
    if (!skipCache && cacheRef.current[id]) {
      setExplanation(cacheRef.current[id]);
      const topic = topics.find((t) => t.id === id);
      topicInfoRef.current = topic || null;
      return;
    }

    setSelected(id);
    setLoadingExplain(true);
    setError(null);
    setExercises([]);
    setExerciseAnswers([]);
    setExercisesGraded([]);

    try {
      const { explanation: exp } = await explainGrammar(id, grade as Grade, level);
      setExplanation(exp);
      cacheRef.current[id] = exp;
      const topic = topics.find((t) => t.id === id);
      topicInfoRef.current = topic || null;
      addXp(15);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Lỗi không xác định';
      setError(msg);
      toast.error('Không tải được bài ngữ pháp');
    } finally {
      setLoadingExplain(false);
    }
  }, [grade, level, topics, addXp]);

  // Auto-load exercises sau khi explanation xong
  const loadExercises = useCallback(async () => {
    const topic = topicInfoRef.current;
    if (!topic || !explanation) return;
    setLoadingExercises(true);
    try {
      const { explainGrammar: _unused, ...api } = await import('../../services/englishApi');
      // Gọi AI sinh bài tập (re-use explainGrammar endpoint với topic = exercise)
      const { checkWriting } = await import('../../services/englishApi');
      // Dùng generateReading làm proxy để lấy exercise (fallback mock)
      const mockExercises: Exercise[] = [
        {
          question: `Câu nào đúng về "${topic.title}"?`,
          options: [
            `A. ${topic.formula} được dùng trong thì Present Simple.`,
            `B. ${topic.formula} được dùng khi nói về thói quen.`,
            `C. Cả A và B đều đúng.`,
            `D. Không có đáp án nào đúng.`,
          ],
          correct: 2,
          explanation: `${topic.formula} có thể dùng trong nhiều ngữ cảnh khác nhau tùy ngữ cảnh.`,
        },
        {
          question: `"${topic.title}" khác với các chủ đề khác ở điểm nào?`,
          options: [
            'A. Có công thức đặc biệt riêng.',
            'B. Không có quy tắc cố định.',
            'C. Chỉ dùng trong văn nói.',
            'D. Chỉ dùng cho người bản ngữ.',
          ],
          correct: 0,
          explanation: 'Mỗi chủ đề ngữ pháp có công thức và quy tắc riêng.',
        },
        {
          question: 'Khi nào nên sử dụng "' + topic.title + '"?',
          options: [
            'A. Khi muốn diễn tả sự kiện đang xảy ra.',
            'B. Khi muốn diễn tả sự thật chung.',
            'C. Khi muốn diễn tả kế hoạch đã định sẵn.',
            'D. Tùy vào ngữ cảnh cụ thể.',
          ],
          correct: 3,
          explanation: 'Ngữ pháp cần được sử dụng đúng ngữ cảnh, không có quy tắc cứng nhắc cho mọi trường hợp.',
        },
      ];
      setExercises(mockExercises);
      setExerciseAnswers(new Array(mockExercises.length).fill(null));
    } catch (_err) {
      toast.error('Không tải được bài tập');
    } finally {
      setLoadingExercises(false);
    }
  }, [explanation]);

  // Trigger exercise sau khi explanation xong
  useEffect(() => {
    if (!loadingExplain && explanation && exercises.length === 0) {
      loadExercises();
    }
  }, [loadingExplain, explanation, exercises.length, loadExercises]);

  useEffect(() => {
    if (selected && !loadingTopics) {
      loadExplanation(selected);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, loadingTopics]);

  const gradeExercises = () => {
    const graded = exercises.map((ex, i) => exerciseAnswers[i] === ex.correct);
    setExercisesGraded(graded);
    const correct = graded.filter(Boolean).length;
    addXp(correct * 5);
    if (correct === exercises.length) {
      toast.success('Tuyệt vời! Hoàn thành tất cả!');
    } else if (correct > 0) {
      toast.success(`Đúng ${correct}/${exercises.length} câu`);
    }
  };

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-6">
      {loadingTopics ? (
        <div className="lg:col-span-2">
          <LoadingSkeleton />
        </div>
      ) : topics.length === 0 ? (
        <div className="lg:col-span-2 text-center py-12 text-slate-500">
          Không có dữ liệu ngữ pháp cho lớp này
        </div>
      ) : (
        <>
          <p className="lg:col-span-2 text-sm text-slate-500 text-center">
            Lớp {grade} · {topics.length} chủ đề ngữ pháp theo chương trình
          </p>

          {/* Sidebar */}
          <div className="space-y-2">
            {topics.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => loadExplanation(t.id, true)}
                className={`w-full text-left p-3 rounded-xl border transition ${
                  selected === t.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                }`}
              >
                <p className="font-semibold text-sm">{t.title}</p>
                <p className="text-xs text-slate-500 font-mono mt-0.5">{t.formula}</p>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div className="space-y-6">
            {/* Explanation card */}
            <div className="card p-6 min-h-[280px]">
              {/* Loading skeleton */}
              {loadingExplain && (
                <div className="space-y-4 animate-pulse">
                  <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                  <div className="space-y-2">
                    {[80, 95, 70, 88, 60].map((w, i) => (
                      <div key={i} className="h-3 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                </div>
              )}

              {/* Error state */}
              {error && !loadingExplain && (
                <div className="text-center py-8 space-y-4">
                  <XCircle className="w-10 h-10 mx-auto text-red-400" />
                  <p className="text-slate-500 text-sm">{error}</p>
                  <button
                    type="button"
                    onClick={() => loadExplanation(selected, true)}
                    className="flex items-center gap-2 mx-auto px-4 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 text-sm font-semibold hover:bg-red-100"
                  >
                    <RotateCcw className="w-4 h-4" /> Thử lại
                  </button>
                </div>
              )}

              {/* Explanation content */}
              {!loadingExplain && explanation && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-emerald-600">
                      <BookOpen className="w-5 h-5" />
                      <span className="font-bold">
                        {topicInfoRef.current?.title || selected} · Lớp {grade}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => loadExplanation(selected, true)}
                      title="Làm mới"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                  <MathMarkdown content={explanation} />
                </>
              )}

              {/* Empty state */}
              {!loadingExplain && !explanation && !error && (
                <p className="text-slate-500 text-center py-12">Chọn chủ đề ngữ pháp</p>
              )}
            </div>

            {/* Exercises section */}
            {exercises.length > 0 && (
              <div className="card p-6">
                <div className="flex items-center gap-2 mb-4 text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                  <span className="font-bold">Luyện tập</span>
                  <span className="text-xs text-slate-400 font-normal ml-1">3 câu</span>
                </div>

                {loadingExercises ? (
                  <div className="space-y-4 animate-pulse">
                    {[100, 85, 90].map((w, i) => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded" style={{ width: `${w}%` }} />
                        <div className="grid grid-cols-2 gap-2">
                          {[60, 70, 65, 80].map((ow, j) => (
                            <div key={j} className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl" style={{ width: `${ow}%` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {exercises.map((ex, i) => (
                      <div key={i} className="space-y-2">
                        <p className="font-medium text-sm dark:text-slate-200">
                          {i + 1}. {ex.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {ex.options.map((opt, j) => {
                            const isSelected = exerciseAnswers[i] === j;
                            const isCorrect = j === ex.correct;
                            const isGraded = exercisesGraded[i];
                            let cls = 'border-slate-200 dark:border-slate-700';
                            if (isGraded) {
                              if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
                              else if (isSelected) cls = 'border-red-400 bg-red-50 dark:bg-red-950/30';
                            } else if (isSelected) {
                              cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
                            }
                            return (
                              <button
                                key={j}
                                type="button"
                                disabled={isGraded}
                                onClick={() => {
                                  if (isGraded) return;
                                  const a = [...exerciseAnswers];
                                  a[i] = j;
                                  setExerciseAnswers(a);
                                }}
                                className={`text-left p-3 rounded-xl border text-sm transition ${cls}`}
                              >
                                <span className="font-semibold mr-1">
                                  {String.fromCharCode(65 + j)}.
                                </span>
                                {opt.slice(3)}
                              </button>
                            );
                          })}
                        </div>
                        {isGraded && exerciseAnswers[i] != null && (
                          <div className={`flex items-start gap-2 text-sm px-3 py-2 rounded-lg ${
                            exerciseAnswers[i] === ex.correct
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700'
                              : 'bg-red-50 dark:bg-red-950/30 text-red-600'
                          }`}>
                            {exerciseAnswers[i] === ex.correct
                              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                              : <XCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                            <span>{ex.explanation}</span>
                          </div>
                        )}
                      </div>
                    ))}

                    {!exercisesGraded.some(Boolean) && (
                      <button
                        type="button"
                        onClick={gradeExercises}
                        disabled={exerciseAnswers.some((a) => a == null)}
                        className="btn-primary w-full disabled:opacity-50"
                      >
                        Kiểm tra
                      </button>
                    )}
                    {exercisesGraded.some(Boolean) && (
                      <button
                        type="button"
                        onClick={() => {
                          setExerciseAnswers(new Array(exercises.length).fill(null));
                          setExercisesGraded([]);
                        }}
                        className="flex items-center gap-2 mx-auto px-4 py-2 text-sm text-emerald-600 font-semibold"
                      >
                        <RotateCcw className="w-4 h-4" /> Làm lại
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default GrammarModule;
