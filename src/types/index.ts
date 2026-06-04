export interface SolutionStep {
  id: string;
  title: string;
  content: string;
}

export interface VisualizationData {
  visualization: 'graph' | 'geometry' | 'vector';
  data: {
    expression?: string;
    latex?: string;
    roots?: number[];
    type?: string;
    sides?: number[];
    vectors?: string[];
  };
}

export interface SolveResult {
  solution: string;
  question: string;
  steps?: SolutionStep[];
  visualization?: VisualizationData | null;
  demo?: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface HistoryItem {
  id: string;
  question: string;
  solution: string;
  timestamp: string;
  topic?: string;
  visualization?: VisualizationData | null;
}

export interface TtsResponse {
  audioBase64: string | null;
  format: string | null;
  fallback: boolean;
  text: string;
  speed?: number;
  message?: string;
  provider?: 'edge' | 'kokoro' | 'browser';
  voice?: string;
}
