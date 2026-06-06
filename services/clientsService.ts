import estimatorApi from './estimatorApi';

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export const clientsService = {
  getAll: async (params?: { page?: number; search?: string }) => {
    const { data } = await estimatorApi.get('/clients', { params });
    return data as { data: Client[] };
  },
};
