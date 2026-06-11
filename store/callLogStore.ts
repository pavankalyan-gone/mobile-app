import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CallDirection } from './callStore';

export interface CallLogEntry {
  id: string;
  leadId: number;
  leadName: string;
  leadPhone: string;
  direction: CallDirection;
  /** epoch ms when the call started */
  at: number;
  durationMin: number;
  missed: boolean;
  noteSaved: boolean;
}

interface CallLogState {
  entries: CallLogEntry[];
  addEntry: (entry: Omit<CallLogEntry, 'id'>) => string;
  markNoteSaved: (id: string) => void;
  clear: () => void;
}

const MAX_ENTRIES = 200;

export const useCallLogStore = create<CallLogState>()(
  persist(
    (set) => ({
      entries: [],

      addEntry: (entry) => {
        const id = `${entry.leadId}-${entry.at}`;
        set((state) => ({
          entries: [{ ...entry, id }, ...state.entries].slice(0, MAX_ENTRIES),
        }));
        return id;
      },

      markNoteSaved: (id) =>
        set((state) => ({
          entries: state.entries.map((e) => (e.id === id ? { ...e, noteSaved: true } : e)),
        })),

      clear: () => set({ entries: [] }),
    }),
    {
      name: 'call-log',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
