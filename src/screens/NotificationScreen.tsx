import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';

export const NotificationScreen = () => {
  // In a real app, this would be fetched via React Query from the backend
  const notifications = [
    { id: 1, title: 'Lead Reminder', message: 'Call John Doe regarding estimate', unread: true },
    { id: 2, title: 'Estimate Update', message: 'Estimate #1002 approved', unread: false },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.card, item.unread && styles.unread]}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardMessage}>{item.message}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  card: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  unread: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardMessage: {
    fontSize: 14,
    color: '#666',
  }
});
