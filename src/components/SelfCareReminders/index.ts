/**
 * Self Care Reminders Components
 * 
 * Self-contained module for self-care reminder and wellness tracking features
 */

// Core interfaces and types
export interface SelfCareActivity {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'physical' | 'mental' | 'social' | 'spiritual' | 'practical';
  frequency: 'daily' | 'weekly' | 'monthly';
  lastCompleted?: string;
  streak?: number;
  isCompleted?: boolean;
  completionHistory?: string[];
}

export interface Reminder {
  id: string;
  activityId: string;
  time: string;
  days: string[];
  enabled: boolean;
  title: string;
  description?: string;
  sound?: boolean;
  vibration?: boolean;
}

export interface SelfCareRemindersProps {
  activities?: SelfCareActivity[];
  reminders?: Reminder[];
  onActivityComplete?: (activityId: string) => void;
  onReminderCreate?: (reminder: Reminder) => void;
  onReminderUpdate?: (reminder: Reminder) => void;
  onReminderDelete?: (reminderId: string) => void;
  className?: string;
  showProgress?: boolean;
  allowCustomActivities?: boolean;
}

// Constants
export const SELF_CARE_CATEGORIES = [
  'physical',
  'mental', 
  'social',
  'spiritual',
  'practical'
] as const;

export const FREQUENCY_OPTIONS = [
  'daily',
  'weekly', 
  'monthly'
] as const;

export const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
] as const;

export type SelfCareCategory = typeof SELF_CARE_CATEGORIES[number];
export type FrequencyOption = typeof FREQUENCY_OPTIONS[number];
export type DayOfWeek = typeof DAYS_OF_WEEK[number];

// Default self-care activities
export const DEFAULT_ACTIVITIES: SelfCareActivity[] = [
  {
    id: 'meditation',
    title: 'Meditation',
    description: 'Take 10 minutes to practice mindfulness and breathing exercises',
    icon: '🧘',
    category: 'mental',
    frequency: 'daily',
    streak: 0,
    completionHistory: []
  },
  {
    id: 'exercise',
    title: 'Physical Exercise',
    description: 'Get your body moving for at least 30 minutes',
    icon: '🏃',
    category: 'physical',
    frequency: 'daily',
    streak: 0,
    completionHistory: []
  },
  {
    id: 'journaling',
    title: 'Journaling',
    description: 'Write down your thoughts, feelings, and reflections',
    icon: '📝',
    category: 'mental',
    frequency: 'daily',
    streak: 0,
    completionHistory: []
  },
  {
    id: 'social-connection',
    title: 'Social Connection',
    description: 'Reach out to a friend, family member, or loved one',
    icon: '👥',
    category: 'social',
    frequency: 'weekly',
    streak: 0,
    completionHistory: []
  },
  {
    id: 'gratitude-practice',
    title: 'Gratitude Practice',
    description: 'List three things you are grateful for today',
    icon: '🙏',
    category: 'spiritual',
    frequency: 'daily',
    streak: 0,
    completionHistory: []
  },
  {
    id: 'healthy-meal',
    title: 'Healthy Meal',
    description: 'Prepare and enjoy a nutritious, balanced meal',
    icon: '🥗',
    category: 'practical',
    frequency: 'daily',
    streak: 0,
    completionHistory: []
  }
];

// Default reminders
export const DEFAULT_REMINDERS: Reminder[] = [
  {
    id: 'morning-meditation',
    activityId: 'meditation',
    time: '08:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    enabled: true,
    title: 'Morning Meditation',
    description: 'Start your day with mindfulness',
    sound: true,
    vibration: true
  },
  {
    id: 'evening-journal',
    activityId: 'journaling',
    time: '20:00',
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    enabled: true,
    title: 'Evening Journaling',
    description: 'Reflect on your day',
    sound: true,
    vibration: false
  }
];

// Utility functions
export const getCategoryIcon = (category: SelfCareCategory): string => {
  const icons: Record<SelfCareCategory, string> = {
    physical: '💪',
    mental: '🧠',
    social: '👥',
    spiritual: '🙏',
    practical: '🛠️'
  };
  return icons[category] || '📋';
};

export const getCategoryColor = (category: SelfCareCategory): string => {
  const colors: Record<SelfCareCategory, string> = {
    physical: '#e74c3c',
    mental: '#3498db',
    social: '#f39c12',
    spiritual: '#9b59b6',
    practical: '#2ecc71'
  };
  return colors[category] || '#95a5a6';
};

export const getFrequencyText = (frequency: FrequencyOption): string => {
  const texts: Record<FrequencyOption, string> = {
    daily: 'Every day',
    weekly: 'Once a week',
    monthly: 'Once a month'
  };
  return texts[frequency] || frequency;
};

export const formatDayOfWeek = (day: string): string => {
  return day.charAt(0).toUpperCase() + day.slice(1);
};

export const calculateStreak = (activity: SelfCareActivity): number => {
  if (!activity.completionHistory || activity.completionHistory.length === 0) {
    return 0;
  }

  const sortedHistory = activity.completionHistory
    .map(date => new Date(date))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const now = new Date();
  
  for (let i = 0; i < sortedHistory.length; i++) {
    const completionDate = sortedHistory[i];
    const daysDiff = Math.floor((now.getTime() - completionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    let expectedInterval: number;
    switch (activity.frequency) {
      case 'daily':
        expectedInterval = 1;
        break;
      case 'weekly':
        expectedInterval = 7;
        break;
      case 'monthly':
        expectedInterval = 30;
        break;
      default:
        expectedInterval = 1;
    }
    
    if (daysDiff <= expectedInterval * (i + 1)) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
};

export const isActivityDueToday = (activity: SelfCareActivity): boolean => {
  if (!activity.lastCompleted) {
    return true;
  }

  const lastCompleted = new Date(activity.lastCompleted);
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - lastCompleted.getTime()) / (1000 * 60 * 60 * 24));

  switch (activity.frequency) {
    case 'daily':
      return daysDiff >= 1;
    case 'weekly':
      return daysDiff >= 7;
    case 'monthly':
      return daysDiff >= 30;
    default:
      return false;
  }
};

export const getActivityProgress = (activity: SelfCareActivity): number => {
  if (!activity.completionHistory || activity.completionHistory.length === 0) {
    return 0;
  }

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentCompletions = activity.completionHistory.filter(
    date => new Date(date) >= thirtyDaysAgo
  );

  let expectedCompletions: number;
  switch (activity.frequency) {
    case 'daily':
      expectedCompletions = 30;
      break;
    case 'weekly':
      expectedCompletions = 4;
      break;
    case 'monthly':
      expectedCompletions = 1;
      break;
    default:
      expectedCompletions = 1;
  }

  return Math.min((recentCompletions.length / expectedCompletions) * 100, 100);
};

export const completeActivity = (activity: SelfCareActivity): SelfCareActivity => {
  const now = new Date().toISOString();
  const updatedHistory = [...(activity.completionHistory || []), now];
  
  return {
    ...activity,
    lastCompleted: now,
    isCompleted: true,
    completionHistory: updatedHistory,
    streak: calculateStreak({
      ...activity,
      completionHistory: updatedHistory
    })
  };
};

export const createReminder = (
  activityId: string,
  time: string,
  days: DayOfWeek[],
  title: string,
  description?: string
): Reminder => {
  return {
    id: `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    activityId,
    time,
    days,
    enabled: true,
    title,
    description,
    sound: true,
    vibration: true
  };
};

export const validateReminder = (reminder: Partial<Reminder>): string[] => {
  const errors: string[] = [];

  if (!reminder.activityId) {
    errors.push('Activity ID is required');
  }

  if (!reminder.time) {
    errors.push('Time is required');
  } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(reminder.time)) {
    errors.push('Time must be in HH:MM format');
  }

  if (!reminder.days || reminder.days.length === 0) {
    errors.push('At least one day must be selected');
  }

  if (!reminder.title || reminder.title.trim().length === 0) {
    errors.push('Title is required');
  }

  return errors;
};

// Export a mock component function for compatibility
export const SelfCareReminders = {
  displayName: 'SelfCareReminders',
  defaultProps: {
    activities: DEFAULT_ACTIVITIES,
    reminders: DEFAULT_REMINDERS,
    showProgress: true,
    allowCustomActivities: true
  }
};

// Default export
export default SelfCareReminders;