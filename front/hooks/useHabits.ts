import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '@/api/endpoints/habits';
import { useAuth } from '@/contexts/AuthContext';
import type { HabitRequest, HabitRespond } from '@/types';

const HABITS_KEY = ['habits'];

export function useHabits() {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...HABITS_KEY, token],
    queryFn: habitsApi.getAll,
    enabled: !!token,
  });
}

export function useHabit(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: [...HABITS_KEY, token, id],
    queryFn: () => habitsApi.getById(id),
    enabled: !!id && !!token,
  });
}

export function useCreateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: HabitRequest) => habitsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useUpdateHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HabitRequest }) => habitsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useArchiveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useUnarchiveHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.unarchive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}

export function useDeleteHabit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => habitsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HABITS_KEY });
    },
  });
}
