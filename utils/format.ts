const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Parses dates coming from the backends. Perfex returns space-separated
 * datetimes ("2026-06-10 09:00:00") which are not ISO 8601 — passing them
 * straight to `new Date()` is implementation-defined across JS engines.
 */
export function parseServerDate(value?: string | null): Date | null {
  if (!value) return null;
  let iso = value.includes('T') ? value : value.replace(' ', 'T');
  // Date-only strings ("2026-07-01") are parsed as UTC midnight by the spec,
  // which renders as the previous day in UTC-negative timezones. Anchor them
  // to local midnight to match the local-time formatters below.
  if (!iso.includes('T')) iso += 'T00:00:00';
  const date = new Date(iso);
  return isNaN(date.getTime()) ? null : date;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** "08 Jun 2026" */
export function formatDate(value?: string | null): string {
  const date = parseServerDate(value);
  if (!date) return '';
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** "08 Jun" — compact form for list cards */
export function formatShortDate(value?: string | null): string {
  const date = parseServerDate(value);
  if (!date) return '';
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]}`;
}

/** "08 Jun 2026, 4:05 PM" */
export function formatDateTime(value?: string | null): string {
  const date = parseServerDate(value);
  if (!date) return '';
  let hours = date.getHours();
  const minutes = pad(date.getMinutes());
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${pad(date.getDate())} ${MONTHS[date.getMonth()]} ${date.getFullYear()}, ${hours}:${minutes} ${ampm}`;
}

/** Null-safe INR currency formatting — never throws on malformed API data. */
export function formatINR(value?: number | null): string {
  if (value == null || !isFinite(value)) return '—';
  return `₹${value.toLocaleString('en-IN')}`;
}

/** Local-timezone YYYY-MM-DD key, e.g. for calendar grouping. */
export function toDateKey(value?: string | null): string | null {
  const date = parseServerDate(value);
  if (!date) return null;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
