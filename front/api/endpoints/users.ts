import apiClient from '../client';
import type { UserRespond, UpdateUserRequest, ChangePasswordRequest } from '@/types';

export const usersApi = {
  getAll: async (): Promise<UserRespond[]> => {
    const response = await apiClient.get<UserRespond[]>('/user');
    return response.data;
  },

  getById: async (id: string): Promise<UserRespond> => {
    const response = await apiClient.get<UserRespond>(`/user/${id}`);
    return response.data;
  },

  update: async (id: string, data: UpdateUserRequest): Promise<void> => {
    await apiClient.put(`/user/${id}`, data);
  },

  changePassword: async (id: string, data: ChangePasswordRequest): Promise<void> => {
    await apiClient.patch(`/user/${id}/password`, data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/user/${id}`);
  },
};
