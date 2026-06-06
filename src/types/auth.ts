import type { EnglishStatsPayload } from '../services/englishApi';

export type UserRole = 'student' | 'teacher';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  role: UserRole;
  grade: number | null;
  createdAt: string;
  englishStats?: EnglishStatsPayload;
}
