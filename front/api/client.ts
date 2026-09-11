import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import type { UserRespond } from '@/types';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const getBaseUrl = (): string => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:8080/api';
    }
    // Web ve iOS Simulator için localhost
    // NOT: Gerçek fiziksel telefon (Expo Go) kullanıyorsan burayı Wi-Fi IP'n yapmalısın (Örn: 192.168.1.55)
    return 'http://localhost:8080/api';
  }
  return 'https://api.socialstreak.app/api';
};

const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Token helpers ───────────────────────────────────
// Platform kontrolü eklenerek Web (localStorage) ve Mobil (SecureStore) ayrımı yapıldı
export const saveToken = async (token: string): Promise<void> => {
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  }
};

export const getToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
};

export const clearToken = async (): Promise<void> => {
  delete apiClient.defaults.headers.common['Authorization'];
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
};

// ── User helpers ─────────────────────────────────────
export const saveStoredUser = async (user: UserRespond): Promise<void> => {
  const json = JSON.stringify(user);
  if (Platform.OS === 'web') {
    localStorage.setItem(USER_KEY, json);
  } else {
    await SecureStore.setItemAsync(USER_KEY, json);
  }
};

export const getStoredUser = async (): Promise<UserRespond | null> => {
  try {
    const json =
      Platform.OS === 'web'
        ? localStorage.getItem(USER_KEY)
        : await SecureStore.getItemAsync(USER_KEY);
    return json ? (JSON.parse(json) as UserRespond) : null;
  } catch {
    return null;
  }
};

export const clearStoredUser = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(USER_KEY);
  } else {
    await SecureStore.deleteItemAsync(USER_KEY);
  }
};

// ── Request Interceptor: Attach JWT ─────────────────
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Handle auth errors ────────
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Helper kullanarak token'ı siliyoruz
      await clearToken();
      // TODO: Navigate to login screen
    }
    return Promise.reject(error);
  },
);

export default apiClient;