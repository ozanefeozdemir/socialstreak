import apiClient, { saveToken, saveRefreshToken } from '../client';
import type { LoginRequest, RegisterRequest, AuthRespond } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthRespond> => {
    const response = await apiClient.post<AuthRespond>('/auth/login', data);
    await saveToken(response.data.token);
    if (response.data.refreshToken) {
      await saveRefreshToken(response.data.refreshToken);
    }
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthRespond> => {
    const response = await apiClient.post<AuthRespond>('/auth/register', data);
    await saveToken(response.data.token);
    if (response.data.refreshToken) {
      await saveRefreshToken(response.data.refreshToken);
    }
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthRespond> => {
    const response = await apiClient.post<AuthRespond>('/auth/refresh', { refreshToken });
    await saveToken(response.data.token);
    if (response.data.refreshToken) {
      await saveRefreshToken(response.data.refreshToken);
    }
    return response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', refreshToken ? { refreshToken } : {});
  },
};
