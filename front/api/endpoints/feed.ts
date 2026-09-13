import apiClient from '../client';
import type { FeedItemRespond } from '@/types';

export const feedApi = {
  getFeed: async (): Promise<FeedItemRespond[]> => {
    const response = await apiClient.get<FeedItemRespond[]>('/feed');
    return response.data;
  },
};
