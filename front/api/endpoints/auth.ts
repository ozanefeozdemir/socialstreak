import apiClient, { saveToken } from '../client';
import type { LoginRequest, RegisterRequest, AuthRespond } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<AuthRespond> => {
    const response = await apiClient.post<AuthRespond>('/auth/login', data);
    await saveToken(response.data.token);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthRespond> => {
    const response = await apiClient.post<AuthRespond>('/auth/register', data);
    await saveToken(response.data.token);
    return response.data;
  },
};
