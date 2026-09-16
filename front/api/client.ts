import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSyncStore } from '@/store/useSyncStore';

import type { AuthRespond, UserRespond } from '@/types';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
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

// ── Auth failure listener ────────────────────────────
type AuthFailureListener = () => void;
let onAuthFailureListener: AuthFailureListener | null = null;

export const setOnAuthFailure = (listener: AuthFailureListener | null) => {
  onAuthFailureListener = listener;
};

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

// ── Refresh Token helpers ────────────────────────────
export const saveRefreshToken = async (refreshToken: string): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } else {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === 'web') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const clearRefreshToken = async (): Promise<void> => {
  if (Platform.OS === 'web') {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
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

    // Offline Interceptor for Write Operations
    if (config.method && ['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected) {
        // Queue the mutation for background sync
        useSyncStore.getState().addToQueue({
          url: config.url || '',
          method: config.method.toUpperCase() as any,
          payload: config.data,
        });

        // Override the adapter to mock a successful response (Optimistic UI)
        config.adapter = async () => {
          return {
            data: { success: true, offline: true },
            status: 200,
            statusText: 'OK',
            headers: config.headers as any,
            config,
            request: {},
          };
        };
      }
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor: Handle silent refresh & auth errors ────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Do not attempt refresh for auth endpoints themselves (login, register, refresh, logout)
    const isAuthEndpoint = originalRequest?.url?.includes('/auth/');

    if (error.response?.status === 401 && !originalRequest?._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const currentRefreshToken = await getRefreshToken();
        if (!currentRefreshToken) {
          throw new Error('No refresh token available');
        }

        // Use independent axios instance to prevent interceptor recursion
        const response = await axios.post<AuthRespond>(
          `${getBaseUrl()}/auth/refresh`,
          { refreshToken: currentRefreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
        await saveToken(newAccessToken);
        if (newRefreshToken) {
          await saveRefreshToken(newRefreshToken);
        }

        processQueue(null, newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearToken();
        await clearRefreshToken();
        await clearStoredUser();
        if (onAuthFailureListener) {
          onAuthFailureListener();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;