# Leads Mobile API Reference

This document outlines the API endpoints available for lead management in the mobile application. These endpoints connect to the Perfex CRM Mobile Module.

## Base URL & Authentication

*   **Base URL:** `https://<your-crm-domain>/mobile_app/api`
*   **Authentication:** 
    *   Include a Bearer Token in the `Authorization` header: `Authorization: Bearer <your_access_token>`
    *   Alternatively, for GET requests that download files (e.g. PDFs), pass the token in the query string: `?token=<your_access_token>`

---

## 1. Get Leads List

Retrieves a paginated list of leads with optional filters and search functionality.

*   **Endpoint:** `GET /leads`
*   **Headers:**
    *   `Authorization: Bearer <token>`
*   **Query Parameters:**
    *   `status` (integer, optional) - Filter by Lead Status ID.
    *   `source` (integer, optional) - Filter by Lead Source ID.
    *   `assigned` (integer | string, optional) - Pass staff ID to filter by assigned agent, or pass `"me"` to filter by the logged-in staff member.
    *   `search` (string, optional) - Search across lead name, email, company, or phone number.
    *   `lost` (string `"1"` | `"0"`, optional) - Pass `"1"` to view lost leads. Defaults to `"0"`.
    *   `junk` (string `"1"` | `"0"`, optional) - Pass `"1"` to view junk leads. Defaults to `"0"`.
    *   `sort` (string, optional) - Field to sort by. Allowed: `dateadded`, `name`, `company`, `id`, `email`, `phonenumber`, `status`. Defaults to `dateadded`.
    *   `order` (string `"asc"` | `"desc"`, optional) - Sort order. Defaults to `"desc"`.
    *   `page` (integer, optional) - Page number for pagination. Defaults to `1`.
    *   `limit` (integer, optional) - Number of results per page. Max: `100`, Defaults to `20`.

### Example Response (`200 OK`)

```json
{
  "status": true,
  "data": [
    {
      "id": "12",
      "name": "Jane Smith",
      "email": "janesmith@example.com",
      "phonenumber": "+1-555-0199",
      "company": "Acme Corporation",
      "status": "1",
      "status_name": "Customer"
    },
    {
      "id": "15",
      "name": "John Doe",
      "email": "johndoe@example.com",
      "phonenumber": "+1-555-0122",
      "company": "Globex Corp",
      "status": "2",
      "status_name": "Lead"
    }
  ]
}
```

---

## 2. Get Lead Details (Lead Profile)

Retrieves full details for a specific lead, including notes, attachments, reminders, activity logs, custom field definitions, and custom field values.

*   **Endpoint:** `GET /leads/{id}`
*   **Headers:**
    *   `Authorization: Bearer <token>`

### Example Response (`200 OK`)

```json
{
  "status": true,
  "data": {
    "lead": {
      "id": "12",
      "name": "Jane Smith",
      "title": "Director of Operations",
      "company": "Acme Corporation",
      "description": "Looking for CRM solution integration.",
      "country": "1",
      "zip": "10001",
      "city": "New York",
      "state": "NY",
      "address": "123 Broadway Ave",
      "assigned": "1",
      "dateadded": "2026-06-01 10:00:00",
      "from_form_id": "0",
      "status": "1",
      "source": "2",
      "lastcontact": "2026-06-05 14:30:00",
      "dateassigned": "2026-06-01 10:05:00",
      "last_status_change": "2026-06-01 10:00:00",
      "addedfrom": "1",
      "email": "janesmith@example.com",
      "website": "www.acme.com",
      "phonenumber": "+1-555-0199",
      "lead_value": "15000.00",
      "default_language": "english",
      "public": "0",
      "client_id": "0",
      "hash": "abc123xyz"
    },
    "notes": [
      {
        "id": "4",
        "rel_id": "12",
        "rel_type": "lead",
        "description": "Followed up on estimate. Client requested a 10% discount.",
        "dateadded": "2026-06-05 14:30:00",
        "addedfrom": "1",
        "staff_name": "Admin User"
      }
    ],
    "attachments": [
      {
        "id": "2",
        "file_name": "acme_requirements.pdf",
        "filetype": "application/pdf",
        "dateadded": "2026-06-01 10:10:00"
      }
    ],
    "reminders": [
      {
        "id": "8",
        "rel_id": "12",
        "rel_type": "lead",
        "date": "2026-06-10 09:00:00",
        "description": "Call Jane to finalize agreement",
        "staff": "1",
        "notify_by_email": "1",
        "creator": "1",
        "isnotified": "0"
      }
    ],
    "activity_log": [
      {
        "id": "45",
        "leadid": "12",
        "date": "2026-06-05 14:30:00",
        "description": "Mobile Check-in performed at 40.7128, -74.0060",
        "additional_data": null,
        "staffid": "1"
      }
    ],
    "custom_fields": [
      {
        "id": "1",
        "fieldto": "leads",
        "name": "Target Go-Live Date",
        "type": "date",
        "required": "0",
        "options": "",
        "field_order": "1",
        "active": "1"
      },
      {
        "id": "2",
        "fieldto": "leads",
        "name": "Integration Tier",
        "type": "select",
        "required": "1",
        "options": "Bronze,Silver,Gold,Platinum",
        "field_order": "2",
        "active": "1"
      }
    ],
    "custom_field_values": {
      "1": "2026-08-01",
      "2": "Gold"
    }
  }
}
```

---

## 3. Create Lead

Creates a new lead. Standard fields and custom field values can be passed in a single payload.

*   **Endpoint:** `POST /lead_create`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body (JSON):**

```json
{
  "name": "Bruce Wayne",
  "company": "Wayne Enterprises",
  "email": "bruce@waynecorp.com",
  "phonenumber": "+1-555-1939",
  "title": "CEO",
  "description": "Interested in industrial defense tech.",
  "address": "1007 Mountain Drive",
  "city": "Gotham",
  "state": "NJ",
  "zip": "07001",
  "country": 0,
  "website": "wayneenterprises.com",
  "lead_value": 50000.00,
  "assigned": 1,
  "status": 1,
  "source": 2,
  "custom_fields": {
    "leads": {
      "1": "2026-07-04",
      "2": "Platinum"
    }
  }
}
```

### Example Response (`200 OK`)

```json
{
  "status": true,
  "data": {
    "id": 16,
    "message": "Lead created successfully"
  }
}
```

---

## 4. Update Lead Profile

Updates the standard fields and/or custom fields of an existing lead.

*   **Endpoint:** `POST /lead_update/{id}`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    *   Pass the fields you want to update. Note that custom fields are nested inside `custom_fields -> leads -> {field_id}`.

```json
{
  "name": "Bruce Wayne (Updated)",
  "company": "Wayne Tech",
  "phonenumber": "+1-555-9999",
  "custom_fields": {
    "leads": {
      "1": "2026-10-31",
      "2": "Platinum"
    }
  }
}
```

### Example Response (`200 OK`)

```json
{
  "status": true,
  "data": {
    "message": "Lead updated successfully"
  }
}
```

---

## 5. Update Lead Status

Changes the status of a specific lead (e.g. moving a lead from "Attempted to Contact" to "Working").

*   **Endpoint:** `POST /leads/{id}/status`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body (JSON):**

```json
{
  "status": 2
}
```

### Example Response (`200 OK`)

```json
{
  "status": true,
  "data": {
    "message": "Lead status updated"
  }
}
```

---

## 6. Mark Lead Status (Lost, Junk)

Quickly toggle a lead's status between lost or junk.

### Mark as Lost
*   **Endpoint:** `POST /lead_mark_lost/{id}`
*   **Response:**
    ```json
    {
      "status": true,
      "data": {
        "message": "Lead marked as lost"
      }
    }
    ```

### Unmark as Lost (Restore)
*   **Endpoint:** `POST /lead_unmark_lost/{id}`
*   **Response:**
    ```json
    {
      "status": true,
      "data": {
        "message": "Lead unmarked as lost"
      }
    }
    ```

### Mark as Junk
*   **Endpoint:** `POST /lead_mark_junk/{id}`
*   **Response:**
    ```json
    {
      "status": true,
      "data": {
        "message": "Lead marked as junk"
      }
    }
    ```

### Unmark as Junk (Restore)
*   **Endpoint:** `POST /lead_unmark_junk/{id}`
*   **Response:**
    ```json
    {
      "status": true,
      "data": {
        "message": "Lead unmarked as junk"
      }
    }
    ```

---

## 7. Lead Notes

### Add Note to Lead
Adds a new note directly to a lead's profile.

*   **Endpoint:** `POST /lead_note/{id}`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "description": "Spoke to the customer on the phone. They want to scheduling another call next Tuesday."
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "status": true,
      "data": {
        "message": "Note added successfully"
      }
    }
    ```

---

## 8. Lead Reminders

### List Reminders for Lead
Retrieves the list of reminders specifically set for a lead.

*   **Endpoint:** `GET /leads/{id}/reminders`
*   **Headers:**
    *   `Authorization: Bearer <token>`
*   **Response (`200 OK`):**
    ```json
    {
      "status": true,
      "data": [
        {
          "id": "8",
          "rel_id": "12",
          "rel_type": "lead",
          "date": "2026-06-10 09:00:00",
          "description": "Call Jane to finalize agreement",
          "staff": "1",
          "notify_by_email": "1",
          "creator": "1",
          "isnotified": "0",
          "staff_name": "Admin User",
          "is_notified": 0
        }
      ]
    }
    ```

### Add Reminder for Lead
Creates a new reminder for a lead.

*   **Endpoint:** `POST /lead_reminder/{id}`
*   **Headers:**
    *   `Authorization: Bearer <token>`
    *   `Content-Type: application/json`
*   **Request Body (JSON):**
    ```json
    {
      "description": "Follow up regarding sent invoice proposal",
      "date": "2026-06-15 15:30:00",
      "notify_by_email": 1
    }
    ```
    *   `date`: Must be formatted as `YYYY-MM-DD HH:MM:SS`.
    *   `notify_by_email`: `1` to notify the staff member by email when the reminder triggers, `0` otherwise.
*   **Response (`200 OK`):**
    ```json
    {
      "status": true,
      "data": {
        "message": "Reminder added"
      }
    }
    ```

---

## 9. Custom Fields Metadata

Retrieves definitions of all custom fields belonging to a specific module type (e.g., `leads`). This metadata is crucial for dynamically rendering custom field inputs (dropdowns, date pickers, texts, checkboxes) in your app UI.

*   **Endpoint:** `GET /custom_fields/{type}` (e.g. `GET /custom_fields/leads`)
*   **Headers:**
    *   `Authorization: Bearer <token>`
*   **Response (`200 OK`):**
    ```json
    {
      "status": true,
      "data": [
        {
          "id": "1",
          "fieldto": "leads",
          "name": "Target Go-Live Date",
          "slug": "leads_target_go_live_date",
          "type": "date",
          "required": "0",
          "options": "",
          "field_order": "1",
          "active": "1",
          "bs_column": "12",
          "default_value": ""
        },
        {
          "id": "2",
          "fieldto": "leads",
          "name": "Integration Tier",
          "slug": "leads_integration_tier",
          "type": "select",
          "required": "1",
          "options": "Bronze,Silver,Gold,Platinum",
          "field_order": "2",
          "active": "1",
          "bs_column": "12",
          "default_value": "Bronze"
        }
      ]
    }
    ```

### Supported Custom Field Types:
*   `input` (Text Input)
*   `number` (Number Input)
*   `select` (Dropdown Single-Select, use values listed in comma-separated `options`)
*   `multiselect` (Dropdown Multi-Select)
*   `checkbox` (Multiple checkable options)
*   `radio` (Single option select)
*   `date` (Date picker, formatted as `YYYY-MM-DD`)
*   `datetime` (Date & Time picker, formatted as `YYYY-MM-DD HH:MM:SS`)
*   `textarea` (Multi-line text area)
*   `colorpicker` (Color code input)
