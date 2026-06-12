import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuthStore } from '../store/AuthStore';

export const ProfileHeader = () => {
  const user = useAuthStore(state => state.user);

  return (
    <TouchableOpacity style={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'U'}</Text>
      </View>
      <View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.role}>User</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 12,
    color: '#666',
  }
});
