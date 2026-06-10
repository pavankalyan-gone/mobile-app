import { useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNotificationStore, NotificationItem } from '../store/notificationStore';
import { EmptyState } from '../components/ui/EmptyState';
import { theme } from '../constants/theme';

function formatReceivedAt(date: Date): string {
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { notifications, markAllRead, clearAll } = useNotificationStore();

  // Opening the screen marks everything as read (clears the bell badge)
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  const handlePress = (item: NotificationItem) => {
    if (item.data?.lead_id) router.push(`/lead/${item.data.lead_id}`);
    else if (item.data?.estimate_id) router.push(`/estimate/${item.data.estimate_id}`);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Notifications',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
          headerTitleStyle: { ...theme.typography.headlineMd, color: theme.colors.primary, fontWeight: '700' },
        }}
      />

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const navigable = !!(item.data?.lead_id || item.data?.estimate_id);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={navigable ? 0.7 : 1}
              onPress={() => handlePress(item)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
            >
              <View style={styles.iconWrapper}>
                <MaterialCommunityIcons name="bell-outline" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title || 'Notification'}</Text>
                {item.body ? <Text style={styles.cardText} numberOfLines={2}>{item.body}</Text> : null}
                <Text style={styles.cardDate}>{formatReceivedAt(item.receivedAt)}</Text>
              </View>
              {navigable && (
                <MaterialCommunityIcons name="chevron-right" size={22} color={theme.colors.textMuted} />
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <EmptyState
            icon="bell-off-outline"
            title="No notifications"
            subtitle="You're all caught up — new alerts will show up here"
          />
        }
        ListFooterComponent={
          notifications.length > 0 ? (
            <Button
              mode="text"
              onPress={clearAll}
              textColor={theme.colors.textMuted}
              style={styles.clearBtn}
            >
              Clear all
            </Button>
          ) : null
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingVertical: theme.spacing.gapSm,
    paddingBottom: theme.spacing.gapLg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.lg,
    padding: theme.spacing.paddingX,
    marginHorizontal: theme.spacing.margin,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    ...theme.typography.labelMd,
    color: theme.colors.onSurface,
    fontWeight: '700',
  },
  cardText: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardDate: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginTop: 4,
  },
  clearBtn: {
    marginTop: theme.spacing.gapSm,
  },
});
