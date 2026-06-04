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

export interface VocabWord {
  word: string;
  ipa: string;
  meaning: string;
  example: string;
  image: string;
}

export interface VocabTopic {
  id: string;
  label: string;
  emoji: string;
  words: VocabWord[];
}

export interface GrammarTopic {
  id: string;
  title: string;
  formula: string;
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
