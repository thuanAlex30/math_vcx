import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addPoints: (n: number) => void;
  recordSelfSolve: () => void;
  recordTopicCorrect: (topicId: string) => void;
  recordPracticePerfect: () => void;
  checkNightOwl: () => void;
  recordFirstSolve: () => void;
  syncStreakBadges: (streak: number) => void;
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
      addPoints: (n) => set({ points: get().points + n }),
      recordFirstSolve: () => {
        const badges = get().badges;
        if (badges.find((b) => b.id === 'first_solve')?.unlocked) return;
        set({ badges: unlockBadge(badges, 'first_solve'), points: get().points + 10 });
      },
      recordSelfSolve: () => {
        const count = get().selfSolveCount + 1;
        let badges = get().badges;
        if (count >= 5) badges = unlockBadge(badges, 'self_solver_5');
        set({ selfSolveCount: count, badges, points: get().points + 15 });
      },
      recordTopicCorrect: (topicId) => {
        const counts = { ...get().topicCorrectCounts };
        counts[topicId] = (counts[topicId] || 0) + 1;
        let badges = get().badges;
        if (counts[topicId] >= 10) {
          badges = [
            ...badges.filter((b) => !b.id.startsWith('topic_master_')),
            {
              id: `topic_master_${topicId}`,
              name: `Bậc thầy ${topicId}`,
              emoji: '🏆',
              unlocked: true,
            },
          ];
        }
        set({ topicCorrectCounts: counts, badges, points: get().points + 5 });
      },
      recordPracticePerfect: () => {
        set({
          badges: unlockBadge(get().badges, 'practice_perfect'),
          points: get().points + 25,
        });
      },
      checkNightOwl: () => {
        const h = new Date().getHours();
        if (h >= 21) {
          set({ badges: unlockBadge(get().badges, 'night_owl') });
        }
      },
      syncStreakBadges: (streak) => {
        let badges = get().badges;
        if (streak >= 3) badges = unlockBadge(badges, 'streak_3');
        if (streak >= 7) badges = unlockBadge(badges, 'streak_7');
        if (streak >= 30) badges = unlockBadge(badges, 'streak_30');
        set({ badges });
      },
    }),
    { name: 'giasu-math-gamification' }
  )
);
