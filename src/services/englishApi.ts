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

export const fetchPronunciationPractice = async (grade: EnglishGrade) => {
  const { data } = await client.get<PronunciationPractice>('/english/pronunciation/practice', {
    params: { grade },
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
  level?: EnglishLevel
) => {
  const { data } = await client.post<{ reply: string }>('/english/chat', {
    messages,
    grade,
    role,
    level,
  });
  return data;
};

export const fetchLeaderboard = async () => {
  const { data } = await client.get<{ leaderboard: LeaderboardEntry[] }>('/english/leaderboard');
  return data.leaderboard.map((e) =>
    e.isUser ? { ...e, xp: useUserXp(), name: 'Bạn' } : e
  );
};

function useUserXp() {
  try {
    const raw = localStorage.getItem('english-progress');
    if (raw) return JSON.parse(raw).state?.xp ?? 0;
  } catch {
    /* ignore */
  }
  return 0;
}

export const englishTts = async (text: string, speed = 1, voice: 'female' | 'male' = 'female') => {
  const { data } = await client.post('/tts', { text, speed, voice, lang: 'en' });
  return data;
};
