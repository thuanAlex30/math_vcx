import axios from 'axios';
import type {
  ChatRole,
  EnglishCurriculum,
  EnglishGrade,
  EnglishLevel,
  GrammarTopic,
  ListeningQuestion,
  PronunciationPractice,
  PronunciationResult,
  VocabTopic,
  WritingResult,
  LeaderboardEntry,
} from '../types/english';
import type { ChatMessage } from '../types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 120000,
});

export const fetchEnglishCurriculum = async (grade: EnglishGrade) => {
  const { data } = await client.get<EnglishCurriculum>('/english/curriculum', {
    params: { grade },
  });
  return data;
};

export const fetchVocabTopics = async (grade: EnglishGrade) => {
  const { data } = await client.get<{
    grade: number;
    topics: { id: string; label: string; emoji: string; wordCount: number }[];
  }>('/english/topics/vocabulary', { params: { grade } });
  return data.topics;
};

export const fetchVocabulary = async (topicId: string, grade: EnglishGrade) => {
  const { data } = await client.get<VocabTopic>(`/english/vocabulary/${topicId}`, {
    params: { grade },
  });
  return data;
};

export const expandVocabulary = async (
  topicId: string,
  grade: EnglishGrade,
  exclude: string[],
  count = 12
) => {
  const { data } = await client.post<{ words: VocabTopic['words']; source: string }>(
    `/english/vocabulary/${topicId}/expand`,
    { grade, exclude, count }
  );
  return data;
};

export const fetchGrammarTopics = async (grade: EnglishGrade) => {
  const { data } = await client.get<{ grade: number; topics: GrammarTopic[] }>(
    '/english/topics/grammar',
    { params: { grade } }
  );
  return data.topics;
};

export const fetchPronunciationPractice = async (
  grade: EnglishGrade,
  unitId?: string
) => {
  const { data } = await client.get<PronunciationPractice>('/english/pronunciation/practice', {
    params: { grade, unitId },
  });
  return data;
};

export const explainGrammar = async (topicId: string, grade: EnglishGrade, level?: EnglishLevel) => {
  const { data } = await client.post<{ topic: GrammarTopic; explanation: string }>(
    '/english/grammar/explain',
    { topicId, grade, level }
  );
  return data;
};

export const checkWriting = async (text: string, grade: EnglishGrade, level?: EnglishLevel) => {
  const { data } = await client.post<WritingResult>('/english/writing/check', { text, grade, level });
  return data;
};

export const scorePronunciation = async (
  expected: string,
  spoken: string,
  grade: EnglishGrade,
  level?: EnglishLevel
) => {
  const { data } = await client.post<PronunciationResult>('/english/pronunciation/score', {
    expected,
    spoken,
    grade,
    level,
  });
  return data;
};

export const generateListening = async (
  grade: EnglishGrade,
  topicId?: string,
  level?: EnglishLevel
) => {
  const { data } = await client.post<{
    title: string;
    type: string;
    audioScript: string;
    questions: ListeningQuestion[];
    playbackSpeed?: number;
    durationSec?: number;
  }>('/english/listening/generate', { grade, topicId, level });
  return data;
};

export const gradeListening = async (questions: ListeningQuestion[], answers: number[]) => {
  const { data } = await client.post<{
    score: number;
    correct: number;
    total: number;
    results: (ListeningQuestion & { userAnswer: number; isCorrect: boolean })[];
  }>('/english/listening/grade', { questions, answers });
  return data;
};

export const gradeReading = async (questions: ListeningQuestion[], answers: number[]) => {
  const { data } = await client.post<{
    score: number;
    correct: number;
    total: number;
    results: (ListeningQuestion & { userAnswer: number; isCorrect: boolean })[];
  }>('/english/reading/grade', { questions, answers });
  return data;
};

export const generateReading = async (grade: EnglishGrade, level?: EnglishLevel) => {
  const { data } = await client.post<{
    title: string;
    passage: string;
    questions: ListeningQuestion[];
    targetLength?: number;
    newWordsPercent?: number;
  }>('/english/reading/generate', { grade, level });
  return data;
};

export const englishChat = async (
  messages: ChatMessage[],
  grade: EnglishGrade,
  role: ChatRole,
  level?: EnglishLevel,
  topicId?: string
) => {
  const { data } = await client.post<{ reply: string }>('/english/chat', {
    messages,
    grade,
    role,
    level,
    topicId,
  });
  return data;
};

export const fetchLeaderboard = async () => {
  const { data } = await client.get<{ leaderboard: LeaderboardEntry[] }>('/english/leaderboard');
  return data.leaderboard.map((e) => {
    if (e.isUser) {
      const userXp = (() => {
        try {
          const raw = localStorage.getItem('english-progress');
          return raw ? (JSON.parse(raw).state?.xp ?? 0) : 0;
        } catch { return 0; }
      })();
      return { ...e, xp: userXp, name: 'Bạn' };
    }
    return e;
  });
};

export const englishTts = async (text: string, speed = 1, voice: 'female' | 'male' = 'female') => {
  const { data } = await client.post('/tts', { text, speed, voice, lang: 'en' });
  return data;
};

// ============================================
// ENGLISH LEADERBOARD & STATS — Real data từ MongoDB
// ============================================

export interface EnglishStatsPayload {
  xp?: number;
  level?: number;
  streak?: number;
  lastStudyDate?: string | null;
  wordsLearned?: number;
  pronunciationScore?: number;
  listeningScore?: number;
  readingScore?: number;
  grammarScore?: number;
  chatScore?: number;
  writingScore?: number;
  totalStudyMinutes?: number;
  weeklyProgress?: number[];
  skillsPracticed?: {
    vocab?: number; grammar?: number; pronunciation?: number;
    listening?: number; reading?: number; writing?: number; chat?: number;
  };
}

export interface EnglishStatsFromBackend {
  xp: number;
  level: number;
  streak: number;
  lastStudyDate: string | null;
  wordsLearned: number;
  pronunciationScore: number;
  listeningScore: number;
  writingScore: number;
  totalStudyMinutes: number;
  weeklyProgress: number[];
  skillsPracticed: {
    vocab: number; grammar: number; pronunciation: number;
    listening: number; reading: number; writing: number; chat: number;
  };
}

export const fetchEnglishStatsMe = async () => {
  const { data } = await client.get<EnglishStatsFromBackend>('/english/stats/me');
  return data;
};

export const syncEnglishStatsFromBackend = async (stats: EnglishStatsPayload) => {
  const { data } = await client.post<{ ok: boolean; xp: number; level: number }>(
    '/english/stats/sync',
    stats
  );
  return data;
};

// ============================================
// VOCAB SRS — Sync với MongoDB
// ============================================

export interface VocabSrsCardPayload {
  wordId: string;
  word: string;
  topicId: string;
  interval?: number;
  easeFactor?: number;
  repetitions?: number;
  nextReviewDate: string;
  lastReviewDate?: string;
  createdAt?: string;
  ipa?: string;
  meaning?: string;
  example?: string;
}

export const fetchVocabSrsCards = async () => {
  const { data } = await client.get<{ cards: VocabSrsCardPayload[]; dueCount: number; totalCount: number }>('/vocab-sr');
  return data;
};

export const syncVocabSrsCards = async (cards: VocabSrsCardPayload[]) => {
  const { data } = await client.post<{ ok: boolean; syncedCount: number; totalCards: number }>(
    '/vocab-sr/sync',
    { cards }
  );
  return data;
};

export const updateVocabSrsCard = async (
  wordId: string,
  update: Partial<VocabSrsCardPayload>
) => {
  const { data } = await client.put<{ ok: boolean; card: VocabSrsCardPayload }>(
    `/vocab-sr/${encodeURIComponent(wordId)}`,
    update
  );
  return data;
};
