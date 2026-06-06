import React from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { Text, Button, Card, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useNotificationStore, NotificationItem } from '../../store/notificationStore';
import { EmptyState } from '../../components/ui/EmptyState';

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
    const iconName = isLead ? 'account-box' : 'file-document';
    const iconBg = isLead ? '#E8F5E9' : '#EDE7F6';
    const iconColor = isLead ? '#4CAF50' : '#6750A4';

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
        <Text variant="headlineMedium" style={styles.title}>Notifications</Text>
        {notifications.length > 0 && (
          <Button mode="text" onPress={markAllRead} textColor="#6750A4" style={styles.clearBtn}>
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
            icon="bell-off"
            title="No notifications yet"
            subtitle="Reminders and status updates will appear here"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingTop: 56, // Push down past status bar
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  clearBtn: {
    margin: 0,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#212121',
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  timeText: {
    fontSize: 11,
    color: '#9E9E9E',
    marginRight: 16,
  },
});
