import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface DailyTask {
  id: string;
  type: 'math' | 'english' | 'review';
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
  ctaParams?: Record<string, string | number>;
  estimatedMinutes: number;
  completed: boolean;
}

interface DailyPlanStore {
  date: string | null;
  tasks: DailyTask[];
  streakRescueUsedWeek: string | null;
  setPlan: (date: string, tasks: DailyTask[]) => void;
  completeTask: (taskId: string) => void;
  pendingCount: () => number;
  canUseStreakRescue: () => boolean;
  useStreakRescue: () => void;
}

function weekKey() {
  const d = new Date();
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay() + 1);
  return start.toISOString().slice(0, 10);
}

export const useDailyPlanStore = create<DailyPlanStore>()(
  persist(
    (set, get) => ({
      date: null,
      tasks: [],
      streakRescueUsedWeek: null,
      setPlan: (date, tasks) => set({ date, tasks }),
      completeTask: (taskId) =>
        set({
          tasks: get().tasks.map((t) =>
            t.id === taskId ? { ...t, completed: true } : t
          ),
        }),
      pendingCount: () => get().tasks.filter((t) => !t.completed).length,
      canUseStreakRescue: () => get().streakRescueUsedWeek !== weekKey(),
      useStreakRescue: () => set({ streakRescueUsedWeek: weekKey() }),
    }),
    { name: 'giasu-daily-plan' }
  )
);
