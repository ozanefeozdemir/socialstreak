import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getToken,
  saveToken,
  clearToken,
  getRefreshToken,
  saveRefreshToken,
  clearRefreshToken,
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
  setOnAuthFailure,
} from '@/api/client';
import { authApi } from '@/api/endpoints/auth';
import { usersApi } from '@/api/endpoints/users';
import { queryClient } from '@/contexts/QueryProvider';
import type { UserRespond, LoginRequest, RegisterRequest } from '@/types';

interface AuthState {
  token: string | null;
  user: UserRespond | null;
  isLoggedIn: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserRespond) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoggedIn: false,
    isLoading: true,
  });

  // Listen for forced logout / refresh failure from Axios interceptor
  useEffect(() => {
    setOnAuthFailure(() => {
      queryClient.clear();
      setState({
        token: null,
        user: null,
        isLoggedIn: false,
        isLoading: false,
      });
    });
    return () => {
      setOnAuthFailure(null);
    };
  }, []);

  // Load stored token, refresh token, and user profile on app launch
  useEffect(() => {
    (async () => {
      try {
        const [token, refreshToken, storedUser] = await Promise.all([
          getToken(),
          getRefreshToken(),
          getStoredUser(),
        ]);
        let finalUser = storedUser;
        const hasSession = !!(token || refreshToken);

        if (hasSession && !finalUser) {
          try {
            finalUser = await usersApi.getMe();
            await saveStoredUser(finalUser);
          } catch {
            // Ignore network errors, maintain session
          }
        }

        setState({
          token,
          user: finalUser,
          isLoggedIn: hasSession,
          isLoading: false,
        });
      } catch {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    })();
  }, []);

  const login = useCallback(async (data: LoginRequest) => {
    // Clear any previous user's cached queries immediately
    queryClient.clear();
    const response = await authApi.login(data);
    await Promise.all([
      saveToken(response.token),
      response.refreshToken ? saveRefreshToken(response.refreshToken) : Promise.resolve(),
      saveStoredUser(response.user),
    ]);

    setState({
      token: response.token,
      user: response.user,
      isLoggedIn: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    // Clear any previous user's cached queries immediately
    queryClient.clear();
    const response = await authApi.register(data);
    await Promise.all([
      saveToken(response.token),
      response.refreshToken ? saveRefreshToken(response.refreshToken) : Promise.resolve(),
      saveStoredUser(response.user),
    ]);

    setState({
      token: response.token,
      user: response.user,
      isLoggedIn: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore network error on logout revocation
      }
    }
    await Promise.all([clearToken(), clearRefreshToken(), clearStoredUser()]);
    // Wipe all cached queries (habits, check-ins, user data) from memory
    queryClient.clear();
    setState({
      token: null,
      user: null,
      isLoggedIn: false,
      isLoading: false,
    });
  }, []);

  const setUser = useCallback((user: UserRespond) => {
    saveStoredUser(user);
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, setUser }}>
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
