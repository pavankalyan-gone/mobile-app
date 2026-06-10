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

/**
 * Calculates brightness to determine contrasting text color, returning exact API color styles.
 * Falls back to semantic colors if exact color is not provided or invalid.
 */
export function getExactStatusStyles(status: string | null | undefined, hexColor: string | null | undefined): StatusStyle {
  if (!hexColor || !/^#[0-9A-Fa-f]{6}$/.test(hexColor)) {
    return getStatusStyles(status);
  }

  // Calculate relative luminance for text contrast
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // standard perceived brightness formula
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  return {
    backgroundColor: hexColor,
    color: brightness > 128 ? '#000000' : '#ffffff',
  };
}
