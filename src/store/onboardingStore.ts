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

const VALID_GOALS = ['on_grade', 'thpt', 'english_exam', 'daily_practice'];
const VALID_STYLES = ['read', 'tts', 'graph', 'chat'];
const VALID_MINUTES = [15, 30, 45, 60];
const VALID_SLOTS = ['morning', 'afternoon', 'evening', 'weekend'];

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
        set({
          ...data,
          goals: Array.isArray(data.goals)
            ? data.goals.filter((g): g is LearningGoal => VALID_GOALS.includes(g))
            : ['on_grade'],
          studySlots: Array.isArray(data.studySlots)
            ? data.studySlots.filter((s): s is StudyTimeSlot => VALID_SLOTS.includes(s))
            : ['evening'],
          dailyMinutes: VALID_MINUTES.includes(data.dailyMinutes as number)
            ? (data.dailyMinutes as 15 | 30 | 45 | 60)
            : 30,
          preferredStyle: VALID_STYLES.includes(data.preferredStyle as string)
            ? (data.preferredStyle as PreferredStyle)
            : 'read',
          completed: true,
        }),
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
