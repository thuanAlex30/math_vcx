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
  TrendingUp,
  Lock,
  ChevronRight,
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
import GradeSubjectSelector from '../components/GradeSubjectSelector';
import { useGradeStore } from '../store/gradeStore';

const SKILLS: { id: EnglishSkill; label: string; icon: typeof BookOpen; color: string; bg: string; border: string }[] = [
  { id: 'vocabulary', label: 'Từ vựng', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800' },
  { id: 'grammar', label: 'Ngữ pháp', icon: Sparkles, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
  { id: 'pronunciation', label: 'Phát âm', icon: Mic, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' },
  { id: 'listening', label: 'Nghe', icon: Headphones, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  { id: 'reading', label: 'Đọc', icon: BookOpen, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800' },
  { id: 'writing', label: 'Viết', icon: PenLine, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800' },
  { id: 'chat', label: 'Hội thoại', icon: MessageCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' },
];

const DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

const EnglishHubPage: React.FC = () => {
  const [skill, setSkill] = useState<EnglishSkill>('vocabulary');
  const [showAllBadges, setShowAllBadges] = useState(false);
  const { grade } = useGradeStore();
  const {
    xp, streak, badges, wordsLearned,
    pronunciationScore, listeningScore, writingScore, readingScore, grammarScore,
    weeklyProgress,
  } = useEnglishStore();
  const level = levelFromXp(xp);
  const xpInLevel = xp % 500;
  const xpToNext = 500 - xpInLevel;

  const skillScores = { pronunciation: pronunciationScore, listening: listeningScore, writing: writingScore, reading: readingScore, grammar: grammarScore };

  const renderModule = () => {
    const key = `${skill}-${grade}`;
    switch (skill) {
      case 'vocabulary': return <VocabModule key={key} />;
      case 'grammar': return <GrammarModule key={key} />;
      case 'pronunciation': return <PronunciationModule key={key} />;
      case 'listening': return <ListeningModule key={key} />;
      case 'reading': return <ReadingModule key={key} />;
      case 'writing': return <WritingModule key={key} />;
      case 'chat': return <EnglishChatModule key={key} />;
      default: return null;
    }
  };

  const unlockedBadges = badges.filter((b) => b.unlocked);
  const lockedBadges = badges.filter((b) => !b.unlocked);
  const displayBadges = showAllBadges ? badges : [...unlockedBadges, ...lockedBadges.slice(0, 2)];

  return (
    <div className="pt-20 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">

          {/* Title + Grade Selector */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <Languages className="w-6 h-6 text-white" />
                </span>
                Học Tiếng Anh
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-2 ml-14">
                AI giáo viên cá nhân hóa — học theo lớp em
              </p>
              <div className="mt-4 ml-0">
                <GradeSubjectSelector showSubject={false} />
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap gap-3 mt-4 ml-0 md:ml-14">
            {/* Level + XP bar */}
            <div className="card px-4 py-3 flex items-center gap-3 min-w-[160px]">
              <Star className="w-6 h-6 text-amber-400 fill-amber-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Level {level}</p>
                  <p className="text-xs text-slate-400">{xpInLevel}/{500} XP</p>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500"
                    style={{ width: `${Math.min(100, (xpInLevel / 500) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Streak */}
            <div className="card px-4 py-3 flex items-center gap-2">
              <Flame className="w-6 h-6 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Streak</p>
                <p className="font-bold leading-tight">{streak} ngày</p>
              </div>
            </div>

            {/* Vocab */}
            <div className="card px-4 py-3 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-violet-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Từ vựng</p>
                <p className="font-bold leading-tight">{wordsLearned}</p>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="card px-4 py-3 flex items-center gap-1.5">
              <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" />
              <div className="flex gap-0.5">
                {weeklyProgress.map((val, i) => {
                  const max = Math.max(...weeklyProgress, 1);
                  return (
                    <div key={i} className="flex flex-col items-center gap-0.5" title={`${DAYS[i]}: ${val} XP`}>
                      <div className="w-2 rounded-sm bg-slate-100 dark:bg-slate-800 overflow-hidden" style={{ height: 24 }}>
                        <div
                          className="w-full rounded-sm bg-emerald-400 transition-all duration-300"
                          style={{ height: `${Math.max(4, (val / max) * 24)}px`, marginTop: `${24 - Math.max(4, (val / max) * 24)}px` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400">{DAYS[i]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Badges */}
          {badges.length > 0 && (
            <div className="mt-4 ml-0 md:ml-14">
              <div className="flex flex-wrap gap-2">
                {displayBadges.map((b) => {
                  if (!b.unlocked) {
                    return (
                      <span
                        key={b.id}
                        className="chip bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center gap-1"
                        title={b.name}
                      >
                        <Lock className="w-3 h-3" />
                        {b.name}
                      </span>
                    );
                  }
                  return (
                    <span key={b.id} className="chip" title={b.name}>
                      {b.emoji} {b.name}
                    </span>
                  );
                })}
                {!showAllBadges && lockedBadges.length > 2 && (
                  <button
                    onClick={() => setShowAllBadges(true)}
                    className="chip bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    +{lockedBadges.length - 2} khóa <ChevronRight className="w-3 h-3" />
                  </button>
                )}
                {showAllBadges && lockedBadges.length > 2 && (
                  <button
                    onClick={() => setShowAllBadges(false)}
                    className="chip bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1"
                  >
                    Thu gọn <ChevronRight className="w-3 h-3 rotate-90" />
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                {unlockedBadges.length}/{badges.length} huy hiệu đã mở khóa
              </p>
            </div>
          )}
        </motion.header>

        {/* Skill Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-8">
          {SKILLS.map((s) => {
            const Icon = s.icon;
            const active = skill === s.id;
            const score = skillScores[s.id as keyof typeof skillScores];
            return (
              <motion.button
                key={s.id}
                type="button"
                whileTap={{ scale: 0.97 }}
                onClick={() => setSkill(s.id)}
                className={`p-3 sm:p-4 rounded-2xl border-2 text-center transition-all ${
                  active
                    ? `border-emerald-500 ${s.bg} shadow-md`
                    : `border-slate-200/80 dark:border-slate-700 card hover:border-emerald-300`
                }`}
              >
                <div className={`w-9 h-9 mx-auto rounded-xl bg-gradient-to-br ${s.color === 'text-violet-600' ? 'from-violet-500 to-purple-600' : s.color === 'text-blue-600' ? 'from-blue-500 to-cyan-500' : s.color === 'text-rose-600' ? 'from-rose-500 to-pink-500' : s.color === 'text-amber-600' ? 'from-amber-500 to-orange-500' : s.color === 'text-teal-600' ? 'from-teal-500 to-emerald-500' : s.color === 'text-indigo-600' ? 'from-indigo-500 to-violet-500' : 'from-emerald-500 to-green-600'} flex items-center justify-center mb-2`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs font-bold mb-1">{s.label}</p>
                {score > 0 ? (
                  <div className="flex items-center justify-center gap-0.5">
                    <div className="h-1 flex-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, score)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400">{score}</span>
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400">Bắt đầu</p>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Active Module */}
        <motion.div key={skill} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          {renderModule()}
        </motion.div>
      </div>
    </div>
  );
};

export default EnglishHubPage;
