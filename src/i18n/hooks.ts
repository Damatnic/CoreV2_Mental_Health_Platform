/**
 * Internationalization Hooks
 * 
 * Custom hooks for i18n functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { i18n, Language } from './index';

/**
 * Hook to use translations
 */
export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(i18n.language);
  const [, forceUpdate] = useState({});

  useEffect(() => {
    const handleLanguageChange = () => {
      setLanguageState(i18n.language);
      forceUpdate({});
    };

    // Subscribe to language changes
    const unsubscribe = i18n.on('languageChanged', handleLanguageChange);
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const t = useCallback((key: string, params?: Record<string, any>) => {
    return i18n.t(key, params);
  }, []);

  const changeLanguage = useCallback((lng: Language) => {
    return i18n.changeLanguage(lng);
  }, []);

  return {
    t,
    i18n,
    language,
    changeLanguage
  };
}

/**
 * Hook to get available languages
 */
export function useLanguages() {
  return {
    languages: i18n.languages,
    currentLanguage: i18n.language
  };
}

/**
 * Hook for language detection
 */
export function useLanguageDetection() {
  useEffect(() => {
    // Detect browser language
    const browserLang = navigator.language.split('-')[0] as Language;
    
    // Check localStorage for saved preference
    const savedLang = localStorage.getItem('preferredLanguage') as Language | null;
    
    if (savedLang && i18n.languages.includes(savedLang)) {
      i18n.changeLanguage(savedLang);
    } else if (i18n.languages.includes(browserLang)) {
      i18n.changeLanguage(browserLang);
    }
  }, []);
}

/**
 * Hook for translation loading state
 */
export function useTranslationLoading() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleLoading = (loading: boolean) => {
      setIsLoading(loading);
    };

    const loadingUnsubscribe = i18n.on('loading', () => handleLoading(true));
    const loadedUnsubscribe = i18n.on('loaded', () => handleLoading(false));

    return () => {
      if (typeof loadingUnsubscribe === 'function') loadingUnsubscribe();
      if (typeof loadedUnsubscribe === 'function') loadedUnsubscribe();
    };
  }, []);

  return isLoading;
}

/**
 * Hook for formatted translations
 */
export function useFormattedTranslation() {
  const { t } = useTranslation();

  const formatDate = useCallback((date: Date, format?: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      dateStyle: format === 'short' ? 'short' : 'medium'
    }).format(date);
  }, []);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(num);
  }, []);

  const formatCurrency = useCallback((amount: number, currency = 'USD') => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency
    }).format(amount);
  }, []);

  return {
    t,
    formatDate,
    formatNumber,
    formatCurrency
  };
}



