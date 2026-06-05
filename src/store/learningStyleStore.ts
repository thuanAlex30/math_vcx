import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PreferredStyle } from './onboardingStore';

interface LearningStyleStore {
  ttsUsed: number;
  graphViewed: number;
  chatUsed: number;
  socraticCompleted: number;
  sessionCount: number;
  preferredFormat: PreferredStyle | null;
  dataSaver: boolean;
  recordUsage: (type: 'tts' | 'graph' | 'chat' | 'socratic') => void;
  incrementSession: () => void;
  setDataSaver: (v: boolean) => void;
}

function computePreferred(state: LearningStyleStore): PreferredStyle | null {
  if (state.sessionCount < 10) return null;
  const counts = {
    tts: state.ttsUsed,
    graph: state.graphViewed,
    chat: state.chatUsed,
    read: state.socraticCompleted,
  };
  const max = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return max[1] > 0 ? (max[0] as PreferredStyle) : null;
}

export const useLearningStyleStore = create<LearningStyleStore>()(
  persist(
    (set, get) => ({
      ttsUsed: 0,
      graphViewed: 0,
      chatUsed: 0,
      socraticCompleted: 0,
      sessionCount: 0,
      preferredFormat: null,
      dataSaver: false,
      recordUsage: (type) => {
        const key =
          type === 'tts'
            ? 'ttsUsed'
            : type === 'graph'
              ? 'graphViewed'
              : type === 'chat'
                ? 'chatUsed'
                : 'socraticCompleted';
        const next = { ...get(), [key]: get()[key] + 1 };
        set({ [key]: next[key], preferredFormat: computePreferred(next) });
      },
      incrementSession: () => {
        const sessionCount = get().sessionCount + 1;
        const state = { ...get(), sessionCount };
        set({ sessionCount, preferredFormat: computePreferred(state) });
      },
      setDataSaver: (dataSaver) => set({ dataSaver }),
    }),
    { name: 'giasu-learning-style' }
  )
);

export function preferredFormatLabel(fmt: PreferredStyle | null): string {
  const map: Record<PreferredStyle, string> = {
    tts: 'nghe lời giải',
    graph: 'xem đồ thị',
    chat: 'hỏi chat',
    read: 'đọc lời giải',
  };
  return fmt ? map[fmt] : '';
}
