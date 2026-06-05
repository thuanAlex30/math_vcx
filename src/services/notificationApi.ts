import axios from 'axios';
import type { WeakTopic } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
});

export interface SmartNotification {
  id: string;
  type: 'weak_topic' | 'review_mistakes' | 'great_progress' | 'prerequisite_warning' | 'question_of_day' | 'streak_milestone' | 'streak_rescued';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action?: {
    type: string;
    topicId?: string;
    numberOfQuestions?: number;
    questionIds?: string[];
  };
  xp_reward?: number;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface MathSRCard {
  questionId: string;
  question: string;
  topic: string;
  options: string[];
  correct: number;
  explanation: string;
  createdAt: string;
  lastReviewDate?: string;
  nextReviewDate: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  quality?: number;
  isCorrect?: boolean;
  mistakeCount: number;
  _id?: string;
}

// ===== NOTIFICATIONS =====

export const getNotifications = async (unreadOnly = false) => {
  const response = await client.get<{ notifications: SmartNotification[]; unreadCount: number }>('/notifications', {
    params: { unreadOnly },
  });
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await client.post<{ notification: SmartNotification }>('/notifications/mark-read', {
    notificationId,
  });
  return response.data;
};

export const generateSmartNotifications = async (recentPracticeCount = 20) => {
  const response = await client.post<{ newNotifications: SmartNotification[]; totalNotifications: number }>(
    '/notifications/generate',
    { recentPracticeCount }
  );
  return response.data;
};

// ===== SPACED REPETITION - MATH =====

export interface MathSRStats {
  total: number;
  dueToday: number;
  withMistakes: number;
}

export interface ReviewSuggestion {
  type: 'urgent_review' | 'mistake_review' | 'weak_topic_review';
  message: string;
  cardsCount: number;
  estimatedMinutes: number;
  topic?: string;
}

export const getMathSRCards = async (dueOnly = false) => {
  const response = await client.get<{ cards: MathSRCard[]; stats: MathSRStats; reviewPlan: MathSRCard[] }>(
    '/math-sr',
    {
      params: { dueOnly },
    }
  );
  return response.data;
};

export const addMathSRCard = async (questionData: Omit<MathSRCard, 'createdAt' | 'nextReviewDate'>) => {
  const response = await client.post<{ card: MathSRCard }>('/math-sr', questionData);
  return response.data;
};

/**
 * Cập nhật SR card khi học sinh hoàn thành câu hỏi
 * @param cardId - ID của card
 * @param quality - 0 (sai), 1 (vừa), 2 (đúng)
 */
export const updateMathSRCard = async (
  cardId: string,
  quality: 0 | 1 | 2,
  isCorrect: boolean
) => {
  const response = await client.put<{ card: MathSRCard; nextReviewDate: string; interval: number }>(
    `/math-sr/${cardId}`,
    { quality, isCorrect }
  );
  return response.data;
};

export const getMathSRReviewSuggestions = async () => {
  const response = await client.get<{
    suggestions: ReviewSuggestion[];
    reviewPlan: MathSRCard[];
    totalCards: number;
  }>('/math-sr/review-suggestions');
  return response.data;
};

// ===== SOCIAL CHALLENGES =====

export interface Challenge {
  _id: string;
  challengerId: string;
  opponentId: string;
  challengerName: string;
  opponentName: string;
  problem: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit: number;
  status: 'pending' | 'accepted' | 'in-progress' | 'completed';
  createdAt: string;
  expiresAt: string;
  challengerScore?: number;
  opponentScore?: number;
  challengerTime?: number;
  opponentTime?: number;
  winner?: string | 'draw';
}

export interface ChallengeLeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  grade?: number;
  subject?: string;
  wins: number;
  totalChallenges: number;
  winRate: number | string;
  totalScore: number;
  avgScore: number | string;
}

export const createChallenge = async (opponentId: string, problem: string, difficulty: string, timeLimit = 600) => {
  const response = await client.post<{ success: boolean; challenge: Challenge }>('/social/challenges/create', {
    opponentId,
    problem,
    difficulty,
    timeLimit,
  });
  return response.data;
};

export const acceptChallenge = async (challengeId: string) => {
  const response = await client.post<{ success: boolean; challenge: Challenge }>(
    `/social/challenges/${challengeId}/accept`,
    {}
  );
  return response.data;
};

export const submitChallengeResult = async (challengeId: string, score: number, timeSeconds: number) => {
  const response = await client.post<{ success: boolean; challenge: Challenge }>(
    `/social/challenges/${challengeId}/submit`,
    { score, timeSeconds }
  );
  return response.data;
};

export const getUserChallenges = async (filter: 'all' | 'pending' | 'active' | 'completed' = 'all') => {
  const response = await client.get<{ success: boolean; challenges: Challenge[] }>('/social/challenges', {
    params: { filter },
  });
  return response.data;
};

export const getChallengeLeaderboard = async (limit = 50) => {
  const response = await client.get<{ success: boolean; leaderboard: ChallengeLeaderboardEntry[] }>(
    '/social/challenges/leaderboard',
    { params: { limit } }
  );
  return response.data;
};

// ===== LEARNING COACH =====

export interface CoachingMessage {
  message: string;
  timestamp: string;
  focusArea?: string;
  nextSteps: string[];
}

export interface CoachingAnalysis {
  stats: {
    totalProblems: number;
    correctCount: number;
    averageTimeSeconds: number;
    overallSuccessRate: number | string;
    recentSuccessRate: number | string;
    byDifficulty: Record<string, { total: number; correct: number }>;
    byTopic: Record<string, { total: number; correct: number }>;
    recentPerformance: any[];
  };
  weakAreas: Array<{ topic: string; successRate: number | string; totalProblems: number }>;
  strongAreas: Array<{ topic: string; successRate: number | string; totalProblems: number }>;
  insights: string[];
  recommendations: string[];
}

export interface PersonalizedRecommendation {
  type: 'focus-weak-area' | 'challenge-strong-area' | 'spaced-repetition' | 'consistency';
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
}

export const getCoachingAnalysis = async () => {
  const response = await client.get<{ success: boolean; analysis: CoachingAnalysis }>('/social/coach/analysis');
  return response.data;
};

export const getCoachingMessage = async (focusArea?: string) => {
  const response = await client.get<{ success: boolean; coachingMessage: CoachingMessage }>('/social/coach/message', {
    params: focusArea ? { focusArea } : {},
  });
  return response.data;
};

export const getPersonalizedRecommendations = async () => {
  const response = await client.get<{ success: boolean; recommendations: PersonalizedRecommendation[] }>(
    '/social/coach/recommendations'
  );
  return response.data;
};

// ===== QUESTION OF THE DAY (QotD) =====

export interface QotDQuestion {
  _id: string;
  dateString: string;
  problem: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  solution?: string;
  explanation?: string;
}

export interface QotDSubmission {
  _id: string;
  dateString: string;
  answer: string;
  isCorrect: boolean;
  timeSeconds: number;
  submittedAt: string;
  points: number;
}

export interface QotDSubmissionResult {
  submission: QotDSubmission;
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
  points: number;
}

export interface QotDLeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  grade?: number;
  todayCorrect: boolean;
  todayTime?: number;
  todayPoints: number;
  totalStreak: number;
  totalCorrect: number;
  totalPoints: number;
}

export interface QotDStats {
  correctCount: number;
  streak: number;
  totalPoints: number;
  lastSubmissionDate?: string;
  totalSubmissions: number;
  successRate: number | string;
  averageTimeSeconds: number | string;
  last7Days: Array<{ date: string; correct: boolean; points: number }>;
}

export const getTodayQuestion = async () => {
  const response = await client.get<{ success: boolean; question: QotDQuestion }>('/social/qotd');
  return response.data;
};

export const submitQotDAnswer = async (answer: string, timeSeconds: number, questionDate?: string) => {
  const response = await client.post<{ success: boolean; result: QotDSubmissionResult }>('/social/qotd/submit', {
    answer,
    timeSeconds,
    questionDate,
  });
  return response.data;
};

export const getQotDLeaderboard = async (limit = 50) => {
  const response = await client.get<{ success: boolean; leaderboard: { dateString: string; leaderboard: QotDLeaderboardEntry[] } }>(
    '/social/qotd/leaderboard',
    { params: { limit } }
  );
  return response.data;
};

export const getUserQotDStats = async () => {
  const response = await client.get<{ success: boolean; stats: QotDStats }>('/social/qotd/stats');
  return response.data;
};
