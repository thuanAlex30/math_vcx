import axios from 'axios';
import type { ChatMessage, SolveResult, TtsResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL: API_BASE_URL, timeout: 120000 });

export const solveMath = async (data: {
  question: string;
  image?: string;
}): Promise<SolveResult> => {
  const response = await client.post<SolveResult>('/solve', data);
  return response.data;
};

export const solveMathStream = async (
  data: { question: string; image?: string },
  onToken: (token: string) => void,
  onDone?: (payload: SolveResult & { done: true }) => void
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
  context?: { question: string; solution: string }
) => {
  const response = await client.post<{ reply: string; demo?: boolean }>('/chat', {
    messages,
    context,
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
