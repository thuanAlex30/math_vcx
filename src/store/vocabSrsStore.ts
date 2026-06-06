import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { syncVocabSrsCards } from '../services/englishApi';
import { useAuthStore } from './authStore';

export interface SrsCard {
  wordId: string;
  word: string;
  topicId: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReviewDate: string;
}

/** SM-2 cập nhật — quality: 0 Khó, 1 Vừa, 2 Dễ */
function sm2Update(card: SrsCard, quality: number): Partial<SrsCard> {
  let { interval, easeFactor, repetitions } = card;

  if (quality < 1) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 3;
    else interval = Math.round(interval * easeFactor);
    repetitions += 1;
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (2 - quality) * (0.08 + (2 - quality) * 0.02))
  );

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    interval,
    easeFactor,
    repetitions,
    nextReviewDate: next.toISOString().slice(0, 10),
  };
}

/** Chuyển SrsCard → payload gửi lên backend */
function toPayload(card: SrsCard) {
  return {
    wordId: card.wordId,
    word: card.word,
    topicId: card.topicId,
    interval: card.interval,
    easeFactor: card.easeFactor,
    repetitions: card.repetitions,
    nextReviewDate: card.nextReviewDate,
  };
}

interface VocabSrsStore {
  cards: SrsCard[];
  addCard: (card: Omit<SrsCard, 'interval' | 'easeFactor' | 'repetitions' | 'nextReviewDate'>) => void;
  reviewCard: (wordId: string, quality: 0 | 1 | 2) => void;
  getDueCount: () => number;
  getDueCards: () => SrsCard[];
  syncToBackend: () => Promise<void>;
}

const today = () => new Date().toISOString().slice(0, 10);

export const useVocabSrsStore = create<VocabSrsStore>()(
  persist(
    (set, get) => ({
      cards: [],

      addCard: (card) => {
        const exists = get().cards.find((c) => c.wordId === card.wordId);
        if (exists) return;
        set({
          cards: [
            ...get().cards,
            {
              ...card,
              interval: 0,
              easeFactor: 2.5,
              repetitions: 0,
              nextReviewDate: today(),
            },
          ],
        });
      },

      reviewCard: (wordId, quality) => {
        set({
          cards: get().cards.map((c) =>
            c.wordId === wordId ? { ...c, ...sm2Update(c, quality) } : c
          ),
        });
        // Sync lên backend nếu user đã đăng nhập
        const isLoggedIn = !!useAuthStore.getState().user;
        if (isLoggedIn) {
          const card = get().cards.find((c) => c.wordId === wordId);
          if (card) {
            syncVocabSrsCards([toPayload(card)]).catch(() => {/* silent fail */});
          }
        }
      },

      getDueCount: () =>
        get().cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today()).length,

      getDueCards: () =>
        get().cards.filter((c) => !c.nextReviewDate || c.nextReviewDate <= today()),

      /** Sync toàn bộ cards lên MongoDB — gọi khi user đăng nhập */
      syncToBackend: async () => {
        const { cards } = get();
        if (!cards.length) return;
        try {
          await syncVocabSrsCards(cards.map(toPayload));
        } catch (err) {
          console.warn('[vocabSrsStore] sync failed:', err);
        }
      },
    }),
    { name: 'giasu-vocab-srs' }
  )
);
