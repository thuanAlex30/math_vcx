import { create } from 'zustand';
import axios from 'axios';
import type { User } from '../types/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const authClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30000,
});

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    grade?: number;
  }) => Promise<void>;
  loginWithGoogle: () => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authClient.post<{ user: User }>('/auth/login', {
        email,
        password,
      });
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Đăng nhập thất bại';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  register: async ({ name, email, password, grade }) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authClient.post<{ user: User }>('/auth/register', {
        name,
        email,
        password,
        grade,
      });
      set({ user: data.user, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: unknown) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.error
          ? String(err.response.data.error)
          : 'Đăng ký thất bại';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  loginWithGoogle: () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  },

  logout: async () => {
    try {
      await authClient.post('/auth/logout');
    } catch {
      /* cookie có thể đã hết hạn */
    }
    set({ user: null, isAuthenticated: false, isLoading: false, error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const { data } = await authClient.get<{ user: User }>('/auth/me');
      set({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
