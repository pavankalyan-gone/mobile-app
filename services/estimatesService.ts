import estimatorApi from './estimatorApi';

export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired'
  | 'approved'
  | 'waiting_approval'
  | 'pending_approval';

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
  created_at?: string;
  lead_name?: string;
  valid_until: string;
  total: number;
}

export interface EstimateDetailItem {
  id: number;
  description: string;
  qty: number;
  rate: number;
  amount: number;
}

export interface EstimateDetail extends Estimate {
  sections: EstimateSection[];
  items: EstimateDetailItem[];
  subtotal: number;
  pdf_url: string | null;
  lead_id: number | null;
}

export interface EstimatesResponse {
  current_page: number;
  data: Estimate[];
  total: number;
  per_page: number;
  last_page: number;
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

export interface PostCommentPayload {
  content: string;
  parent_id?: number | null;
}

export const estimatesService = {
  getAll: async (params?: { status?: string; client_id?: number; page?: number }): Promise<EstimatesResponse> => {
    const { data } = await estimatorApi.get('/estimates', { params });
    return data as EstimatesResponse;
  },

  getById: async (id: number): Promise<EstimateDetail> => {
    const { data } = await estimatorApi.get(`/estimates/${id}`);
    return data as EstimateDetail;
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
