import perfexApi from './perfexApi';

export interface Reminder {
  id: number;
  title: string;
  due_date: string;
  is_read: boolean;
  /** Present when the server relates the reminder to a record (e.g. a lead) */
  rel_type?: string;
  rel_id?: number | string;
}

export const remindersService = {
  getAll: async (): Promise<Reminder[]> => {
    // Failures must propagate so React Query retries and reports isError
    // instead of caching an empty list as fresh data.
    const { data } = await perfexApi.get<any>('/reminders');
    if (Array.isArray(data)) return data as Reminder[];
    if (data && Array.isArray(data.data)) return data.data as Reminder[];
    return [];
  },
};
