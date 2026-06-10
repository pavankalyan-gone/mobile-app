import { create } from 'zustand';

export type CallDirection = 'outgoing' | 'incoming';

/** A pending call older than this is considered stale and never prompts the user. */
export const PENDING_CALL_MAX_AGE_MS = 30 * 60 * 1000;

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
  setOutgoingCall: (call: Omit<PendingCall, 'startedAt' | 'direction'>) => void;
  setIncomingCall: (call: Omit<PendingCall, 'startedAt' | 'direction'>) => void;
  clearPendingCall: () => void;
  showModal: () => void;
  dismissModal: () => void;
}

export function isPendingCallFresh(call: PendingCall | null): call is PendingCall {
  return !!call && Date.now() - call.startedAt <= PENDING_CALL_MAX_AGE_MS;
}

export const useCallStore = create<CallStore>((set) => ({
  pendingCall: null,
  modalVisible: false,

  setOutgoingCall: (call) =>
    set({ pendingCall: { ...call, direction: 'outgoing', startedAt: Date.now() } }),

  setIncomingCall: (call) =>
    set({ pendingCall: { ...call, direction: 'incoming', startedAt: Date.now() } }),

  clearPendingCall: () => set({ pendingCall: null }),

  showModal: () => set({ modalVisible: true }),

  dismissModal: () => set({ modalVisible: false, pendingCall: null }),
}));
