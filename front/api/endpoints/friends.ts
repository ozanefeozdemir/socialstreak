import apiClient from '../client';
import type { FriendshipRespond } from '@/types';

export const friendsApi = {
  getAll: async (): Promise<FriendshipRespond[]> => {
    const response = await apiClient.get<FriendshipRespond[]>('/friendship');
    return response.data;
  },

  remove: async (friendId: string): Promise<void> => {
    await apiClient.delete(`/friendship/${friendId}`);
  },
};
