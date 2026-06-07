import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsService, CreateLeadPayload, AddReminderPayload, GetLeadsParams } from '../services/leadsService';

export const useLeads = (params?: GetLeadsParams) =>
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
    mutationFn: ({ id, status }: { id: number; status: number | string }) =>
      leadsService.updateStatus(id, status),
    onSuccess: (_, variables) => {
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
