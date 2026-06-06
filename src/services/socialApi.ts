/**
 * Social Features API Client
 * Handles Social Challenges, Learning Coach, QotD endpoints
 * Backend returns: { success: true, challenges/leaderboard/coachingMessage/... } hoặc flat { leaderboard: [] }
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  withCredentials: true,
});

// ============================================
// INTERFACES
// ============================================

export interface Challenge {
  _id: string;
  challengerId?: string;
  opponentId?: string;
  challengerName?: string;
  opponentName?: string;
  challengerScore?: number;
  opponentScore?: number;
  challengerTime?: number;
  opponentTime?: number;
  problem?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'accepted' | 'in-progress' | 'completed';
  winner?: string | 'draw';
  createdAt: string;
  expiresAt: string;
}

export interface ChallengeLeaderboardEntry {
  userId: string;
  name: string;
  avatar?: string;
  grade?: number;
  wins: number;
  totalChallenges: number;
  winRate: number | string;
  totalScore: number;
  avgScore: number | string;
}

export interface CoachingAnalysis {
  stats: {
    totalProblems: number;
    correctCount: number;
    averageTimeSeconds: number;
    overallSuccessRate: number | string;
    recentSuccessRate: number | string;
    recentPerformance: unknown[];
  };
  weakAreas: Array<{ topic: string; successRate: number | string; totalProblems: number }>;
  strongAreas: Array<{ topic: string; successRate: number | string; totalProblems: number }>;
  insights: string[];
  recommendations: string[];
}

export interface CoachingMessage {
  message: string;
  timestamp?: string;
  focusArea?: string;
  nextSteps: string[];
}

export interface PersonalizedRecommendation {
  type: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  difficulty?: string;
  estimatedTime?: number;
}

export interface QotDQuestion {
  _id: string;
  dateString: string;
  problem: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  solution?: string;
  explanation?: string;
}

export interface QotDSubmissionResult {
  submission: {
    _id: string;
    dateString: string;
    answer: string;
    isCorrect: boolean;
    timeSeconds: number;
    submittedAt: string;
    points: number;
  };
  isCorrect: boolean;
  explanation: string;
  correctAnswer: string;
  points: number;
}

export interface QotDStats {
  correctCount: number;
  streak: number;
  totalPoints: number;
  lastSubmissionDate?: string;
  totalSubmissions?: number;
  successRate: number | string;
  averageTimeSeconds?: number | string;
  last7Days: Array<{ date: string; correct: boolean; points: number }>;
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

// ============================================
// SOCIAL CHALLENGES API
// ============================================

export async function getUserChallenges(filter = 'all') {
  const res = await client.get('/social/challenges', { params: { filter } });
  // Backend: { success: true, challenges: Challenge[] }
  if (res.data?.success) return res.data as { success: boolean; challenges: Challenge[] };
  // Fallback: direct array
  return { success: true, challenges: (Array.isArray(res.data) ? res.data : []) as Challenge[] };
}

export async function createChallenge(
  opponentId: string,
  problem: string,
  difficulty: string,
  timeLimit = 600
) {
  const res = await client.post('/social/challenges/create', {
    opponentId,
    problem,
    difficulty,
    timeLimit,
  });
  return res.data as { success: boolean; challenge: Challenge };
}

export async function acceptChallenge(challengeId: string) {
  const res = await client.post(`/social/challenges/${challengeId}/accept`, {});
  return res.data as { success: boolean; challenge: Challenge };
}

export async function submitChallengeResult(
  challengeId: string,
  score: number,
  timeSeconds: number
) {
  const res = await client.post(`/social/challenges/${challengeId}/submit`, {
    score,
    timeSeconds,
  });
  return res.data as { success: boolean; challenge: Challenge };
}

export async function getChallengeLeaderboard(limit = 50) {
  const res = await client.get('/social/challenges/leaderboard', { params: { limit } });
  // Backend: { success: true, leaderboard: ChallengeLeaderboardEntry[] }
  if (res.data?.success) return res.data as { success: boolean; leaderboard: ChallengeLeaderboardEntry[] };
  // Fallback
  return { success: true, leaderboard: (res.data?.leaderboard ?? []) as ChallengeLeaderboardEntry[] };
}

// ============================================
// LEARNING COACH API
// ============================================

export async function getCoachingAnalysis() {
  const res = await client.get('/social/coach/analysis');
  // Backend: { success: true, analysis: CoachingAnalysis }
  if (res.data?.success) return res.data as { success: boolean; analysis: CoachingAnalysis };
  return { success: true, analysis: (res.data?.analysis ?? {}) as CoachingAnalysis };
}

export async function getCoachingMessage(focusArea?: string) {
  const res = await client.get('/social/coach/message', {
    params: focusArea ? { focusArea } : {},
  });
  // Backend: { success: true, coachingMessage: CoachingMessage }
  if (res.data?.success) return res.data as { success: boolean; coachingMessage: CoachingMessage };
  return { success: true, coachingMessage: (res.data ?? {}) as CoachingMessage };
}

export async function getPersonalizedRecommendations() {
  const res = await client.get('/social/coach/recommendations');
  // Backend: { success: true, recommendations: PersonalizedRecommendation[] }
  if (res.data?.success) return res.data as { success: boolean; recommendations: PersonalizedRecommendation[] };
  return { success: true, recommendations: (res.data?.recommendations ?? []) as PersonalizedRecommendation[] };
}

// ============================================
// QUESTION OF THE DAY API
// ============================================

export async function getTodayQuestion() {
  const res = await client.get('/social/qotd');
  // Backend: { success: true, question: QotDQuestion }
  if (res.data?.success) return res.data as { success: boolean; question: QotDQuestion };
  return { success: true, question: (res.data?.question ?? res.data ?? {}) as QotDQuestion };
}

export async function submitQotDAnswer(answer: string, timeSeconds: number, questionDate?: string) {
  const today = questionDate ?? new Date().toISOString().split('T')[0];
  const res = await client.post('/social/qotd/submit', {
    answer,
    timeSeconds,
    questionDate: today,
  });
  // Backend: { success: true, result: QotDSubmissionResult }
  if (res.data?.success) return res.data as { success: boolean; result: QotDSubmissionResult };
  return { success: true, result: (res.data?.result ?? res.data) as QotDSubmissionResult };
}

export async function getQotDLeaderboard(limit = 50) {
  const res = await client.get('/social/qotd/leaderboard', { params: { limit } });
  // Backend: { success: true, leaderboard: { dateString, leaderboard: QotDLeaderboardEntry[] } }
  if (res.data?.success) return res.data as {
    success: boolean;
    leaderboard: { dateString: string; leaderboard: QotDLeaderboardEntry[] };
  };
  const lb = res.data?.leaderboard;
  return {
    success: true,
    leaderboard: {
      dateString: lb?.dateString ?? '',
      leaderboard: (lb?.leaderboard ?? []) as QotDLeaderboardEntry[],
    },
  };
}

export async function getUserQotDStats() {
  const res = await client.get('/social/qotd/stats');
  // Backend: { success: true, stats: QotDStats }
  if (res.data?.success) return res.data as { success: boolean; stats: QotDStats };
  return { success: true, stats: (res.data?.stats ?? {}) as QotDStats };
}
