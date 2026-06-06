import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  MessageSquare,
  Mic,
  LineChart,
  Sparkles,
  ArrowRight,
  BookOpen,
  Users,
  Star,
} from 'lucide-react';
import DailyPlanCard from '../components/profile/DailyPlanCard';
import { useOnboardingStore } from '../store/onboardingStore';
import { useDailyPlanStore } from '../store/dailyPlanStore';
import { useGradeStore } from '../store/gradeStore';
import { useLearningStyleStore } from '../store/learningStyleStore';
import {
  fetchDailyPlan,
  completeDailyTask,
  getStudentSessionId,
} from '../services/api';

const HomePage = () => {
  const navigate = useNavigate();
  const { completed } = useOnboardingStore();
  const { grade } = useGradeStore();
  const { preferredFormat } = useLearningStyleStore();
  const { tasks, setPlan, completeTask, pendingCount } = useDailyPlanStore();
  const [planLoading, setPlanLoading] = useState(false);
  const sessionId = getStudentSessionId();

  useEffect(() => {
    if (!completed) return;
    setPlanLoading(true);
    fetchDailyPlan(sessionId, grade, preferredFormat || undefined)
      .then((plan) => setPlan(plan.date, plan.tasks))
      .catch(() => {})
      .finally(() => setPlanLoading(false));
  }, [completed, sessionId, grade, preferredFormat, setPlan]);

  const handleCompleteTask = async (taskId: string) => {
    completeTask(taskId);
    try {
      await completeDailyTask(sessionId, taskId);
    } catch {
      /* local state đã cập nhật */
    }
  };

  const showDailyPlan = completed && pendingCount() > 0;

  const features = [
    {
      icon: Brain,
      title: 'Giải từng bước',
      description: 'Phân tích đề → Lý thuyết → Các bước → Đáp án, không bỏ sót bước trung gian',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Mic,
      title: 'Giọng neural Việt',
      description: 'Microsoft Edge TTS — giọng Cô My & Thầy Minh, tự nhiên như gia sư thật',
      color: 'from-violet-500 to-purple-500',
    },
    {
      icon: LineChart,
      title: 'Đồ thị & hình học',
      description: 'Desmos tương tác, minh họa tam giác, vector trực quan',
      color: 'from-indigo-500 to-blue-500',
    },
    {
      icon: MessageSquare,
      title: 'Chat gia sư',
      description: 'Hỏi tiếp sau khi giải — AI nhớ ngữ cảnh bài toán',
      color: 'from-emerald-500 to-teal-500',
    },
  ];

  const stats = [
    { value: '10K+', label: 'Học sinh' },
    { value: '50K+', label: 'Bài đã giải' },
    { value: '4.9', label: 'Đánh giá', icon: Star },
  ];

  return (
    <div className="pt-16">
      {showDailyPlan && (
        <section className="py-8 bg-gradient-to-b from-brand-50/80 to-transparent dark:from-brand-950/30">
          <div className="max-w-3xl mx-auto px-4">
            <DailyPlanCard
              tasks={tasks}
              loading={planLoading}
              onComplete={handleCompleteTask}
              compact
            />
          </div>
        </section>
      )}

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-brand-700 dark:text-brand-300 mb-6">
                <Sparkles className="w-4 h-4" />
                Gia sư AI #1 cho học sinh Việt Nam
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
                Học Toán
                <span className="gradient-text block mt-1">dễ hiểu hơn mỗi ngày</span>
              </h1>

              <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-xl leading-relaxed">
                Nhập đề hoặc chụp ảnh — AI giải chi tiết, vẽ đồ thị, đọc lời giải bằng giọng
                tiếng Việt neural. Giống Khan Academy kết hợp ChatGPT.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  type="button"
                  onClick={() => navigate('/tutor')}
                  className="btn-primary flex items-center justify-center gap-2 text-lg"
                >
                  Bắt đầu học ngay
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary flex items-center justify-center gap-2"
                >
                  <BookOpen className="w-5 h-5" />
                  Xem tiến độ
                </button>
              </div>

              <div className="flex flex-wrap gap-8">
                {stats.map((s) => (
                  <div key={s.label}>
                    <p className="text-2xl font-bold gradient-text flex items-center gap-1">
                      {s.value}
                      {s.icon && <s.icon className="w-5 h-5 text-amber-400 fill-amber-400" />}
                    </p>
                    <p className="text-sm text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative"
            >
              <div className="glass-card p-6 lg:p-8 shadow-glow animate-float">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200/80 dark:border-slate-700">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-600 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold">Gia sư AI</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Đang sẵn sàng
                    </p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300">
                    Giải phương trình x² + 5x + 6 = 0
                  </div>
                  {[
                    { step: '1', title: 'Phân tích đề', color: 'bg-blue-500' },
                    { step: '2', title: 'Lý thuyết', color: 'bg-indigo-500' },
                    { step: '3', title: 'Các bước giải', color: 'bg-violet-500' },
                  ].map((item) => (
                    <div
                      key={item.step}
                      className="flex items-center gap-3 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <span className={`w-7 h-7 rounded-lg ${item.color} text-white text-xs font-bold flex items-center justify-center`}>
                        {item.step}
                      </span>
                      <span className="font-medium">{item.title}</span>
                    </div>
                  ))}
                  <div className="p-3 rounded-2xl bg-brand-50 dark:bg-brand-950/50 border border-brand-200/50 dark:border-brand-800/50">
                    <p className="text-xs text-brand-600 dark:text-brand-400 font-medium mb-1">Đáp án</p>
                    <p className="font-semibold">x₁ = -2, x₂ = -3</p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                  <Mic className="w-4 h-4 text-brand-500" />
                  Nghe giải thích · Giọng neural tiếng Việt
                </div>
              </div>

              <div className="absolute -z-10 -bottom-6 -right-6 w-full h-full rounded-3xl bg-gradient-to-br from-brand-400/30 to-violet-400/20 blur-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* English section — additive */}
      <section className="py-16 lg:py-24 bg-gradient-to-br from-emerald-50/80 to-teal-50/50 dark:from-emerald-950/20 dark:to-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-sm font-bold mb-4">
                🌍 Mới — Tiếng Anh
              </span>
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
                Học Tiếng Anh
                <span className="block text-emerald-600">như Duolingo + ChatGPT</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Từ vựng flashcard, ngữ pháp AI, luyện phát âm microphone, nghe-đọc-viết,
                hội thoại với giáo viên AI — XP, level, streak và huy hiệu.
              </p>
              <button
                type="button"
                onClick={() => navigate('/english')}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-500 dark:to-teal-500 text-white font-bold shadow-lg hover:scale-105 transition"
              >
                Vào lớp Tiếng Anh
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {['📚 Từ vựng', '📝 Ngữ pháp', '🎤 Phát âm', '👂 Nghe', '📖 Đọc', '✍️ Viết', '💬 Chat AI', '🏆 XP'].map(
                (item) => (
                  <div key={item} className="card p-4 text-sm font-semibold text-center">
                    {item}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="section-title gradient-text mb-4">Tại sao chọn GiaSư AI?</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Thiết kế cho học sinh THCS, THPT — học mọi lúc, mọi nơi
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  viewport={{ once: true }}
                  whileHover={{ y: -6 }}
                  className="card p-6 group cursor-default"
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    {f.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            whileInView={{ scale: [0.98, 1] }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-600 via-indigo-600 to-violet-600 dark:from-brand-500 dark:via-indigo-500 dark:to-violet-500 p-10 md:p-14 text-center shadow-glow"
          >
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZG9kZCI+PGcgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTMwVjBoLTJ2NGg0djJoLTJ6TTYgMzRWMGgydjRoLTJ6bTMwIDMwVjMwaDJ2MzRoLTR2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
            <Users className="w-12 h-12 text-white/80 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 relative">
              Sẵn sàng chinh phục Toán?
            </h2>
            <p className="text-white/90 text-lg mb-8 relative max-w-lg mx-auto">
              Miễn phí · Không cần đăng ký · Bắt đầu trong 10 giây
            </p>
            <button
              type="button"
              onClick={() => navigate('/tutor')}
              className="relative bg-white text-brand-700 px-10 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition shadow-xl"
            >
              Vào phòng học ngay
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
