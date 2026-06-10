import { create } from 'zustand';
import * as Notifications from 'expo-notifications';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  data: Record<string, any>;
  receivedAt: Date;
  read: boolean;
}

interface NotificationState {
  notifications: NotificationItem[];
  unreadCount: number;
  addNotification: (n: Notifications.Notification) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,

  addNotification: (n) => {
    const item: NotificationItem = {
      id: n.request.identifier,
      title: n.request.content.title ?? '',
      body: n.request.content.body ?? '',
      data: n.request.content.data ?? {},
      receivedAt: new Date(),
      read: false,
    };
    set((state) => {
      const notifications = [item, ...state.notifications].slice(0, 50);
      return {
        notifications,
        unreadCount: notifications.filter((x) => !x.read).length,
      };
    });
  },

  markAllRead: () =>
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));
