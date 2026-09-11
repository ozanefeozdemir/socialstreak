import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkInsApi } from '@/api/endpoints/checkins';

const CHECKINS_KEY = ['checkIns'];

export function useCheckIns(habitId: string) {
  return useQuery({
    queryKey: [...CHECKINS_KEY, habitId],
    queryFn: () => checkInsApi.getAll(habitId),
    enabled: !!habitId,
  });
}

export function useCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (habitId: string) => checkInsApi.checkIn(habitId),
    onSuccess: (_data, habitId) => {
      queryClient.invalidateQueries({ queryKey: [...CHECKINS_KEY, habitId] });
      // Also invalidate todayCheckedIn queries
      queryClient.invalidateQueries({ queryKey: ['todayCheckIns'] });
    },
  });
}

export function useDeleteCheckIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ habitId, checkInId }: { habitId: string; checkInId: string }) =>
      checkInsApi.delete(habitId, checkInId),
    onSuccess: (_data, { habitId }) => {
      queryClient.invalidateQueries({ queryKey: [...CHECKINS_KEY, habitId] });
      queryClient.invalidateQueries({ queryKey: ['todayCheckIns'] });
    },
  });
}
