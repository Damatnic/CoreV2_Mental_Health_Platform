/**
 * Time formatting utilities with mental health platform considerations
 */

interface TimeAgoOptions {
  addSuffix?: boolean;
  includeSeconds?: boolean;
  locale?: string;
  shortFormat?: boolean;
  precise?: boolean;
  maxUnit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
  minUnit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
}

interface RelativeTimeUnit {
  unit: Intl.RelativeTimeFormatUnit;
  value: number;
  threshold: number;
  shortLabel: string;
  longLabel: string;
}

const TIME_UNITS: RelativeTimeUnit[] = [
  {
    unit: 'year',
    value: 365 * 24 * 60 * 60 * 1000,
    threshold: 365 * 24 * 60 * 60 * 1000,
    shortLabel: 'y',
    longLabel: 'year'
  },
  {
    unit: 'month', 
    value: 30 * 24 * 60 * 60 * 1000,
    threshold: 30 * 24 * 60 * 60 * 1000,
    shortLabel: 'mo',
    longLabel: 'month'
  },
  {
    unit: 'day',
    value: 24 * 60 * 60 * 1000,
    threshold: 24 * 60 * 60 * 1000,
    shortLabel: 'd',
    longLabel: 'day'
  },
  {
    unit: 'hour',
    value: 60 * 60 * 1000,
    threshold: 60 * 60 * 1000,
    shortLabel: 'h',
    longLabel: 'hour'
  },
  {
    unit: 'minute',
    value: 60 * 1000,
    threshold: 60 * 1000,
    shortLabel: 'm',
    longLabel: 'minute'
  },
  {
    unit: 'second',
    value: 1000,
    threshold: 1000,
    shortLabel: 's',
    longLabel: 'second'
  }
];

/**
 * Formats a date/time into a relative time string (e.g., "2 hours ago", "in 3 days")
 */
export function formatTimeAgo(
  date: Date | string | number,
  options: TimeAgoOptions = {}
): string {
  const {
    addSuffix = true,
    includeSeconds = false,
    locale = 'en',
    shortFormat = false,
    precise = false,
    maxUnit = 'year',
    minUnit = includeSeconds ? 'second' : 'minute'
  } = options;

  const targetDate = new Date(date);
  const now = new Date();
  
  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }

  const diffMs = now.getTime() - targetDate.getTime();
  const absMs = Math.abs(diffMs);
  const isPast = diffMs > 0;

  // Handle "just now" case
  if (absMs < 30 * 1000) {
    return 'just now';
  }

  // Filter units based on min/max constraints
  const filteredUnits = TIME_UNITS.filter(unit => {
    const minIndex = TIME_UNITS.findIndex(u => u.unit === minUnit);
    const maxIndex = TIME_UNITS.findIndex(u => u.unit === maxUnit);
    const currentIndex = TIME_UNITS.findIndex(u => u.unit === unit.unit);
    return currentIndex >= maxIndex && currentIndex <= minIndex;
  });

  // Find the appropriate unit
  const targetUnit = filteredUnits.find(unit => absMs >= unit.threshold) || filteredUnits[filteredUnits.length - 1];

  if (!targetUnit) {
    return 'just now';
  }

  let value = Math.floor(absMs / targetUnit.value);
  
  // For precise formatting, show decimal places for some units
  if (precise && ['hour', 'day'].includes(targetUnit.unit) && value < 10) {
    value = Math.round((absMs / targetUnit.value) * 10) / 10;
  }

  // Use native Intl.RelativeTimeFormat when possible
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { 
      numeric: 'auto',
      style: shortFormat ? 'narrow' : 'long'
    });
    
    const relativeValue = isPast ? -value : value;
    
    if (addSuffix) {
      return rtf.format(relativeValue, targetUnit.unit);
    } else {
      // Remove suffix manually
      const formatted = rtf.format(relativeValue, targetUnit.unit);
      return formatted.replace(/ ago$/, '').replace(/^in /, '');
    }
  } catch (error) {
    // Fallback for unsupported locales
    return formatTimeAgoFallback(value, targetUnit, isPast, shortFormat, addSuffix);
  }
}

/**
 * Fallback formatting for environments that don't support Intl.RelativeTimeFormat
 */
function formatTimeAgoFallback(
  value: number,
  unit: RelativeTimeUnit,
  isPast: boolean,
  shortFormat: boolean,
  addSuffix: boolean
): string {
  const label = shortFormat ? unit.shortLabel : unit.longLabel;
  const pluralLabel = shortFormat ? label : `${label}${value !== 1 ? 's' : ''}`;
  
  let formatted = `${value}${shortFormat ? '' : ' '}${pluralLabel}`;
  
  if (addSuffix) {
    formatted = isPast ? `${formatted} ago` : `in ${formatted}`;
  }
  
  return formatted;
}

/**
 * Formats time ago with context-aware messaging for mental health scenarios
 */
export function formatTimeAgoWithContext(
  date: Date | string | number,
  context: 'mood' | 'therapy' | 'crisis' | 'chat' | 'journal' | 'general' = 'general',
  options: TimeAgoOptions = {}
): string {
  const baseTime = formatTimeAgo(date, options);
  
  switch (context) {
    case 'mood':
      return `Mood tracked ${baseTime}`;
    case 'therapy':
      return `Session ${baseTime}`;
    case 'crisis':
      return `Last contact ${baseTime}`;
    case 'chat':
      return `Active ${baseTime}`;
    case 'journal':
      return `Journaled ${baseTime}`;
    default:
      return baseTime;
  }
}

/**
 * Formats a precise timestamp with timezone consideration
 */
export function formatPreciseTime(
  date: Date | string | number,
  options: {
    includeDate?: boolean;
    includeTime?: boolean;
    includeSeconds?: boolean;
    includeTimezone?: boolean;
    locale?: string;
    format24Hour?: boolean;
  } = {}
): string {
  const {
    includeDate = true,
    includeTime = true,
    includeSeconds = false,
    includeTimezone = false,
    locale = 'en-US',
    format24Hour = false
  } = options;

  const targetDate = new Date(date);
  
  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }

  const formatOptions: Intl.DateTimeFormatOptions = {};

  if (includeDate) {
    formatOptions.year = 'numeric';
    formatOptions.month = 'short';
    formatOptions.day = 'numeric';
  }

  if (includeTime) {
    formatOptions.hour = 'numeric';
    formatOptions.minute = '2-digit';
    formatOptions.hour12 = !format24Hour;
    
    if (includeSeconds) {
      formatOptions.second = '2-digit';
    }
  }

  if (includeTimezone) {
    formatOptions.timeZoneName = 'short';
  }

  try {
    return new Intl.DateTimeFormat(locale, formatOptions).format(targetDate);
  } catch (error) {
    return targetDate.toLocaleString();
  }
}

/**
 * Gets a user-friendly time range description
 */
export function getTimeRangeDescription(
  startDate: Date | string | number,
  endDate: Date | string | number = new Date()
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid date range';
  }

  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} year${years > 1 ? 's' : ''} ago`;
  }
}

/**
 * Formats duration between two dates
 */
export function formatDuration(
  startDate: Date | string | number,
  endDate: Date | string | number = new Date(),
  options: {
    format?: 'long' | 'short' | 'compact';
    maxUnits?: number;
    includeSeconds?: boolean;
  } = {}
): string {
  const {
    format = 'long',
    maxUnits = 2,
    includeSeconds = false
  } = options;

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Invalid duration';
  }

  const diffMs = Math.abs(end.getTime() - start.getTime());
  const units = [];

  let remaining = diffMs;

  // Calculate each unit
  for (const timeUnit of TIME_UNITS) {
    if (!includeSeconds && timeUnit.unit === 'second') continue;
    
    const value = Math.floor(remaining / timeUnit.value);
    if (value > 0) {
      units.push({
        value,
        unit: timeUnit.unit,
        label: format === 'compact' ? timeUnit.shortLabel : timeUnit.longLabel
      });
      remaining -= value * timeUnit.value;
    }

    if (units.length >= maxUnits) break;
  }

  if (units.length === 0) {
    return format === 'compact' ? '0s' : 'Less than a minute';
  }

  // Format the result
  if (format === 'compact') {
    return units.map(u => `${u.value}${u.label}`).join(' ');
  } else if (format === 'short') {
    return units.map(u => `${u.value}${u.label}`).join(', ');
  } else {
    return units.map(u => {
      const plural = u.value > 1 ? 's' : '';
      return `${u.value} ${u.label}${plural}`;
    }).join(', ');
  }
}

/**
 * Checks if a date is within a specific time range
 */
export function isWithinTimeRange(
  date: Date | string | number,
  range: 'today' | 'yesterday' | 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'this-year',
  referenceDate: Date = new Date()
): boolean {
  const targetDate = new Date(date);
  const refDate = new Date(referenceDate);
  
  if (isNaN(targetDate.getTime())) {
    return false;
  }

  const targetTime = targetDate.getTime();
  const refTime = refDate.getTime();

  switch (range) {
    case 'today': {
      const startOfDay = new Date(refDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(refDate);
      endOfDay.setHours(23, 59, 59, 999);
      return targetTime >= startOfDay.getTime() && targetTime <= endOfDay.getTime();
    }
    
    case 'yesterday': {
      const yesterday = new Date(refDate);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return targetTime >= yesterday.getTime() && targetTime <= endYesterday.getTime();
    }
    
    case 'this-week': {
      const startOfWeek = new Date(refDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day;
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return targetTime >= startOfWeek.getTime() && targetTime <= refTime;
    }
    
    case 'last-week': {
      const startOfLastWeek = new Date(refDate);
      const day = startOfLastWeek.getDay();
      const diff = startOfLastWeek.getDate() - day - 7;
      startOfLastWeek.setDate(diff);
      startOfLastWeek.setHours(0, 0, 0, 0);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(endOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      return targetTime >= startOfLastWeek.getTime() && targetTime <= endOfLastWeek.getTime();
    }
    
    case 'this-month': {
      const startOfMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 1);
      return targetTime >= startOfMonth.getTime() && targetTime <= refTime;
    }
    
    case 'last-month': {
      const startOfLastMonth = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
      const endOfLastMonth = new Date(refDate.getFullYear(), refDate.getMonth(), 0, 23, 59, 59, 999);
      return targetTime >= startOfLastMonth.getTime() && targetTime <= endOfLastMonth.getTime();
    }
    
    case 'this-year': {
      const startOfYear = new Date(refDate.getFullYear(), 0, 1);
      return targetTime >= startOfYear.getTime() && targetTime <= refTime;
    }
    
    default:
      return false;
  }
}

/**
 * Gets next occurrence of a specific time (for scheduling/reminders)
 */
export function getNextOccurrence(
  time: { hour: number; minute: number },
  fromDate: Date = new Date()
): Date {
  const nextOccurrence = new Date(fromDate);
  nextOccurrence.setHours(time.hour, time.minute, 0, 0);
  
  // If the time has already passed today, schedule for tomorrow
  if (nextOccurrence.getTime() <= fromDate.getTime()) {
    nextOccurrence.setDate(nextOccurrence.getDate() + 1);
  }
  
  return nextOccurrence;
}

/**
 * Mental health specific time formatting
 */
export function formatTherapySessionTime(
  sessionDate: Date | string | number,
  duration: number = 50
): string {
  const date = new Date(sessionDate);
  
  if (isNaN(date.getTime())) {
    return 'Invalid session time';
  }

  const endTime = new Date(date.getTime() + duration * 60 * 1000);
  
  const formatOptions: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };

  const startFormatted = date.toLocaleString('en-US', formatOptions);
  const endFormatted = endTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return `${startFormatted} - ${endFormatted} (${duration}min)`;
}

/**
 * Format crisis timeline entries
 */
export function formatCrisisTimeline(date: Date | string | number): string {
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();

  // For crisis situations, we want more precision
  if (diffMs < 60 * 1000) {
    return 'Just now - Crisis support active';
  } else if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `${minutes}m ago - Follow-up needed`;
  } else if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours}h ago - Monitor status`;
  } else {
    return `${formatTimeAgo(date)} - Review required`;
  }
}

/**
 * Helper to determine if it's an appropriate time for notifications
 */
export function isAppropriateNotificationTime(
  currentTime: Date = new Date(),
  userPreferences?: {
    quietHours?: { start: number; end: number };
    timezone?: string;
  }
): boolean {
  const hour = currentTime.getHours();
  
  // Default quiet hours: 10 PM to 7 AM
  const defaultQuietStart = userPreferences?.quietHours?.start ?? 22;
  const defaultQuietEnd = userPreferences?.quietHours?.end ?? 7;
  
  // Handle quiet hours that span midnight
  if (defaultQuietStart > defaultQuietEnd) {
    return !(hour >= defaultQuietStart || hour < defaultQuietEnd);
  } else {
    return !(hour >= defaultQuietStart && hour < defaultQuietEnd);
  }
}

/**
 * Format a timestamp for chat messages
 * @param timestamp - The timestamp to format
 * @returns Formatted timestamp string
 */
export function formatChatTimestamp(timestamp: string | Date | number): string {
  if (!timestamp) return 'Unknown';
  
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Today - show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    // Yesterday
    return 'Yesterday';
  } else if (diffDays < 7) {
    // This week - show day name
    return date.toLocaleDateString([], { weekday: 'long' });
  } else {
    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

export default formatTimeAgo;

