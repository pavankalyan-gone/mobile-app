import perfexApi from './perfexApi';

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  status_id: string;
  source: string;
  assigned_to: string;
  date_added: string;
  last_contact: string | null;
  value: number | null;
}

export interface LeadDetail extends Lead {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  hash: string;
  notes: LeadNote[];
  attachments: LeadAttachment[];
  reminders: Reminder[];
  activity_log: ActivityLogEntry[];
  custom_fields: CustomFieldDefinition[];
  custom_field_values: Record<string, string>;
}

export interface LeadNote {
  id: number;
  rel_id: string;
  rel_type: string;
  description: string;
  dateadded: string;
  addedfrom: string;
  staff_name: string;
}

export interface LeadAttachment {
  id: number;
  file_name: string;
  filetype: string;
  dateadded: string;
}

export interface Reminder {
  id: number;
  rel_id: string;
  rel_type: string;
  description: string;
  date: string;
  staff: string;
  notify_by_email: string;
  creator: string;
  isnotified: string;
  staff_name?: string;
  is_notified: number;
}

export interface ActivityLogEntry {
  id: number;
  leadid: string;
  date: string;
  description: string;
  additional_data: string | null;
  staffid: string;
}

export interface CustomFieldDefinition {
  id: number;
  fieldto: string;
  name: string;
  slug?: string;
  type: 'input' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'date' | 'datetime' | 'textarea' | 'colorpicker';
  required: string;
  options: string;
  field_order: string;
  active: string;
  bs_column?: string;
  default_value?: string;
}

export interface CreateLeadPayload {
  name: string;
  company?: string;
  email?: string;
  phonenumber?: string;
  title?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: number;
  website?: string;
  lead_value?: number;
  assigned?: number;
  status?: number;
  source?: number;
  custom_fields?: { leads: Record<string, string> };
}

export interface AddReminderPayload {
  description: string;
  date: string;
  notify_by_email: 0 | 1;
}

export interface GetLeadsParams {
  status?: number;
  source?: number;
  assigned?: number | 'me';
  search?: string;
  lost?: '0' | '1';
  junk?: '0' | '1';
  sort?: 'dateadded' | 'name' | 'company' | 'id' | 'email' | 'phonenumber' | 'status';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

const translateReminder = (r: any): Reminder => ({
  id: Number(r.id),
  rel_id: r.rel_id,
  rel_type: r.rel_type,
  description: r.description || '',
  date: r.date || '',
  staff: r.staff,
  notify_by_email: r.notify_by_email,
  creator: r.creator,
  isnotified: r.isnotified,
  staff_name: r.staff_name || '',
  is_notified: typeof r.is_notified === 'number' ? r.is_notified : Number(r.isnotified),
});

const translateLead = (raw: any): Lead => ({
  id: Number(raw.id),
  name: raw.name || '',
  email: raw.email || '',
  phone: raw.phonenumber || '',
  company: raw.company || '',
  status: raw.status_name || String(raw.status) || '',
  status_id: String(raw.status),
  source: raw.source_name || String(raw.source) || '',
  assigned_to: raw.assigned_name || String(raw.assigned) || 'Unassigned',
  date_added: raw.dateadded || new Date().toISOString(),
  last_contact: raw.lastcontact || null,
  value: raw.lead_value ? Number(raw.lead_value) : null,
});

const translateLeadDetail = (raw: any, rest: any): LeadDetail => ({
  ...translateLead(raw),
  title: raw.title || '',
  description: raw.description || '',
  address: raw.address || '',
  city: raw.city || '',
  state: raw.state || '',
  zip: raw.zip || '',
  country: raw.country || '',
  website: raw.website || '',
  hash: raw.hash || '',
  notes: (rest.notes || []).map((n: any): LeadNote => ({
    id: Number(n.id),
    rel_id: n.rel_id,
    rel_type: n.rel_type,
    description: n.description,
    dateadded: n.dateadded,
    addedfrom: n.addedfrom,
    staff_name: n.staff_name || '',
  })),
  attachments: (rest.attachments || []).map((a: any): LeadAttachment => ({
    id: Number(a.id),
    file_name: a.file_name,
    filetype: a.filetype,
    dateadded: a.dateadded,
  })),
  reminders: (rest.reminders || []).map(translateReminder),
  activity_log: (rest.activity_log || []).map((e: any): ActivityLogEntry => ({
    id: Number(e.id),
    leadid: e.leadid,
    date: e.date,
    description: e.description,
    additional_data: e.additional_data || null,
    staffid: e.staffid,
  })),
  custom_fields: (rest.custom_fields || []).map((f: any): CustomFieldDefinition => ({
    id: Number(f.id),
    fieldto: f.fieldto,
    name: f.name,
    slug: f.slug,
    type: f.type,
    required: f.required,
    options: f.options || '',
    field_order: f.field_order,
    active: f.active,
    bs_column: f.bs_column,
    default_value: f.default_value,
  })),
  custom_field_values: rest.custom_field_values || {},
});

export const leadsService = {
  getAll: async (params?: GetLeadsParams): Promise<{ leads: Lead[]; page: number }> => {
    const { data: wrapper } = await perfexApi.get<any>('/leads', { params });
    const raw = wrapper.data || [];
    return { leads: raw.map(translateLead), page: params?.page || 1 };
  },

  getById: async (id: number): Promise<LeadDetail> => {
    const { data: wrapper } = await perfexApi.get<any>(`/leads/${id}`);
    const payload = wrapper.data || {};
    return translateLeadDetail(payload.lead || payload, payload);
  },

  create: async (payload: CreateLeadPayload): Promise<{ id: number; message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>('/lead_create', payload);
    return wrapper.data;
  },

  update: async (id: number, payload: Partial<CreateLeadPayload>): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_update/${id}`, payload);
    return wrapper.data;
  },

  updateStatus: async (id: number, status: number): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/leads/${id}/status`, { status });
    return wrapper.data;
  },

  markLost: async (id: number) => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_mark_lost/${id}`);
    return wrapper.data;
  },

  unmarkLost: async (id: number) => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_unmark_lost/${id}`);
    return wrapper.data;
  },

  markJunk: async (id: number) => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_mark_junk/${id}`);
    return wrapper.data;
  },

  unmarkJunk: async (id: number) => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_unmark_junk/${id}`);
    return wrapper.data;
  },

  addNote: async (id: number, description: string): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_note/${id}`, { description });
    return wrapper.data;
  },

  getReminders: async (leadId: number): Promise<Reminder[]> => {
    const { data: wrapper } = await perfexApi.get<any>(`/leads/${leadId}/reminders`);
    return (wrapper.data || []).map(translateReminder);
  },

  addReminder: async (leadId: number, payload: AddReminderPayload): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_reminder/${leadId}`, payload);
    return wrapper.data;
  },

  getCustomFields: async (type: string = 'leads'): Promise<CustomFieldDefinition[]> => {
    const { data: wrapper } = await perfexApi.get<any>(`/custom_fields/${type}`);
    return (wrapper.data || []).map((f: any): CustomFieldDefinition => ({
      id: Number(f.id),
      fieldto: f.fieldto,
      name: f.name,
      slug: f.slug,
      type: f.type,
      required: f.required,
      options: f.options || '',
      field_order: f.field_order,
      active: f.active,
      bs_column: f.bs_column,
      default_value: f.default_value,
    })),
  },
};
