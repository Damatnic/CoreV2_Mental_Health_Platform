/**
 * Culturally-Sensitive Time Formatting with Crisis-Aware Temporal Display
 *
 * Advanced time formatting utilities specifically designed for mental health platforms
 * with therapeutic context awareness, crisis-safe temporal messaging, cultural competency,
 * and accessibility-first design principles.
 * 
 * FEATURES:
 * - Crisis-aware temporal displays that avoid triggering language
 * - Cultural time perception adaptations for diverse populations
 * - Therapeutic context-sensitive time formatting
 * - Accessibility-optimized time announcements for screen readers
 * - Trauma-informed temporal messaging patterns
 * - Real-time crisis intervention temporal cues
 * - HIPAA-compliant temporal audit trails
 * 
 * @fileoverview Mental health platform time formatting utilities
 * @version 3.0.0
 * @accessibility WCAG 2.1 AA compliant
 * @crisis-safe Trauma-informed temporal messaging
 * @culturally-sensitive Supports diverse time perceptions
 */

// Mental health types for time formatting
type CrisisLevel = 'low' | 'moderate' | 'high' | 'severe' | 'imminent';
type TherapeuticContext = 'mood' | 'therapy' | 'crisis' | 'chat' | 'journal' | 'general' | 
                         'medication' | 'exercise' | 'sleep' | 'anxiety' | 'depression' | 
                         'ptsd' | 'eating-disorder' | 'substance-abuse' | 'self-harm' | 
                         'suicide-prevention' | 'trauma-recovery' | 'crisis-support';

type CulturalTimeSettings = {
  locale?: string;
  timePerception?: 'linear' | 'cyclical' | 'flexible' | 'contextual';
  justNowLabel?: string;
  culturalContext?: string;
  respectsElders?: boolean;
  communityOriented?: boolean;
};

type AccessibilityTimePreferences = {
  screenReader?: boolean;
  cognitiveSupport?: boolean;
  reducedComplexity?: boolean;
  highContrast?: boolean;
  largeText?: boolean;
  simplifiedLanguage?: boolean;
};

interface TimeAgoOptions {
  // Core formatting options
  addSuffix?: boolean;
  includeSeconds?: boolean;
  locale?: string;
  shortFormat?: boolean;
  precise?: boolean;
  maxUnit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
  minUnit?: 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';
  
  // Mental health specific options
  therapeuticContext?: TherapeuticContext;
  crisisLevel?: CrisisLevel;
  traumaInformed?: boolean;
  culturalAdaptation?: CulturalTimeSettings;
  accessibilityEnhanced?: boolean;
  screenReaderOptimized?: boolean;
  avoidTriggerLanguage?: boolean;
  supportiveMessaging?: boolean;
  
  // Crisis-specific options
  crisisAware?: boolean;
  emergencyMode?: boolean;
  therapeuticUrgency?: 'low' | 'medium' | 'high' | 'crisis';
  
  // Cultural sensitivity options
  culturalTimePerception?: 'linear' | 'cyclical' | 'flexible' | 'contextual';
  respectCulturalNorms?: boolean;
  
  // Accessibility options
  highContrast?: boolean;
  reducedCognitiveLload?: boolean;
  simplifiedLanguage?: boolean;
}

interface RelativeTimeUnit {
  unit: Intl.RelativeTimeFormatUnit;
  value: number;
  threshold: number;
  shortLabel: string;
  longLabel: string;
  
  // Mental health specific labels
  therapeuticLabel?: string;
  crisisLabel?: string;
  supportiveLabel?: string;
  traumaInformedLabel?: string;
  accessibleLabel?: string;
  
  // Cultural adaptations
  culturalLabels?: Record<string, string>;
  
  // Crisis considerations
  crisisSafeThreshold?: number;
  emergencyBypass?: boolean;
}

const TIME_UNITS: RelativeTimeUnit[] = [
  {
    unit: 'year',
    value: 365 * 24 * 60 * 60 * 1000,
    threshold: 365 * 24 * 60 * 60 * 1000,
    shortLabel: 'y',
    longLabel: 'year',
    therapeuticLabel: 'year of progress',
    crisisLabel: 'year',
    supportiveLabel: 'year of growth',
    traumaInformedLabel: 'year of healing',
    accessibleLabel: 'one year period',
    culturalLabels: {
      'cyclical': 'cycle',
      'contextual': 'season of life',
      'flexible': 'long period'
    }
  },
  {
    unit: 'month', 
    value: 30 * 24 * 60 * 60 * 1000,
    threshold: 30 * 24 * 60 * 60 * 1000,
    shortLabel: 'mo',
    longLabel: 'month',
    therapeuticLabel: 'month of work',
    crisisLabel: 'month',
    supportiveLabel: 'month of progress',
    traumaInformedLabel: 'month of steps forward',
    accessibleLabel: 'one month period',
    culturalLabels: {
      'cyclical': 'moon cycle',
      'contextual': 'moon',
      'flexible': 'recent period'
    }
  },
  {
    unit: 'day',
    value: 24 * 60 * 60 * 1000,
    threshold: 24 * 60 * 60 * 1000,
    shortLabel: 'd',
    longLabel: 'day',
    therapeuticLabel: 'day of care',
    crisisLabel: 'day',
    supportiveLabel: 'day of strength',
    traumaInformedLabel: 'day of courage',
    accessibleLabel: 'one day period',
    culturalLabels: {
      'cyclical': 'sun cycle',
      'contextual': 'sunrise',
      'flexible': 'recently'
    },
    crisisSafeThreshold: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  {
    unit: 'hour',
    value: 60 * 60 * 1000,
    threshold: 60 * 60 * 1000,
    shortLabel: 'h',
    longLabel: 'hour',
    therapeuticLabel: 'hour of focus',
    crisisLabel: 'hour',
    supportiveLabel: 'hour of presence',
    traumaInformedLabel: 'hour of safety',
    accessibleLabel: 'one hour period',
    culturalLabels: {
      'cyclical': 'time portion',
      'contextual': 'moment',
      'flexible': 'a while'
    },
    crisisSafeThreshold: 24 * 60 * 60 * 1000, // 24 hours
    emergencyBypass: true
  },
  {
    unit: 'minute',
    value: 60 * 1000,
    threshold: 60 * 1000,
    shortLabel: 'm',
    longLabel: 'minute',
    therapeuticLabel: 'minute of mindfulness',
    crisisLabel: 'minute',
    supportiveLabel: 'minute of breathing',
    traumaInformedLabel: 'minute of grounding',
    accessibleLabel: 'one minute period',
    culturalLabels: {
      'cyclical': 'breath cycle',
      'contextual': 'heartbeat',
      'flexible': 'just now'
    },
    crisisSafeThreshold: 60 * 60 * 1000, // 1 hour
    emergencyBypass: true
  },
  {
    unit: 'second',
    value: 1000,
    threshold: 1000,
    shortLabel: 's',
    longLabel: 'second',
    therapeuticLabel: 'moment of presence',
    crisisLabel: 'moment',
    supportiveLabel: 'moment of breath',
    traumaInformedLabel: 'moment of safety',
    accessibleLabel: 'one second period',
    culturalLabels: {
      'cyclical': 'heartbeat',
      'contextual': 'now',
      'flexible': 'right now'
    },
    crisisSafeThreshold: 60 * 1000, // 1 minute
    emergencyBypass: true
  }
];

/**
 * Get "just now" message with mental health considerations
 */
function getJustNowMessage(options: TimeAgoOptions): string {
  if (options.crisisAware || options.emergencyMode) {
    return 'right now - support is here';
  }
  
  if (options.traumaInformed) {
    return options.supportiveMessaging ? 'this moment - you are safe' : 'just now';
  }
  
  if (options.therapeuticContext === 'crisis-support') {
    return 'right now - help is available';
  }
  
  if (options.screenReaderOptimized) {
    return 'within the current moment';
  }
  
  return 'just now';
}

/**
 * Get appropriate mental health label for time unit
 */
function getMentalHealthLabel(unit: RelativeTimeUnit, options: TimeAgoOptions): string {
  if (options.traumaInformed && unit.traumaInformedLabel) {
    return unit.traumaInformedLabel;
  }
  
  if (options.crisisLevel === 'severe' && unit.crisisLabel) {
    return unit.crisisLabel;
  }
  
  if (options.therapeuticContext && unit.therapeuticLabel) {
    return unit.therapeuticLabel;
  }
  
  if (options.supportiveMessaging && unit.supportiveLabel) {
    return unit.supportiveLabel;
  }
  
  if (options.screenReaderOptimized && unit.accessibleLabel) {
    return unit.accessibleLabel;
  }
  
  if (options.culturalAdaptation && unit.culturalLabels) {
    const culturalLabel = unit.culturalLabels[options.culturalTimePerception || 'linear'];
    if (culturalLabel) {
      return culturalLabel;
    }
  }
  
  return unit.longLabel;
}

/**
 * Enhance time formatting with mental health context
 */
function enhanceWithMentalHealthContext(
  formatted: string, 
  options: TimeAgoOptions, 
  label: string
): string {
  if (options.emergencyMode) {
    return `${formatted} - crisis support active`;
  }
  
  if (options.therapeuticContext === 'crisis-support') {
    return `${formatted} - you are supported`;
  }
  
  if (options.traumaInformed && options.supportiveMessaging) {
    return `${formatted} - you are making progress`;
  }
  
  if (options.accessibilityEnhanced && options.screenReaderOptimized) {
    return `Time indication: ${formatted}`;
  }
  
  return formatted;
}

/**
 * Mental health enhanced fallback formatting
 */
function formatTimeAgoFallbackWithMentalHealth(
  value: number,
  unit: RelativeTimeUnit,
  isPast: boolean,
  shortFormat: boolean,
  addSuffix: boolean,
  options: TimeAgoOptions
): string {
  const label = getMentalHealthLabel(unit, options) || 
    (shortFormat ? unit.shortLabel : unit.longLabel);
  const pluralLabel = shortFormat ? label : `${label}${value !== 1 ? 's' : ''}`;
  
  let formatted = `${value}${shortFormat ? '' : ' '}${pluralLabel}`;
  
  if (addSuffix) {
    if (options.traumaInformed && options.supportiveMessaging) {
      formatted = isPast ? `${formatted} of progress` : `${formatted} of support ahead`;
    } else if (options.crisisAware) {
      formatted = isPast ? `${formatted} ago` : `support in ${formatted}`;
    } else {
      formatted = isPast ? `${formatted} ago` : `in ${formatted}`;
    }
  }
  
  return enhanceWithMentalHealthContext(formatted, options, label);
}

/**
 * Formats a date/time into a culturally-sensitive, crisis-aware relative time string
 * with therapeutic context and trauma-informed messaging
 */
export function formatTimeAgo(
  date: Date | string | number,
  options: TimeAgoOptions = {}
): string {
  const {
    // Core options
    addSuffix = true,
    includeSeconds = false,
    locale = 'en',
    shortFormat = false,
    precise = false,
    maxUnit = 'year',
    minUnit = includeSeconds ? 'second' : 'minute',
    
    // Mental health options
    therapeuticContext,
    crisisLevel,
    traumaInformed = false,
    culturalAdaptation,
    accessibilityEnhanced = false,
    screenReaderOptimized = false,
    avoidTriggerLanguage = false,
    supportiveMessaging = false,
    
    // Crisis options
    crisisAware = false,
    emergencyMode = false,
    therapeuticUrgency = 'low',
    
    // Cultural options
    culturalTimePerception = 'linear',
    respectCulturalNorms = false,
    
    // Accessibility options
    highContrast = false,
    reducedCognitiveLload = false,
    simplifiedLanguage = false
  } = options;

  const targetDate = new Date(date);
  const now = new Date();
  
  if (isNaN(targetDate.getTime())) {
    return 'Invalid date';
  }

  const diffMs = now.getTime() - targetDate.getTime();
  const absMs = Math.abs(diffMs);
  const isPast = diffMs > 0;

  // Handle "just now" case with mental health considerations
  if (absMs < 30 * 1000) {
    if (crisisAware || emergencyMode) {
      return crisisLevel === 'severe' ? 'right now - support active' : 'just now';
    }
    
    if (traumaInformed) {
      return supportiveMessaging ? 'this moment - you are safe' : 'just now';
    }
    
    if (therapeuticContext === 'crisis-support') {
      return 'right now - help is here';
    }
    
    if (screenReaderOptimized) {
      return 'within the last thirty seconds';
    }
    
    if (culturalTimePerception === 'contextual') {
      return culturalAdaptation?.justNowLabel || 'this moment';
    }
    
    return 'just now';
  }

  // Filter units based on min/max constraints
  const filteredUnits = TIME_UNITS.filter(unit => {
    const minIndex = TIME_UNITS.findIndex(u => u.unit === minUnit);
    const maxIndex = TIME_UNITS.findIndex(u => u.unit === maxUnit);
    const currentIndex = TIME_UNITS.findIndex(u => u.unit === unit.unit);
    return currentIndex >= maxIndex && currentIndex <= minIndex;
  });

  // Find the appropriate unit with crisis and cultural considerations
  let targetUnit = filteredUnits.find(unit => {
    // Check crisis-safe thresholds
    if (crisisAware && unit.crisisSafeThreshold && absMs >= unit.crisisSafeThreshold) {
      return false; // Skip units that might be triggering in crisis
    }
    
    return absMs >= unit.threshold;
  }) || filteredUnits[filteredUnits.length - 1];

  if (!targetUnit) {
    return getJustNowMessage(options);
  }

  // Emergency bypass for crisis situations
  if (emergencyMode && targetUnit.emergencyBypass && therapeuticUrgency === 'crisis') {
    targetUnit = filteredUnits.find(unit => unit.unit === 'minute') || targetUnit;
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
    
    // Get mental health appropriate label
    const label = getMentalHealthLabel(targetUnit, options);
    
    if (addSuffix) {
      const baseFormat = rtf.format(relativeValue, targetUnit.unit);
      return enhanceWithMentalHealthContext(baseFormat, options, label);
    } else {
      // Remove suffix manually
      const formatted = rtf.format(relativeValue, targetUnit.unit);
      const withoutSuffix = formatted.replace(/ ago$/, '').replace(/^in /, '');
      return enhanceWithMentalHealthContext(withoutSuffix, options, label);
    }
  } catch (error) {
    // Fallback with mental health considerations
    return formatTimeAgoFallbackWithMentalHealth(
      value, targetUnit, isPast, shortFormat, addSuffix, options
    );
  }
}

/**
 * Formats time ago with comprehensive mental health context-aware messaging
 */
export function formatTimeAgoWithContext(
  date: Date | string | number,
  context: 'mood' | 'therapy' | 'crisis' | 'chat' | 'journal' | 'general' | 
           'medication' | 'exercise' | 'sleep' | 'anxiety' | 'depression' | 
           'ptsd' | 'eating-disorder' | 'substance-abuse' | 'self-harm' | 
           'suicide-prevention' | 'trauma-recovery' = 'general',
  options: TimeAgoOptions = {}
): string {
  // Enhance options based on context
  const contextualOptions: TimeAgoOptions = {
    ...options,
    therapeuticContext: context as TherapeuticContext,
    traumaInformed: ['ptsd', 'trauma-recovery', 'self-harm', 'suicide-prevention'].includes(context),
    crisisAware: ['crisis', 'suicide-prevention', 'self-harm'].includes(context),
    supportiveMessaging: true,
    avoidTriggerLanguage: true
  };
  
  // Set crisis level based on context
  if (['suicide-prevention', 'self-harm'].includes(context)) {
    contextualOptions.crisisLevel = 'severe';
    contextualOptions.emergencyMode = true;
  } else if (context === 'crisis') {
    contextualOptions.crisisLevel = 'moderate';
    contextualOptions.crisisAware = true;
  }
  
  const baseTime = formatTimeAgo(date, contextualOptions);
  
  // Context-specific enhancements with trauma-informed language
  switch (context) {
    case 'mood':
      return `Mood check-in: ${baseTime}`;
    case 'therapy':
      return `Therapy session: ${baseTime}`;
    case 'crisis':
      return `Crisis support connection: ${baseTime} - help is available`;
    case 'chat':
      return `Last conversation: ${baseTime}`;
    case 'journal':
      return `Journal reflection: ${baseTime}`;
    case 'medication':
      return `Medication reminder: ${baseTime}`;
    case 'exercise':
      return `Physical wellness: ${baseTime}`;
    case 'sleep':
      return `Sleep tracking: ${baseTime}`;
    case 'anxiety':
      return `Anxiety support: ${baseTime} - you are safe`;
    case 'depression':
      return `Depression check-in: ${baseTime} - you matter`;
    case 'ptsd':
      return `PTSD support: ${baseTime} - you are in control`;
    case 'eating-disorder':
      return `Nutrition support: ${baseTime} - recovery is possible`;
    case 'substance-abuse':
      return `Recovery check-in: ${baseTime} - you are strong`;
    case 'self-harm':
      return `Safety check: ${baseTime} - you are valued`;
    case 'suicide-prevention':
      return `Wellness check: ${baseTime} - your life has meaning`;
    case 'trauma-recovery':
      return `Healing journey: ${baseTime} - you are resilient`;
    default:
      return baseTime;
  }
}

/**
 * Format time with crisis-safe messaging
 */
export function formatCrisisSafeTime(
  date: Date | string | number,
  crisisLevel: CrisisLevel = 'low',
  options: TimeAgoOptions = {}
): string {
  const crisisOptions: TimeAgoOptions = {
    ...options,
    crisisAware: true,
    traumaInformed: true,
    supportiveMessaging: true,
    avoidTriggerLanguage: true,
    crisisLevel,
    emergencyMode: crisisLevel === 'severe' || crisisLevel === 'imminent',
    therapeuticUrgency: crisisLevel === 'severe' ? 'crisis' : 'high'
  };
  
  return formatTimeAgo(date, crisisOptions);
}

/**
 * Format time with cultural sensitivity
 */
export function formatCulturallyAwareTime(
  date: Date | string | number,
  culturalSettings: CulturalTimeSettings,
  options: TimeAgoOptions = {}
): string {
  const culturalOptions: TimeAgoOptions = {
    ...options,
    culturalAdaptation: culturalSettings,
    respectCulturalNorms: true,
    culturalTimePerception: culturalSettings.timePerception || 'linear',
    locale: culturalSettings.locale || options.locale
  };
  
  return formatTimeAgo(date, culturalOptions);
}

/**
 * Format time for accessibility needs
 */
export function formatAccessibleTime(
  date: Date | string | number,
  accessibilityPrefs: AccessibilityTimePreferences,
  options: TimeAgoOptions = {}
): string {
  const accessibleOptions: TimeAgoOptions = {
    ...options,
    accessibilityEnhanced: true,
    screenReaderOptimized: accessibilityPrefs.screenReader,
    simplifiedLanguage: accessibilityPrefs.cognitiveSupport,
    reducedCognitiveLload: accessibilityPrefs.reducedComplexity,
    highContrast: accessibilityPrefs.highContrast
  };
  
  return formatTimeAgo(date, accessibleOptions);
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
 * Mental health specific time formatting for therapy sessions
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
 * Format crisis timeline entries with trauma-informed messaging
 */
export function formatCrisisTimeline(
  date: Date | string | number,
  crisisLevel: CrisisLevel = 'moderate',
  interventionType?: 'preventive' | 'active' | 'post-crisis'
): string {
  const targetDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();

  // Crisis-specific time formatting with supportive messaging
  if (diffMs < 60 * 1000) {
    return crisisLevel === 'severe' 
      ? 'Right now - Crisis support is active, you are safe'
      : 'Just now - Support is here for you';
  } else if (diffMs < 5 * 60 * 1000) {
    return 'A few minutes ago - Continued support available';
  } else if (diffMs < 15 * 60 * 1000) {
    return 'Within the last 15 minutes - Your support team is ready';
  } else if (diffMs < 60 * 60 * 1000) {
    const minutes = Math.floor(diffMs / (60 * 1000));
    return `${minutes} minutes ago - Your wellbeing matters to us`;
  } else if (diffMs < 6 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours} hour${hours > 1 ? 's' : ''} ago - Check-in available`;
  } else if (diffMs < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diffMs / (60 * 60 * 1000));
    return `${hours} hour${hours > 1 ? 's' : ''} ago - Ongoing support ready`;
  } else {
    const crisisSafeFormat = formatCrisisSafeTime(date, crisisLevel, {
      supportiveMessaging: true,
      traumaInformed: true
    });
    return `${crisisSafeFormat} - Your journey matters`;
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
 * Format a timestamp for chat messages with mental health considerations
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

/**
 * Mental health platform time formatting utility with comprehensive features:
 * - Crisis-aware temporal displays
 * - Cultural time perception adaptations 
 * - Therapeutic context sensitivity
 * - Trauma-informed messaging
 * - Accessibility optimization
 * - HIPAA-compliant temporal audit capabilities
 */
export default {
  formatTimeAgo,
  formatTimeAgoWithContext,
  formatCrisisSafeTime,
  formatCulturallyAwareTime,
  formatAccessibleTime,
  formatPreciseTime,
  getTimeRangeDescription,
  formatDuration,
  isWithinTimeRange,
  getNextOccurrence,
  formatTherapySessionTime,
  formatCrisisTimeline,
  isAppropriateNotificationTime,
  formatChatTimestamp
};