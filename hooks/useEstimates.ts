import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { estimatesService, CreateEstimatePayload, EstimateStatus, PostCommentPayload } from '../services/estimatesService';

export const useEstimates = (params?: { status?: string; client_id?: number; page?: number }) =>
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

export const useCreateEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEstimatePayload) => estimatesService.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useUpdateEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<CreateEstimatePayload> }) =>
      estimatesService.update(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
    },
  });
};

export const useDeleteEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => estimatesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useCopyEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => estimatesService.copy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useSendEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => estimatesService.send(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useMarkEstimateAs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: EstimateStatus }) =>
      estimatesService.markAs(id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useUpdateEstimateStatus = useMarkEstimateAs;

export const useSubmitEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => estimatesService.submit(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useApproveEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => estimatesService.approve(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useRejectEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      estimatesService.reject(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  });
};

export const useEstimateComments = (estimateId: number) =>
  useQuery({
    queryKey: ['estimate-comments', estimateId],
    queryFn: () => estimatesService.listComments(estimateId),
    enabled: !!estimateId,
  });

export const usePostComment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ estimateId, payload }: { estimateId: number; payload: PostCommentPayload }) =>
      estimatesService.postComment(estimateId, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['estimate-comments', variables.estimateId] });
    },
  });
};
