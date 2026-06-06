import perfexApi from './perfexApi';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: string;
  source: string;
  assigned_to: string;
  date_added: string;
  last_contact: string | null;
  value: number | null;
  tags: string[];
}

export interface Reminder {
  id: number;
  description: string;
  date: string;
  is_notified: number;
  staff_name: string;
}

const translateLead = (crmLead: any): Lead => {
  return {
    id: Number(crmLead.id),
    name: crmLead.name || '',
    email: crmLead.email || '',
    phone: crmLead.phonenumber || '',
    status: crmLead.status_name || String(crmLead.status) || '',
    source: crmLead.source_name || String(crmLead.source) || '',
    assigned_to: crmLead.assigned_name || String(crmLead.assigned) || 'Unassigned',
    date_added: crmLead.dateadded || crmLead.date_added || new Date().toISOString(),
    last_contact: crmLead.lastcontact || null,
    value: crmLead.lead_value ? Number(crmLead.lead_value) : null,
    tags: crmLead.tags ? (typeof crmLead.tags === 'string' ? crmLead.tags.split(',').map((t: string) => t.trim()) : crmLead.tags) : [],
  };
};

export const leadsService = {
  getAll: async (params?: { status?: string; search?: string; page?: number }): Promise<{ leads: Lead[]; total: number; page: number }> => {
    const { data: wrapper } = await perfexApi.get<any>('/leads', { params });
    const rawLeads = wrapper.data || [];
    const translatedLeads = rawLeads.map(translateLead);
    return {
      leads: translatedLeads,
      total: translatedLeads.length,
      page: params?.page || 1,
    };
  },

  getById: async (id: number): Promise<Lead> => {
    const { data: wrapper } = await perfexApi.get<any>(`/leads/${id}`);
    const crmLead = wrapper.data?.lead || wrapper.data;
    return translateLead(crmLead);
  },

  getReminders: async (leadId: number): Promise<Reminder[]> => {
    const { data: wrapper } = await perfexApi.get<any>(`/leads/${leadId}/reminders`);
    const rawReminders = wrapper.data || [];
    return rawReminders.map((r: any) => ({
      id: Number(r.id),
      description: r.description || '',
      date: r.date || '',
      is_notified: typeof r.is_notified === 'number' ? r.is_notified : Number(r.isnotified),
      staff_name: r.staff_name || 'Staff Member',
    }));
  },

  updateStatus: async (id: number, status: string) => {
    const { data } = await perfexApi.patch(`/leads/${id}/status`, { status });
    return data;
  },
};
