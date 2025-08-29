/**
 * Enhanced Translation Service for Mental Health Platform
 * Provides comprehensive multilingual support with RTL, localization, and crisis resource management
 */

import { SUPPORTED_LOCALES, LANGUAGE_CONFIG, SupportedLocale } from '../i18n/index';

export interface TranslationConfig {
  locale: SupportedLocale;
  fallbackLocale: SupportedLocale;
  rtl: boolean;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
  currencyFormat: string;
}

export interface CrisisResource {
  hotline: string;
  textLine: string;
  website: string;
  hours: string;
  description: string;
  languages: string[];
}

export interface LocalizedCrisisResources {
  [locale: string]: {
    emergency: string;
    national: CrisisResource[];
    local?: CrisisResource[];
    international: CrisisResource[];
  };
}

// Crisis resources by language and region
const CRISIS_RESOURCES: LocalizedCrisisResources = {
  en: {
    emergency: '911',
    national: [
      {
        hotline: '988',
        textLine: 'Text HOME to 741741',
        website: 'https://988lifeline.org',
        hours: '24/7',
        description: 'Suicide & Crisis Lifeline',
        languages: ['English', 'Spanish']
      },
      {
        hotline: '1-800-273-8255',
        textLine: 'Text HELLO to 741741',
        website: 'https://www.crisistextline.org',
        hours: '24/7',
        description: 'Crisis Text Line',
        languages: ['English']
      }
    ],
    international: [
      {
        hotline: 'International Association for Suicide Prevention',
        textLine: '',
        website: 'https://www.iasp.info/resources/Crisis_Centres',
        hours: 'Varies by country',
        description: 'Global crisis center directory',
        languages: ['Multiple']
      }
    ]
  },
  es: {
    emergency: '911',
    national: [
      {
        hotline: '988',
        textLine: 'Envía AYUDA al 741741',
        website: 'https://988lifeline.org/es',
        hours: '24/7',
        description: 'Línea de Prevención del Suicidio y Crisis',
        languages: ['Español', 'Inglés']
      },
      {
        hotline: '1-888-628-9454',
        textLine: 'Envía HOLA al 741741',
        website: 'https://espanol.crisistextline.org',
        hours: '24/7',
        description: 'Línea de Crisis por Mensaje de Texto',
        languages: ['Español']
      }
    ],
    international: [
      {
        hotline: 'Asociación Internacional para la Prevención del Suicidio',
        textLine: '',
        website: 'https://www.iasp.info/resources/Crisis_Centres',
        hours: 'Varía por país',
        description: 'Directorio global de centros de crisis',
        languages: ['Múltiples']
      }
    ]
  },
  zh: {
    emergency: '911',
    national: [
      {
        hotline: '988',
        textLine: '发送 HOME 至 741741',
        website: 'https://988lifeline.org',
        hours: '24/7',
        description: '自杀与危机生命线',
        languages: ['英语', '西班牙语', '中文']
      },
      {
        hotline: '1-877-990-8585',
        textLine: '',
        website: 'https://www.asianmhc.org',
        hours: '周一至周五 9AM-5PM PST',
        description: '亚裔心理健康中心',
        languages: ['中文', '粤语', '普通话', '英语']
      }
    ],
    international: [
      {
        hotline: '北京心理危机干预热线',
        textLine: '',
        website: '',
        hours: '24/7',
        description: '010-82951332',
        languages: ['中文']
      },
      {
        hotline: '香港撒玛利亚防止自杀会',
        textLine: '',
        website: 'https://www.sbhk.org.hk',
        hours: '24/7',
        description: '2389 2222',
        languages: ['粤语', '普通话', '英语']
      }
    ]
  },
  ar: {
    emergency: '911',
    national: [
      {
        hotline: '988',
        textLine: 'أرسل HOME إلى 741741',
        website: 'https://988lifeline.org',
        hours: '24/7',
        description: 'خط الحياة للأزمات والانتحار',
        languages: ['الإنجليزية', 'الإسبانية']
      },
      {
        hotline: '1-888-432-4453',
        textLine: '',
        website: 'https://www.aahicrisis.org',
        hours: '24/7',
        description: 'الخط الساخن للأزمات العربية الأمريكية',
        languages: ['العربية', 'الإنجليزية']
      }
    ],
    international: [
      {
        hotline: 'خط المساعدة النفسية - الإمارات',
        textLine: '',
        website: '',
        hours: '24/7',
        description: '800-4673',
        languages: ['العربية', 'الإنجليزية']
      },
      {
        hotline: 'مركز الاستشارات النفسية - السعودية',
        textLine: '',
        website: '',
        hours: '24/7',
        description: '920033360',
        languages: ['العربية']
      }
    ]
  }
};

class TranslationService {
  private currentLocale: SupportedLocale = 'en';
  private fallbackLocale: SupportedLocale = 'en';
  private translations: Map<string, any> = new Map();
  private listeners: Set<(locale: SupportedLocale) => void> = new Set();

  constructor() {
    this.initializeLocale();
    this.loadTranslations();
  }

  /**
   * Initialize locale from stored preference or browser settings
   */
  private initializeLocale(): void {
    if (typeof window === 'undefined') return;

    // Check stored preference
    const storedLocale = localStorage.getItem('preferredLocale') as SupportedLocale;
    if (storedLocale && SUPPORTED_LOCALES.includes(storedLocale)) {
      this.currentLocale = storedLocale;
      return;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0] as SupportedLocale;
    if (SUPPORTED_LOCALES.includes(browserLang)) {
      this.currentLocale = browserLang;
    }
  }

  /**
   * Load translations for all supported locales
   */
  private async loadTranslations(): Promise<void> {
    for (const locale of SUPPORTED_LOCALES) {
      try {
        // Load common translations
        const commonModule = await import(`../i18n/locales/${locale}/common.json`);
        const crisisModule = await import(`../i18n/locales/${locale}/crisis.json`);
        
        this.translations.set(locale, {
          common: commonModule.default || commonModule,
          crisis: crisisModule.default || crisisModule
        });
      } catch (error) {
        console.warn(`Failed to load translations for ${locale}`, error);
        // Fallback translations will be used
      }
    }
  }

  /**
   * Get current locale
   */
  public getCurrentLocale(): SupportedLocale {
    return this.currentLocale;
  }

  /**
   * Set current locale with RTL support
   */
  public async setLocale(locale: SupportedLocale): Promise<void> {
    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.warn(`Unsupported locale: ${locale}`);
      return;
    }

    this.currentLocale = locale;
    
    // Store preference
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', locale);
      
      // Update document attributes for RTL support
      const config = LANGUAGE_CONFIG[locale];
      document.documentElement.lang = locale;
      document.documentElement.dir = config.rtl ? 'rtl' : 'ltr';
      
      // Add RTL class for CSS styling
      if (config.rtl) {
        document.body.classList.add('rtl');
      } else {
        document.body.classList.remove('rtl');
      }
    }

    // Notify listeners
    this.listeners.forEach(listener => listener(locale));
  }

  /**
   * Subscribe to locale changes
   */
  public onLocaleChange(callback: (locale: SupportedLocale) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get translation for a key
   */
  public translate(key: string, params?: Record<string, any>): string {
    const keys = key.split('.');
    let translation = this.translations.get(this.currentLocale);
    
    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }

    // Fallback to English if not found
    if (!translation && this.currentLocale !== this.fallbackLocale) {
      translation = this.translations.get(this.fallbackLocale);
      for (const k of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k];
        } else {
          translation = undefined;
          break;
        }
      }
    }

    // Return key if no translation found
    if (!translation || typeof translation !== 'string') {
      return key;
    }

    // Replace parameters
    let result = translation;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), String(value));
      });
    }

    return result;
  }

  /**
   * Format date according to locale
   */
  public formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const config = LANGUAGE_CONFIG[this.currentLocale];
    
    return new Intl.DateTimeFormat(this.currentLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      ...options
    }).format(dateObj);
  }

  /**
   * Format time according to locale
   */
  public formatTime(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    
    return new Intl.DateTimeFormat(this.currentLocale, {
      hour: '2-digit',
      minute: '2-digit',
      ...options
    }).format(dateObj);
  }

  /**
   * Format number according to locale
   */
  public formatNumber(number: number, options?: Intl.NumberFormatOptions): string {
    const config = LANGUAGE_CONFIG[this.currentLocale];
    return new Intl.NumberFormat(this.currentLocale, {
      ...config.numberFormat,
      ...options
    }).format(number);
  }

  /**
   * Format currency according to locale
   */
  public formatCurrency(amount: number, currency = 'USD'): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'currency',
      currency
    }).format(amount);
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  public formatRelativeTime(date: Date | string | number): string {
    const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

    const rtf = new Intl.RelativeTimeFormat(this.currentLocale, { numeric: 'auto' });

    if (Math.abs(diffInSeconds) < 60) {
      return rtf.format(-diffInSeconds, 'second');
    } else if (Math.abs(diffInSeconds) < 3600) {
      return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
    } else if (Math.abs(diffInSeconds) < 86400) {
      return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
    } else if (Math.abs(diffInSeconds) < 2592000) {
      return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
    } else if (Math.abs(diffInSeconds) < 31536000) {
      return rtf.format(-Math.floor(diffInSeconds / 2592000), 'month');
    } else {
      return rtf.format(-Math.floor(diffInSeconds / 31536000), 'year');
    }
  }

  /**
   * Get crisis resources for current locale
   */
  public getCrisisResources(): typeof CRISIS_RESOURCES[SupportedLocale] {
    return CRISIS_RESOURCES[this.currentLocale] || CRISIS_RESOURCES.en;
  }

  /**
   * Get culturally appropriate mental health terminology
   */
  public getMentalHealthTerms(): Record<string, string> {
    const terms: Record<string, Record<string, string>> = {
      en: {
        anxiety: 'Anxiety',
        depression: 'Depression',
        stress: 'Stress',
        trauma: 'Trauma',
        therapy: 'Therapy',
        counseling: 'Counseling',
        mindfulness: 'Mindfulness',
        selfCare: 'Self-Care',
        support: 'Support',
        recovery: 'Recovery'
      },
      es: {
        anxiety: 'Ansiedad',
        depression: 'Depresión',
        stress: 'Estrés',
        trauma: 'Trauma',
        therapy: 'Terapia',
        counseling: 'Consejería',
        mindfulness: 'Atención Plena',
        selfCare: 'Autocuidado',
        support: 'Apoyo',
        recovery: 'Recuperación'
      },
      zh: {
        anxiety: '焦虑',
        depression: '抑郁',
        stress: '压力',
        trauma: '创伤',
        therapy: '治疗',
        counseling: '咨询',
        mindfulness: '正念',
        selfCare: '自我照顾',
        support: '支持',
        recovery: '康复'
      },
      ar: {
        anxiety: 'القلق',
        depression: 'الاكتئاب',
        stress: 'الضغط النفسي',
        trauma: 'الصدمة',
        therapy: 'العلاج',
        counseling: 'الإرشاد',
        mindfulness: 'اليقظة الذهنية',
        selfCare: 'الرعاية الذاتية',
        support: 'الدعم',
        recovery: 'التعافي'
      }
    };

    return terms[this.currentLocale] || terms.en;
  }

  /**
   * Check if current locale is RTL
   */
  public isRTL(): boolean {
    return LANGUAGE_CONFIG[this.currentLocale]?.rtl || false;
  }

  /**
   * Get language configuration
   */
  public getLanguageConfig(): typeof LANGUAGE_CONFIG[SupportedLocale] {
    return LANGUAGE_CONFIG[this.currentLocale];
  }

  /**
   * Pluralization helper
   */
  public pluralize(key: string, count: number, params?: Record<string, any>): string {
    const pluralKey = count === 1 ? `${key}_one` : `${key}_other`;
    let translation = this.translate(pluralKey, { count, ...params });
    
    // Fallback to base key if plural form not found
    if (translation === pluralKey) {
      translation = this.translate(key, { count, ...params });
    }
    
    return translation;
  }

  /**
   * Get all available locales with their configurations
   */
  public getAvailableLocales(): Array<{
    code: SupportedLocale;
    name: string;
    nativeName: string;
    rtl: boolean;
  }> {
    return SUPPORTED_LOCALES.map(locale => ({
      code: locale,
      name: LANGUAGE_CONFIG[locale].name,
      nativeName: LANGUAGE_CONFIG[locale].nativeName,
      rtl: LANGUAGE_CONFIG[locale].rtl || false
    }));
  }

  /**
   * Format percentage according to locale
   */
  public formatPercent(value: number, decimals = 0): string {
    return new Intl.NumberFormat(this.currentLocale, {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  }

  /**
   * Get text direction for current locale
   */
  public getTextDirection(): 'ltr' | 'rtl' {
    return this.isRTL() ? 'rtl' : 'ltr';
  }

  /**
   * Get calendar system for current locale
   */
  public getCalendarSystem(): string {
    const calendarSystems: Record<string, string> = {
      ar: 'islamic-civil',
      zh: 'chinese',
      ja: 'japanese',
      ko: 'korean'
    };
    
    return calendarSystems[this.currentLocale] || 'gregory';
  }

  /**
   * Format list according to locale (e.g., "A, B, and C")
   */
  public formatList(items: string[], type: 'conjunction' | 'disjunction' = 'conjunction'): string {
    if (typeof Intl.ListFormat !== 'undefined') {
      return new Intl.ListFormat(this.currentLocale, { type }).format(items);
    }
    
    // Fallback for browsers without ListFormat support
    if (items.length === 0) return '';
    if (items.length === 1) return items[0];
    if (items.length === 2) {
      return type === 'conjunction' 
        ? `${items[0]} and ${items[1]}`
        : `${items[0]} or ${items[1]}`;
    }
    
    const lastItem = items[items.length - 1];
    const rest = items.slice(0, -1);
    const connector = type === 'conjunction' ? 'and' : 'or';
    return `${rest.join(', ')}, ${connector} ${lastItem}`;
  }
}

// Create singleton instance
export const translationService = new TranslationService();

// React hook for using translation service
export const useTranslationService = () => {
  const [locale, setLocaleState] = React.useState(translationService.getCurrentLocale());
  
  React.useEffect(() => {
    const unsubscribe = translationService.onLocaleChange((newLocale) => {
      setLocaleState(newLocale);
    });
    
    return unsubscribe;
  }, []);
  
  return {
    locale,
    setLocale: (locale: SupportedLocale) => translationService.setLocale(locale),
    t: (key: string, params?: Record<string, any>) => translationService.translate(key, params),
    formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => 
      translationService.formatDate(date, options),
    formatTime: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => 
      translationService.formatTime(date, options),
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => 
      translationService.formatNumber(number, options),
    formatCurrency: (amount: number, currency?: string) => 
      translationService.formatCurrency(amount, currency),
    formatRelativeTime: (date: Date | string | number) => 
      translationService.formatRelativeTime(date),
    formatPercent: (value: number, decimals?: number) =>
      translationService.formatPercent(value, decimals),
    formatList: (items: string[], type?: 'conjunction' | 'disjunction') =>
      translationService.formatList(items, type),
    getCrisisResources: () => translationService.getCrisisResources(),
    getMentalHealthTerms: () => translationService.getMentalHealthTerms(),
    isRTL: () => translationService.isRTL(),
    getTextDirection: () => translationService.getTextDirection(),
    pluralize: (key: string, count: number, params?: Record<string, any>) =>
      translationService.pluralize(key, count, params),
    getAvailableLocales: () => translationService.getAvailableLocales()
  };
};

// Export React for hook
import * as React from 'react';

export default translationService;