import estimatorApi from './estimatorApi';

export interface Estimate {
  id: number;
  estimate_number: string;
  lead_id: number;
  lead_name: string;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  subtotal: number;
  total: number;
  currency: string;
  valid_until: string;
  created_at: string;
  items: EstimateItem[];
  pdf_url?: string;
}

export interface EstimateItem {
  id: number;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export const estimatesService = {
  getAll: async (params?: { status?: string; lead_id?: number; page?: number }) => {
    const { data } = await estimatorApi.get('/estimates', { params });
    return data as { estimates: Estimate[]; total: number };
  },

  getById: async (id: number) => {
    const { data } = await estimatorApi.get(`/estimates/${id}`);
    return data as Estimate;
  },

  updateStatus: async (id: number, status: Estimate['status']) => {
    const { data } = await estimatorApi.patch(`/estimates/${id}/status`, { status });
    return data;
  },
};
