import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { eventBus } from '../utils/EventBus';
import { useAuthStore } from '../store/AuthStore';

export const AccessRevokedModal = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsubscribe = eventBus.on('AccessRevoked', () => {
      setVisible(true);
      // Wait a moment then log out automatically
      setTimeout(() => {
        setVisible(false);
        useAuthStore.getState().logout();
      }, 5000);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <Text style={styles.title}>Access Revoked</Text>
          <Text style={styles.message}>
            Your access to this application or workspace has been revoked by the administrator. 
            You will be logged out securely.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  }
});
