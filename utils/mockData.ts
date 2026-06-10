import { AxiosRequestConfig, AxiosResponse } from 'axios';

const generateMockLeads = (count: number) => {
  const generated: any[] = [];
  const statuses = [
    { id: '1', name: 'Customer' },
    { id: '2', name: 'Lead' },
    { id: '3', name: 'Attempted to Contact' },
    { id: '4', name: 'Working' }
  ];
  const sources = ['1', '2', '3'];
  
  for (let i = 1; i <= count; i++) {
    const statusObj = statuses[Math.floor(Math.random() * statuses.length)];
    generated.push({
      id: String(i),
      name: `Lead ${i}`,
      email: `lead${i}@example.com`,
      phonenumber: `+1-555-${String(i).padStart(4, '0')}`,
      company: `Company ${i}`,
      status: statusObj.id,
      status_name: statusObj.name,
      title: `Role ${i}`,
      description: `Description for lead ${i}`,
      country: "1",
      zip: "10001",
      city: "New York",
      state: "NY",
      address: "123 Main St",
      assigned: Math.random() > 0.5 ? "1" : "0",
      dateadded: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().slice(0, 19).replace('T', ' '),
      from_form_id: "0",
      source: sources[Math.floor(Math.random() * sources.length)],
      lastcontact: null,
      dateassigned: null,
      last_status_change: null,
      addedfrom: "1",
      website: `www.company${i}.com`,
      lead_value: String(Math.floor(Math.random() * 50000)),
      public: "0",
      client_id: "0",
      hash: `hash${i}`,
      notes: [],
      attachments: [],
      reminders: [],
      activity_log: [],
      custom_field_values: {},
      tags: []
    });
  }
  return generated;
};

let leads: any[] = generateMockLeads(1000);

let estimates: any[] = [
  {
    id: 1,
    estimate_number: "EST-2026-001",
    client_id: 1,
    status: "accepted",
    total_amount: 15000,
    expiry_date: "2026-07-01",
    created_by: 1,
    created_at: "2026-06-01 10:15:00",
    lead_name: "Jane Smith",
    valid_until: "2026-07-01",
    total: 15000,
    subtotal: 15000,
    pdf_url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    lead_id: 1,
    sections: [
      {
        name: "Main Integration Suite",
        items: [
          { product_id: 101, quantity: 1, unit_price: 10000, discount_percentage: 0 },
          { product_id: 102, quantity: 2, unit_price: 2500, discount_percentage: 0 }
        ]
      }
    ],
    items: [
      { id: 1, description: "CRM Core Setup License", qty: 1, rate: 10000, amount: 10000 },
      { id: 2, description: "Staff Training & Support Sessions", qty: 2, rate: 2500, amount: 5000 }
    ],
    comments: [
      {
        id: 1,
        estimate_id: 1,
        user_id: 1,
        content: "Draft sent for client approval.",
        parent_id: null,
        created_at: "2026-06-01 10:20:00",
        user: { name: "Jane Developer" }
      }
    ]
  },
  {
    id: 2,
    estimate_number: "EST-2026-002",
    client_id: 2,
    status: "sent",
    total_amount: 8500,
    expiry_date: "2026-07-10",
    created_by: 1,
    created_at: "2026-06-02 09:30:00",
    lead_name: "John Doe",
    valid_until: "2026-07-10",
    total: 8500,
    subtotal: 8500,
    pdf_url: null,
    lead_id: 2,
    sections: [
      {
        name: "Standard Estimator Package",
        items: [
          { product_id: 201, quantity: 1, unit_price: 8500, discount_percentage: 0 }
        ]
      }
    ],
    items: [
      { id: 3, description: "Estimator Automated Integration", qty: 1, rate: 8500, amount: 8500 }
    ],
    comments: []
  }
];

let clients: any[] = [
  { id: 1, name: "Acme Corporation", email: "contact@acme.com", phone: "+1-555-0100" },
  { id: 2, name: "Globex Corp", email: "info@globex.com", phone: "+1-555-0122" },
  { id: 3, name: "Initech", email: "billing@initech.com", phone: "+1-555-0133" }
];

let reminders: any[] = [
  { id: 1, title: "Follow up: Jane Smith", due_date: "2026-06-10 09:00:00", is_read: false },
  { id: 2, title: "Draft Proposal: Alice Johnson", due_date: "2026-06-15 15:30:00", is_read: false }
];

const customFields = [
  {
    id: 1,
    fieldto: "leads",
    name: "Target Go-Live Date",
    slug: "leads_target_go_live_date",
    type: "date",
    required: "0",
    options: "",
    field_order: "1",
    active: "1"
  },
  {
    id: 2,
    fieldto: "leads",
    name: "Integration Tier",
    slug: "leads_integration_tier",
    type: "select",
    options: "Bronze,Silver,Gold,Platinum",
    field_order: "2",
    active: "1"
  }
];

const leadStatuses = [
  { id: 1, name: "Customer" },
  { id: 2, name: "Lead" },
  { id: 3, name: "Attempted to Contact" },
  { id: 4, name: "Working" }
];

export async function mockAdapter(config: AxiosRequestConfig): Promise<AxiosResponse> {
  const url = config.url || '';
  const method = (config.method || 'get').toLowerCase();
  
  // Helper to construct responses
  const makeResponse = (data: any, status = 200): any => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Created',
    headers: {},
    config: config as any
  });

  // Extract path and clean query parameters
  const cleanUrl = url.split('?')[0];

  console.log(`[Mock Server] Intercepted: ${method.toUpperCase()} ${cleanUrl}`);

  // Auth endpoints
  if (cleanUrl.endsWith('/login') || cleanUrl.endsWith('/auth/login')) {
    return makeResponse({
      status: true,
      success: true,
      data: {
        access_token: 'mock-perfex-token-12345',
        token: 'mock-estimator-token-12345',
        user: {
          id: 1,
          name: "Jane Developer",
          email: "jane@example.com",
          role: "Admin",
          mobile_number: "+1-555-123-456"
        }
      },
      user: {
        id: 1,
        name: "Jane Developer",
        email: "jane@example.com",
        role: "Admin",
        mobile_number: "+1-555-123-456"
      },
      token: 'mock-estimator-token-12345'
    });
  }

  if (cleanUrl.endsWith('/logout') || cleanUrl.endsWith('/auth/logout')) {
    return makeResponse({ status: true, message: 'Logged out successfully' });
  }

  // Custom Fields
  if (cleanUrl.includes('/custom_fields/')) {
    return makeResponse({ status: true, data: customFields });
  }

  // Lead Statuses
  if (cleanUrl.endsWith('/lead_statuses')) {
    return makeResponse({ status: true, data: leadStatuses });
  }

  // Leads
  if (cleanUrl.endsWith('/leads')) {
    // Implement simple local search & filtering if params are passed
    let filteredLeads = [...leads];
    
    const search = config.params?.search;
    if (search) {
      const q = search.toLowerCase();
      filteredLeads = filteredLeads.filter(l => 
        l.name.toLowerCase().includes(q) || 
        l.company.toLowerCase().includes(q) || 
        l.email.toLowerCase().includes(q)
      );
    }

    const status = config.params?.status;
    if (status) {
      filteredLeads = filteredLeads.filter(l => l.status === String(status));
    }

    const assigned = config.params?.assigned;
    if (assigned !== undefined && assigned !== '') {
      if (assigned === 'me' || assigned === 1) {
        filteredLeads = filteredLeads.filter(l => l.assigned === "1"); // Assuming 1 is current user
      } else {
        filteredLeads = filteredLeads.filter(l => l.assigned === String(assigned));
      }
    }

    const sort = config.params?.sort;
    const order = config.params?.order || 'desc';
    if (sort) {
       filteredLeads.sort((a, b) => {
         const valA = a[sort];
         const valB = b[sort];
         if (valA < valB) return order === 'asc' ? -1 : 1;
         if (valA > valB) return order === 'asc' ? 1 : -1;
         return 0;
       });
    } else {
       // default sort by dateadded desc
       filteredLeads.sort((a, b) => new Date(b.dateadded).getTime() - new Date(a.dateadded).getTime());
    }

    const page = config.params?.page ? parseInt(config.params.page, 10) : 1;
    const limit = config.params?.limit ? parseInt(config.params.limit, 10) : 20;

    const start = (page - 1) * limit;
    const paginatedLeads = filteredLeads.slice(start, start + limit);

    return makeResponse({ 
      status: true, 
      data: paginatedLeads,
      total: filteredLeads.length
    });
  }

  // Single Lead Details
  const leadDetailMatch = cleanUrl.match(/\/leads\/(\d+)$/);
  if (leadDetailMatch && method === 'get') {
    const id = leadDetailMatch[1];
    const lead = leads.find(l => l.id === id);
    if (lead) {
      return makeResponse({ status: true, data: { lead, ...lead } });
    }
    return makeResponse({ status: false, error: 'Lead not found' }, 404);
  }

  // Create Lead
  if (cleanUrl.endsWith('/lead_create') && method === 'post') {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const newId = String(leads.length + 1);
    const newLead = {
      id: newId,
      name: body.name || 'Unnamed Lead',
      email: body.email || '',
      phonenumber: body.phonenumber || '',
      company: body.company || '',
      status: String(body.status || 1),
      status_name: leadStatuses.find(s => s.id === (body.status || 1))?.name || 'Customer',
      title: body.title || '',
      description: body.description || '',
      country: String(body.country || 1),
      zip: body.zip || '',
      city: body.city || '',
      state: body.state || '',
      address: body.address || '',
      assigned: String(body.assigned || 1),
      dateadded: new Date().toISOString().slice(0, 19).replace('T', ' '),
      from_form_id: '0',
      source: String(body.source || 1),
      lastcontact: null,
      dateassigned: new Date().toISOString().slice(0, 19).replace('T', ' '),
      last_status_change: new Date().toISOString().slice(0, 19).replace('T', ' '),
      addedfrom: '1',
      website: body.website || '',
      lead_value: String(body.lead_value || '0.00'),
      public: '0',
      client_id: '0',
      hash: Math.random().toString(36).substring(7),
      notes: [],
      attachments: [],
      reminders: [],
      activity_log: [
        {
          id: 1,
          leadid: newId,
          date: new Date().toISOString().slice(0, 19).replace('T', ' '),
          description: "Lead created via Mobile App",
          additional_data: null,
          staffid: "1"
        }
      ],
      custom_field_values: body.custom_fields?.leads || {},
      tags: []
    };
    leads.push(newLead);
    return makeResponse({ status: true, data: { id: Number(newId), message: "Lead created successfully" } });
  }

  // Update Lead
  const leadUpdateMatch = cleanUrl.match(/\/lead_update\/(\d+)$/);
  if (leadUpdateMatch && method === 'post') {
    const id = leadUpdateMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index] = {
        ...leads[index],
        ...body,
        custom_field_values: {
          ...leads[index].custom_field_values,
          ...(body.custom_fields?.leads || {})
        }
      };
      return makeResponse({ status: true, data: { message: "Lead updated successfully" } });
    }
    return makeResponse({ status: false, error: 'Lead not found' }, 404);
  }

  // Update Lead Status
  const leadStatusUpdateMatch = cleanUrl.match(/\/leads\/(\d+)\/status$/);
  if (leadStatusUpdateMatch && method === 'post') {
    const id = leadStatusUpdateMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index].status = String(body.status);
      leads[index].status_name = leadStatuses.find(s => s.id === body.status)?.name || leads[index].status_name;
      return makeResponse({ status: true, data: { message: "Lead status updated" } });
    }
    return makeResponse({ status: false, error: 'Lead not found' }, 404);
  }

  // Mark Lost
  const leadMarkLostMatch = cleanUrl.match(/\/lead_mark_lost\/(\d+)$/);
  if (leadMarkLostMatch && method === 'post') {
    const id = leadMarkLostMatch[1];
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index].status_name = 'Lost';
      return makeResponse({ status: true, data: { message: "Lead marked as lost" } });
    }
  }

  // Unmark Lost
  const leadUnmarkLostMatch = cleanUrl.match(/\/lead_unmark_lost\/(\d+)$/);
  if (leadUnmarkLostMatch && method === 'post') {
    const id = leadUnmarkLostMatch[1];
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index].status_name = 'Lead';
      return makeResponse({ status: true, data: { message: "Lead unmarked as lost" } });
    }
  }

  // Mark Junk
  const leadMarkJunkMatch = cleanUrl.match(/\/lead_mark_junk\/(\d+)$/);
  if (leadMarkJunkMatch && method === 'post') {
    const id = leadMarkJunkMatch[1];
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index].status_name = 'Junk';
      return makeResponse({ status: true, data: { message: "Lead marked as junk" } });
    }
  }

  // Unmark Junk
  const leadUnmarkJunkMatch = cleanUrl.match(/\/lead_unmark_junk\/(\d+)$/);
  if (leadUnmarkJunkMatch && method === 'post') {
    const id = leadUnmarkJunkMatch[1];
    const index = leads.findIndex(l => l.id === id);
    if (index !== -1) {
      leads[index].status_name = 'Lead';
      return makeResponse({ status: true, data: { message: "Lead unmarked as junk" } });
    }
  }

  // Add Lead Note
  const leadNoteMatch = cleanUrl.match(/\/lead_note\/(\d+)$/);
  if (leadNoteMatch && method === 'post') {
    const id = leadNoteMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const newNote = {
        id: Math.floor(Math.random() * 1000) + 10,
        rel_id: id,
        rel_type: "lead",
        description: body.description,
        dateadded: new Date().toISOString().slice(0, 19).replace('T', ' '),
        addedfrom: "1",
        staff_name: "Jane Developer"
      };
      lead.notes.push(newNote);
      return makeResponse({ status: true, data: { message: "Note added successfully" } });
    }
  }

  // Reminders for a specific Lead
  const leadRemindersMatch = cleanUrl.match(/\/leads\/(\d+)\/reminders$/);
  if (leadRemindersMatch && method === 'get') {
    const id = leadRemindersMatch[1];
    const lead = leads.find(l => l.id === id);
    if (lead) {
      return makeResponse({ status: true, data: lead.reminders });
    }
  }

  // Add Reminder for Lead
  const leadAddReminderMatch = cleanUrl.match(/\/lead_reminder\/(\d+)$/);
  if (leadAddReminderMatch && method === 'post') {
    const id = leadAddReminderMatch[1];
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    const lead = leads.find(l => l.id === id);
    if (lead) {
      const newRem = {
        id: Math.floor(Math.random() * 1000) + 10,
        rel_id: id,
        rel_type: "lead",
        date: body.date,
        description: body.description,
        staff: "1",
        notify_by_email: String(body.notify_by_email || 0),
        creator: "1",
        isnotified: "0",
        staff_name: "Jane Developer",
        is_notified: 0
      };
      lead.reminders.push(newRem);
      // also add to global reminders list
      reminders.push({
        id: newRem.id,
        title: `Reminder: ${body.description} (Lead: ${lead.name})`,
        due_date: body.date,
        is_read: false
      });
      return makeResponse({ status: true, data: { message: "Reminder added" } });
    }
  }

  // Estimates list
  if (cleanUrl.endsWith('/estimates')) {
    if (method === 'get') {
      return makeResponse({
        current_page: 1,
        data: estimates,
        total: estimates.length,
        per_page: 20,
        last_page: 1
      });
    }

    if (method === 'post') {
      const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
      const newId = estimates.length + 1;
      const client = clients.find(c => c.id === body.client_id);
      const newEst = {
        id: newId,
        estimate_number: `EST-2026-0${newId}`,
        client_id: body.client_id,
        status: "draft" as any,
        total_amount: 5000, // simple mock amount
        expiry_date: body.expiry_date || new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
        created_by: 1,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
        lead_name: client?.name || "Client Estimate",
        valid_until: body.expiry_date || '',
        total: 5000,
        subtotal: 5000,
        pdf_url: null,
        lead_id: null,
        sections: body.sections || [],
        items: (body.sections || []).flatMap((s: any, idx: number) => 
          (s.items || []).map((itm: any, itemIdx: number) => ({
            id: idx * 10 + itemIdx,
            description: `Product ${itm.product_id} Integration`,
            qty: itm.quantity,
            rate: itm.unit_price,
            amount: itm.quantity * itm.unit_price
          }))
        ),
        comments: []
      };
      estimates.push(newEst);
      return makeResponse({ success: true, estimate: newEst });
    }
  }

  // Single Estimate Detail
  const estDetailMatch = cleanUrl.match(/\/estimates\/(\d+)$/);
  if (estDetailMatch) {
    const id = Number(estDetailMatch[1]);
    const est = estimates.find(e => e.id === id);
    if (est) {
      if (method === 'get') {
        return makeResponse(est);
      }
      if (method === 'put') {
        const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        const index = estimates.findIndex(e => e.id === id);
        if (index !== -1) {
          estimates[index] = { ...estimates[index], ...body };
          return makeResponse({ success: true, message: "Estimate updated successfully" });
        }
      }
      if (method === 'delete') {
        estimates = estimates.filter(e => e.id !== id);
        return makeResponse({ success: true, message: "Estimate deleted" });
      }
    }
  }

  // Copy Estimate
  const estCopyMatch = cleanUrl.match(/\/estimates\/(\d+)\/copy$/);
  if (estCopyMatch && method === 'post') {
    const id = Number(estCopyMatch[1]);
    const est = estimates.find(e => e.id === id);
    if (est) {
      const newId = estimates.length + 1;
      const copyEst = {
        ...est,
        id: newId,
        estimate_number: `EST-2026-0${newId}`,
        status: "draft" as any
      };
      estimates.push(copyEst);
      return makeResponse({ success: true, new_estimate_id: newId, message: "Estimate copied successfully" });
    }
  }

  // Send Estimate
  const estSendMatch = cleanUrl.match(/\/estimates\/(\d+)\/send$/);
  if (estSendMatch && method === 'post') {
    const id = Number(estSendMatch[1]);
    const index = estimates.findIndex(e => e.id === id);
    if (index !== -1) {
      estimates[index].status = 'sent';
      return makeResponse({ success: true, message: "Estimate sent to client" });
    }
  }

  // Mark Estimate Status
  const estMarkMatch = cleanUrl.match(/\/estimates\/(\d+)\/mark-as\/(\w+)$/);
  if (estMarkMatch && method === 'post') {
    const id = Number(estMarkMatch[1]);
    const status = estMarkMatch[2];
    const index = estimates.findIndex(e => e.id === id);
    if (index !== -1) {
      estimates[index].status = status as any;
      return makeResponse({ success: true, new_status: status, message: `Status updated to ${status}` });
    }
  }

  // Submit Estimate
  const estSubmitMatch = cleanUrl.match(/\/estimates\/(\d+)\/submit$/);
  if (estSubmitMatch && method === 'post') {
    const id = Number(estSubmitMatch[1]);
    const index = estimates.findIndex(e => e.id === id);
    if (index !== -1) {
      estimates[index].status = 'waiting_approval';
      return makeResponse({ success: true, message: "Estimate submitted for approval" });
    }
  }

  // Approve Estimate
  const estApproveMatch = cleanUrl.match(/\/estimates\/(\d+)\/approve$/);
  if (estApproveMatch && method === 'post') {
    const id = Number(estApproveMatch[1]);
    const index = estimates.findIndex(e => e.id === id);
    if (index !== -1) {
      estimates[index].status = 'approved';
      return makeResponse({ success: true, message: "Estimate approved" });
    }
  }

  // Reject Estimate
  const estRejectMatch = cleanUrl.match(/\/estimates\/(\d+)\/reject$/);
  if (estRejectMatch && method === 'post') {
    const id = Number(estRejectMatch[1]);
    const index = estimates.findIndex(e => e.id === id);
    if (index !== -1) {
      estimates[index].status = 'declined';
      return makeResponse({ success: true, message: "Estimate declined by client" });
    }
  }

  // Estimate Comments
  const estCommentsMatch = cleanUrl.match(/\/estimates\/(\d+)\/comments$/);
  if (estCommentsMatch) {
    const id = Number(estCommentsMatch[1]);
    const est = estimates.find(e => e.id === id);
    if (est) {
      if (method === 'get') {
        return makeResponse(est.comments || []);
      }
      if (method === 'post') {
        const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
        const newComm = {
          id: (est.comments || []).length + 1,
          estimate_id: id,
          user_id: 1,
          content: body.content,
          parent_id: body.parent_id || null,
          created_at: new Date().toISOString().slice(0, 19).replace('T', ' '),
          user: { name: "Jane Developer" }
        };
        est.comments = est.comments || [];
        est.comments.push(newComm);
        return makeResponse({ success: true, comment: newComm });
      }
    }
  }

  // Clients
  if (cleanUrl.endsWith('/clients')) {
    return makeResponse({ data: clients });
  }

  // Product Suggestion
  if (cleanUrl.endsWith('/products/suggest')) {
    const body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data;
    return makeResponse({
      suggested_description: `Professional deployment of ${body.name || 'Equipment'} featuring customizable service plans and standard integration.`,
      suggested_category: "Software Services"
    });
  }

  // Reminders List
  if (cleanUrl.endsWith('/reminders')) {
    return makeResponse(reminders);
  }

  // Default Fallback
  return makeResponse({});
}
