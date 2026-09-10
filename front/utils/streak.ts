/**
 * Streak calculation utilities
 * Determines consecutive check-in days for a habit
 */

import type { CheckInRespond } from '@/types';

/**
 * Calculate the current streak from a list of check-ins (ordered by date DESC).
 * A streak is the number of consecutive days ending today (or yesterday if not yet checked in today).
 */
export function calculateStreak(checkIns: CheckInRespond[]): number {
  if (checkIns.length === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dates = checkIns
    .map((c) => new Date(c.checkInDate + 'T00:00:00'))
    .sort((a, b) => b.getTime() - a.getTime()); // newest first

  let streak = 0;
  let expectedDate = new Date(today);

  // Allow starting from today or yesterday
  const firstDate = dates[0];
  const diffFromToday = Math.floor((today.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffFromToday > 1) return 0; // Most recent check-in is too old

  if (diffFromToday === 1) {
    expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - 1);
  }

  for (const date of dates) {
    if (date.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else if (date.getTime() < expectedDate.getTime()) {
      break;
    }
  }

  return streak;
}
