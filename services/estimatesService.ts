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
    // Let request failures propagate: swallowing them caches an empty list as
    // a successful response, so the user sees "no estimates" instead of the
    // error/retry state and React Query's retries never engage.
    try {
      console.log('[EstimatesService] Requesting estimates with params:', params);
      const { data } = await estimatorApi.get<any>('/estimates', { params });
      console.log('[EstimatesService] Received estimates response:', JSON.stringify(data).slice(0, 500));
      if (Array.isArray(data)) {
        return { data, current_page: 1, last_page: 1, total: data.length, per_page: data.length };
      }
      if (data && Array.isArray(data.estimates)) {
        const total = data.total ?? data.estimates.length;
        const limit = 20;
        const lastPage = Math.max(1, Math.ceil(total / limit));
        const currentPage = params?.page ?? 1;
        return {
          data: data.estimates,
          current_page: currentPage,
          last_page: lastPage,
          total: total,
          per_page: limit,
        };
      }
      if (data && Array.isArray(data.data)) {
        return {
          data: data.data,
          current_page: data.current_page || 1,
          last_page: data.last_page || 1,
          total: data.total || data.data.length,
          per_page: data.per_page || data.data.length,
        };
      }
      console.warn('[EstimatesService] Estimates response had unrecognized format, returning empty array.');
      return { data: [], current_page: 1, last_page: 1, total: 0, per_page: 0 };
    } catch (err: any) {
      console.error('[EstimatesService] getAll estimates error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      throw err;
    }
  },

  getById: async (id: number): Promise<EstimateDetail> => {
    try {
      console.log(`[EstimatesService] Requesting estimate detail for ID: ${id}`);
      const { data } = await estimatorApi.get(`/estimates/${id}`);
      console.log(`[EstimatesService] Received estimate detail response for ID: ${id}:`, JSON.stringify(data).slice(0, 500));
      return data as EstimateDetail;
    } catch (err: any) {
      console.error(`[EstimatesService] getById estimate details error for ID: ${id}:`, {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data
      });
      throw err;
    }
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
