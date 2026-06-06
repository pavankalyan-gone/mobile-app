import { useQuery } from '@tanstack/react-query';
import { remindersService } from '../services/remindersService';

export const useReminders = () =>
  useQuery({
    queryKey: ['reminders'],
    queryFn: () => remindersService.getAll(),
    staleTime: 1000 * 60 * 2,
  });
