import { REMINDER_OPTIONS, formatDateForApi } from '../reminderPresets';

describe('formatDateForApi', () => {
  it('produces zero-padded local "Y-m-d H:i:s"', () => {
    expect(formatDateForApi(new Date(2026, 0, 5, 9, 7, 31))).toBe('2026-01-05 09:07:00');
    expect(formatDateForApi(new Date(2026, 11, 25, 23, 59, 0))).toBe('2026-12-25 23:59:00');
  });
});

describe('REMINDER_OPTIONS', () => {
  it('all presets resolve to a future date', () => {
    const now = Date.now();
    for (const opt of REMINDER_OPTIONS) {
      expect(opt.getDate().getTime()).toBeGreaterThan(now);
    }
  });

  it('morning presets land at 9am local time', () => {
    const tomorrow = REMINDER_OPTIONS.find((o) => o.label === 'Tomorrow 9am')!.getDate();
    expect(tomorrow.getHours()).toBe(9);
    expect(tomorrow.getMinutes()).toBe(0);
    const nextWeek = REMINDER_OPTIONS.find((o) => o.label === 'Next week')!.getDate();
    expect(nextWeek.getHours()).toBe(9);
  });
});
