import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecentLead {
  id: number;
  name: string;
  company: string;
  viewedAt: number;
}

interface RecentLeadsState {
  entries: RecentLead[];
  record: (lead: { id: number; name: string; company?: string }) => void;
}

const MAX_RECENT = 10;

export const useRecentLeadsStore = create<RecentLeadsState>()(
  persist(
    (set) => ({
      entries: [],

      record: (lead) =>
        set((state) => ({
          entries: [
            { id: lead.id, name: lead.name, company: lead.company || '', viewedAt: Date.now() },
            ...state.entries.filter((e) => e.id !== lead.id),
          ].slice(0, MAX_RECENT),
        })),
    }),
    {
      name: 'recent-leads',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
