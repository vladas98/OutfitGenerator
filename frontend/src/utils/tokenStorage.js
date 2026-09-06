import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store's web implementation is an empty stub (native Keychain /
// Keystore have no browser equivalent), so web needs its own branch rather
// than relying on the library to fall back automatically.
const KEY = 'outfitgenerator_auth_token';

export async function getToken() {
  if (Platform.OS === 'web') {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(KEY);
}

export async function setToken(token) {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.setItem(KEY, token);
    } catch {
      // Private browsing / storage disabled — session just won't persist.
    }
    return;
  }
  return SecureStore.setItemAsync(KEY, token);
}

export async function clearToken() {
  if (Platform.OS === 'web') {
    try {
      window.localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
    return;
  }
  return SecureStore.deleteItemAsync(KEY);
}
