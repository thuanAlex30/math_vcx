import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  useOnboardingStore,
  type LearningGoal,
  type StudyTimeSlot,
  type PreferredStyle,
} from '../../store/onboardingStore';
import { useGradeStore, GRADES } from '../../store/gradeStore';

const GOALS: { id: LearningGoal; label: string }[] = [
  { id: 'on_grade', label: 'Ôn theo chương trình lớp' },
  { id: 'thpt', label: 'Luyện thi THPT Quốc gia' },
  { id: 'english_exam', label: 'Nâng band / ôn thi Anh' },
  { id: 'daily_practice', label: 'Luyện đều mỗi ngày' },
];

const SLOTS: { id: StudyTimeSlot; label: string }[] = [
  { id: 'morning', label: 'Sáng' },
  { id: 'afternoon', label: 'Chiều' },
  { id: 'evening', label: 'Tối' },
  { id: 'weekend', label: 'Cuối tuần' },
];

const STYLES: { id: PreferredStyle; label: string }[] = [
  { id: 'read', label: 'Đọc lời giải' },
  { id: 'tts', label: 'Nghe TTS' },
  { id: 'graph', label: 'Xem đồ thị' },
  { id: 'chat', label: 'Hỏi chat trước' },
];

const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate();
  const { grade, setGrade } = useGradeStore();
  const { completeOnboarding } = useOnboardingStore();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [goals, setGoals] = useState<LearningGoal[]>(['on_grade']);
  const [slots, setSlots] = useState<StudyTimeSlot[]>(['evening']);
  const [minutes, setMinutes] = useState<15 | 30 | 45 | 60>(30);
  const [style, setStyle] = useState<PreferredStyle>('read');

  const toggleGoal = (g: LearningGoal) => {
    setGoals((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const toggleSlot = (s: StudyTimeSlot) => {
    setSlots((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const finish = () => {
    completeOnboarding({
      name: name.trim(),
      goals,
      studySlots: slots,
      dailyMinutes: minutes,
      preferredStyle: style,
    });
    const displayName = name.trim() || 'bạn';
    toast.success(`Chào ${displayName}! Hôm nay em bắt đầu với 3 việc nhé →`);
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Chào em!</h2>
              <p className="text-sm text-slate-500">Thiết lập nhanh — khoảng 60 giây</p>
            </div>
          </div>

          <div className="flex gap-1.5 mb-8">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <label className="block text-sm font-semibold mb-2">Em tên gì? (không bắt buộc)</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Minh"
                  className="input-field w-full"
                  autoFocus
                />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">Lớp</label>
                  <div className="flex flex-wrap gap-2">
                    {GRADES.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGrade(g)}
                        className={`chip ${grade === g ? 'ring-2 ring-brand-500 bg-brand-50 dark:bg-brand-950/40' : ''}`}
                      >
                        Lớp {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Mục tiêu học tập</label>
                  <div className="space-y-2">
                    {GOALS.map((g) => (
                      <label key={g.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={goals.includes(g.id)}
                          onChange={() => toggleGoal(g.id)}
                          className="accent-brand-600"
                        />
                        <span className="text-sm font-medium">{g.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold mb-2">Giờ rảnh thường học</label>
                  <div className="flex flex-wrap gap-2">
                    {SLOTS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => toggleSlot(s.id)}
                        className={`chip ${slots.includes(s.id) ? 'ring-2 ring-brand-500' : ''}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Thời lượng mục tiêu / ngày</label>
                  <div className="grid grid-cols-4 gap-2">
                    {([15, 30, 45, 60] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMinutes(m)}
                        className={`py-3 rounded-xl text-sm font-bold border-2 transition ${
                          minutes === m
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {m}p
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <label className="block text-sm font-semibold mb-2">Em thích học kiểu nào? (tùy chọn)</label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setStyle(s.id)}
                      className={`p-4 rounded-xl text-sm font-medium border-2 transition ${
                        style === s.id
                          ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Quay lại
              </button>
            )}
            <button
              type="button"
              onClick={() => (step < 3 ? setStep((s) => s + 1) : finish())}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {step < 3 ? (
                <>Tiếp tục <ChevronRight className="w-4 h-4" /></>
              ) : (
                'Bắt đầu học!'
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingWizard;
