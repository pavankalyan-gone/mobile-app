import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estimatesService } from '../services/estimatesService';

export const useEstimates = (params?: { status?: string; lead_id?: number }) =>
  useQuery({
    queryKey: ['estimates', params],
    queryFn: () => estimatesService.getAll(params),
    staleTime: 1000 * 60 * 2,
  });

export const useEstimate = (id: number) =>
  useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimatesService.getById(id),
    enabled: !!id,
  });

export const useUpdateEstimateStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      estimatesService.updateStatus(id, status as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
    },
  });
};
