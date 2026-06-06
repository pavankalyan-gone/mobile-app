import estimatorApi from './estimatorApi';

export interface Reminder {
  id: number;
  title: string;
  due_date: string;
  is_read: boolean;
}

export const remindersService = {
  getAll: async (): Promise<Reminder[]> => {
    const { data } = await estimatorApi.get('/reminders');
    return data as Reminder[];
  },
};
