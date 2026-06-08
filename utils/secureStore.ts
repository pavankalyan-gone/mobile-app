import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function setItemAsync(
  key: string,
  value: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value, options);
  }
}

export async function getItemAsync(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return await AsyncStorage.getItem(key);
  } else {
    return await SecureStore.getItemAsync(key, options);
  }
}

export async function deleteItemAsync(
  key: string,
  options?: SecureStore.SecureStoreOptions
): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key, options);
  }
}
