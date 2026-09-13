import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { habitsApi } from '@/api/endpoints/habits';
import { checkInsApi } from '@/api/endpoints/checkins';
import { useAuth } from '@/contexts/AuthContext';
import { calculateHabitStats, type HabitStreakStats } from '@/utils/streak';
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

export interface HabitsStatsSummary {
  statsMap: Record<string, HabitStreakStats>;
  maxHighestStreak: number;
  maxCurrentStreak: number;
  totalCheckIns: number;
}

export function useHabitsStreakStats(habits: HabitRespond[] | undefined) {
  const { token } = useAuth();
  const habitIds = habits?.map((h) => h.id).join(',') || '';

  return useQuery<HabitsStatsSummary>({
    queryKey: ['habitStreakStats', token, habitIds],
    queryFn: async () => {
      if (!habits || habits.length === 0) {
        return {
          statsMap: {},
          maxHighestStreak: 0,
          maxCurrentStreak: 0,
          totalCheckIns: 0,
        };
      }

      const results = await Promise.all(
        habits.map(async (habit) => {
          try {
            const checkIns = await checkInsApi.getAll(habit.id);
            return calculateHabitStats(habit.id, checkIns);
          } catch {
            return {
              habitId: habit.id,
              currentStreak: 0,
              highestStreak: 0,
              totalCheckIns: 0,
            };
          }
        })
      );

      const statsMap: Record<string, HabitStreakStats> = {};
      let maxHighest = 0;
      let maxCurrent = 0;
      let totalCheckIns = 0;

      for (const stat of results) {
        statsMap[stat.habitId] = stat;
        if (stat.highestStreak > maxHighest) maxHighest = stat.highestStreak;
        if (stat.currentStreak > maxCurrent) maxCurrent = stat.currentStreak;
        totalCheckIns += stat.totalCheckIns;
      }

      return {
        statsMap,
        maxHighestStreak: maxHighest,
        maxCurrentStreak: maxCurrent,
        totalCheckIns,
      };
    },
    enabled: !!token && !!habits && habits.length > 0,
  });
}

