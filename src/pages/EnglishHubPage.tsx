import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Languages,
  BookOpen,
  Mic,
  Headphones,
  PenLine,
  MessageCircle,
  Sparkles,
  Flame,
  Trophy,
  Star,
} from 'lucide-react';
import { useEnglishStore, levelFromXp } from '../store/englishStore';
import VocabModule from '../components/english/VocabModule';
import GrammarModule from '../components/english/GrammarModule';
import PronunciationModule from '../components/english/PronunciationModule';
import ListeningModule from '../components/english/ListeningModule';
import ReadingModule from '../components/english/ReadingModule';
import WritingModule from '../components/english/WritingModule';
import EnglishChatModule from '../components/english/EnglishChatModule';
import type { EnglishSkill } from '../types/english';

const SKILLS: { id: EnglishSkill; label: string; icon: typeof BookOpen; color: string }[] = [
  { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen, color: 'from-violet-500 to-purple-600' },
  { id: 'grammar', label: 'Ngữ pháp', icon: Sparkles, color: 'from-blue-500 to-cyan-500' },
  { id: 'pronunciation', label: 'Phát âm', icon: Mic, color: 'from-rose-500 to-pink-500' },
  { id: 'listening', label: 'Nghe', icon: Headphones, color: 'from-amber-500 to-orange-500' },
  { id: 'reading', label: 'Đọc', icon: BookOpen, color: 'from-teal-500 to-emerald-500' },
  { id: 'writing', label: 'Viết', icon: PenLine, color: 'from-indigo-500 to-violet-500' },
  { id: 'chat', label: 'Hội thoại', icon: MessageCircle, color: 'from-emerald-500 to-green-600' },
];

const EnglishHubPage: React.FC = () => {
  const [skill, setSkill] = useState<EnglishSkill>('vocabulary');
  const { xp, streak, badges, wordsLearned } = useEnglishStore();
  const level = levelFromXp(xp);

  const renderModule = () => {
    switch (skill) {
      case 'vocabulary': return <VocabModule />;
      case 'grammar': return <GrammarModule />;
      case 'pronunciation': return <PronunciationModule />;
      case 'listening': return <ListeningModule />;
      case 'reading': return <ReadingModule />;
      case 'writing': return <WritingModule />;
      case 'chat': return <EnglishChatModule />;
      default: return null;
    }
  };

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Languages className="w-6 h-6 text-white" />
                </span>
                Học Tiếng Anh
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 ml-14">
                Duolingo × ChatGPT — AI giáo viên 24/7
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="card px-4 py-2 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <div>
                  <p className="text-xs text-slate-500">Level {level}</p>
                  <p className="font-bold text-emerald-600">{xp} XP</p>
                </div>
              </div>
              <div className="card px-4 py-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-xs text-slate-500">Streak</p>
                  <p className="font-bold">{streak} ngày</p>
                </div>
              </div>
              <div className="card px-4 py-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-violet-500" />
                <div>
                  <p className="text-xs text-slate-500">Từ vựng</p>
                  <p className="font-bold">{wordsLearned}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4 ml-0 md:ml-14">
            {badges.filter((b: { unlocked: boolean }) => b.unlocked).map((b: { id: string; emoji: string; name: string }) => (
              <span key={b.id} className="chip" title={b.name}>
                {b.emoji} {b.name}
              </span>
            ))}
          </div>
        </motion.header>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
          {SKILLS.map((s) => {
            const Icon = s.icon;
            const active = skill === s.id;
            return (
              <motion.button
                key={s.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSkill(s.id)}
                className={`p-4 rounded-2xl border-2 text-center transition ${
                  active
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 shadow-md'
                    : 'border-slate-200/80 dark:border-slate-700 card hover:border-emerald-300'
                }`}
              >
                <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xs font-bold">{s.label}</p>
              </motion.button>
            );
          })}
        </div>

        <motion.div key={skill} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {renderModule()}
        </motion.div>
      </div>
    </div>
  );
};

export default EnglishHubPage;
