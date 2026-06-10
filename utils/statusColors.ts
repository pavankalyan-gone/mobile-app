export interface StatusStyle {
  backgroundColor: string;
  color: string;
}

/**
 * Single source of truth for status chip colors across leads and estimates.
 * Order matters: positive → negative → in-progress → neutral fallback.
 */
export function getStatusStyles(status: string | null | undefined): StatusStyle {
  const normalized = (status ?? '').toLowerCase().replace(/\s+/g, '_');
  if (/(new|custom|accept|approv)/.test(normalized)) {
    return { backgroundColor: '#cfebba', color: '#1b300f' }; // Light forest tint
  }
  if (/(lost|junk|declin|expir|fail)/.test(normalized)) {
    return { backgroundColor: '#ffdad6', color: '#ba1a1a' }; // Red error tint
  }
  if (/(contact|remind|pend|sent|wait)/.test(normalized)) {
    return { backgroundColor: '#ffd8ed', color: '#290a21' }; // Pink tertiary tint
  }
  return { backgroundColor: '#eeeeec', color: '#44483f' }; // Gray tint
}
