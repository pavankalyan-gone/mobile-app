import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.branding}>Enterprise Mobile</Text>
      <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      <Text style={styles.status}>Initializing secure session...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  branding: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  loader: {
    marginBottom: 16,
  },
  status: {
    fontSize: 14,
    color: '#666',
  }
});
