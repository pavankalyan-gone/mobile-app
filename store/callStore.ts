import { create } from 'zustand';

export type CallDirection = 'outgoing' | 'incoming';

export interface PendingCall {
  leadId: number;
  leadName: string;
  leadPhone: string;
  direction: CallDirection;
  startedAt: number;
}

interface CallStore {
  pendingCall: PendingCall | null;
  modalVisible: boolean;
  /** Raw incoming phone number before lead lookup resolves */
  incomingNumber: string | null;
  setOutgoingCall: (call: Omit<PendingCall, 'startedAt' | 'direction'>) => void;
  setIncomingCall: (call: Omit<PendingCall, 'startedAt' | 'direction'>) => void;
  setIncomingNumber: (number: string) => void;
  showModal: () => void;
  dismissModal: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
  pendingCall: null,
  modalVisible: false,
  incomingNumber: null,

  setOutgoingCall: (call) =>
    set({ pendingCall: { ...call, direction: 'outgoing', startedAt: Date.now() } }),

  setIncomingCall: (call) =>
    set({
      pendingCall: { ...call, direction: 'incoming', startedAt: Date.now() },
      incomingNumber: null,
    }),

  setIncomingNumber: (number) => set({ incomingNumber: number }),

  showModal: () => set({ modalVisible: true }),

  dismissModal: () => set({ modalVisible: false, pendingCall: null }),
}));
