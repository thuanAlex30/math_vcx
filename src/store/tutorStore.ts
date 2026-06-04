import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, SolutionStep, VisualizationData } from '../types';
import type { VoiceChoice } from '../components/AudioPlayer';

interface TutorStore {
  question: string;
  image: string | null;
  solution: string;
  steps: SolutionStep[];
  visualization: VisualizationData | null;
  isLoading: boolean;
  chatMessages: ChatMessage[];
  expandedSteps: string[];
  speechRate: number;
  voice: VoiceChoice;
  setQuestion: (q: string) => void;
  setImage: (img: string | null) => void;
  setSolution: (s: string, steps?: SolutionStep[], viz?: VisualizationData | null) => void;
  appendSolution: (token: string) => void;
  setLoading: (v: boolean) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setChatMessages: (msgs: ChatMessage[]) => void;
  toggleStep: (id: string) => void;
  expandAllSteps: () => void;
  setSpeechRate: (r: number) => void;
  setVoice: (v: VoiceChoice) => void;
  reset: () => void;
}

export const useTutorStore = create<TutorStore>()(
  persist(
    (set, get) => ({
      question: '',
      image: null,
      solution: '',
      steps: [],
      visualization: null,
      isLoading: false,
      chatMessages: [],
      expandedSteps: [],
      speechRate: 1,
      voice: 'female',
      setQuestion: (question) => set({ question }),
      setImage: (image) => set({ image }),
      setSolution: (solution, steps = [], visualization = null) =>
        set({
          solution,
          steps,
          visualization,
          expandedSteps: steps.map((s) => s.id),
        }),
      appendSolution: (token) =>
        set((state) => ({ solution: state.solution + token })),
      setLoading: (isLoading) => set({ isLoading }),
      addChatMessage: (msg) =>
        set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
      setChatMessages: (chatMessages) => set({ chatMessages }),
      toggleStep: (id) => {
        const { expandedSteps } = get();
        set({
          expandedSteps: expandedSteps.includes(id)
            ? expandedSteps.filter((s) => s !== id)
            : [...expandedSteps, id],
        });
      },
      expandAllSteps: () => {
        const { steps } = get();
        set({ expandedSteps: steps.map((s) => s.id) });
      },
      setSpeechRate: (speechRate) => set({ speechRate }),
      setVoice: (voice) => set({ voice }),
      reset: () =>
        set({
          solution: '',
          steps: [],
          visualization: null,
          chatMessages: [],
          expandedSteps: [],
        }),
    }),
    {
      name: 'math-tutor-prefs',
      partialize: (s) => ({ speechRate: s.speechRate, voice: s.voice }),
    }
  )
);
