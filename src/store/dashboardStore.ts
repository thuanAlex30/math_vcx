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
  recordSolve: (topic?: string) => void;
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
      recordSolve: (topic) => {
        const today = new Date().toISOString().slice(0, 10);
        const state = get();
        let streak = state.streak;
        if (state.lastStudyDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const y = yesterday.toISOString().slice(0, 10);
          streak = state.lastStudyDate === y ? streak + 1 : 1;
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
          lastStudyDate: today,
        });
      },
    }),
    { name: 'math-dashboard' }
  )
);
