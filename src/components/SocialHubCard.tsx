import React, { useState } from 'react';
import { Sparkles, Trophy, Lightbulb, Zap, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QuestionOfTheDayPanel } from './QuestionOfTheDayPanel';
import { SocialChallengesPanel } from './SocialChallengesPanel';
import { LearningCoachPanel } from './LearningCoachPanel';
import { MathSRReviewPanel } from './MathSRReviewPanel';

type SocialTab = 'qotd' | 'challenges' | 'coach' | 'sr';

const SocialHubCard: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SocialTab>('qotd');

  const tabs: { id: SocialTab; label: string; icon: React.ElementType }[] = [
    { id: 'qotd', label: 'Câu hỏi ngày', icon: Zap },
    { id: 'challenges', label: 'Thử thách', icon: Trophy },
    { id: 'coach', label: 'Huấn luyện viên', icon: Lightbulb },
    { id: 'sr', label: 'Ôn tập SR', icon: BookOpen },
  ];

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">Hoạt động cộng đồng</h2>
        </div>
        <button
          type="button"
          onClick={() => navigate('/demo-features')}
          className="text-xs text-brand-600 hover:text-brand-700 font-medium"
        >
          Xem tất cả →
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 px-4 pt-4">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                tab === t.id
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="px-4 pb-5 pt-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {tab === 'qotd' && <QuestionOfTheDayPanel />}
            {tab === 'challenges' && <SocialChallengesPanel compact />}
            {tab === 'coach' && <LearningCoachPanel />}
            {tab === 'sr' && <MathSRReviewPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SocialHubCard;
