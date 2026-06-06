import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService } from '../services/leadsService';

export const useLeads = (params?: { status?: string; search?: string; page?: number }) =>
  useQuery({
    queryKey: ['leads', params],
    queryFn: () => leadsService.getAll(params),
    staleTime: 1000 * 60 * 2,
  });

export const useLead = (id: number) =>
  useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsService.getById(id),
    enabled: !!id,
  });

export const useLeadReminders = (leadId: number) =>
  useQuery({
    queryKey: ['lead-reminders', leadId],
    queryFn: () => leadsService.getReminders(leadId),
    enabled: !!leadId,
  });

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      leadsService.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};
