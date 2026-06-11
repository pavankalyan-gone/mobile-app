import { parseServerDate, formatDate, formatDateTime, formatINR, toDateKey } from '../format';

describe('parseServerDate', () => {
  it('parses Perfex space-separated datetimes as local time', () => {
    const date = parseServerDate('2026-06-10 09:30:00');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(5);
    expect(date!.getDate()).toBe(10);
    expect(date!.getHours()).toBe(9);
    expect(date!.getMinutes()).toBe(30);
  });

  it('parses date-only strings as LOCAL midnight, not UTC', () => {
    // Regression: `new Date('2026-07-01')` is UTC midnight per spec, which is
    // the previous day in UTC-negative timezones (tests run in New York).
    const date = parseServerDate('2026-07-01');
    expect(date).not.toBeNull();
    expect(date!.getDate()).toBe(1);
    expect(date!.getMonth()).toBe(6);
    expect(date!.getHours()).toBe(0);
  });

  it('passes ISO strings through', () => {
    const date = parseServerDate('2026-06-10T12:00:00');
    expect(date!.getHours()).toBe(12);
  });

  it('returns null for empty and invalid input', () => {
    expect(parseServerDate(null)).toBeNull();
    expect(parseServerDate('')).toBeNull();
    expect(parseServerDate('not a date')).toBeNull();
  });
});

describe('formatDate / formatDateTime', () => {
  it('formats as "DD Mon YYYY"', () => {
    expect(formatDate('2026-06-08 14:30:00')).toBe('08 Jun 2026');
  });

  it('formats date-only values without shifting a day', () => {
    expect(formatDate('2026-07-01')).toBe('01 Jul 2026');
  });

  it('formats datetimes with 12h clock', () => {
    expect(formatDateTime('2026-06-08 14:05:00')).toBe('08 Jun 2026, 2:05 PM');
    expect(formatDateTime('2026-06-08 00:15:00')).toBe('08 Jun 2026, 12:15 AM');
  });

  it('returns empty string for missing values', () => {
    expect(formatDate(null)).toBe('');
    expect(formatDateTime(undefined)).toBe('');
  });
});

describe('toDateKey', () => {
  it('produces a local YYYY-MM-DD key', () => {
    expect(toDateKey('2026-06-08 23:30:00')).toBe('2026-06-08');
  });

  it('keeps date-only values on their own calendar day', () => {
    expect(toDateKey('2026-07-01')).toBe('2026-07-01');
  });
});

describe('formatINR', () => {
  it('formats numbers with the rupee symbol', () => {
    expect(formatINR(15000)).toBe('₹15,000');
  });

  it('never throws on malformed values', () => {
    expect(formatINR(null)).toBe('—');
    expect(formatINR(undefined)).toBe('—');
    expect(formatINR(NaN)).toBe('—');
    expect(formatINR(Infinity)).toBe('—');
  });
});
