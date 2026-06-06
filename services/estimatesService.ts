import estimatorApi from './estimatorApi';

export type EstimateStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface EstimateItem {
  product_id: number;
  quantity: number;
  unit_price: number;
  discount_percentage?: number;
}

export interface EstimateSection {
  name: string;
  items: EstimateItem[];
}

export interface Estimate {
  id: number;
  estimate_number: string;
  client_id: number;
  status: EstimateStatus;
  total_amount: number;
  expiry_date: string;
  created_by: number;
  created_at?: string;
}

export interface EstimateDetail extends Estimate {
  sections: EstimateSection[];
}

export interface Comment {
  id: number;
  estimate_id: number;
  user_id: number;
  content: string;
  parent_id: number | null;
  created_at: string;
  user?: { name: string };
}

export interface CreateEstimatePayload {
  client_id: number;
  expiry_date: string;
  sections: EstimateSection[];
}

export interface PostCommentPayload {
  content: string;
  parent_id?: number | null;
}

export const estimatesService = {
  getAll: async (params?: { status?: string; client_id?: number; page?: number }) => {
    const { data } = await estimatorApi.get('/estimates', { params });
    return data as { current_page: number; data: Estimate[] };
  },

  getById: async (id: number) => {
    const { data } = await estimatorApi.get(`/estimates/${id}`);
    return data as EstimateDetail;
  },

  create: async (payload: CreateEstimatePayload) => {
    const { data } = await estimatorApi.post('/estimates', payload);
    return data as { success: boolean; estimate: Estimate };
  },

  update: async (id: number, payload: Partial<CreateEstimatePayload>) => {
    const { data } = await estimatorApi.put(`/estimates/${id}`, payload);
    return data as { success: boolean; message: string };
  },

  delete: async (id: number) => {
    const { data } = await estimatorApi.delete(`/estimates/${id}`);
    return data as { success: boolean; message: string };
  },

  copy: async (id: number) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/copy`);
    return data as { success: boolean; new_estimate_id: number; message: string };
  },

  send: async (id: number) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/send`);
    return data as { success: boolean; message: string };
  },

  markAs: async (id: number, status: EstimateStatus) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/mark-as/${status}`);
    return data as { success: boolean; new_status: string; message: string };
  },

  submit: async (id: number) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/submit`);
    return data as { success: boolean; message: string };
  },

  approve: async (id: number) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/approve`);
    return data as { success: boolean; message: string };
  },

  reject: async (id: number, reason: string) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/reject`, { reason });
    return data as { success: boolean; message: string };
  },

  listComments: async (id: number) => {
    const { data } = await estimatorApi.get(`/estimates/${id}/comments`);
    return data as Comment[];
  },

  postComment: async (id: number, payload: PostCommentPayload) => {
    const { data } = await estimatorApi.post(`/estimates/${id}/comments`, payload);
    return data as { success: boolean; comment: Comment };
  },
};
