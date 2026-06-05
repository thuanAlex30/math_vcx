import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TopicStat {
  name: string;
  count: number;
}

interface DashboardStore {
  totalSolved: number;
  topics: TopicStat[];
  streak: number;
  lastStudyDate: string | null;
  /** Chuỗi trước khi bỏ lỡ ngày — dùng cứu chuỗi */
  streakBeforeBreak: number;
  recordSolve: (topic?: string) => void;
  restoreStreak: () => void;
}

const defaultTopics = [
  'Đại số',
  'Hình học',
  'Giải tích',
  'Xác suất',
  'Vector',
  'Ma trận',
];

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      totalSolved: 0,
      topics: defaultTopics.map((name) => ({ name, count: 0 })),
      streak: 0,
      lastStudyDate: null,
      streakBeforeBreak: 0,
      recordSolve: (topic) => {
        const today = new Date().toISOString().slice(0, 10);
        const state = get();
        let streak = state.streak;
        let streakBeforeBreak = state.streakBeforeBreak;
        if (state.lastStudyDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const y = yesterday.toISOString().slice(0, 10);
          if (state.lastStudyDate === y) {
            streak = streak + 1;
          } else {
            // Bỏ lỡ ít nhất 1 ngày — lưu chuỗi cũ để cứu
            if (state.streak > 0 && state.lastStudyDate) {
              streakBeforeBreak = state.streak;
            }
            streak = 1;
          }
        }
        const topics = [...state.topics];
        if (topic) {
          const idx = topics.findIndex((t) => t.name === topic);
          if (idx >= 0) topics[idx] = { ...topics[idx], count: topics[idx].count + 1 };
          else topics.push({ name: topic, count: 1 });
        }
        set({
          totalSolved: state.totalSolved + 1,
          topics,
          streak,
          streakBeforeBreak,
          lastStudyDate: today,
        });
      },
      restoreStreak: () => {
        const state = get();
        const today = new Date().toISOString().slice(0, 10);
        const restored = Math.max(state.streak, state.streakBeforeBreak + 1);
        set({
          streak: restored,
          streakBeforeBreak: 0,
          lastStudyDate: today,
        });
      },
    }),
    { name: 'math-dashboard' }
  )
);
