import React from 'react';
import { FlatList, View, StyleSheet, Image } from 'react-native';
import { Text, Button, Card, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotificationStore, NotificationItem } from '../../store/notificationStore';
import { EmptyState } from '../../components/ui/EmptyState';
import { theme } from '../../constants/theme';

export default function NotificationsScreen() {
  const { notifications, markAllRead } = useNotificationStore();
  const router = useRouter();

  const handleNotificationPress = (item: NotificationItem) => {
    if (item.data?.lead_id) {
      router.push(`/lead/${item.data.lead_id}`);
    } else if (item.data?.estimate_id) {
      router.push(`/estimate/${item.data.estimate_id}`);
    }
  };

  const renderItem = ({ item }: { item: NotificationItem }) => {
    const isLead = !!item.data?.lead_id;
    const iconName = isLead ? 'account-outline' : 'file-document-outline';
    const iconBg = isLead ? '#cfebba' : '#ffd8ed';
    const iconColor = isLead ? '#1b300f' : '#290a21';

    return (
      <Card style={styles.card} onPress={() => handleNotificationPress(item)}>
        <Card.Title
          title={item.title}
          subtitle={item.body}
          titleStyle={styles.cardTitle}
          subtitleStyle={styles.cardSubtitle}
          left={(props) => (
            <Avatar.Icon
              {...props}
              icon={iconName}
              color={iconColor}
              style={{ backgroundColor: iconBg }}
              size={40}
            />
          )}
          right={() => (
            <Text style={styles.timeText}>
              {new Date(item.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        />
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <Button mode="text" onPress={markAllRead} textColor={theme.colors.primary} style={styles.clearBtn} labelStyle={styles.clearBtnLabel}>
            Clear all
          </Button>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <EmptyState
            icon="bell-off-outline"
            title="No notifications yet"
            subtitle="Reminders and status updates will appear here"
          />
        }
        ListFooterComponent={
          <View style={styles.footerPromo}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCJgv1m8iGtPUfgZooIxXtKb1mUf_waWxPy8ntT906GbrbUAIV9MkN5tyO5FiEnDQWo1zuLYUfpzkxMPMUqH9Z09r2esr_36ZSiNB9HDndGnoOTYza6B8Upnel4FcTr3hiFBOjcdpHgf6aIF9ltkKmzxBrcC8KO8ik5IGRAoYcqvo9lOA0_1whUTapgb2I_r1f3gycqpD-vZbAhE1xZp_FiJt3AhQFUAJz8C5HUovQeNAdUrd7EK1qU_lyzFvxIMiTnXxbHLFbOb8Q' }}
              style={styles.promoImage}
            />
            <View style={styles.promoOverlay}>
              <Text style={styles.promoCategory}>WEEKLY DIGEST</Text>
              <Text style={styles.promoText}>Your sales efficiency is up 12% this week.</Text>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 56, // Push down past status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.margin,
    marginBottom: theme.spacing.gapMd,
  },
  title: {
    ...theme.typography.headlineLg,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  clearBtn: {
    margin: 0,
  },
  clearBtnLabel: {
    ...theme.typography.labelMd,
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: theme.spacing.margin,
    paddingBottom: theme.spacing.gapLg,
  },
  card: {
    marginBottom: theme.spacing.gapSm,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.xl,
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
  },
  cardTitle: {
    ...theme.typography.labelMd,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cardSubtitle: {
    ...theme.typography.bodyMd,
    color: theme.colors.onSurfaceVariant,
  },
  timeText: {
    ...theme.typography.labelSm,
    color: theme.colors.textMuted,
    marginRight: 16,
  },
  footerPromo: {
    marginTop: 24,
    height: 180,
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.borderSubtle,
  },
  promoImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  promoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 27, 1, 0.45)', // Tinted overlay using primary dark forest green
    justifyContent: 'flex-end',
    padding: 20,
  },
  promoCategory: {
    ...theme.typography.labelSm,
    color: '#ffffff',
    opacity: 0.8,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 4,
  },
  promoText: {
    ...theme.typography.headlineMd,
    color: '#ffffff',
    fontWeight: '700',
  },
});

