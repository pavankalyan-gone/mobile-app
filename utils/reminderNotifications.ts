import * as Notifications from 'expo-notifications';
import { parseServerDate } from './format';

/**
 * Best-effort local notification at the reminder's time, so reminders fire on
 * the phone instead of living only in the CRM. Never throws — the schedule is
 * a bonus on top of the server-side save.
 */
export async function scheduleReminderNotification(opts: {
  leadId: number;
  leadName?: string;
  description: string;
  date: string | Date;
}): Promise<void> {
  try {
    const date = opts.date instanceof Date ? opts.date : parseServerDate(opts.date);
    if (!date || date.getTime() <= Date.now()) return;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `⏰ ${opts.description}`,
        body: opts.leadName ? `Reminder for ${opts.leadName}` : 'Lead reminder',
        data: { lead_id: opts.leadId },
        sound: true,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
    });
  } catch {
    // scheduling can fail without permissions — the CRM reminder still exists
  }
}
