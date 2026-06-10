import perfexApi from './perfexApi';

export interface Reminder {
  id: number;
  title: string;
  due_date: string;
  is_read: boolean;
}

export const remindersService = {
  getAll: async (): Promise<Reminder[]> => {
    try {
      const { data } = await perfexApi.get<any>('/reminders');
      if (Array.isArray(data)) return data as Reminder[];
      if (data && Array.isArray(data.data)) return data.data as Reminder[];
      return [];
    } catch {
      return [];
    }
  },
};
