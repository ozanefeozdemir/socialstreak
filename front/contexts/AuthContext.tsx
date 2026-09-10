import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { AuthRespond, UserRespond } from '@/types';

const TOKEN_KEY = 'auth_token';

interface AuthState {
  token: string | null;
  user: UserRespond | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (authResponse: AuthRespond) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserRespond) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function getStoredToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function storeToken(token: string): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.setItem(TOKEN_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoggedIn: false,
    isLoading: true,
  });

  // Load stored token on app launch
  useEffect(() => {
    (async () => {
      const token = await getStoredToken();
      setState((prev) => ({
        ...prev,
        token,
        isLoggedIn: !!token,
        isLoading: false,
      }));
    })();
  }, []);

  const login = useCallback(async (authResponse: AuthRespond) => {
    await storeToken(authResponse.token);
    setState((prev) => ({
      ...prev,
      token: authResponse.token,
      isLoggedIn: true,
    }));
  }, []);

  const logout = useCallback(async () => {
    await removeToken();
    setState({
      token: null,
      user: null,
      isLoggedIn: false,
      isLoading: false,
    });
  }, []);

  const setUser = useCallback((user: UserRespond) => {
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
