import apiClient from '../client';
import type { CheckInRespond } from '@/types';

export const checkInsApi = {
  checkIn: async (habitId: string): Promise<CheckInRespond> => {
    const response = await apiClient.post<CheckInRespond>(`/habit/${habitId}/checkin`);
    return response.data;
  },

  getAll: async (habitId: string): Promise<CheckInRespond[]> => {
    const response = await apiClient.get<CheckInRespond[]>(`/habit/${habitId}/checkin`);
    return response.data;
  },

  delete: async (habitId: string, checkInId: string): Promise<void> => {
    await apiClient.delete(`/habit/${habitId}/checkin/${checkInId}`);
  },
};
