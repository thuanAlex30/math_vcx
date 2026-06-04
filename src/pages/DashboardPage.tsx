import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Flame,
  TrendingUp,
  BookMarked,
  Award,
  Languages,
  Calculator,
  Headphones,
  Mic,
  PenLine,
  Trophy,
  Star,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useHistoryStore } from '../store/historyStore';
import { useEnglishStore, levelFromXp } from '../store/englishStore';
import { SAMPLE_TOPICS } from '../data/sampleProblems';
import SubjectSwitcher from '../components/SubjectSwitcher';
import { fetchLeaderboard } from '../services/englishApi';
import type { LeaderboardEntry } from '../types/english';

type DashTab = 'all' | 'math' | 'english';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<DashTab>('all');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const { totalSolved, topics, streak } = useDashboardStore();
  const { history } = useHistoryStore();
  const {
    xp,
    streak: enStreak,
    wordsLearned,
    studyMinutes,
    pronunciationScore,
    listeningScore,
    writingScore,
    weeklyProgress,
    badges,
  } = useEnglishStore();

  useEffect(() => {
    fetchLeaderboard().then(setLeaderboard).catch(() => {});
  }, [xp]);

  const mergedTopics = SAMPLE_TOPICS.map((sample) => {
    const stored = topics.find((t) => t.name === sample.name);
    return { ...sample, count: stored?.count ?? 0 };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...mergedTopics.map((t) => t.count), 1);
  const recent = history.slice(0, 5);
  const weekCount = history.filter((h) => {
    const d = new Date(h.timestamp);
    return Date.now() - d.getTime() < 7 * 86400000;
  }).length;

  const mathStats = [
    { label: 'Bài Toán đã học', value: totalSolved || history.length, icon: BookMarked, gradient: 'from-blue-500 to-cyan-500' },
    { label: 'Chuỗi ngày', value: streak, icon: Flame, gradient: 'from-orange-500 to-rose-500' },
    { label: 'Tuần này', value: weekCount, icon: TrendingUp, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Chủ đề Toán', value: topics.filter((t) => t.count > 0).length, icon: Target, gradient: 'from-violet-500 to-purple-500' },
  ];

  const englishStats = [
    { label: 'Giờ học', value: `${Math.floor(studyMinutes / 60)}h${studyMinutes % 60}m`, icon: Star, gradient: 'from-emerald-500 to-teal-500' },
    { label: 'Từ đã học', value: wordsLearned, icon: Languages, gradient: 'from-violet-500 to-purple-500' },
    { label: 'Phát âm', value: pronunciationScore || '—', icon: Mic, gradient: 'from-rose-500 to-pink-500' },
    { label: 'Nghe / Viết', value: `${listeningScore || '—'} / ${writingScore || '—'}`, icon: Headphones, gradient: 'from-amber-500 to-orange-500' },
  ];

  const showMath = tab === 'all' || tab === 'math';
  const showEnglish = tab === 'all' || tab === 'english';

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </span>
                Bảng tiến độ
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 ml-14">
                Theo dõi Toán & Tiếng Anh
              </p>
            </div>
            <SubjectSwitcher />
          </div>

          <div className="flex gap-2 mt-6 ml-0 md:ml-14">
            {([
              { id: 'all', label: 'Tất cả', icon: LayoutDashboard },
              { id: 'math', label: 'Toán', icon: Calculator },
              { id: 'english', label: 'Tiếng Anh', icon: Languages },
            ] as const).map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${
                    tab === t.id
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'card hover:border-brand-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </div>
        </motion.div>

        {showMath && (
          <>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-brand-600">
              <Calculator className="w-5 h-5" /> Toán học
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
              {mathStats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={s.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="card p-6 relative overflow-hidden">
                    <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-20`} />
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-extrabold">{s.value}</p>
                    <p className="text-sm text-slate-500 font-medium">{s.label}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mb-10">
              <div className="card p-6 lg:p-8">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-amber-500" />
                  Chủ đề Toán thường luyện
                </h2>
                <div className="space-y-5">
                  {mergedTopics.map((t, i) => (
                    <div key={t.name}>
                      <div className="flex justify-between text-sm font-medium mb-2">
                        <span>{t.name}</span>
                        <span className="text-slate-500">{t.count} bài</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(t.count / maxCount) * 100}%` }} transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }} className={`h-full ${t.color} rounded-full`} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-6 lg:p-8 flex flex-col">
                <h2 className="text-lg font-bold mb-4">Toán — vừa học gần đây</h2>
                {recent.length === 0 ? (
                  <p className="text-slate-500 text-sm flex-1">Chưa có hoạt động</p>
                ) : (
                  <ul className="space-y-3 flex-1">
                    {recent.map((h) => (
                      <li key={h.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                        <p className="font-medium text-sm line-clamp-1">{h.question}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(h.timestamp).toLocaleDateString('vi-VN')}
                          {h.topic ? ` · ${h.topic}` : ''}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
                <button type="button" onClick={() => navigate('/tutor')} className="btn-primary w-full mt-6">
                  Tiếp tục học Toán
                </button>
              </div>
            </div>
          </>
        )}

        {showEnglish && (
          <>
            <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-emerald-600">
              <Languages className="w-5 h-5" /> Tiếng Anh
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {englishStats.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="card p-6">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-3 shadow-md`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-2xl font-extrabold">{s.value}</p>
                    <p className="text-sm text-slate-500">{s.label}</p>
                  </motion.div>
                );
              })}
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mb-10">
              <div className="card p-6">
                <p className="text-sm text-slate-500">Level {levelFromXp(xp)} · {xp} XP · Streak {enStreak} ngày</p>
                <h3 className="font-bold mt-2 mb-4">Tiến độ tuần (XP)</h3>
                <div className="flex items-end gap-2 h-24">
                  {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d, i) => {
                    const v = weeklyProgress[i] || 0;
                    const max = Math.max(...weeklyProgress, 1);
                    return (
                      <div key={d} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full bg-emerald-500 rounded-t-lg transition-all" style={{ height: `${(v / max) * 100}%`, minHeight: v ? 4 : 0 }} />
                        <span className="text-[10px] text-slate-500">{d}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold flex items-center gap-2 mb-4">
                  <Trophy className="w-5 h-5 text-amber-500" /> Huy hiệu
                </h3>
                <div className="flex flex-wrap gap-2">
                  {badges.map((b) => (
                    <span
                      key={b.id}
                      className={`chip ${b.unlocked ? '' : 'opacity-40 grayscale'}`}
                      title={b.name}
                    >
                      {b.emoji} {b.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-bold mb-4">Bảng xếp hạng</h3>
                <ul className="space-y-2 text-sm">
                  {leaderboard.slice(0, 5).map((e) => (
                    <li key={e.rank} className={`flex justify-between p-2 rounded-lg ${e.isUser ? 'bg-emerald-50 dark:bg-emerald-950/40 font-bold' : ''}`}>
                      <span>#{e.rank} {e.name}</span>
                      <span className="text-slate-500">{e.xp} XP</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button type="button" onClick={() => navigate('/english')} className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold mb-10">
              Tiếp tục học Tiếng Anh
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
