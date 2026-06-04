import axios from 'axios';
import type {
  ChatRole,
  EnglishLevel,
  GrammarTopic,
  ListeningQuestion,
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

export const fetchVocabTopics = async () => {
  const { data } = await client.get<{ topics: { id: string; label: string; emoji: string; wordCount: number }[] }>(
    '/english/topics/vocabulary'
  );
  return data.topics;
};

export const fetchVocabulary = async (topicId: string) => {
  const { data } = await client.get<VocabTopic>(`/english/vocabulary/${topicId}`);
  return data;
};

export const fetchGrammarTopics = async () => {
  const { data } = await client.get<{ topics: GrammarTopic[] }>('/english/topics/grammar');
  return data.topics;
};

export const explainGrammar = async (topicId: string, level: EnglishLevel) => {
  const { data } = await client.post<{ topic: GrammarTopic; explanation: string }>(
    '/english/grammar/explain',
    { topicId, level }
  );
  return data;
};

export const checkWriting = async (text: string, level: EnglishLevel) => {
  const { data } = await client.post<WritingResult>('/english/writing/check', { text, level });
  return data;
};

export const scorePronunciation = async (
  expected: string,
  spoken: string,
  level: EnglishLevel
) => {
  const { data } = await client.post<PronunciationResult>('/english/pronunciation/score', {
    expected,
    spoken,
    level,
  });
  return data;
};

export const generateListening = async (level: EnglishLevel, type = 'dialogue') => {
  const { data } = await client.post<{
    title: string;
    type: string;
    audioScript: string;
    questions: ListeningQuestion[];
  }>('/english/listening/generate', { level, type });
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

export const generateReading = async (level: EnglishLevel) => {
  const { data } = await client.post<{
    title: string;
    passage: string;
    questions: ListeningQuestion[];
  }>('/english/reading/generate', { level });
  return data;
};

export const englishChat = async (
  messages: ChatMessage[],
  level: EnglishLevel,
  role: ChatRole
) => {
  const { data } = await client.post<{ reply: string }>('/english/chat', {
    messages,
    level,
    role,
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
