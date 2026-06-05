import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LearningGoal =
  | 'on_grade'
  | 'thpt'
  | 'english_exam'
  | 'daily_practice';

export type PreferredStyle = 'read' | 'tts' | 'graph' | 'chat';

export type StudyTimeSlot = 'morning' | 'afternoon' | 'evening' | 'weekend';

interface OnboardingStore {
  completed: boolean;
  name: string;
  goals: LearningGoal[];
  studySlots: StudyTimeSlot[];
  dailyMinutes: 15 | 30 | 45 | 60;
  preferredStyle: PreferredStyle;
  completeOnboarding: (data: Partial<Omit<OnboardingStore, 'completeOnboarding' | 'resetOnboarding'>>) => void;
  resetOnboarding: () => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completed: false,
      name: '',
      goals: ['on_grade'],
      studySlots: ['evening'],
      dailyMinutes: 30,
      preferredStyle: 'read',
      completeOnboarding: (data) =>
        set({ ...data, completed: true }),
      resetOnboarding: () =>
        set({
          completed: false,
          name: '',
          goals: ['on_grade'],
          studySlots: ['evening'],
          dailyMinutes: 30,
          preferredStyle: 'read',
        }),
    }),
    { name: 'giasu-onboarding' }
  )
);

/** Context gửi kèm API */
export function buildStudentContext() {
  const s = useOnboardingStore.getState();
  return {
    name: s.name || undefined,
    goals: s.goals,
    preferredStyle: s.preferredStyle,
  };
}
