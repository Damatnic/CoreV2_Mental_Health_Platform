/**
 * Locale Formatting Utilities
 *
 * Provides culturally-aware formatting for dates, times, numbers,
 * and other locale-specific data for the mental health platform.
 * Supports multiple languages and cultural preferences.
 *
 * @fileoverview Locale formatting utilities and cultural adaptation
 * @version 2.0.0
 * @license Apache-2.0
 */

import i18n from '../i18n';

/**
 * Locale configuration interface
 */
export interface LocaleConfig {
  dateFormat: string;
  timeFormat: '12h' | '24h';
  numberDecimal: string;
  numberThousands: string;
  currency: string;
  firstDayOfWeek: number; // 0 = Sunday, 1 = Monday
  calendar: 'gregorian' | 'lunar' | 'islamic' | 'buddhist';
  rtl: boolean; // Right-to-left text direction
}

/**
 * Date formatting options
 */
export interface DateFormatOptions {
  style?: 'full' | 'long' | 'medium' | 'short';
  includeTime?: boolean;
  relative?: boolean;
  timezone?: string;
}

/**
 * Number formatting options
 */
export interface NumberFormatOptions {
  style?: 'decimal' | 'currency' | 'percent';
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  useGrouping?: boolean;
}

/**
 * Supported locales with their specific configurations
 */
export const LOCALE_CONFIGS: Record<string, LocaleConfig> = {
  en: {
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    numberDecimal: '.',
    numberThousands: ',',
    currency: 'USD',
    firstDayOfWeek: 0, // Sunday
    calendar: 'gregorian',
    rtl: false
  },
  es: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberDecimal: ',',
    numberThousands: '.',
    currency: 'EUR',
    firstDayOfWeek: 1, // Monday
    calendar: 'gregorian',
    rtl: false
  },
  fr: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberDecimal: ',',
    numberThousands: ' ',
    currency: 'EUR',
    firstDayOfWeek: 1, // Monday
    calendar: 'gregorian',
    rtl: false
  },
  de: {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberDecimal: ',',
    numberThousands: '.',
    currency: 'EUR',
    firstDayOfWeek: 1, // Monday
    calendar: 'gregorian',
    rtl: false
  },
  ja: {
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    numberDecimal: '.',
    numberThousands: ',',
    currency: 'JPY',
    firstDayOfWeek: 0, // Sunday
    calendar: 'gregorian',
    rtl: false
  },
  ar: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberDecimal: '.',
    numberThousands: ',',
    currency: 'SAR',
    firstDayOfWeek: 6, // Saturday
    calendar: 'islamic',
    rtl: true
  },
  zh: {
    dateFormat: 'YYYY/MM/DD',
    timeFormat: '24h',
    numberDecimal: '.',
    numberThousands: ',',
    currency: 'CNY',
    firstDayOfWeek: 1, // Monday
    calendar: 'gregorian',
    rtl: false
  },
  hi: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    numberDecimal: '.',
    numberThousands: ',',
    currency: 'INR',
    firstDayOfWeek: 0, // Sunday
    calendar: 'gregorian',
    rtl: false
  },
  pt: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    numberDecimal: ',',
    numberThousands: '.',
    currency: 'BRL',
    firstDayOfWeek: 0, // Sunday
    calendar: 'gregorian',
    rtl: false
  },
  ru: {
    dateFormat: 'DD.MM.YYYY',
    timeFormat: '24h',
    numberDecimal: ',',
    numberThousands: ' ',
    currency: 'RUB',
    firstDayOfWeek: 1, // Monday
    calendar: 'gregorian',
    rtl: false
  }
};

/**
 * Mental health specific formatting configurations
 */
export const MENTAL_HEALTH_FORMATS = {
  moodScale: {
    en: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'],
    es: ['Muy Malo', 'Malo', 'Regular', 'Bueno', 'Excelente'],
    fr: ['Très Mauvais', 'Mauvais', 'Moyen', 'Bon', 'Excellent'],
    de: ['Sehr Schlecht', 'Schlecht', 'Mittel', 'Gut', 'Ausgezeichnet'],
    ja: ['とても悪い', '悪い', '普通', '良い', '素晴らしい'],
    ar: ['سيء جداً', 'سيء', 'متوسط', 'جيد', 'ممتاز'],
    zh: ['很差', '差', '一般', '好', '优秀'],
    hi: ['बहुत खराब', 'खराब', 'ठीक', 'अच्छा', 'उत्कृष्ट'],
    pt: ['Muito Ruim', 'Ruim', 'Regular', 'Bom', 'Excelente'],
    ru: ['Очень Плохо', 'Плохо', 'Средне', 'Хорошо', 'Отлично']
  },
  anxietyLevels: {
    en: ['None', 'Mild', 'Moderate', 'Severe', 'Extreme'],
    es: ['Ninguna', 'Leve', 'Moderada', 'Severa', 'Extrema'],
    fr: ['Aucune', 'Légère', 'Modérée', 'Sévère', 'Extrême'],
    de: ['Keine', 'Leicht', 'Mäßig', 'Schwer', 'Extrem'],
    ja: ['なし', '軽度', '中程度', '重度', '極度'],
    ar: ['لا شيء', 'خفيف', 'متوسط', 'شديد', 'شديد جداً'],
    zh: ['无', '轻度', '中度', '重度', '极度'],
    hi: ['कोई नहीं', 'हल्का', 'मध्यम', 'गंभीर', 'अत्यधिक'],
    pt: ['Nenhuma', 'Leve', 'Moderada', 'Severa', 'Extrema'],
    ru: ['Нет', 'Легкая', 'Умеренная', 'Тяжелая', 'Крайняя']
  }
};

/**
 * Locale Formatting Service
 */
export class LocaleFormattingService {
  private static currentLocale: string = 'en';

  /**
   * Set the current locale
   */
  public static setLocale(locale: string): void {
    if (LOCALE_CONFIGS[locale]) {
      this.currentLocale = locale;
    }
  }

  /**
   * Get the current locale
   */
  public static getCurrentLocale(): string {
    return this.currentLocale;
  }

  /**
   * Get locale configuration
   */
  public static getLocaleConfig(locale?: string): LocaleConfig {
    const targetLocale = locale || this.currentLocale;
    return LOCALE_CONFIGS[targetLocale] || LOCALE_CONFIGS.en;
  }

  /**
   * Format a date according to locale preferences
   */
  public static formatDate(
    date: Date | string | number,
    options: DateFormatOptions = {},
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    const dateObj = new Date(date);

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }

    try {
      // Handle relative dates
      if (options.relative) {
        return this.formatRelativeDate(dateObj, targetLocale);
      }

      // Use Intl.DateTimeFormat for proper localization
      const formatOptions: Intl.DateTimeFormatOptions = {
        dateStyle: options.style || 'medium',
        timeZone: options.timezone
      };

      if (options.includeTime) {
        formatOptions.timeStyle = options.style || 'short';
      }

      return new Intl.DateTimeFormat(targetLocale, formatOptions).format(dateObj);
    } catch (error) {
      // Fallback to basic formatting
      return this.basicDateFormat(dateObj, config);
    }
  }

  /**
   * Format a relative date (e.g., "2 hours ago")
   */
  public static formatRelativeDate(date: Date, locale?: string): string {
    const targetLocale = locale || this.currentLocale;
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    try {
      const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });

      if (diffDays > 0) {
        return rtf.format(-diffDays, 'day');
      } else if (diffHours > 0) {
        return rtf.format(-diffHours, 'hour');
      } else if (diffMinutes > 0) {
        return rtf.format(-diffMinutes, 'minute');
      } else {
        return rtf.format(-diffSeconds, 'second');
      }
    } catch (error) {
      // Fallback for unsupported locales
      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    }
  }

  /**
   * Format a number according to locale preferences
   */
  public static formatNumber(
    number: number,
    options: NumberFormatOptions = {},
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;

    try {
      const formatOptions: Intl.NumberFormatOptions = {
        style: options.style || 'decimal',
        minimumFractionDigits: options.minimumFractionDigits,
        maximumFractionDigits: options.maximumFractionDigits,
        useGrouping: options.useGrouping !== false
      };

      if (options.style === 'currency') {
        const config = this.getLocaleConfig(targetLocale);
        formatOptions.currency = config.currency;
      }

      return new Intl.NumberFormat(targetLocale, formatOptions).format(number);
    } catch (error) {
      // Fallback to basic number formatting
      return this.basicNumberFormat(number, this.getLocaleConfig(targetLocale));
    }
  }

  /**
   * Format currency according to locale
   */
  public static formatCurrency(
    amount: number,
    locale?: string,
    currency?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    const targetCurrency = currency || config.currency;

    return this.formatNumber(amount, {
      style: 'currency'
    }, targetLocale);
  }

  /**
   * Format percentage according to locale
   */
  public static formatPercentage(
    value: number,
    locale?: string,
    decimals: number = 1
  ): string {
    const targetLocale = locale || this.currentLocale;

    return this.formatNumber(value / 100, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }, targetLocale);
  }

  /**
   * Format mental health scale values
   */
  public static formatMoodScale(
    value: number,
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const scales = MENTAL_HEALTH_FORMATS.moodScale[targetLocale] || 
                  MENTAL_HEALTH_FORMATS.moodScale.en;
    
    const index = Math.max(0, Math.min(4, Math.floor(value) - 1));
    return scales[index] || scales[0];
  }

  /**
   * Format anxiety level
   */
  public static formatAnxietyLevel(
    value: number,
    locale?: string
  ): string {
    const targetLocale = locale || this.currentLocale;
    const levels = MENTAL_HEALTH_FORMATS.anxietyLevels[targetLocale] || 
                  MENTAL_HEALTH_FORMATS.anxietyLevels.en;
    
    const index = Math.max(0, Math.min(4, Math.floor(value)));
    return levels[index] || levels[0];
  }

  /**
   * Get text direction for locale
   */
  public static getTextDirection(locale?: string): 'ltr' | 'rtl' {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    return config.rtl ? 'rtl' : 'ltr';
  }

  /**
   * Check if locale uses right-to-left text
   */
  public static isRTL(locale?: string): boolean {
    return this.getTextDirection(locale) === 'rtl';
  }

  /**
   * Get first day of week for locale
   */
  public static getFirstDayOfWeek(locale?: string): number {
    const targetLocale = locale || this.currentLocale;
    const config = this.getLocaleConfig(targetLocale);
    return config.firstDayOfWeek;
  }

  /**
   * Get supported locales
   */
  public static getSupportedLocales(): string[] {
    return Object.keys(LOCALE_CONFIGS);
  }

  /**
   * Check if locale is supported
   */
  public static isLocaleSupported(locale: string): boolean {
    return locale in LOCALE_CONFIGS;
  }

  /**
   * Basic date formatting fallback
   */
  private static basicDateFormat(date: Date, config: LocaleConfig): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    return config.dateFormat
      .replace('DD', day)
      .replace('MM', month)
      .replace('YYYY', year);
  }

  /**
   * Basic number formatting fallback
   */
  private static basicNumberFormat(number: number, config: LocaleConfig): string {
    const parts = number.toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.numberThousands);
    const decimalPart = parts[1] ? config.numberDecimal + parts[1] : '';
    
    return integerPart + decimalPart;
  }
}

/**
 * Convenience functions for common formatting operations
 */
export const formatDate = LocaleFormattingService.formatDate.bind(LocaleFormattingService);
export const formatNumber = LocaleFormattingService.formatNumber.bind(LocaleFormattingService);
export const formatCurrency = LocaleFormattingService.formatCurrency.bind(LocaleFormattingService);
export const formatPercentage = LocaleFormattingService.formatPercentage.bind(LocaleFormattingService);
export const formatMoodScale = LocaleFormattingService.formatMoodScale.bind(LocaleFormattingService);
export const formatAnxietyLevel = LocaleFormattingService.formatAnxietyLevel.bind(LocaleFormattingService);
export const isRTL = LocaleFormattingService.isRTL.bind(LocaleFormattingService);

/**
 * Default export
 */
export default LocaleFormattingService;
