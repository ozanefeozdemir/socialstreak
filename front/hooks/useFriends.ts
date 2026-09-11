import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendsApi } from '@/api/endpoints/friends';
import { useAuth } from '@/contexts/AuthContext';
import type { FriendshipRespond } from '@/types';

export function useFriends() {
  const { token } = useAuth();

  return useQuery<FriendshipRespond[]>({
    queryKey: ['friends'],
    queryFn: friendsApi.getAll,
    enabled: !!token,
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => friendsApi.remove(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}
