import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { leadsService, AddReminderPayload } from '../services/leadsService';

/**
 * Offline outbox for writes made right after a call, when coverage is often
 * poor. Failed saves are queued in AsyncStorage and flushed when connectivity
 * returns (or on the next app start).
 */

const OUTBOX_KEY = 'offline_outbox_v1';

export type OutboxItem =
  | { kind: 'note'; leadId: number; description: string; queuedAt: number }
  | { kind: 'reminder'; leadId: number; payload: AddReminderPayload; queuedAt: number };

async function readOutbox(): Promise<OutboxItem[]> {
  try {
    const raw = await AsyncStorage.getItem(OUTBOX_KEY);
    const items = raw ? JSON.parse(raw) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function writeOutbox(items: OutboxItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(items));
  } catch {
    // storage failure: the in-flight save already showed its own error UI
  }
}

export async function addToOutbox(item: OutboxItem): Promise<void> {
  const items = await readOutbox();
  items.push(item);
  await writeOutbox(items);
}

let flushing = false;

export async function flushOutbox(): Promise<void> {
  if (flushing) return;
  flushing = true;
  try {
    let items = await readOutbox();
    while (items.length > 0) {
      const item = items[0];
      try {
        if (item.kind === 'note') {
          await leadsService.addNote(item.leadId, item.description);
        } else {
          await leadsService.addReminder(item.leadId, item.payload);
        }
      } catch (err: any) {
        // No response means still offline — keep the queue and retry later.
        if (!err?.response) return;
        // The server rejected it (e.g. lead deleted) — drop the item so one
        // bad entry can't block everything behind it.
      }
      items = items.slice(1);
      await writeOutbox(items);
    }
  } finally {
    flushing = false;
  }
}

let teardown: (() => void) | null = null;

/** Starts the connectivity listener and attempts an initial flush. */
export function initOutbox(): () => void {
  if (teardown) return teardown;
  const unsubscribe = NetInfo.addEventListener((state) => {
    if (state.isConnected) flushOutbox();
  });
  flushOutbox();
  teardown = () => {
    unsubscribe();
    teardown = null;
  };
  return teardown;
}
