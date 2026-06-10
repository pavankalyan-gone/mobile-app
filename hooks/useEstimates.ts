import { useQuery, useInfiniteQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { estimatesService, EstimateDetail, EstimateStatus, PostCommentPayload } from '../services/estimatesService';

export const useEstimates = (params?: { status?: string; client_id?: number }) =>
  useInfiniteQuery({
    queryKey: ['estimates', params],
    queryFn: ({ pageParam }) => estimatesService.getAll({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.current_page < lastPage.last_page ? lastPage.current_page + 1 : undefined,
    staleTime: 1000 * 60 * 2,
  });

export const useEstimate = (id: number) =>
  useQuery({
    queryKey: ['estimate', id],
    queryFn: () => estimatesService.getById(id),
    enabled: !!id,
  });

/**
 * Optimistically writes the new status into the detail cache so the UI updates
 * instantly, rolls back on error, and re-syncs with the server when settled.
 * Replaces the fragile local-useState mirrors the detail screens used to keep.
 */
function optimisticStatus<TVars>(
  queryClient: QueryClient,
  mutationFn: (vars: TVars) => Promise<unknown>,
  getId: (vars: TVars) => number,
  getStatus: (vars: TVars) => EstimateStatus,
) {
  return {
    mutationFn,
    onMutate: async (vars: TVars) => {
      const id = getId(vars);
      await queryClient.cancelQueries({ queryKey: ['estimate', id] });
      const previous = queryClient.getQueryData<EstimateDetail>(['estimate', id]);
      if (previous) {
        queryClient.setQueryData<EstimateDetail>(['estimate', id], {
          ...previous,
          status: getStatus(vars),
        });
      }
      return { previous };
    },
    onError: (_err: unknown, vars: TVars, context?: { previous?: EstimateDetail }) => {
      if (context?.previous) {
        queryClient.setQueryData(['estimate', getId(vars)], context.previous);
      }
    },
    onSettled: (_data: unknown, _err: unknown, vars: TVars) => {
      queryClient.invalidateQueries({ queryKey: ['estimate', getId(vars)] });
      queryClient.invalidateQueries({ queryKey: ['estimates'] });
    },
  };
}

export const useSendEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation(
    optimisticStatus(queryClient, (id: number) => estimatesService.send(id), (id) => id, () => 'sent')
  );
};

export const useMarkEstimateAs = () => {
  const queryClient = useQueryClient();
  return useMutation(
    optimisticStatus(
      queryClient,
      ({ id, status }: { id: number; status: EstimateStatus }) => estimatesService.markAs(id, status),
      (v) => v.id,
      (v) => v.status
    )
  );
};

export const useUpdateEstimateStatus = useMarkEstimateAs;

export const useSubmitEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation(
    optimisticStatus(queryClient, (id: number) => estimatesService.submit(id), (id) => id, () => 'waiting_approval')
  );
};

export const useApproveEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation(
    optimisticStatus(queryClient, (id: number) => estimatesService.approve(id), (id) => id, () => 'approved')
  );
};

export const useRejectEstimate = () => {
  const queryClient = useQueryClient();
  return useMutation(
    optimisticStatus(
      queryClient,
      ({ id, reason }: { id: number; reason: string }) => estimatesService.reject(id, reason),
      (v) => v.id,
      () => 'declined'
    )
  );
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
