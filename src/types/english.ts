export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';
export type ChatRole = 'teacher' | 'native' | 'ielts' | 'friend';
export type EnglishSkill =
  | 'vocabulary'
  | 'grammar'
  | 'pronunciation'
  | 'listening'
  | 'reading'
  | 'writing'
  | 'chat';

export type EnglishGrade = 6 | 7 | 8 | 9 | 10 | 11 | 12;

export interface VocabWord {
  word: string;
  ipa: string;
  meaning: string;
  example?: string;
  image: string;
  synonym?: string;
  antonym?: string;
  collocation?: string;
  wordFamily?: string;
}

export interface VocabTopic {
  id: string;
  label: string;
  emoji: string;
  words: VocabWord[];
  grade?: number;
  totalWords?: number;
  unlimited?: boolean;
  difficulty?: string;
  features?: {
    hasImages?: boolean;
    hasExamples?: boolean;
    hasSynonyms?: boolean;
    hasCollocations?: boolean;
    hasWordFamilies?: boolean;
  };
}

export interface GrammarTopic {
  id: string;
  title: string;
  formula: string;
}

export interface EnglishCurriculum {
  grade: number;
  vocabulary: {
    wordsPerSession: number;
    topics: string[];
    difficulty: string;
  };
  grammar: { difficulty: string; topicIds: string[] };
  pronunciation: { description: string; exercises: string[] };
  listening: { durationSec: number; speed: number; topics: string[] };
  reading: { lengthWords: number; newWordsPercent: number };
  writing: { type: string; promptHint: string; lengthWords: number | null; lengthSentences: number | null };
  conversation: { turns: number; topicHint: string };
}

export interface PronunciationPractice {
  grade: number;
  content: string;
  description: string;
  exercises: string[];
  sentences: string[];
}

export interface ListeningQuestion {
  question: string;
  options: string[];
  answer: number;
  explanation: string;
}

export interface WritingError {
  original: string;
  fix: string;
  explanation: string;
  type: string;
}

export interface WritingResult {
  corrected: string;
  errors: WritingError[];
  suggestions: string[];
  score: number;
}

export interface PronunciationResult {
  score: number;
  wrongWords: string[];
  feedback: string;
  tips: string[];
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  streak: number;
  isUser?: boolean;
}
