import { useQuery } from '@tanstack/react-query';
import { clientsService } from '../services/clientsService';

export const useClients = (params?: { page?: number; search?: string }) =>
  useQuery({
    queryKey: ['clients', params],
    queryFn: () => clientsService.getAll(params),
    staleTime: 1000 * 60 * 5,
  });
