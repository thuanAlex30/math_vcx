import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  Flame,
  TrendingUp,
  BookMarked,
  Award,
} from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { useHistoryStore } from '../store/historyStore';
import { SAMPLE_TOPICS } from '../data/sampleProblems';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { totalSolved, topics, streak } = useDashboardStore();
  const { history } = useHistoryStore();

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

  const stats = [
    {
      label: 'Bài đã học',
      value: totalSolved || history.length,
      icon: BookMarked,
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Chuỗi ngày',
      value: streak,
      icon: Flame,
      gradient: 'from-orange-500 to-rose-500',
    },
    {
      label: 'Tuần này',
      value: weekCount,
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Chủ đề',
      value: topics.filter((t) => t.count > 0).length,
      icon: Target,
      gradient: 'from-violet-500 to-purple-500',
    },
  ];

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-6 h-6 text-white" />
            </span>
            Bảng tiến độ
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 ml-14">
            Theo dõi hành trình học Toán của bạn
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.06 }}
                className="card p-6 relative overflow-hidden group"
              >
                <div
                  className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br ${s.gradient} opacity-20 group-hover:opacity-30 transition`}
                />
                <div
                  className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-4 shadow-md`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-3xl font-extrabold">{s.value}</p>
                <p className="text-sm text-slate-500 font-medium">{s.label}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6 lg:p-8">
            <h2 className="text-lg font-bold flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-amber-500" />
              Chủ đề thường luyện
            </h2>
            <div className="space-y-5">
              {mergedTopics.map((t, i) => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm font-medium mb-2">
                    <span>{t.name}</span>
                    <span className="text-slate-500">{t.count} bài</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(t.count / maxCount) * 100}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.6 }}
                      className={`h-full ${t.color} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 lg:p-8 flex flex-col">
            <h2 className="text-lg font-bold mb-4">Vừa học gần đây</h2>
            {recent.length === 0 ? (
              <p className="text-slate-500 text-sm flex-1">Chưa có hoạt động</p>
            ) : (
              <ul className="space-y-3 flex-1">
                {recent.map((h) => (
                  <li
                    key={h.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50"
                  >
                    <p className="font-medium text-sm line-clamp-1">{h.question}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(h.timestamp).toLocaleDateString('vi-VN')}
                      {h.topic ? ` · ${h.topic}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => navigate('/tutor')}
              className="btn-primary w-full mt-6"
            >
              Tiếp tục học
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
