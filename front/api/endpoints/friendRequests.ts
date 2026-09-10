import apiClient from '../client';
import type { FriendRequestRespond } from '@/types';

export const friendRequestsApi = {
  getSent: async (): Promise<FriendRequestRespond[]> => {
    const response = await apiClient.get<FriendRequestRespond[]>('/friendreq/sent');
    return response.data;
  },

  getReceived: async (): Promise<FriendRequestRespond[]> => {
    const response = await apiClient.get<FriendRequestRespond[]>('/friendreq/received');
    return response.data;
  },

  send: async (friendId: string): Promise<FriendRequestRespond> => {
    const response = await apiClient.post<FriendRequestRespond>(`/friendreq/send/${friendId}`);
    return response.data;
  },

  accept: async (requestId: string): Promise<void> => {
    await apiClient.post(`/friendreq/accept/${requestId}`);
  },

  remove: async (requestId: string): Promise<void> => {
    await apiClient.delete(`/friendreq/${requestId}`);
  },
};
