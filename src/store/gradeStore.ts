import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const GRADES = [6, 7, 8, 9, 10, 11, 12] as const;
export type Grade = (typeof GRADES)[number];

interface GradeStore {
  grade: Grade;
  setGrade: (g: Grade) => void;
}

export const useGradeStore = create<GradeStore>()(
  persist(
    (set) => ({
      grade: 9,
      setGrade: (grade) => set({ grade }),
    }),
    { name: 'learning-grade' }
  )
);
