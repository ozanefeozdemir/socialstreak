/**
 * Date formatting utilities
 * Uses date-fns for consistent date handling
 */

import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

/** Format a check-in date (YYYY-MM-DD) for display */
export function formatCheckInDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMM d');
}

/** Format an ISO instant for feed timestamps */
export function formatTimestamp(isoStr: string): string {
  return formatDistanceToNow(new Date(isoStr), { addSuffix: true });
}

/** Format a date as "Sep 10, 2026" */
export function formatFullDate(isoStr: string): string {
  return format(new Date(isoStr), 'MMM d, yyyy');
}
