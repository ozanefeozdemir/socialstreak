import apiClient from '../client';
import type { UserRespond, PublicUserRespond, UserSearchDto, UpdateUserRequest, ChangePasswordRequest } from '@/types';

export const usersApi = {
  getMe: async (): Promise<UserRespond> => {
    const response = await apiClient.get<UserRespond>('/user/me');
    return response.data;
  },

  getAll: async (): Promise<PublicUserRespond[]> => {
    const response = await apiClient.get<PublicUserRespond[]>('/user');
    return response.data;
  },

  search: async (query: string, page = 0, size = 20): Promise<UserSearchDto[]> => {
    const response = await apiClient.get<UserSearchDto[]>('/user/search', {
      params: { q: query, page, size },
    });
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
