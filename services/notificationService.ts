import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import api from './api';

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
        lightColor: '#6750A4',
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
      console.log('Error fetching push token:', error);
      return null;
    }
  },

  registerDeviceToken: async (): Promise<void> => {
    const granted = await notificationService.requestPermission();
    if (!granted) return;

    const token = await notificationService.getExpoPushToken();
    if (!token) return;

    try {
      await api.post('/device-tokens', {
        token,
        platform: Platform.OS,
      });
    } catch (error) {
      console.error('Failed to register device token with backend:', error);
    }
  },
};
