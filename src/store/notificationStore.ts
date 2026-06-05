import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SmartNotification, MathSRCard, MathSRStats, ReviewSuggestion } from '../services/notificationApi';

interface NotificationStore {
  notifications: SmartNotification[];
  unreadCount: number;
  mathSRCards: MathSRCard[];
  mathSRStats: MathSRStats;
  reviewSuggestions: ReviewSuggestion[];
  isLoadingNotifications: boolean;
  isLoadingSR: boolean;

  // Notification actions
  setNotifications: (notifications: SmartNotification[]) => void;
  addNotification: (notification: SmartNotification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (notificationId: string) => void;
  setUnreadCount: (count: number) => void;
  setLoadingNotifications: (loading: boolean) => void;

  // SR actions
  setMathSRCards: (cards: MathSRCard[]) => void;
  addMathSRCard: (card: MathSRCard) => void;
  updateMathSRCard: (cardId: string, card: Partial<MathSRCard>) => void;
  setMathSRStats: (stats: MathSRStats) => void;
  setReviewSuggestions: (suggestions: ReviewSuggestion[]) => void;
  setLoadingSR: (loading: boolean) => void;

  // Utility
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  mathSRCards: [],
  mathSRStats: { total: 0, dueToday: 0, withMistakes: 0 },
  reviewSuggestions: [],
  isLoadingNotifications: false,
  isLoadingSR: false,
};

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Notification actions
      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
          unreadCount: !notification.isRead ? state.unreadCount + 1 : state.unreadCount,
        }));
      },

      markAsRead: (notificationId) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === notificationId ? { ...n, isRead: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
          unreadCount: 0,
        }));
      },

      deleteNotification: (notificationId) => {
        set((state) => {
          const notification = state.notifications.find((n) => n.id === notificationId);
          return {
            notifications: state.notifications.filter((n) => n.id !== notificationId),
            unreadCount: notification?.isRead === false ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
          } as Partial<NotificationStore>;
        });
      },

      setUnreadCount: (count) => set({ unreadCount: count }),

      setLoadingNotifications: (isLoadingNotifications) => set({ isLoadingNotifications }),

      // SR actions
      setMathSRCards: (mathSRCards) => set({ mathSRCards }),

      addMathSRCard: (card) => {
        set((state) => ({
          mathSRCards: [card, ...state.mathSRCards],
          mathSRStats: {
            ...state.mathSRStats,
            total: state.mathSRStats.total + 1,
          },
        }));
      },

      updateMathSRCard: (cardId, updates) => {
        set((state) => ({
          mathSRCards: state.mathSRCards.map((c) =>
            c.questionId === cardId || c._id === cardId ? { ...c, ...updates } : c
          ),
        }));
      },

      setMathSRStats: (mathSRStats) => set({ mathSRStats }),

      setReviewSuggestions: (reviewSuggestions) => set({ reviewSuggestions }),

      setLoadingSR: (isLoadingSR) => set({ isLoadingSR }),

      reset: () => set(initialState),
    }),
    {
      name: 'notification-store',
      partialize: (state) => ({
        notifications: state.notifications,
        mathSRCards: state.mathSRCards,
        mathSRStats: state.mathSRStats,
      }),
    }
  )
);
