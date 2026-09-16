import apiClient from '../client';
import type { HabitSessionRequest, HabitSessionRespond } from '@/types';

export const sessionsApi = {
  create: async (habitId: string, data: HabitSessionRequest): Promise<HabitSessionRespond> => {
    const response = await apiClient.post<HabitSessionRespond>(`/habit/${habitId}/session`, data);
    return response.data;
  },

  getAll: async (habitId: string): Promise<HabitSessionRespond[]> => {
    const response = await apiClient.get<HabitSessionRespond[]>(`/habit/${habitId}/session`);
    return response.data;
  },

  delete: async (habitId: string, sessionId: string): Promise<void> => {
    await apiClient.delete(`/habit/${habitId}/session/${sessionId}`);
  },
};
