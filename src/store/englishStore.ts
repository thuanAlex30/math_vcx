import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnglishLevel, ChatRole } from '../types/english';
import { syncEnglishStatsFromBackend, type EnglishStatsPayload } from '../services/englishApi';
import { useAuthStore } from './authStore';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
}

export type AdaptiveSuggestion = 'up' | 'down' | null;

export interface EnglishStore {
  level: EnglishLevel;
  adaptiveLevel: EnglishLevel | null;
  recentScores: number[];
  chatRole: ChatRole;
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  studyMinutes: number;
  wordsLearned: number;
  pronunciationScore: number;
  listeningScore: number;
  readingScore: number;
  grammarScore: number;
  chatScore: number;
  writingScore: number;
  weeklyProgress: number[];
  badges: Badge[];
  restoreFromBackend: (stats: EnglishStatsPayload) => void;
  pushToBackend: () => void;
  setLevel: (l: EnglishLevel) => void;
  setAdaptiveLevel: (l: EnglishLevel | null) => void;
  setChatRole: (r: ChatRole) => void;
  addXp: (amount: number) => void;
  recordWordLearned: () => void;
  recordStudyMinutes: (mins: number) => void;
  updateScores: (scores: Partial<{ pronunciation: number; listening: number; writing: number; reading: number; grammar: number; chat: number }>) => void;
  recordAdaptiveScore: (score: number) => AdaptiveSuggestion;
  recordChat: () => void;
  effectiveLevel: () => EnglishLevel;
  checkStreak: () => void;
  checkBadgeUnlock: () => void;
}

function computeAdaptiveSuggestion(scores: number[], level: EnglishLevel): AdaptiveSuggestion {
  if (scores.length < 3) return null;
  const last3 = scores.slice(-3);
  if (last3.every((s) => s >= 80)) return 'up';
  if (last3.every((s) => s < 50)) return 'down';
  return null;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-word', name: 'Từ đầu tiên', emoji: '🌱', unlocked: false },
  { id: 'streak-3', name: '3 ngày liên tiếp', emoji: '🔥', unlocked: false },
  { id: 'streak-7', name: '1 tuần streak', emoji: '📅', unlocked: false },
  { id: 'streak-30', name: '1 tháng streak', emoji: '🏆', unlocked: false },
  { id: 'vocab-10', name: '10 từ vựng', emoji: '📚', unlocked: false },
  { id: 'vocab-50', name: '50 từ vựng', emoji: '📖', unlocked: false },
  { id: 'speaker', name: 'Phát âm chuẩn', emoji: '🎤', unlocked: false },
  { id: 'writer', name: 'Nhà văn nhỏ', emoji: '✍️', unlocked: false },
  { id: 'listener', name: 'Tai thính', emoji: '👂', unlocked: false },
  { id: 'reader', name: 'Độc giả', emoji: '📰', unlocked: false },
  { id: 'grammarian', name: 'Ngữ pháp vững', emoji: '🧠', unlocked: false },
  { id: 'conversationalist', name: 'Hội thoại tự tin', emoji: '💬', unlocked: false },
  { id: 'level-5', name: 'Level 5', emoji: '⭐', unlocked: false },
  { id: 'level-10', name: 'Level 10', emoji: '🌟', unlocked: false },
];

function levelFromXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

export { levelFromXp };

export const useEnglishStore = create<EnglishStore>()(
  persist(
    (set, get) => ({
      level: 'beginner',
      adaptiveLevel: null,
      recentScores: [],
      chatRole: 'teacher',
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      studyMinutes: 0,
      wordsLearned: 0,
      pronunciationScore: 0,
      listeningScore: 0,
      readingScore: 0,
      grammarScore: 0,
      chatScore: 0,
      writingScore: 0,
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
      badges: DEFAULT_BADGES,

      restoreFromBackend: (stats) => {
        set({
          xp: stats.xp,
          streak: stats.streak,
          lastStudyDate: stats.lastStudyDate,
          wordsLearned: stats.wordsLearned,
          pronunciationScore: stats.pronunciationScore,
          listeningScore: stats.listeningScore,
          writingScore: stats.writingScore,
          weeklyProgress: stats.weeklyProgress,
        });
        get().checkBadgeUnlock();
      },

      pushToBackend: async () => {
        const { user } = useAuthStore.getState();
        if (!user) return;
        const { xp, streak, lastStudyDate, wordsLearned, pronunciationScore, listeningScore, writingScore, studyMinutes, weeklyProgress } = get();
        try {
          await syncEnglishStatsFromBackend({
            xp, streak, lastStudyDate,
            wordsLearned, pronunciationScore, listeningScore, writingScore,
            totalStudyMinutes: studyMinutes,
            weeklyProgress,
          });
        } catch (err) {
          console.warn('[englishStore] pushToBackend failed:', err);
        }
      },

      setLevel: (level) => set({ level }),
      setAdaptiveLevel: (adaptiveLevel) => set({ adaptiveLevel }),
      effectiveLevel: () => get().adaptiveLevel || get().level,

      recordAdaptiveScore: (score) => {
        const state = get();
        const recentScores = [...state.recentScores, score].slice(-10);
        const current = state.adaptiveLevel || state.level;
        const suggestion = computeAdaptiveSuggestion(recentScores, current);
        set({ recentScores });
        return suggestion;
      },

      setChatRole: (chatRole) => set({ chatRole }),

      checkBadgeUnlock: () => {
        const s = get();
        const current = s.xp;
        const streak = s.streak;
        const wl = s.wordsLearned;
        const ps = s.pronunciationScore;
        const ws = s.writingScore;
        const ls = s.listeningScore;
        const rs = s.readingScore;
        const gs = s.grammarScore;
        const cs = s.chatScore;
        const lvl = Math.floor(current / 500) + 1;

        const conditions: [string, boolean][] = [
          ['first-word', current >= 50],
          ['streak-3', streak >= 3],
          ['streak-7', streak >= 7],
          ['streak-30', streak >= 30],
          ['vocab-10', wl >= 10],
          ['vocab-50', wl >= 50],
          ['speaker', ps >= 80],
          ['writer', ws >= 75],
          ['listener', ls >= 80],
          ['reader', rs >= 75],
          ['grammarian', gs >= 80],
          ['conversationalist', cs >= 5],
          ['level-5', lvl >= 5],
          ['level-10', lvl >= 10],
        ];

        const badges = s.badges.map((b) => {
          const cond = conditions.find(([id]) => id === b.id);
          if (cond && cond[1]) return { ...b, unlocked: true };
          return b;
        });

        const changed = badges.some((b, i) => b.unlocked !== s.badges[i].unlocked);
        if (changed) set({ badges });
      },

      addXp: (amount) => {
        const state = get();
        const today = new Date().toISOString().slice(0, 10);
        let streak = state.streak;
        if (state.lastStudyDate !== today) {
          const y = new Date();
          y.setDate(y.getDate() - 1);
          streak = state.lastStudyDate === y.toISOString().slice(0, 10) ? streak + 1 : 1;
        }
        const xp = state.xp + amount;
        const day = new Date().getDay();
        const weekly = [...state.weeklyProgress];
        weekly[day] = (weekly[day] || 0) + amount;
        set({ xp, streak, lastStudyDate: today, weeklyProgress: weekly });
        get().checkBadgeUnlock();
        const { user } = useAuthStore.getState();
        if (user) get().pushToBackend();
      },

      recordWordLearned: () => {
        set({ wordsLearned: get().wordsLearned + 1 });
        get().checkBadgeUnlock();
        get().addXp(10);
      },

      recordStudyMinutes: (mins) => {
        set({ studyMinutes: get().studyMinutes + mins });
        const { user } = useAuthStore.getState();
        if (user) get().pushToBackend();
      },

      updateScores: (scores) => {
        const s = get();
        const next = {
          pronunciationScore: scores.pronunciation ?? s.pronunciationScore,
          listeningScore: scores.listening ?? s.listeningScore,
          writingScore: scores.writing ?? s.writingScore,
          readingScore: scores.reading ?? s.readingScore,
          grammarScore: scores.grammar ?? s.grammarScore,
          chatScore: scores.chat ?? s.chatScore,
        };
        set(next);
        get().checkBadgeUnlock();
      },

      checkStreak: () => {
        /* persisted via addXp */
      },

      recordChat: () => {
        set({ chatScore: get().chatScore + 1 });
        get().checkBadgeUnlock();
      },
    }),
    { name: 'english-progress' }
  )
);
