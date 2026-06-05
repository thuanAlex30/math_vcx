import { create } from 'zustand';

export type TopicStatus = 'unknown' | 'learning' | 'weak' | 'strong';

export interface WeakTopic {
  id: string;
  name: string;
  grade: number | null;
  severity: 'low' | 'medium' | 'high';
}

export interface KnowledgeNode {
  id: string;
  name: string;
  grade: number;
  status: TopicStatus;
}

interface StudentProfileStore {
  weakTopics: WeakTopic[];
  strongTopics: WeakTopic[];
  knowledgeNodes: KnowledgeNode[];
  loading: boolean;
  lastFetched: string | null;
  setProfile: (data: {
    weakTopics: WeakTopic[];
    strongTopics: WeakTopic[];
  }) => void;
  setKnowledgeMap: (nodes: KnowledgeNode[]) => void;
  setLoading: (v: boolean) => void;
}

export const useStudentProfileStore = create<StudentProfileStore>((set) => ({
  weakTopics: [],
  strongTopics: [],
  knowledgeNodes: [],
  loading: false,
  lastFetched: null,
  setProfile: ({ weakTopics, strongTopics }) =>
    set({ weakTopics, strongTopics, lastFetched: new Date().toISOString() }),
  setKnowledgeMap: (knowledgeNodes) =>
    set({ knowledgeNodes, lastFetched: new Date().toISOString() }),
  setLoading: (loading) => set({ loading }),
}));
