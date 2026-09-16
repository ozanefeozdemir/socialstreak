import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionsApi } from '@/api/endpoints/sessions';
import type { HabitSessionRequest } from '@/types';

const SESSIONS_KEY = ['sessions'];

export function useSessions(habitId: string) {
  return useQuery({
    queryKey: [...SESSIONS_KEY, habitId],
    queryFn: () => sessionsApi.getAll(habitId),
    enabled: !!habitId,
  });
}

export function useCreateSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, data }: { habitId: string; data: HabitSessionRequest }) =>
      sessionsApi.create(habitId, data),
    onSuccess: (_data, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, habitId] });
      queryClient.invalidateQueries({ queryKey: ['checkIns', habitId] });
      queryClient.invalidateQueries({ queryKey: ['todayCheckIns'] });
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeleteSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, sessionId }: { habitId: string; sessionId: string }) =>
      sessionsApi.delete(habitId, sessionId),
    onSuccess: (_data, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: [...SESSIONS_KEY, habitId] });
    },
  });
}
