import { Platform, PermissionsAndroid } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// react-native-call-detection types
type CallEventType = 'Disconnected' | 'Dialing' | 'Incoming' | 'Connected' | 'Offhook';
type CallListener = (event: CallEventType, phoneNumber?: string) => void;

let CallDetectorInstance: any = null;

async function requestAndroidPermission(): Promise<boolean> {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      {
        title: 'Phone State Permission',
        message: 'Perfex CRM needs phone access to detect calls from your leads.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

export async function startCallDetection(onCallEvent: CallListener): Promise<() => void> {
  if (Platform.OS === 'web') {
    return () => {};
  }

  // Check if we are running in Expo Go (StoreClient)
  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  if (isExpoGo) {
    console.warn('Call detection is disabled in Expo Go. Use a development build to enable call detection.');
    return () => {};
  }

  if (Platform.OS === 'android') {
    const permitted = await requestAndroidPermission();
    if (!permitted) return () => {};
  }

  try {
    // Dynamic import to avoid crashing when the native module isn't linked yet
    const CallDetection = require('react-native-call-detection').default;
    CallDetectorInstance = new CallDetection(
      (event: CallEventType, number: string) => {
        onCallEvent(event, number);
      },
      false,   // readPhoneNumbers — false on iOS (number is unavailable there without entitlement)
      () => {}, // permissionCallback
      {
        title: 'Phone State',
        message: 'Perfex CRM needs access to detect incoming calls from leads.',
      }
    );
  } catch (err) {
    console.warn('Call detection unavailable:', err);
    return () => {};
  }

  return () => {
    try {
      CallDetectorInstance?.dispose();
      CallDetectorInstance = null;
    } catch {}
  };
}

