import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getToken,
  saveToken,
  clearToken,
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
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

  // Load stored token and user profile on app launch
  useEffect(() => {
    (async () => {
      try {
        const [token, storedUser] = await Promise.all([getToken(), getStoredUser()]);
        setState({
          token,
          user: storedUser,
          isLoggedIn: !!token,
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
    await saveToken(response.token);

    // Fetch full user profile matching username
    let loggedInUser: UserRespond | null = null;
    try {
      const users = await usersApi.getAll();
      loggedInUser =
        users.find((u) => u.username.toLowerCase() === response.username.toLowerCase()) || null;
    } catch {
      // Ignore if offline/error
    }

    if (loggedInUser) {
      await saveStoredUser(loggedInUser);
    }

    setState({
      token: response.token,
      user: loggedInUser,
      isLoggedIn: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    // Clear any previous user's cached queries immediately
    queryClient.clear();
    const response = await authApi.register(data);
    await saveToken(response.token);

    // Fetch full user profile matching registered username
    let registeredUser: UserRespond | null = null;
    try {
      const users = await usersApi.getAll();
      registeredUser =
        users.find((u) => u.username.toLowerCase() === response.username.toLowerCase()) || null;
    } catch {
      // Ignore if offline/error
    }

    if (registeredUser) {
      await saveStoredUser(registeredUser);
    }

    setState({
      token: response.token,
      user: registeredUser,
      isLoggedIn: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([clearToken(), clearStoredUser()]);
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

