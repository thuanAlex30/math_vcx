/**
 * Social Features API Client
 * Handles calls to Social Challenges, Learning Coach, and QotD endpoints
 */

import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api';

// ============================================
// INTERFACES
// ============================================

export interface Challenge {
  _id: string;
  challengerUserId: string;
  opponentUserId: string;
  problem: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'accepted' | 'in-progress' | 'completed';
  challengerScore?: number;
  opponentScore?: number;
  challengerTime?: number;
  opponentTime?: number;
  winner?: string;
  createdAt: string;
  expiresAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  avgScore: number;
  totalChallenges: number;
}

export interface CoachingAnalysis {
  overallSuccessRate: number;
  recentSuccessRate: number;
  totalProblems: number;
  weakAreas: Array<{ topic: string; successRate: number; count: number }>;
  strongAreas: Array<{ topic: string; successRate: number; count: number }>;
  averageTimeSeconds: number;
}

export interface CoachingMessage {
  message: string;
  timestamp: string;
  focusArea?: string;
  nextSteps: string[];
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  type: string;
  description: string;
  estimatedMinutes?: number;
  estimatedTime?: number;
  difficulty?: string;
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

export interface QotDStats {
  correctCount: number;
  streak: number;
  totalPoints: number;
  lastSubmissionDate?: string;
  successRate?: number;
  last7Days?: boolean[];
}

// ============================================
// SOCIAL CHALLENGES API
// ============================================

export async function createChallenge(
  opponentUserId: string,
  problem: string,
  difficulty: string,
  timeLimit: number = 600
) {
  try {
    const response = await axios.post(`${API_BASE}/social/challenges/create`, {
      opponentUserId,
      problem,
      difficulty,
      timeLimit
    });
    return response.data;
  } catch (error) {
    console.error('Error creating challenge:', error);
    throw error;
  }
}

export async function getUserChallenges(filter: string = 'all') {
  try {
    const response = await axios.get(`${API_BASE}/social/challenges`, {
      params: { filter }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user challenges:', error);
    throw error;
  }
}

export async function acceptChallenge(challengeId: string) {
  try {
    const response = await axios.post(
      `${API_BASE}/social/challenges/${challengeId}/accept`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw error;
  }
}

export async function submitChallengeResult(
  challengeId: string,
  score: number,
  timeSeconds: number
) {
  try {
    const response = await axios.post(
      `${API_BASE}/social/challenges/${challengeId}/submit`,
      {
        score,
        timeSeconds
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting challenge result:', error);
    throw error;
  }
}

export async function getChallengeLeaderboard(limit: number = 50) {
  try {
    const response = await axios.get(
      `${API_BASE}/social/challenges/leaderboard`,
      {
        params: { limit }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching challenge leaderboard:', error);
    throw error;
  }
}

// ============================================
// LEARNING COACH API
// ============================================

export async function getCoachingAnalysis() {
  try {
    const response = await axios.get(`${API_BASE}/social/coach/analysis`);
    return response.data;
  } catch (error) {
    console.error('Error fetching coaching analysis:', error);
    throw error;
  }
}

export async function getCoachingMessage(focusArea?: string) {
  try {
    const response = await axios.get(`${API_BASE}/social/coach/message`, {
      params: { focusArea }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching coaching message:', error);
    throw error;
  }
}

export async function getPersonalizedRecommendations() {
  try {
    const response = await axios.get(`${API_BASE}/social/coach/recommendations`);
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw error;
  }
}

// ============================================
// QUESTION OF THE DAY API
// ============================================

export async function getTodayQuestion() {
  try {
    const response = await axios.get(`${API_BASE}/social/qotd`);
    return response.data;
  } catch (error) {
    console.error('Error fetching today question:', error);
    throw error;
  }
}

export async function submitQotDAnswer(answer: string, timeSeconds: number) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await axios.post(`${API_BASE}/social/qotd/submit`, {
      questionDate: today,
      answer,
      timeSeconds
    });
    return response.data;
  } catch (error) {
    console.error('Error submitting QotD answer:', error);
    throw error;
  }
}

export async function getQotDLeaderboard(limit: number = 50) {
  try {
    const response = await axios.get(`${API_BASE}/social/qotd/leaderboard`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching QotD leaderboard:', error);
    throw error;
  }
}

export async function getUserQotDStats() {
  try {
    const response = await axios.get(`${API_BASE}/social/qotd/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching QotD stats:', error);
    throw error;
  }
}
