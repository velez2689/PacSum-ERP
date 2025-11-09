/**
 * Date utility functions using date-fns
 */

import {
  format,
  formatDistance,
  formatRelative,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  parseISO,
  isValid,
  isBefore,
  isAfter,
} from 'date-fns';

/**
 * Format date to standard format
 */
export function formatDate(date: Date | string, formatStr: string = 'MMM d, yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return format(dateObj, formatStr);
}

/**
 * Format date and time
 */
export function formatDateTime(
  date: Date | string,
  formatStr: string = 'MMM d, yyyy h:mm a'
): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return format(dateObj, formatStr);
}

/**
 * Format time only
 */
export function formatTime(date: Date | string, formatStr: string = 'h:mm a'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid time';
  return format(dateObj, formatStr);
}

/**
 * Format date relative to now (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return formatDistance(dateObj, new Date(), { addSuffix: true });
}

/**
 * Format date relative to now with custom text (e.g., "today at 3:00 PM")
 */
export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';
  return formatRelative(dateObj, new Date());
}

/**
 * Format date for display based on context
 */
export function formatSmartDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return 'Invalid date';

  if (isToday(dateObj)) {
    return `Today at ${format(dateObj, 'h:mm a')}`;
  } else if (isYesterday(dateObj)) {
    return `Yesterday at ${format(dateObj, 'h:mm a')}`;
  } else if (isTomorrow(dateObj)) {
    return `Tomorrow at ${format(dateObj, 'h:mm a')}`;
  } else if (isThisWeek(dateObj)) {
    return format(dateObj, 'EEEE \'at\' h:mm a');
  } else if (isThisYear(dateObj)) {
    return format(dateObj, 'MMM d \'at\' h:mm a');
  } else {
    return format(dateObj, 'MMM d, yyyy');
  }
}

/**
 * Get date range for common periods
 */
export function getDateRange(
  period: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear'
): { start: Date; end: Date } {
  const now = new Date();

  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    case 'thisWeek':
      return { start: startOfWeek(now), end: endOfWeek(now) };
    case 'lastWeek':
      const lastWeek = subWeeks(now, 1);
      return { start: startOfWeek(lastWeek), end: endOfWeek(lastWeek) };
    case 'thisMonth':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'lastMonth':
      const lastMonth = subMonths(now, 1);
      return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
    case 'thisYear':
      return { start: startOfYear(now), end: endOfYear(now) };
    case 'lastYear':
      const lastYear = subYears(now, 1);
      return { start: startOfYear(lastYear), end: endOfYear(lastYear) };
    default:
      return { start: startOfDay(now), end: endOfDay(now) };
  }
}

/**
 * Check if date is within range
 */
export function isDateInRange(date: Date | string, start: Date | string, end: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const startObj = typeof start === 'string' ? parseISO(start) : start;
  const endObj = typeof end === 'string' ? parseISO(end) : end;

  return isAfter(dateObj, startObj) && isBefore(dateObj, endObj);
}

/**
 * Get number of days between dates
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
  const startObj = typeof start === 'string' ? parseISO(start) : start;
  const endObj = typeof end === 'string' ? parseISO(end) : end;
  return differenceInDays(endObj, startObj);
}

/**
 * Get number of hours between dates
 */
export function getHoursBetween(start: Date | string, end: Date | string): number {
  const startObj = typeof start === 'string' ? parseISO(start) : start;
  const endObj = typeof end === 'string' ? parseISO(end) : end;
  return differenceInHours(endObj, startObj);
}

/**
 * Get number of minutes between dates
 */
export function getMinutesBetween(start: Date | string, end: Date | string): number {
  const startObj = typeof start === 'string' ? parseISO(start) : start;
  const endObj = typeof end === 'string' ? parseISO(end) : end;
  return differenceInMinutes(endObj, startObj);
}

/**
 * Add business days to date (excludes weekends)
 */
export function addBusinessDays(date: Date | string, days: number): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  let result = new Date(dateObj);
  let addedDays = 0;

  while (addedDays < days) {
    result = addDays(result, 1);
    // Skip weekends
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }

  return result;
}

/**
 * Format ISO date for input fields
 */
export function toInputDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, 'yyyy-MM-dd');
}

/**
 * Format ISO datetime for input fields
 */
export function toInputDateTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(dateObj)) return '';
  return format(dateObj, "yyyy-MM-dd'T'HH:mm");
}

/**
 * Parse input date to ISO string
 */
export function fromInputDate(dateStr: string): string {
  const date = parseISO(dateStr);
  return date.toISOString();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isBefore(dateObj, new Date());
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return isAfter(dateObj, new Date());
}

/**
 * Get fiscal year from date
 */
export function getFiscalYear(date: Date | string, fiscalYearStart: number = 1): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  return month >= fiscalYearStart ? year : year - 1;
}

/**
 * Get quarter from date
 */
export function getQuarter(date: Date | string): number {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  const month = dateObj.getMonth() + 1;
  return Math.ceil(month / 3);
}

// Re-export commonly used date-fns functions
export {
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  isToday,
  isYesterday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  isThisYear,
  parseISO,
  isValid,
};
