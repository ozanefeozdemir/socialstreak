/**
 * Streak calculation utilities
 * Determines consecutive check-in days for a habit
 */

import type { CheckInRespond } from '@/types';

/**
 * Calculate the current streak from a list of check-ins.
 * A streak is the number of consecutive days ending today (or yesterday if not yet checked in today).
 */
export function calculateStreak(checkIns: CheckInRespond[]): number {
  if (!checkIns || checkIns.length === 0) return 0;

  // Extract unique date strings and sort descending
  const uniqueDates = Array.from(new Set(checkIns.map((c) => c.checkInDate))).sort((a, b) =>
    b.localeCompare(a)
  );

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const mostRecent = uniqueDates[0];
  if (mostRecent !== todayStr && mostRecent !== yesterdayStr) {
    return 0;
  }

  let streak = 0;
  let expected = new Date(mostRecent + 'T00:00:00Z');

  for (const dateStr of uniqueDates) {
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dateStr === expectedStr) {
      streak++;
      expected.setUTCDate(expected.getUTCDate() - 1);
    } else if (dateStr < expectedStr) {
      break;
    }
  }

  return streak;
}

export const calculateCurrentStreak = calculateStreak;

/**
 * Calculate the all-time highest consecutive day streak from a list of check-ins.
 */
export function calculateHighestStreak(checkIns: CheckInRespond[]): number {
  if (!checkIns || checkIns.length === 0) return 0;

  // Extract unique date strings and sort ascending
  const uniqueDates = Array.from(new Set(checkIns.map((c) => c.checkInDate))).sort((a, b) =>
    a.localeCompare(b)
  );

  if (uniqueDates.length === 1) return 1;

  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    const prevDate = new Date(uniqueDates[i - 1] + 'T00:00:00Z');
    const currDate = new Date(uniqueDates[i] + 'T00:00:00Z');

    const diffDays = Math.round(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export interface HabitStreakStats {
  habitId: string;
  currentStreak: number;
  highestStreak: number;
  totalCheckIns: number;
  lastCheckInDate?: string;
}

export function calculateHabitStats(
  habitId: string,
  checkIns: CheckInRespond[]
): HabitStreakStats {
  const currentStreak = calculateStreak(checkIns);
  const highestStreak = calculateHighestStreak(checkIns);
  const totalCheckIns = checkIns?.length ?? 0;

  const sortedCheckIns = [...(checkIns || [])].sort((a, b) =>
    b.checkInDate.localeCompare(a.checkInDate)
  );
  const lastCheckInDate = sortedCheckIns[0]?.checkInDate;

  return {
    habitId,
    currentStreak,
    highestStreak,
    totalCheckIns,
    lastCheckInDate,
  };
}

