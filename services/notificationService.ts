import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as SecureStore from '../utils/secureStore';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import perfexApi from './perfexApi';

const PUSH_TOKEN_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const notificationService = {
  requestPermission: async (): Promise<boolean> => {
    if (!Device.isDevice) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1b300f',
      });
    }

    return true;
  },

  getExpoPushToken: async (): Promise<string | null> => {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      return tokenData.data;
    } catch (error) {
      if (__DEV__) console.warn('Error fetching push token:', error);
      return null;
    }
  },

  registerDeviceToken: async (): Promise<void> => {
    // Callers fire-and-forget this, so nothing here may reject — a keystore
    // or permissions failure must not surface as an unhandled rejection.
    try {
      const granted = await notificationService.requestPermission();
      if (!granted) return;

      const token = await notificationService.getExpoPushToken();
      if (!token) return;

      await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);

      await perfexApi.post('/devices/register', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      if (__DEV__) console.warn('Failed to register device token:', error);
    }
  },

  deregisterDeviceToken: async (): Promise<void> => {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!token) return;

    try {
      await perfexApi.post('/devices/deregister', { token });
      await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
    } catch (error) {
      if (__DEV__) console.warn('Failed to deregister device token:', error);
    }
  },
};
