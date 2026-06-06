import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || '/api';

export interface MathBadge {
  id: string;
  name: string;
  emoji: string;
  unlocked: boolean;
}

interface MathGamificationStore {
  points: number;
  selfSolveCount: number;
  topicCorrectCounts: Record<string, number>;
  badges: MathBadge[];
  streak: number;
  lastStudyDate: string | null;
  isLoaded: boolean;
  addPoints: (n: number) => void;
  recordSelfSolve: () => void;
  recordTopicCorrect: (topicId: string) => void;
  recordPracticePerfect: () => void;
  checkNightOwl: () => void;
  recordFirstSolve: () => void;
  syncStreakBadges: (streak: number) => void;
  syncToBackend: () => Promise<void>;
  restoreFromBackend: (stats: {
    points: number;
    selfSolveCount: number;
    streak: number;
    lastStudyDate: string;
    topicCorrectCounts: Record<string, number>;
    badges: MathBadge[];
  }) => void;
}

const DEFAULT_BADGES: MathBadge[] = [
  { id: 'first_solve', name: 'Giải bài đầu tiên', emoji: '🎯', unlocked: false },
  { id: 'streak_3', name: 'Chuỗi 3 ngày', emoji: '🔥', unlocked: false },
  { id: 'streak_7', name: 'Chuỗi 7 ngày', emoji: '⚡', unlocked: false },
  { id: 'streak_30', name: 'Chuỗi 30 ngày', emoji: '💎', unlocked: false },
  { id: 'self_solver_5', name: 'Tự giải 5 bài', emoji: '🧠', unlocked: false },
  { id: 'practice_perfect', name: 'Luyện tập 100%', emoji: '💯', unlocked: false },
  { id: 'night_owl', name: 'Cú đêm', emoji: '🦉', unlocked: false },
];

function unlockBadge(badges: MathBadge[], id: string) {
  return badges.map((b) => (b.id === id ? { ...b, unlocked: true } : b));
}

export const useMathGamificationStore = create<MathGamificationStore>()(
  persist(
    (set, get) => ({
      points: 0,
      selfSolveCount: 0,
      topicCorrectCounts: {},
      badges: DEFAULT_BADGES,
      streak: 0,
      lastStudyDate: null,
      isLoaded: false,

      addPoints: (n) => {
        const state = get();
        const now = new Date();
        const today = now.toISOString().slice(0, 10);
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const y = yesterday.toISOString().slice(0, 10);
        const newStreak = state.lastStudyDate !== today
          ? (state.lastStudyDate === y ? state.streak + 1 : 1)
          : state.streak;
        set({ points: state.points + n, streak: newStreak, lastStudyDate: today });
      },

      recordFirstSolve: () => {
        const badges = get().badges;
        if (badges.find((b) => b.id === 'first_solve')?.unlocked) return;
        set({ badges: unlockBadge(badges, 'first_solve'), points: get().points + 10 });
        get().syncToBackend();
      },

      recordSelfSolve: () => {
        const count = get().selfSolveCount + 1;
        let badges = get().badges;
        if (count >= 5) badges = unlockBadge(badges, 'self_solver_5');
        set({ selfSolveCount: count, badges, points: get().points + 15 });
        get().syncToBackend();
      },

      recordTopicCorrect: (topicId) => {
        const counts = { ...get().topicCorrectCounts };
        counts[topicId] = (counts[topicId] || 0) + 1;
        let badges = get().badges;
        if (counts[topicId] >= 10) {
          badges = [
            ...badges.filter((b) => !b.id.startsWith('topic_master_')),
            { id: `topic_master_${topicId}`, name: `Bậc thầy ${topicId}`, emoji: '🏆', unlocked: true },
          ];
        }
        set({ topicCorrectCounts: counts, badges, points: get().points + 5 });
        get().syncToBackend();
      },

      recordPracticePerfect: () => {
        set({ badges: unlockBadge(get().badges, 'practice_perfect'), points: get().points + 25 });
        get().syncToBackend();
      },

      checkNightOwl: () => {
        const h = new Date().getHours();
        if (h >= 21) {
          set({ badges: unlockBadge(get().badges, 'night_owl') });
          get().syncToBackend();
        }
      },

      syncStreakBadges: (streak) => {
        let badges = get().badges;
        if (streak >= 3) badges = unlockBadge(badges, 'streak_3');
        if (streak >= 7) badges = unlockBadge(badges, 'streak_7');
        if (streak >= 30) badges = unlockBadge(badges, 'streak_30');
        set({ badges, streak });
        get().syncToBackend();
      },

      syncToBackend: async () => {
        const { points, selfSolveCount, streak, lastStudyDate, topicCorrectCounts, badges } = get();
        try {
          await axios.post(`${API}/math/stats/sync`, {
            points, selfSolveCount, streak, lastStudyDate, topicCorrectCounts, badges,
          }, { withCredentials: true });
        } catch { /* silent */ }
      },

      restoreFromBackend: (stats) => {
        set({
          points: stats.points ?? 0,
          selfSolveCount: stats.selfSolveCount ?? 0,
          streak: stats.streak ?? 0,
          lastStudyDate: stats.lastStudyDate ?? null,
          topicCorrectCounts: stats.topicCorrectCounts ?? {},
          badges: (stats.badges ?? []).length > 0 ? stats.badges : DEFAULT_BADGES,
          isLoaded: true,
        });
      },
    }),
    { name: 'giasu-math-gamification' }
  )
);
