import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EnglishLevel, ChatRole } from '../types/english';

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
}

interface EnglishStore {
  level: EnglishLevel;
  chatRole: ChatRole;
  xp: number;
  streak: number;
  lastStudyDate: string | null;
  studyMinutes: number;
  wordsLearned: number;
  pronunciationScore: number;
  listeningScore: number;
  writingScore: number;
  weeklyProgress: number[];
  badges: Badge[];
  setLevel: (l: EnglishLevel) => void;
  setChatRole: (r: ChatRole) => void;
  addXp: (amount: number) => void;
  recordWordLearned: () => void;
  recordStudyMinutes: (mins: number) => void;
  updateScores: (scores: Partial<{ pronunciation: number; listening: number; writing: number }>) => void;
  checkStreak: () => void;
}

const DEFAULT_BADGES: Badge[] = [
  { id: 'first-word', name: 'Từ đầu tiên', emoji: '🌱', unlocked: false },
  { id: 'streak-3', name: '3 ngày liên tiếp', emoji: '🔥', unlocked: false },
  { id: 'vocab-10', name: '10 từ vựng', emoji: '📚', unlocked: false },
  { id: 'speaker', name: 'Phát âm chuẩn', emoji: '🎤', unlocked: false },
  { id: 'writer', name: 'Nhà văn nhỏ', emoji: '✍️', unlocked: false },
  { id: 'listener', name: 'Tai thính', emoji: '👂', unlocked: false },
];

function levelFromXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

export { levelFromXp };

export const useEnglishStore = create<EnglishStore>()(
  persist(
    (set, get) => ({
      level: 'beginner',
      chatRole: 'teacher',
      xp: 0,
      streak: 0,
      lastStudyDate: null,
      studyMinutes: 0,
      wordsLearned: 0,
      pronunciationScore: 0,
      listeningScore: 0,
      writingScore: 0,
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
      badges: DEFAULT_BADGES,
      setLevel: (level) => set({ level }),
      setChatRole: (chatRole) => set({ chatRole }),
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
        const badges = [...state.badges];
        if (xp >= 50 && !badges[0].unlocked) badges[0] = { ...badges[0], unlocked: true };
        if (streak >= 3 && !badges[1].unlocked) badges[1] = { ...badges[1], unlocked: true };
        if (state.wordsLearned >= 10 && !badges[2].unlocked) badges[2] = { ...badges[2], unlocked: true };
        const day = new Date().getDay();
        const weekly = [...state.weeklyProgress];
        weekly[day] = (weekly[day] || 0) + amount;
        set({ xp, streak, lastStudyDate: today, badges, weeklyProgress: weekly });
      },
      recordWordLearned: () => {
        const w = get().wordsLearned + 1;
        const badges = [...get().badges];
        if (w >= 10 && !badges[2].unlocked) badges[2] = { ...badges[2], unlocked: true };
        set({ wordsLearned: w, badges });
        get().addXp(10);
      },
      recordStudyMinutes: (mins) => set({ studyMinutes: get().studyMinutes + mins }),
      updateScores: (scores) => {
        const s = get();
        const next = {
          pronunciationScore: scores.pronunciation ?? s.pronunciationScore,
          listeningScore: scores.listening ?? s.listeningScore,
          writingScore: scores.writing ?? s.writingScore,
        };
        const badges = [...s.badges];
        if (next.pronunciationScore >= 80 && !badges[3].unlocked)
          badges[3] = { ...badges[3], unlocked: true };
        if (next.writingScore >= 75 && !badges[4].unlocked)
          badges[4] = { ...badges[4], unlocked: true };
        if (next.listeningScore >= 80 && !badges[5].unlocked)
          badges[5] = { ...badges[5], unlocked: true };
        set({ ...next, badges });
      },
      checkStreak: () => {
        /* persisted via addXp */
      },
    }),
    { name: 'english-progress' }
  )
);
