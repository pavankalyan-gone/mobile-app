import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
}));
jest.mock('../../services/leadsService', () => ({
  leadsService: {
    addNote: jest.fn(),
    addReminder: jest.fn(),
  },
}));

import { addToOutbox, flushOutbox } from '../outbox';
import { leadsService } from '../../services/leadsService';

const addNote = leadsService.addNote as jest.Mock;
const addReminder = leadsService.addReminder as jest.Mock;

const networkError = () => Object.assign(new Error('Network Error'), { response: undefined });
const serverError = (status: number) => Object.assign(new Error('Request failed'), { response: { status } });

async function queuedItems(): Promise<any[]> {
  const raw = await AsyncStorage.getItem('offline_outbox_v1');
  return raw ? JSON.parse(raw) : [];
}

beforeEach(async () => {
  await AsyncStorage.clear();
  addNote.mockReset();
  addReminder.mockReset();
});

describe('outbox', () => {
  it('flushes queued notes and reminders in order and empties the queue', async () => {
    addNote.mockResolvedValue({ message: 'ok' });
    addReminder.mockResolvedValue({ message: 'ok' });

    await addToOutbox({ kind: 'note', leadId: 7, description: 'first', queuedAt: 1 });
    await addToOutbox({
      kind: 'reminder',
      leadId: 7,
      payload: { description: 'follow up', date: '2026-06-12 09:00:00', notify_by_email: 0 },
      queuedAt: 2,
    });

    await flushOutbox();

    expect(addNote).toHaveBeenCalledWith(7, 'first');
    expect(addReminder).toHaveBeenCalledWith(7, expect.objectContaining({ description: 'follow up' }));
    expect(await queuedItems()).toHaveLength(0);
  });

  it('keeps the queue intact when still offline (no server response)', async () => {
    addNote.mockRejectedValue(networkError());

    await addToOutbox({ kind: 'note', leadId: 1, description: 'offline note', queuedAt: 1 });
    await flushOutbox();

    expect(await queuedItems()).toHaveLength(1);
    expect(addNote).toHaveBeenCalledTimes(1);
  });

  it('drops an item the server rejected so it cannot block the queue', async () => {
    // First item is rejected by the server (e.g. lead deleted), second is fine
    addNote.mockRejectedValueOnce(serverError(404)).mockResolvedValueOnce({ message: 'ok' });

    await addToOutbox({ kind: 'note', leadId: 99, description: 'bad lead', queuedAt: 1 });
    await addToOutbox({ kind: 'note', leadId: 2, description: 'good lead', queuedAt: 2 });

    await flushOutbox();

    expect(addNote).toHaveBeenNthCalledWith(1, 99, 'bad lead');
    expect(addNote).toHaveBeenNthCalledWith(2, 2, 'good lead');
    expect(await queuedItems()).toHaveLength(0);
  });

  it('resumes from the front of the queue on the next flush', async () => {
    addNote.mockRejectedValueOnce(networkError());
    await addToOutbox({ kind: 'note', leadId: 5, description: 'retry me', queuedAt: 1 });
    await flushOutbox();
    expect(await queuedItems()).toHaveLength(1);

    addNote.mockResolvedValue({ message: 'ok' });
    await flushOutbox();
    expect(addNote).toHaveBeenLastCalledWith(5, 'retry me');
    expect(await queuedItems()).toHaveLength(0);
  });

  it('survives corrupted storage without throwing', async () => {
    await AsyncStorage.setItem('offline_outbox_v1', '{not json');
    await expect(flushOutbox()).resolves.toBeUndefined();
  });
});
