import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  User,
  Edit3,
  Save,
  X,
  Star,
  Flame,
  Clock,
  Trophy,
  BookOpen,
  TrendingUp,
  ChevronRight,
  LogOut,
  Sparkles,
  CheckCircle2,
  Award,
  GraduationCap,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useOnboardingStore } from '../store/onboardingStore';
import { useEnglishStore, levelFromXp } from '../store/englishStore';
import { useGradeStore, GRADES } from '../store/gradeStore';
import { useMathGamificationStore } from '../store/mathGamificationStore';
import { useHistoryStore } from '../store/historyStore';
import { useLearningStyleStore } from '../store/learningStyleStore';
import ConfirmModal from '../components/ConfirmModal';
import LoadingSkeleton from '../components/LoadingSkeleton';

const GOAL_LABELS: Record<string, string> = {
  on_grade: 'Ôn theo chương trình lớp',
  thpt: 'Luyện thi THPT',
  english_exam: 'Nâng band / ôn thi Anh',
  daily_practice: 'Luyện tập đều mỗi ngày',
};

const STYLE_LABELS: Record<string, string> = {
  read: '📖 Đọc lời giải',
  tts: '🎧 Nghe TTS',
  graph: '📊 Xem đồ thị',
  chat: '💬 Hỏi chat trước',
};

const SKILL_COLORS: Record<string, string> = {
  vocabulary: 'from-violet-500 to-purple-600',
  grammar: 'from-blue-500 to-cyan-500',
  pronunciation: 'from-rose-500 to-pink-500',
  listening: 'from-amber-500 to-orange-500',
  reading: 'from-teal-500 to-emerald-500',
  writing: 'from-indigo-500 to-violet-500',
  chat: 'from-emerald-500 to-green-600',
};

const SKILL_ICONS: Record<string, string> = {
  vocabulary: '📚',
  grammar: '🧠',
  pronunciation: '🎤',
  listening: '🎧',
  reading: '📰',
  writing: '✍️',
  chat: '💬',
};

const ProfilePage: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { name, goals, studySlots, dailyMinutes, preferredStyle } = useOnboardingStore();
  const { xp, streak, badges, wordsLearned, weeklyProgress, pronunciationScore, listeningScore, writingScore, readingScore } = useEnglishStore();
  const { grade, setGrade } = useGradeStore();
  const { points, streak: mathStreak } = useMathGamificationStore();
  const { history } = useHistoryStore();
  const { dataSaver } = useLearningStyleStore();
  const englishLevel = levelFromXp(xp);

  const [editingName, setEditingName] = useState(false);
  const [editName, setEditName] = useState(name);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Calculate stats
  const totalStudyMinutes = weeklyProgress.reduce((a, b) => a + b, 0);
  const unlockedBadges = badges.filter((b) => b.unlocked);
  const maxXp = Math.max(...weeklyProgress, 1);
  const totalSolved = history.length;
  const thisWeekXp = weeklyProgress.reduce((a, b) => a + b, 0);

  const skillScores = { pronunciation: pronunciationScore, listening: listeningScore, writing: writingScore, reading: readingScore };

  const handleSaveName = () => {
    const { completeOnboarding } = useOnboardingStore.getState();
    completeOnboarding({ name: editName.trim() });
    setEditingName(false);
    toast.success('Đã lưu tên!');
  };

  const handleLogout = async () => {
    setLoading(true);
    await logout();
    setShowLogoutModal(false);
    window.location.href = '/auth';
  };

  const displayName = useOnboardingStore((s) => s.name);
  const goalsList = useOnboardingStore((s) => s.goals);
  const slotsList = useOnboardingStore((s) => s.studySlots);
  const stylePref = useOnboardingStore((s) => s.preferredStyle);
  const minutesPref = useOnboardingStore((s) => s.dailyMinutes);

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'vừa tham gia';

  // Recent activity from history
  const recentActivity = history.slice(-5).reverse().map((h) => ({
    date: new Date(h.timestamp).toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }),
    topic: h.topic || 'Toán',
    question: h.question.slice(0, 50) + (h.question.length > 50 ? '...' : ''),
  }));

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-3xl mx-auto px-4 space-y-6">

        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={displayName || 'Avatar'}
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-200 dark:ring-brand-800"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-3xl text-white font-bold shadow-lg">
                  {(displayName || user?.name || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="input-field flex-1 text-lg font-bold"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="p-2 rounded-xl bg-emerald-500 text-white">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingName(false); setEditName(displayName); }} className="p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {displayName || user?.name || 'Học sinh GiaSư AI'}
                      </h1>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="chip text-xs">
                          <GraduationCap className="w-3 h-3" />
                          Lớp {grade}
                        </span>
                        {user?.email && (
                          <span className="text-xs text-slate-400 truncate max-w-[200px]">{user.email}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Tham gia: {memberSince}</p>
                    </div>
                    <button
                      onClick={() => { setEditName(displayName); setEditingName(true); }}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
                      title="Đổi tên"
                    >
                      <Edit3 className="w-4 h-4 text-slate-500" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Overview */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          {[
            { icon: Star, label: 'Level', value: englishLevel, sub: `${xp} XP`, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { icon: Flame, label: 'Streak', value: streak, sub: 'ngày liên tiếp', color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
            { icon: Clock, label: 'Phút học', value: totalStudyMinutes || '–', sub: 'tuần này', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { icon: Award, label: 'Huy hiệu', value: unlockedBadges.length, sub: `/${badges.length} đã mở`, color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30' },
          ].map(({ icon: Icon, label, value, sub, color, bg }) => (
            <div key={label} className={`card p-4 ${bg}`}>
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{value}</p>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="text-[10px] text-slate-400">{sub}</p>
            </div>
          ))}
        </motion.div>

        {/* English Skills */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card p-5"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Kỹ năng Tiếng Anh
          </h2>
          <div className="space-y-3">
            {Object.entries({
              vocabulary: { label: 'Từ vựng', value: wordsLearned, unit: 'từ' },
              ...skillScores,
            }).map(([id, s]: [string, { label: string; value: number; unit: string }]) => (
              <div key={id} className="flex items-center gap-3">
                <span className="w-8 text-center">{SKILL_ICONS[id] || '📘'}</span>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{s.label}</span>
                    <span className="text-xs text-slate-400">{s.value}{s.unit}</span>
                  </div>
                  <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${SKILL_COLORS[id] || 'from-brand-500 to-brand-600'} transition-all duration-700`}
                      style={{ width: `${Math.min(100, s.value)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Tuần này:</p>
            <div className="flex gap-1">
              {weeklyProgress.map((val, i) => {
                const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                const h = maxXp > 0 ? Math.max(4, (val / maxXp) * 40) : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${days[i]}: ${val} XP`}>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-sm overflow-hidden" style={{ height: 40 }}>
                      <div
                        className="w-full bg-emerald-400 rounded-sm transition-all"
                        style={{ height: `${h}px`, marginTop: `${40 - h}px` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400">{days[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Học tập & Mục tiêu */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="card p-5 space-y-4"
        >
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-500" />
            Hồ sơ học tập
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Mục tiêu</p>
              <div className="space-y-1">
                {goalsList.map((g) => (
                  <p key={g} className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <span className="text-emerald-500">✓</span> {GOAL_LABELS[g] || g}
                  </p>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Phong cách học</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{STYLE_LABELS[stylePref] || stylePref}</p>
              <p className="text-xs text-slate-400 mt-1">
                {slotsList.map((s) => ({ morning: '☀️ Sáng', afternoon: '🌤️ Chiều', evening: '🌙 Tối', weekend: '🎉 Cuối tuần' }[s] || s)).join(' · ')} · {minutesPref}p/ngày
              </p>
            </div>
          </div>
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 mb-2">Cài đặt</p>
            <div className="flex flex-wrap gap-3 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={dataSaver} readOnly className="accent-brand-600" />
                <span className="text-slate-600 dark:text-slate-400">Tiết kiệm data</span>
              </label>
              <span className="text-xs text-slate-400 self-center">·</span>
              <span className="text-xs text-slate-400 self-center">Lớp {grade}</span>
              <span className="text-xs text-slate-400 self-center">·</span>
              <span className="text-xs text-slate-400 self-center">Đã giải {totalSolved} bài Toán</span>
            </div>
          </div>
        </motion.div>

        {/* Recent Activity */}
        {recentActivity.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card p-5"
          >
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" />
              Hoạt động gần đây
            </h2>
            <div className="space-y-3">
              {recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-400 mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{a.question}</p>
                      <span className="text-xs text-slate-400 shrink-0">{a.date}</span>
                    </div>
                    <span className="text-xs text-slate-400">{a.topic}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Account */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card p-5"
        >
          <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-slate-400" />
            Tài khoản
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Lớp</span>
              <select
                value={grade}
                onChange={(e) => setGrade(Number(e.target.value))}
                className="input-field w-auto text-sm py-1"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>Lớp {g}</option>
                ))}
              </select>
            </div>
            {user?.email && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Email</span>
                <span className="text-sm text-slate-500 truncate max-w-[200px]">{user.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Vai trò</span>
              <span className="chip text-xs">{user?.role === 'teacher' ? '👨‍🏫 Giáo viên' : '🎓 Học sinh'}</span>
            </div>
          </div>
          <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setShowLogoutModal(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-semibold text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </div>
        </motion.div>
      </div>

      <ConfirmModal
        open={showLogoutModal}
        title="Đăng xuất?"
        message="Em chắc chắn muốn đăng xuất chứ? Dữ liệu học tập vẫn được lưu trên thiết bị này."
        confirmLabel="Đăng xuất"
        cancelLabel="Ở lại"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </div>
  );
};

export default ProfilePage;
