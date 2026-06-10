import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotificationStore } from '../../store/notificationStore';
import { theme } from '../../constants/theme';

/** Bell icon with an unread badge that opens the notifications screen. */
export function NotificationBell() {
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <View>
      <IconButton
        icon="bell-outline"
        size={24}
        iconColor={theme.colors.primary}
        onPress={() => router.push('/notifications')}
        style={styles.iconBtn}
        accessibilityLabel={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
      />
      {unreadCount > 0 && (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
        </View>
      )}
    </View>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Extra IconButtons rendered after the bell. */
  actions?: ReactNode;
  /** Set false to hide the notification bell. */
  showBell?: boolean;
}

export function ScreenHeader({ title, subtitle, actions, showBell = true }: ScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.textContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        {showBell && <NotificationBell />}
        {actions}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.paddingX,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: theme.colors.background,
  },
  textContainer: {
    flexDirection: 'column',
    flex: 1,
    marginRight: theme.spacing.gapSm,
  },
  title: {
    ...theme.typography.headlineXlMobile,
    color: theme.colors.primary,
    letterSpacing: -0.5,
  },
  subtitle: {
    ...theme.typography.labelSm,
    color: 'rgba(68, 72, 63, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    margin: 0,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: theme.colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: theme.colors.onError,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
});
