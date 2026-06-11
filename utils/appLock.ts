import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const LOCK_ENABLED_KEY = 'biometric_lock_enabled';

/** True when the device has biometric hardware with something enrolled. */
export async function canUseBiometrics(): Promise<boolean> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  } catch {
    return false;
  }
}

export async function getBiometricLockEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LOCK_ENABLED_KEY)) === 'true';
  } catch {
    return false;
  }
}

export async function setBiometricLockEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCK_ENABLED_KEY, enabled ? 'true' : 'false');
  } catch {
    // toggling the preference is best-effort
  }
}

/**
 * Prompts the user. Device credentials (PIN/pattern) remain available as a
 * fallback so a failed sensor can never lock someone out of the app.
 */
export async function authenticateForUnlock(): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock ForestCRM',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
