import { Alert, Linking } from 'react-native';

/**
 * Opens an external URL safely: prefixes a scheme for bare domains
 * ("www.example.com") and surfaces failures instead of leaving an
 * unhandled promise rejection.
 */
export async function openExternal(url: string): Promise<void> {
  const target = /^[a-z][a-z0-9+.-]*:/i.test(url) ? url : `https://${url}`;
  try {
    await Linking.openURL(target);
  } catch {
    Alert.alert('Unable to open', target);
  }
}
