import { normalizePhone, phonesMatch } from '../phone';

describe('normalizePhone', () => {
  it('strips formatting and leading zeros', () => {
    expect(normalizePhone('+91 98765-43210')).toBe('919876543210');
    expect(normalizePhone('098765 43210')).toBe('9876543210');
    expect(normalizePhone('(555) 012-3456')).toBe('5550123456');
  });

  it('returns empty string when nothing remains', () => {
    expect(normalizePhone('abc')).toBe('');
    expect(normalizePhone('000')).toBe('');
  });
});

describe('phonesMatch', () => {
  it('matches across country code and formatting differences', () => {
    expect(phonesMatch('+91 98765 43210', '098765 43210')).toBe(true);
    expect(phonesMatch('+91 98765 43210', '98765 43210')).toBe(true);
    expect(phonesMatch('919876543210', '98765-43210')).toBe(true);
  });

  it('rejects different numbers', () => {
    expect(phonesMatch('+91 98765 43210', '+91 98765 43211')).toBe(false);
    expect(phonesMatch('5550123456', '5550129999')).toBe(false);
  });

  it('requires exact equality for short numbers', () => {
    expect(phonesMatch('12345', '12345')).toBe(true);
    expect(phonesMatch('12345', '912345')).toBe(false);
  });

  it('never matches empty or missing values', () => {
    expect(phonesMatch(null, '98765 43210')).toBe(false);
    expect(phonesMatch('98765 43210', undefined)).toBe(false);
    expect(phonesMatch('', '')).toBe(false);
    expect(phonesMatch('abc', 'def')).toBe(false);
  });
});
