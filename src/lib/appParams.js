import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const AUTH_KEYS = ['app_access_token', 'access_token', 'app_access_token'];

function getExtra() {
  return Constants.expoConfig?.extra ?? {};
}

export async function getStoredToken() {
  for (const key of AUTH_KEYS) {
    try {
      const v = await AsyncStorage.getItem(key);
      if (v) return v;
    } catch (_) {}
  }
  return null;
}

export async function setStoredToken(token) {
  if (!token) return;
  try {
    await AsyncStorage.setItem('app_access_token', token);
    await AsyncStorage.setItem('access_token', token);
  } catch (_) {}
}

export async function clearStoredToken() {
  try {
    for (const key of AUTH_KEYS) await AsyncStorage.removeItem(key);
    await AsyncStorage.removeItem('token');
  } catch (_) {}
}

export const appParams = {
  get appId() {
    return getExtra().appId ?? 'default';
  },
  get token() {
    return null;
  },
  get appBaseUrl() {
    return getExtra().apiUrl ?? '/api';
  },
};

export async function loadAppParams() {
  const token = await getStoredToken();
  return { ...appParams, token };
}
