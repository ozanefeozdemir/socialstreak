import { useQuery } from '@tanstack/react-query';
import { feedApi } from '@/api/endpoints/feed';
import { useAuth } from '@/contexts/AuthContext';
import type { FeedItemRespond } from '@/types';

export function useFeed() {
  const { token } = useAuth();

  return useQuery<FeedItemRespond[]>({
    queryKey: ['feed'],
    queryFn: feedApi.getFeed,
    enabled: !!token,
    staleTime: 1000 * 30, // 30 seconds fresh
  });
}
