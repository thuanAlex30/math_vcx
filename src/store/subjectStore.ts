import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Subject = 'math' | 'english';

interface SubjectStore {
  subject: Subject;
  setSubject: (s: Subject) => void;
}

export const useSubjectStore = create<SubjectStore>()(
  persist(
    (set) => ({
      subject: 'math',
      setSubject: (subject) => set({ subject }),
    }),
    { name: 'learning-subject' }
  )
);
