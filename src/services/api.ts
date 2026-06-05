import axios from 'axios';
import type { ChatMessage, SolveResult, TtsResponse } from '../types';
import type { PreferredStyle, LearningGoal } from '../store/onboardingStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  withCredentials: true,
});

export interface StudentContext {
  name?: string;
  grade?: number;
  goals?: LearningGoal[];
  preferredStyle?: PreferredStyle;
}

export type SolveMode = 'full' | 'hint';
export type TutorPersona = 'teacher' | 'friend' | 'strict';

export interface WeakTopic {
  id: string;
  name: string;
  grade: number | null;
  severity: 'low' | 'medium' | 'high';
}

export interface KnowledgeMapNode {
  id: string;
  name: string;
  grade: number;
  status: 'unknown' | 'learning' | 'weak' | 'strong';
}

export interface DailyTask {
  id: string;
  type: 'math' | 'english' | 'review';
  title: string;
  description: string;
  ctaLabel: string;
  ctaRoute: string;
  ctaParams?: Record<string, string | number>;
  estimatedMinutes: number;
  completed: boolean;
}

export const solveMath = async (data: {
  question: string;
  image?: string;
  grade?: number;
  mode?: SolveMode;
  studentContext?: StudentContext;
  compact?: boolean;
}): Promise<SolveResult> => {
  const response = await client.post<SolveResult>('/solve', data);
  return response.data;
};

export const solveMathStream = async (
  data: {
    question: string;
    image?: string;
    studentSessionId?: string;
    grade?: number;
    mode?: SolveMode;
    studentContext?: StudentContext;
    compact?: boolean;
    skipProfileUpdate?: boolean;
    profileCorrect?: boolean;
  },
  onToken: (token: string) => void,
  onDone?: (payload: SolveResult & { done: true; topicId?: string; mode?: string }) => void
): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/solve-stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Stream failed');

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (reader) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      try {
        const parsed = JSON.parse(line.slice(6));
        if (parsed.token) onToken(parsed.token);
        if (parsed.error) {
          const msg = parsed.hint ? `${parsed.error} — ${parsed.hint}` : parsed.error;
          throw new Error(msg);
        }
        if (parsed.done) onDone?.(parsed);
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
};

export const sendChat = async (
  messages: ChatMessage[],
  context?: { question: string; solution: string },
  options?: {
    tutorPersona?: TutorPersona;
    grade?: number;
    studentContext?: StudentContext;
  }
) => {
  const response = await client.post<{ reply: string; demo?: boolean }>('/chat', {
    messages,
    context,
    ...options,
  });
  return response.data;
};

export const textToSpeech = async (
  text: string,
  speed = 1,
  voice: 'female' | 'male' = 'female'
): Promise<TtsResponse> => {
  const response = await client.post<TtsResponse>('/tts', { text, speed, voice });
  return response.data;
};

export const checkHealth = async () => {
  const response = await client.get('/health');
  return response.data;
};

export type PracticeSubject = 'math' | 'english';

export interface CurriculumTopic {
  id: string;
  label: string;
}

export interface PracticeQuestion {
  id?: number;
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  topicId?: string;
  topicLabel?: string;
}

export interface GenerateQuestionsResult {
  grade: number;
  subject: PracticeSubject;
  topic: string;
  questions: PracticeQuestion[];
  source: 'ai' | 'fallback';
  demo?: boolean;
  warning?: string;
}

export const fetchTopics = async (subject: PracticeSubject, grade: number) => {
  const response = await client.get<{
    subject: PracticeSubject;
    grade: number;
    topics: CurriculumTopic[];
  }>('/topics', { params: { subject, grade } });
  return response.data;
};

export const generatePracticeQuestions = async (data: {
  grade: number;
  subject: PracticeSubject;
  topic: string;
  numberOfQuestions?: number;
  lastScore?: number;
}) => {
  const response = await client.post<GenerateQuestionsResult>(
    '/generate-questions',
    data
  );
  return response.data;
};

// --- Profile & personalization ---

export const fetchProfile = async (sessionId: string) => {
  const response = await client.get(`/profile/${sessionId}`);
  return response.data as {
    weakTopics: WeakTopic[];
    strongTopics: WeakTopic[];
    topics: Record<string, unknown>;
  };
};

export const fetchKnowledgeMap = async (sessionId: string, grade?: number) => {
  const response = await client.get<{ nodes: KnowledgeMapNode[]; edges: unknown[] }>(
    `/profile/${sessionId}/knowledge-map`,
    { params: grade ? { grade } : {} }
  );
  return response.data;
};

export const fetchDailyPlan = async (
  sessionId: string,
  grade: number,
  preferredFormat?: string
) => {
  const response = await client.get<{ date: string; tasks: DailyTask[] }>(
    `/profile/${sessionId}/daily-plan`,
    { params: { grade, preferredFormat } }
  );
  return response.data;
};

export const completeDailyTask = async (sessionId: string, taskId: string) => {
  const response = await client.post(`/profile/${sessionId}/daily-plan/complete`, {
    taskId,
  });
  return response.data;
};

export const recordPractice = async (
  sessionId: string,
  topicId: string,
  correct: number,
  total: number
) => {
  const response = await client.post(`/profile/${sessionId}/record-practice`, {
    topicId,
    correct,
    total,
  });
  return response.data;
};

export const recordTopicResult = async (
  sessionId: string,
  topicId: string,
  isCorrect: boolean
) => {
  const response = await client.post(`/profile/${sessionId}/record-topic`, {
    topicId,
    isCorrect,
  });
  return response.data;
};

export const checkMathWriting = async (data: {
  problem: string;
  studentSolution: string;
  grade: number;
}) => {
  const response = await client.post<{
    score: number;
    feedback: string;
    suggestions: string[];
  }>('/math/writing/check', data);
  return response.data;
};

export const generateExam = async (grade: number) => {
  const response = await client.post<{
    questions: PracticeQuestion[];
    durationMinutes: number;
    totalQuestions: number;
  }>('/practice/generate-exam', { type: 'thpt', grade });
  return response.data;
};

export const submitExam = async (
  studentSessionId: string,
  answers: { topicId?: string; correct: boolean }[]
) => {
  const response = await client.post('/exam/submit', { studentSessionId, answers });
  return response.data;
};

export const analyzeExam = async (text: string, grade: number) => {
  const response = await client.post<{
    breakdown: { id: string; name: string; percent: number }[];
    summary: string;
    recommendReview: string[];
  }>('/exam/analyze', { text, grade });
  return response.data;
};

export const joinClassLeaderboard = async (data: {
  classCode: string;
  displayName: string;
  xp: number;
  mathPoints: number;
}) => {
  const response = await client.post('/leaderboard/class/join', data);
  return response.data;
};

export const fetchClassLeaderboard = async (code: string) => {
  const response = await client.get<{
    entries: { rank: number; name: string; xp: number; mathPoints: number }[];
  }>(`/leaderboard/class/${code}`);
  return response.data;
};

export function getStudentSessionId(): string {
  const KEY = 'mathmaster-student-session';
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
