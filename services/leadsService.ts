import perfexApi from './perfexApi';
import { useAuthStore } from '../store/authStore';
import { normalizePhone, phonesMatch } from '../utils/phone';

const staffNameCache: Record<string, string> = {};

export interface Lead {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  status_id: string;
  status_color: string | null;
  source: string;
  source_id: string;
  assigned_to: string;
  assigned_id: string | null;
  date_added: string;
  last_contact: string | null;
  value: number | null;
  custom_fields?: CustomFieldDefinition[];
  custom_field_values?: Record<string, string>;
}

export interface LeadDetail extends Lead {
  title: string;
  description: string;
  lost: boolean;
  junk: boolean;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  website: string;
  hash: string;
  notes: LeadNote[];
  attachments: LeadAttachment[];
  reminders: LeadReminder[];
  activity_log: ActivityLogEntry[];
  custom_fields: CustomFieldDefinition[];
  custom_field_values: Record<string, string>;
  tags: string[];
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

export interface LeadReminder {
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
  additional_data?: string | null;
  staffid: number | string;
  full_name?: string;
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
  status?: number | string;
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

const translateReminder = (r: any): LeadReminder => ({
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

// `String(undefined)` is the truthy string "undefined" — never use it as a
// fallback chain link or the UI will literally render "undefined".
const asLabel = (value: unknown): string => (value == null ? '' : String(value));

const translateLead = (raw: any, rest?: any): Lead => {
  const merged = rest || raw;
  
  let extractedCustomFieldValues: Record<string, string> = { ...(merged.custom_field_values || {}) };
  let extractedCustomFields: any[] = merged.custom_fields || [];

  let rawCustomFieldsArray = merged.customfields || merged.custom_fields;
  
  if (rawCustomFieldsArray && Array.isArray(rawCustomFieldsArray)) {
    // If the array contains objects with 'value', map them to custom_field_values
    rawCustomFieldsArray.forEach((f: any) => {
      if (f.value != null && f.value !== '') {
        extractedCustomFieldValues[f.slug || f.name] = f.value;
        if (f.custom_field_id || f.id) {
          extractedCustomFieldValues[f.custom_field_id || f.id] = f.value;
        }
      }
    });

    // Map the array to our CustomFieldDefinition interface
    extractedCustomFields = rawCustomFieldsArray.map((f: any) => ({
      id: Number(f.custom_field_id || f.id || 0),
      name: f.name || '',
      slug: f.slug || f.name || '',
      type: f.type || 'input',
      required: f.required || '0',
      options: f.options || '',
      active: f.active || '1',
      fieldto: f.fieldto || 'leads',
      bs_column: f.bs_column || 12,
      default_value: f.default_value || '',
    }));
  }

  return {
    id: Number(raw.id),
    name: raw.name || '',
    email: raw.email || '',
    phone: raw.phonenumber || '',
    company: raw.company || '',
    status: raw.status_name || asLabel(raw.status),
    status_id: asLabel(raw.status),
    status_color: raw.color || raw.status_color || null,
    source: raw.source_name || asLabel(raw.source),
    source_id: asLabel(raw.source),
    assigned_to: raw.assigned_name || raw.staff_name || raw.assignee_name || (raw.assigned_firstname ? `${raw.assigned_firstname} ${raw.assigned_lastname || ''}`.trim() : null) || asLabel(raw.assigned) || 'Unassigned',
    assigned_id: asLabel(raw.assigned),
    date_added: raw.dateadded || new Date().toISOString(),
    last_contact: raw.lastcontact || null,
    value: raw.lead_value ? Number(raw.lead_value) : null,
    custom_fields: extractedCustomFields,
    custom_field_values: extractedCustomFieldValues,
  };
};

const translateActivityDescription = (desc: string, additionalData: string | null = null): string => {
  let text = desc;
  
  const translations: Record<string, string> = {
    'not_lead_activity_created': 'Lead created',
    'not_lead_activity_contacted': 'Lead contacted',
    'not_lead_activity_status_updated': 'Lead status updated',
    'not_lead_activity_assigned_to': 'Lead assigned',
    'not_lead_activity_added_attachment': 'Added attachment',
    'not_lead_activity_log_email': 'Email logged',
    'not_lead_activity_marked_lost': 'Marked as lost',
    'not_lead_activity_unmarked_lost': 'Unmarked as lost',
    'not_lead_activity_marked_junk': 'Marked as junk',
    'not_lead_activity_unmarked_junk': 'Unmarked as junk',
    'not_lead_activity_updated': 'Lead updated'
  };

  if (translations[desc]) {
    text = translations[desc];
  } else if (desc.startsWith('not_lead_activity_')) {
    // Fallback: remove the prefix and format it cleanly (e.g. "not_lead_activity_xyz" -> "Xyz")
    const cleaned = desc.replace('not_lead_activity_', '').replace(/_/g, ' ');
    text = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  }

  // If there's additional data, append it cleanly
  if (additionalData) {
    try {
      let parsed = additionalData;
      
      // Handle JSON arrays or objects
      if (additionalData.startsWith('[') || additionalData.startsWith('{')) {
        const jsonObj = JSON.parse(additionalData);
        if (Array.isArray(jsonObj)) {
          parsed = jsonObj.join(', ');
        }
      } 
      // Handle PHP serialized arrays (e.g., a:2:{i:0;s:12:"...";})
      else if (additionalData.startsWith('a:')) {
        const stringMatches = [...additionalData.matchAll(/s:\d+:"(.*?)";/g)];
        if (stringMatches.length > 0) {
          // Extract strings and strip HTML tags (like <a> links)
          const strings = stringMatches.map(m => m[1].replace(/<[^>]+>/g, ''));
          // Join with an arrow to show progression (e.g. "Old Status -> New Status")
          parsed = strings.join(' ➔ ');
        }
      }

      // Only append if we actually extracted something meaningful
      if (parsed && parsed.trim() !== '') {
        text += `\n${parsed}`;
      }
    } catch (e) {
      // Fallback: just append the raw string if parsing fails
      text += `\n${additionalData}`;
    }
  }

  return text;
};

const translateLeadDetail = (raw: any, rest: any): LeadDetail => {
  const baseLead = translateLead(raw, rest);
  const detail: LeadDetail = {
    ...baseLead,
    title: raw.title || '',
    description: raw.description || '',
    // Perfex tracks lost/junk as separate flags, not as a status. Fall back
    // to the status name only when the API omits the flag entirely.
    lost: raw.lost != null ? String(raw.lost) === '1' : baseLead.status.toLowerCase().includes('lost'),
    junk: raw.junk != null ? String(raw.junk) === '1' : baseLead.status.toLowerCase().includes('junk'),
    address: raw.address || '',
    city: raw.city || '',
    state: raw.state || '',
    zip: raw.zip || '',
    country: raw.country || '',
    website: raw.website || '',
    hash: raw.hash || '',
    custom_fields: baseLead.custom_fields || [],
    custom_field_values: baseLead.custom_field_values || {},
    tags: typeof rest.tags === 'string'
      ? rest.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
      : (Array.isArray(rest.tags) ? rest.tags : []),
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
    description: translateActivityDescription(e.description, e.additional_data),
    additional_data: e.additional_data || null,
    staffid: e.staffid,
    full_name: e.full_name || '',
  })),
  };

  // Cache any staff names we can find in the nested data
  detail.activity_log?.forEach(a => {
    if (a.staffid && a.full_name) staffNameCache[String(a.staffid)] = a.full_name;
  });
  detail.notes?.forEach(n => {
    if (n.addedfrom && n.staff_name) staffNameCache[String(n.addedfrom)] = n.staff_name;
  });
  detail.reminders?.forEach(r => {
    if (r.staff && r.staff_name) staffNameCache[String(r.staff)] = r.staff_name;
  });

  // Try to find the actual name of the assigned staff member from cache or nested data
  if (baseLead.assigned_to === String(raw.assigned)) {
    let foundName = staffNameCache[String(raw.assigned)];

    // Fallback: if it's ID 1 and we have no other data, it's almost certainly the Admin
    // Or if it matches the currently logged in user's ID
    if (!foundName) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser && String(currentUser.id) === String(raw.assigned)) {
        foundName = currentUser.name;
      } else if (String(raw.assigned) === '1') {
        foundName = 'Administrator';
      }
    }

    if (foundName) {
      detail.assigned_to = foundName.trim();
    }
  }

  return detail;
};

export const leadsService = {
  getStaffs: async (): Promise<{ id: string | number; full_name: string }[]> => {
    try {
      const { data: wrapper } = await perfexApi.get<any>('/staffs');
      const raw = wrapper?.data || wrapper || [];
      if (Array.isArray(raw)) {
        const parsed = raw.map((s: any) => {
          const staffId = s.staffid || s.staff_id || s.id;
          const fullName = s.full_name || (s.firstname ? `${s.firstname} ${s.lastname || ''}`.trim() : s.name || `Staff ${staffId}`);
          if (staffId && fullName) {
            staffNameCache[String(staffId)] = fullName;
          }
          return { id: staffId, full_name: fullName };
        });
        return parsed;
      }
      return [];
    } catch {
      return [];
    }
  },

  getSources: async (): Promise<{ id: number; name: string }[]> => {
    try {
      const { data: wrapper } = await perfexApi.get<any>('/lead_sources');
      const raw = wrapper?.data || wrapper || [];
      if (Array.isArray(raw)) {
        return raw.map((s: any) => ({
          id: Number(s.id),
          name: s.name,
        }));
      }
      return [];
    } catch {
      return [];
    }
  },

  getAll: async (params?: GetLeadsParams): Promise<{ leads: Lead[]; page: number; total: number | null }> => {
    const [{ data: wrapper }, staffs] = await Promise.all([
      perfexApi.get<any>('/leads', { params }),
      leadsService.getStaffs()
    ]);
    
    const raw = wrapper.data || [];
    const leads = raw.map((r: any) => {
      const lead = translateLead(r);
      if (lead.assigned_to && /^\d+$/.test(lead.assigned_to)) {
        const staff = staffs.find((s) => String(s.id) === lead.assigned_to);
        if (staff) {
          lead.assigned_to = staff.full_name;
        } else if (staffNameCache[lead.assigned_to]) {
          lead.assigned_to = staffNameCache[lead.assigned_to];
        }
      }
      return lead;
    });
    
    // The real API returns no total count — report null rather than the page
    // size so callers don't display "5 leads" for a 500-lead CRM.
    return { leads, page: params?.page || 1, total: wrapper.total ?? null };
  },

  /**
   * Finds the lead matching a caller's phone number. The CRM's text search
   * may miss formatted numbers ("+91 98765-43210" vs "09876543210"), so we
   * try several variants (raw, digits-only, last 10 digits) and verify each
   * candidate with a tolerant suffix comparison.
   */
  findByPhone: async (rawNumber: string): Promise<Lead | null> => {
    const digits = normalizePhone(rawNumber);
    const searchTerms = [rawNumber, digits, digits.slice(-10)]
      .filter((term, i, all) => term.length >= 4 && all.indexOf(term) === i);

    for (const term of searchTerms) {
      try {
        const { leads } = await leadsService.getAll({ search: term, limit: 10 });
        const matched = leads.find((l) => phonesMatch(l.phone, rawNumber));
        if (matched) return matched;
      } catch {
        // try the next variant — a failed search must not abort the lookup
      }
    }
    return null;
  },

  getById: async (id: number): Promise<LeadDetail> => {
    const { data: wrapper } = await perfexApi.get<any>(`/leads/${id}`);
    const payload = wrapper.data || {};
    const detail = translateLeadDetail(payload.lead || payload, payload);
    
    // Attempt to resolve staff names if they are just IDs
    const needsStaffResolution = 
      (detail.assigned_to && /^\d+$/.test(detail.assigned_to)) ||
      detail.notes?.some(n => !n.staff_name && n.addedfrom) ||
      detail.reminders?.some(r => !r.staff_name && r.staff) ||
      detail.activity_log?.some(a => !a.full_name && a.staffid && String(a.staffid) !== '0');

    if (needsStaffResolution) {
      try {
        const staffs = await leadsService.getStaffs();
        
        // Resolve assigned_to
        if (detail.assigned_to && /^\d+$/.test(detail.assigned_to)) {
          const staff = staffs.find(s => String(s.id) === detail.assigned_to);
          if (staff) detail.assigned_to = staff.full_name;
        }

        // Resolve notes
        detail.notes?.forEach(n => {
          if (!n.staff_name && n.addedfrom) {
            const staff = staffs.find(s => String(s.id) === String(n.addedfrom));
            if (staff) n.staff_name = staff.full_name;
          }
        });

        // Resolve reminders
        detail.reminders?.forEach(r => {
          if (!r.staff_name && r.staff) {
            const staff = staffs.find(s => String(s.id) === String(r.staff));
            if (staff) r.staff_name = staff.full_name;
          }
        });

        // Resolve activity log
        detail.activity_log?.forEach(a => {
          if (!a.full_name && a.staffid && String(a.staffid) !== '0') {
            const staff = staffs.find(s => String(s.id) === String(a.staffid));
            if (staff) a.full_name = staff.full_name;
          }
        });
      } catch (e) {
        // ignore
      }
    }
    
    return detail;
  },

  create: async (payload: CreateLeadPayload): Promise<{ id: number; message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>('/lead_create', payload);
    return wrapper.data;
  },

  update: async (id: number, payload: Partial<CreateLeadPayload>): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_update/${id}`, payload);
    return wrapper.data;
  },

  updateStatus: async (id: number, status: number | string): Promise<{ message: string }> => {
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
    // This endpoint reads the raw JSON body (a form body gets "Description is
    // required"), so request JSON-first; a 400 still falls back to form.
    const { data: wrapper } = await perfexApi.post<any>(
      `/lead_note/${id}`,
      { description },
      { _bodyEncoding: 'json' } as any
    );
    return wrapper.data;
  },

  updateNote: async (noteId: number, description: string): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(
      `/lead_note_update/${noteId}`,
      { description },
      { _bodyEncoding: 'json' } as any
    );
    return wrapper.data;
  },

  deleteNote: async (noteId: number): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_note_delete/${noteId}`);
    return wrapper.data;
  },

  getReminders: async (leadId: number): Promise<LeadReminder[]> => {
    const { data: wrapper } = await perfexApi.get<any>(`/leads/${leadId}/reminders`);
    return (wrapper.data || []).map(translateReminder);
  },

  addReminder: async (leadId: number, payload: AddReminderPayload): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_reminder/${leadId}`, payload);
    return wrapper.data;
  },

  deleteReminder: async (leadId: number, reminderId: number): Promise<{ message: string }> => {
    const { data: wrapper } = await perfexApi.post<any>(`/lead_reminder_delete/${leadId}/${reminderId}`);
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
    }));
  },

  getStatuses: async (): Promise<{ id: number; name: string; color: string }[]> => {
    interface LeadStatusRaw { id: string | number; name: string; color?: string }
    interface LeadStatusesResponse { data: LeadStatusRaw[] }
    const { data: wrapper } = await perfexApi.get<LeadStatusesResponse>('/lead_statuses');
    if (!Array.isArray(wrapper.data)) return [];
    return wrapper.data.map((s) => ({
      id: Number(s.id),
      name: s.name,
      color: s.color || '#eeeeec',
    }));
  },
};
