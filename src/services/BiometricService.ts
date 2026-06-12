import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

export class BiometricService {
  private static BIOMETRIC_KEY = 'biometric_enabled';

  static async isBiometricAvailable(): Promise<boolean> {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && isEnrolled;
  }

  static async enableBiometric(): Promise<boolean> {
    const available = await this.isBiometricAvailable();
    if (!available) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to enable biometric login',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      await SecureStore.setItemAsync(this.BIOMETRIC_KEY, 'true');
      return true;
    }
    return false;
  }

  static async disableBiometric(): Promise<void> {
    await SecureStore.deleteItemAsync(this.BIOMETRIC_KEY);
  }

  static async isBiometricEnabled(): Promise<boolean> {
    const value = await SecureStore.getItemAsync(this.BIOMETRIC_KEY);
    return value === 'true';
  }

  static async authenticate(): Promise<boolean> {
    const enabled = await this.isBiometricEnabled();
    if (!enabled) return false;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Log in to Enterprise App',
      cancelLabel: 'Use Password',
      fallbackLabel: 'Use Passcode',
    });

    return result.success;
  }
}
