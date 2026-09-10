import apiClient from '../client';
import type { HabitRequest, HabitRespond } from '@/types';

export const habitsApi = {
  getAll: async (): Promise<HabitRespond[]> => {
    const response = await apiClient.get<HabitRespond[]>('/habit');
    return response.data;
  },

  getById: async (id: string): Promise<HabitRespond> => {
    const response = await apiClient.get<HabitRespond>(`/habit/${id}`);
    return response.data;
  },

  create: async (data: HabitRequest): Promise<HabitRespond> => {
    const response = await apiClient.post<HabitRespond>('/habit', data);
    return response.data;
  },

  update: async (id: string, data: HabitRequest): Promise<HabitRespond> => {
    const response = await apiClient.put<HabitRespond>(`/habit/${id}`, data);
    return response.data;
  },

  archive: async (id: string): Promise<HabitRespond> => {
    const response = await apiClient.patch<HabitRespond>(`/habit/${id}/archive`);
    return response.data;
  },

  unarchive: async (id: string): Promise<HabitRespond> => {
    const response = await apiClient.patch<HabitRespond>(`/habit/${id}/unarchive`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/habit/${id}`);
  },
};
