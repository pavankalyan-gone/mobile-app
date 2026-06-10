import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, CreateLeadPayload, AddReminderPayload, GetLeadsParams, LeadDetail } from '../services/leadsService';

export const useLeads = (params?: GetLeadsParams) =>
  useInfiniteQuery({
    queryKey: ['leads', params],
    queryFn: ({ pageParam = 1 }) => leadsService.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (!lastPage) return undefined;
      const limit = params?.limit || 20;
      // The API doesn't return the total number of items, so if we got fewer items than requested,
      // it means there are no more pages.
      if (lastPage.leads.length < limit) {
        return undefined;
      }
      return lastPage.page + 1;
    },
    staleTime: 1000 * 60 * 2,
  });

export const useLead = (id: number) =>
  useQuery({
    queryKey: ['lead', id],
    queryFn: () => leadsService.getById(id),
    enabled: !!id,
  });

export const useCreateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadsService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
    },
  });
};

export const useUpdateLead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateLeadPayload> }) =>
      leadsService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
};

export const useUpdateLeadStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: number | string; statusName?: string }) =>
      leadsService.updateStatus(id, status),
    // Optimistically reflect the new status in the detail cache; roll back on error.
    onMutate: async ({ id, status, statusName }) => {
      await queryClient.cancelQueries({ queryKey: ['lead', id] });
      const previous = queryClient.getQueryData<LeadDetail>(['lead', id]);
      if (previous && statusName) {
        queryClient.setQueryData<LeadDetail>(['lead', id], {
          ...previous,
          status: statusName,
          status_id: String(status),
        });
      }
      return { previous };
    },
    onError: (_err, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['lead', variables.id], context.previous);
      }
    },
    onSettled: (_data, _err, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
};

export const useMarkLeadLost = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, lost }: { id: number; lost: boolean }) =>
      lost ? leadsService.markLost(id) : leadsService.unmarkLost(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
};

export const useMarkLeadJunk = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, junk }: { id: number; junk: boolean }) =>
      junk ? leadsService.markJunk(id) : leadsService.unmarkJunk(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
};

export const useAddLeadNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, description }: { id: number; description: string }) =>
      leadsService.addNote(id, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.id] });
    },
  });
};

export const useUpdateLeadNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, noteId, description }: { leadId: number; noteId: number; description: string }) =>
      leadsService.updateNote(noteId, description),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useDeleteLeadNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, noteId }: { leadId: number; noteId: number }) =>
      leadsService.deleteNote(noteId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead', variables.leadId] });
    },
  });
};

export const useLeadReminders = (leadId: number) =>
  useQuery({
    queryKey: ['lead-reminders', leadId],
    queryFn: () => leadsService.getReminders(leadId),
    enabled: !!leadId,
  });

export const useAddLeadReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: number; payload: AddReminderPayload }) =>
      leadsService.addReminder(leadId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-reminders', variables.leadId] });
    },
  });
};

export const useDeleteLeadReminder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, reminderId }: { leadId: number; reminderId: number }) =>
      leadsService.deleteReminder(leadId, reminderId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['lead-reminders', variables.leadId] });
    },
  });
};

export const useLeadCustomFields = (type: string = 'leads') =>
  useQuery({
    queryKey: ['custom-fields', type],
    queryFn: () => leadsService.getCustomFields(type),
    staleTime: 1000 * 60 * 10,
  });

export const useLeadStatuses = () =>
  useQuery({
    queryKey: ['lead-statuses'],
    queryFn: () => leadsService.getStatuses(),
    staleTime: 1000 * 60 * 10,
  });

export const useLeadSources = () =>
  useQuery({
    queryKey: ['lead-sources'],
    queryFn: () => leadsService.getSources(),
    staleTime: 1000 * 60 * 10,
  });

export const useStaffs = () =>
  useQuery({
    queryKey: ['staffs'],
    queryFn: () => leadsService.getStaffs(),
    staleTime: 1000 * 60 * 10,
  });
