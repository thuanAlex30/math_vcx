import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Brain, Gauge, User, Mic2, LayoutGrid, MessageCircle, ClipboardList } from 'lucide-react';
import ProblemInput from '../components/ProblemInput';
import PracticeMode from '../components/PracticeMode';
import GradeSubjectSelector from '../components/GradeSubjectSelector';
import SolutionSteps from '../components/SolutionSteps';
import VisualizationPanel from '../components/VisualizationPanel';
import ChatPanel from '../components/ChatPanel';
import LoadingSkeleton from '../components/LoadingSkeleton';
import AudioPlayer from '../components/AudioPlayer';
import MathMarkdown from '../components/MathMarkdown';
import { solveMathStream, sendChat } from '../services/api';
import { useTutorStore } from '../store/tutorStore';
import { useHistoryStore, detectTopic } from '../store/historyStore';
import { useDashboardStore } from '../store/dashboardStore';
import type { SolutionStep } from '../types';

function parseStepsFromText(text: string): SolutionStep[] {
  const steps: SolutionStep[] = [];
  const regex = /\*\*(.*?)\*\*:?/g;
  const matches = [...text.matchAll(regex)];
  if (matches.length === 0) {
    return [{ id: 'full', title: 'Lời giải', content: text }];
  }
  for (let i = 0; i < matches.length; i++) {
    const title = matches[i][1].trim();
    const start = matches[i].index! + matches[i][0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index! : text.length;
    steps.push({ id: `step-${i}`, title, content: text.slice(start, end).trim() });
  }
  return steps;
}

type Tab = 'solution' | 'graph' | 'chat';
type TutorMode = 'solve' | 'practice';

const STUDENT_SESSION_KEY = 'mathmaster-student-session';
const TUTOR_MODE_KEY = 'giasu-tutor-mode';

function getInitialMode(): TutorMode {
  if (typeof window === 'undefined') return 'solve';
  const saved = localStorage.getItem(TUTOR_MODE_KEY);
  return saved === 'practice' ? 'practice' : 'solve';
}

/** Session ID ổn định trên trình duyệt — dùng cho Graph RAG profile backend */
function getStudentSessionId(): string {
  let id = localStorage.getItem(STUDENT_SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STUDENT_SESSION_KEY, id);
  }
  return id;
}

const TutorPage: React.FC = () => {
  const {
    question,
    image,
    solution,
    steps,
    visualization,
    isLoading,
    chatMessages,
    expandedSteps,
    speechRate,
    voice,
    setQuestion,
    setImage,
    setSolution,
    appendSolution,
    setLoading,
    addChatMessage,
    toggleStep,
    setSpeechRate,
    setVoice,
    reset,
  } = useTutorStore();

  const { addToHistory } = useHistoryStore();
  const { recordSolve } = useDashboardStore();
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('solution');
  const [mode, setMode] = useState<TutorMode>(getInitialMode);

  const switchMode = (next: TutorMode) => {
    setMode(next);
    localStorage.setItem(TUTOR_MODE_KEY, next);
  };

  const handleSolve = async () => {
    if (!question.trim() && !image) {
      toast.error('Vui lòng nhập đề bài hoặc tải ảnh');
      return;
    }

    reset();
    setLoading(true);
    setSolution('', [], null);
    setActiveTab('solution');

    try {
      let streamDone = false;
      await solveMathStream(
        {
          question,
          image: image || undefined,
          studentSessionId: getStudentSessionId(),
        },
        (token) => appendSolution(token),
        (payload) => {
          streamDone = true;
          const finalSolution =
            payload.solution || useTutorStore.getState().solution;
          const finalSteps = payload.steps?.length
            ? payload.steps
            : parseStepsFromText(finalSolution);
          setSolution(finalSolution, finalSteps, payload.visualization ?? null);
          saveResult(
            payload.question || question,
            finalSolution,
            payload.visualization ?? null
          );
        }
      );
      if (!streamDone) {
        const st = useTutorStore.getState();
        if (st.solution) {
          setSolution(st.solution, parseStepsFromText(st.solution), null);
          saveResult(question, st.solution, null);
        }
      }
      toast.success('Đã giải xong!');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const saveResult = (
    q: string,
    sol: string,
    viz: typeof visualization
  ) => {
    const topic = detectTopic(q);
    addToHistory({
      id: Date.now().toString(),
      question: q,
      solution: sol,
      timestamp: new Date().toISOString(),
      topic,
      visualization: viz,
    });
    recordSolve(topic);
  };

  const handleChat = async (text: string) => {
    if (!solution) {
      toast.error('Hãy giải bài trước khi chat');
      return;
    }
    addChatMessage({ role: 'user', content: text });
    setChatLoading(true);
    try {
      const msgs = [...chatMessages, { role: 'user' as const, content: text }];
      const { reply } = await sendChat(msgs, { question, solution });
      addChatMessage({ role: 'assistant', content: reply });
    } catch {
      toast.error('Không gửi được tin nhắn');
    } finally {
      setChatLoading(false);
    }
  };

  const displaySteps =
    steps.length > 0 ? steps : solution ? parseStepsFromText(solution) : [];

  const tabs: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
    { id: 'solution', label: 'Lời giải', icon: Brain },
    { id: 'graph', label: 'Minh họa', icon: LayoutGrid },
    { id: 'chat', label: 'Hỏi thêm', icon: MessageCircle },
  ];

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Brain className="w-6 h-6 text-white" />
            </span>
            Phòng học AI
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 ml-14 max-w-xl">
            {mode === 'solve'
              ? 'Nhập đề bên trái · Xem lời giải, đồ thị và nghe giọng gia sư bên phải'
              : 'Chọn lớp, chủ đề · Làm 5 câu trắc nghiệm do AI sinh'}
          </p>

          <div className="flex gap-2 p-1.5 rounded-2xl glass-card mt-6 ml-0 sm:ml-14 max-w-md">
            <button
              type="button"
              onClick={() => switchMode('solve')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                mode === 'solve'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Brain className="w-4 h-4" />
              Gia sư AI
            </button>
            <button
              type="button"
              onClick={() => switchMode('practice')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                mode === 'practice'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ClipboardList className="w-4 h-4" />
              Luyện tập
            </button>
          </div>
        </motion.header>

        {mode === 'practice' ? (
          <PracticeMode />
        ) : (
        <div className="grid xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6 lg:gap-8">
          <div className="space-y-6">
            <div className="card p-4">
              <GradeSubjectSelector showSubject={false} />
            </div>
            <ProblemInput
              question={question}
              image={image}
              isLoading={isLoading}
              onQuestionChange={setQuestion}
              onImageChange={setImage}
              onSolve={handleSolve}
            />

            <div className="card p-5 hidden xl:block">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Mic2 className="w-4 h-4" />
                Cài đặt giọng đọc
              </h3>
              <div className="flex gap-2 mb-4">
                {(['female', 'male'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVoice(v)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium text-sm transition ${
                      voice === v
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/50 text-brand-700 dark:text-brand-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
                    }`}
                  >
                    <User className="w-4 h-4" />
                    {v === 'female' ? 'Cô My' : 'Thầy Minh'}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Gauge className="w-4 h-4 shrink-0" />
                <input
                  type="range"
                  min="0.85"
                  max="1.25"
                  step="0.05"
                  value={speechRate}
                  onChange={(e) => setSpeechRate(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="w-10 font-semibold text-brand-600">{speechRate.toFixed(2)}x</span>
              </label>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2 p-1.5 rounded-2xl glass-card">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-brand-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'solution' && (
              <motion.div
                key="sol"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="card p-6 lg:p-8"
              >
                <div className="flex flex-col gap-4 mb-6">
                  <h2 className="text-xl font-bold">Lời giải chi tiết</h2>
                  {solution && (
                    <>
                      <AudioPlayer
                        text={solution}
                        speechRate={speechRate}
                        voice={voice}
                      />
                      <div className="xl:hidden flex gap-2">
                        {(['female', 'male'] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setVoice(v)}
                            className={`chip ${voice === v ? 'ring-2 ring-brand-500' : ''}`}
                          >
                            {v === 'female' ? 'Cô My' : 'Thầy Minh'}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {isLoading && !solution && <LoadingSkeleton />}
                {isLoading && solution && (
                  <div>
                    <MathMarkdown content={solution} />
                    <p className="text-sm text-brand-600 mt-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
                      AI đang viết tiếp...
                    </p>
                  </div>
                )}
                {!isLoading && solution && displaySteps.length > 0 && (
                  <SolutionSteps
                    steps={displaySteps}
                    expandedSteps={expandedSteps}
                    onToggle={toggleStep}
                    speechRate={speechRate}
                    voice={voice}
                  />
                )}
                {!isLoading && !solution && (
                  <div className="text-center py-20">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      <Brain className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-slate-500 font-medium">Chưa có lời giải</p>
                    <p className="text-sm text-slate-400 mt-1">Nhập đề và nhấn Giải bài</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'graph' && (
              <motion.div key="graph" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <VisualizationPanel visualization={visualization} />
              </motion.div>
            )}

            {activeTab === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <ChatPanel
                  messages={chatMessages}
                  onSend={handleChat}
                  disabled={!solution}
                  isTyping={chatLoading}
                />
              </motion.div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default TutorPage;
