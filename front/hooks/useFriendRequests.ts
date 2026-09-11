import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { friendRequestsApi } from '@/api/endpoints/friendRequests';
import { useAuth } from '@/contexts/AuthContext';
import type { FriendRequestRespond } from '@/types';

export function useSentFriendRequests() {
  const { token } = useAuth();

  return useQuery<FriendRequestRespond[]>({
    queryKey: ['friendRequests', 'sent'],
    queryFn: friendRequestsApi.getSent,
    enabled: !!token,
  });
}

export function useReceivedFriendRequests() {
  const { token } = useAuth();

  return useQuery<FriendRequestRespond[]>({
    queryKey: ['friendRequests', 'received'],
    queryFn: friendRequestsApi.getReceived,
    enabled: !!token,
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (friendId: string) => friendRequestsApi.send(friendId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendRequestsApi.accept(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useRemoveFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) => friendRequestsApi.remove(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
    },
  });
}
