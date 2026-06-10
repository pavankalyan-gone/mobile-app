/** Strips formatting and leading zeros: "+91 98765-43210" → "919876543210" */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Compares two phone numbers tolerantly of country codes and formatting.
 * "+91 98765 43210" matches "098765 43210" and "98765 43210" — strict
 * full-string equality fails on these everyday format mismatches.
 */
export function phonesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (na.length < 7 || nb.length < 7) return na === nb && na.length > 0;
  const suffixLen = Math.min(na.length, nb.length, 10);
  return na.slice(-suffixLen) === nb.slice(-suffixLen);
}
