import { Platform, PermissionsAndroid } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// react-native-call-detection types
// Android emits: Incoming → Offhook → Disconnected (answered)
//            or: Incoming → Missed (not answered)
type CallEventType = 'Disconnected' | 'Dialing' | 'Incoming' | 'Connected' | 'Offhook' | 'Missed';
type CallListener = (event: CallEventType, phoneNumber?: string) => void;

async function requestAndroidPermission(): Promise<boolean> {
  try {
    // READ_PHONE_STATE detects call events; READ_CALL_LOG is additionally
    // required on Android 9+ to receive the caller's number. Detection still
    // works without the number, so only READ_PHONE_STATE is mandatory.
    const results = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      PermissionsAndroid.PERMISSIONS.READ_CALL_LOG,
    ]);
    return results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
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

  let detector: any = null;
  try {
    // Dynamic import to avoid crashing when the native module isn't linked yet
    const CallDetection = require('react-native-call-detection').default;
    detector = new CallDetection(
      (event: CallEventType, number: string) => {
        onCallEvent(event, number);
      },
      // readPhoneNumberAndroid — without it the caller's number is never
      // delivered on Android and incoming calls can't be matched to leads.
      // iOS ignores this flag (the number is unavailable there regardless).
      true,
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

  // Dispose the detector this call created — a shared module-level instance
  // races across logout/login remounts and can tear down the active session.
  return () => {
    try {
      detector?.dispose();
      detector = null;
    } catch {}
  };
}

