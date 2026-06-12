import React, { useEffect, useState } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { BiometricService } from '../services/BiometricService';

export const BiometricSettingsScreen = () => {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    const available = await BiometricService.isBiometricAvailable();
    setIsAvailable(available);
    if (available) {
      const enabled = await BiometricService.isBiometricEnabled();
      setIsEnabled(enabled);
    }
  };

  const toggleSwitch = async () => {
    if (isEnabled) {
      await BiometricService.disableBiometric();
      setIsEnabled(false);
    } else {
      const success = await BiometricService.enableBiometric();
      if (success) {
        setIsEnabled(true);
      } else {
        Alert.alert('Authentication Failed', 'Could not enable biometric login.');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Security Settings</Text>
      
      <View style={styles.settingRow}>
        <View style={styles.textContainer}>
          <Text style={styles.settingLabel}>Biometric Login</Text>
          <Text style={styles.settingDesc}>
            Use Face ID or Touch ID to log in securely without entering your password.
          </Text>
        </View>
        <Switch
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isEnabled ? '#007AFF' : '#f4f3f4'}
          onValueChange={toggleSwitch}
          value={isEnabled}
          disabled={!isAvailable}
        />
      </View>
      {!isAvailable && (
        <Text style={styles.warning}>Biometric hardware is not available on this device.</Text>
      )}
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
    marginBottom: 24,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 14,
    color: '#666',
  },
  warning: {
    marginTop: 12,
    color: '#d32f2f',
    fontSize: 14,
  }
});
