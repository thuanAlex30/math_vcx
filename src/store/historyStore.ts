import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { HistoryItem } from '../types';

interface HistoryStore {
  history: HistoryItem[];
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useHistoryStore = create<HistoryStore>()(
  persist(
    (set) => ({
      history: [],
      searchQuery: '',
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      addToHistory: (item) =>
        set((state) => ({ history: [item, ...state.history].slice(0, 100) })),
      clearHistory: () => set({ history: [] }),
      removeFromHistory: (id) =>
        set((state) => ({
          history: state.history.filter((item) => item.id !== id),
        })),
    }),
    { name: 'math-history' }
  )
);

export function detectTopic(question: string): string {
  const q = question.toLowerCase();
  if (/vector|vectơ|tích vô hướng/i.test(q)) return 'Vector';
  if (/ma trận|matrix/i.test(q)) return 'Ma trận';
  if (/xác suất|probability|bi /i.test(q)) return 'Xác suất';
  if (/đạo hàm|tích phân|giới hạn|lim/i.test(q)) return 'Giải tích';
  if (/tam giác|hình|đường tròn|góc/i.test(q)) return 'Hình học';
  return 'Đại số';
}
