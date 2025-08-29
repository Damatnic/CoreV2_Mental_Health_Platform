// Internationalization (i18n) Configuration for Mental Health Platform
import { createI18n } from 'vue-i18n';
import { ref, computed } from 'vue';

// Supported languages
export const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'zh', 'ja', 'ko', 'ar'] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

// Default locale
export const DEFAULT_LOCALE: SupportedLocale = 'en';

// Browser locale detection
export const getBrowserLocale = (): SupportedLocale => {
  const browserLocale = navigator.language.split('-')[0] as SupportedLocale;
  return SUPPORTED_LOCALES.includes(browserLocale) ? browserLocale : DEFAULT_LOCALE;
};

// Stored locale management
export const getStoredLocale = (): SupportedLocale => {
  const stored = localStorage.getItem('preferredLocale') as SupportedLocale;
  return stored && SUPPORTED_LOCALES.includes(stored) ? stored : getBrowserLocale();
};

export const setStoredLocale = (locale: SupportedLocale): void => {
  localStorage.setItem('preferredLocale', locale);
};

// Language configurations
export const LANGUAGE_CONFIG: Record<SupportedLocale, {
  name: string;
  nativeName: string;
  flag: string;
  rtl: boolean;
  dateFormat: string;
  numberFormat: Intl.NumberFormatOptions;
}> = {
  en: {
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸',
    rtl: false,
    dateFormat: 'MM/dd/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  es: {
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  fr: {
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  de: {
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
    rtl: false,
    dateFormat: 'dd.MM.yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  it: {
    name: 'Italian',
    nativeName: 'Italiano',
    flag: '🇮🇹',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  pt: {
    name: 'Portuguese',
    nativeName: 'Português',
    flag: '🇵🇹',
    rtl: false,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  zh: {
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    rtl: false,
    dateFormat: 'yyyy/MM/dd',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  ja: {
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
    rtl: false,
    dateFormat: 'yyyy/MM/dd',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  ko: {
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
    rtl: false,
    dateFormat: 'yyyy/MM/dd',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  },
  ar: {
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    rtl: true,
    dateFormat: 'dd/MM/yyyy',
    numberFormat: { style: 'decimal', minimumFractionDigits: 0 }
  }
};

// Translation messages - Core application strings
const messages = {
  en: {
    // Navigation
    nav: {
      home: 'Home',
      dashboard: 'Dashboard',
      chat: 'Chat',
      therapy: 'Therapy',
      wellness: 'Wellness',
      crisis: 'Crisis Support',
      profile: 'Profile',
      settings: 'Settings',
      help: 'Help',
      signOut: 'Sign Out'
    },
    
    // Common UI elements
    common: {
      save: 'Save',
      cancel: 'Cancel',
      delete: 'Delete',
      edit: 'Edit',
      close: 'Close',
      continue: 'Continue',
      back: 'Back',
      next: 'Next',
      finish: 'Finish',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      warning: 'Warning',
      info: 'Information',
      confirm: 'Confirm',
      yes: 'Yes',
      no: 'No',
      ok: 'OK',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      refresh: 'Refresh',
      retry: 'Retry'
    },

    // Authentication
    auth: {
      signIn: 'Sign In',
      signUp: 'Sign Up',
      signOut: 'Sign Out',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      forgotPassword: 'Forgot Password?',
      resetPassword: 'Reset Password',
      createAccount: 'Create Account',
      alreadyHaveAccount: 'Already have an account?',
      dontHaveAccount: "Don't have an account?",
      welcome: 'Welcome',
      welcomeBack: 'Welcome back'
    },

    // Crisis support
    crisis: {
      title: 'Crisis Support',
      emergency: 'Emergency',
      needHelp: 'Need immediate help?',
      callNow: 'Call Now',
      textCrisis: 'Text Crisis Line',
      chat: 'Crisis Chat',
      safety: 'Safety Plan',
      resources: 'Crisis Resources',
      hotlines: 'Crisis Hotlines',
      disclaimer: 'If this is a life-threatening emergency, call 911 immediately',
      available247: 'Available 24/7',
      confidential: 'Free & Confidential'
    },

    // Wellness tracking
    wellness: {
      mood: 'Mood',
      anxiety: 'Anxiety',
      sleep: 'Sleep',
      exercise: 'Exercise',
      meditation: 'Meditation',
      journal: 'Journal',
      goals: 'Goals',
      insights: 'Insights',
      progress: 'Progress',
      streak: 'Day Streak',
      trackMood: 'Track Your Mood',
      howAreYou: 'How are you feeling today?',
      addNote: 'Add a note (optional)',
      excellent: 'Excellent',
      good: 'Good',
      okay: 'Okay',
      notGood: 'Not Good',
      terrible: 'Terrible'
    },

    // Therapy
    therapy: {
      sessions: 'Therapy Sessions',
      upcoming: 'Upcoming Sessions',
      past: 'Past Sessions',
      schedule: 'Schedule Session',
      reschedule: 'Reschedule',
      cancel: 'Cancel Session',
      therapist: 'Therapist',
      sessionNotes: 'Session Notes',
      homework: 'Homework',
      progress: 'Progress',
      duration: 'Duration',
      videoCall: 'Video Call',
      phoneCall: 'Phone Call',
      inPerson: 'In Person'
    },

    // Chat
    chat: {
      messages: 'Messages',
      newMessage: 'New Message',
      typeMessage: 'Type your message...',
      send: 'Send',
      online: 'Online',
      offline: 'Offline',
      typing: 'is typing...',
      supportGroup: 'Support Group',
      anonymousChat: 'Anonymous Chat',
      peerSupport: 'Peer Support',
      startConversation: 'Start a conversation'
    },

    // Profile
    profile: {
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      dateOfBirth: 'Date of Birth',
      phone: 'Phone Number',
      address: 'Address',
      emergencyContact: 'Emergency Contact',
      preferences: 'Preferences',
      privacy: 'Privacy Settings',
      notifications: 'Notifications',
      language: 'Language',
      theme: 'Theme',
      accessibility: 'Accessibility'
    },

    // Error messages
    errors: {
      required: 'This field is required',
      invalid: 'Please enter a valid value',
      emailInvalid: 'Please enter a valid email address',
      passwordTooShort: 'Password must be at least 8 characters',
      passwordsNoMatch: 'Passwords do not match',
      networkError: 'Network error. Please check your connection',
      serverError: 'Server error. Please try again later',
      notFound: 'Page not found',
      unauthorized: 'You are not authorized to access this page',
      sessionExpired: 'Your session has expired. Please sign in again'
    },

    // Success messages
    success: {
      saved: 'Changes saved successfully',
      sent: 'Message sent successfully',
      updated: 'Updated successfully',
      deleted: 'Deleted successfully',
      created: 'Created successfully',
      passwordReset: 'Password reset email sent',
      accountCreated: 'Account created successfully'
    }
  },
  
  // Spanish translations (abbreviated for brevity)
  es: {
    nav: {
      home: 'Inicio',
      dashboard: 'Panel',
      chat: 'Chat',
      therapy: 'Terapia',
      wellness: 'Bienestar',
      crisis: 'Apoyo en Crisis',
      profile: 'Perfil',
      settings: 'Configuración',
      help: 'Ayuda',
      signOut: 'Cerrar Sesión'
    },
    common: {
      save: 'Guardar',
      cancel: 'Cancelar',
      delete: 'Eliminar',
      edit: 'Editar',
      close: 'Cerrar',
      loading: 'Cargando...',
      error: 'Error',
      success: 'Éxito',
      yes: 'Sí',
      no: 'No'
    },
    crisis: {
      title: 'Apoyo en Crisis',
      emergency: 'Emergencia',
      needHelp: '¿Necesitas ayuda inmediata?',
      callNow: 'Llamar Ahora',
      available247: 'Disponible 24/7',
      confidential: 'Gratuito y Confidencial'
    }
  }
};

// Create i18n instance
export const i18n = createI18n({
  locale: getStoredLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  messages,
  legacy: false,
  globalInjection: true
});

// Reactive current locale
export const currentLocale = ref<SupportedLocale>(getStoredLocale());

// Computed properties for current language config
export const currentLanguageConfig = computed(() => LANGUAGE_CONFIG[currentLocale.value]);
export const isRTL = computed(() => currentLanguageConfig.value.rtl);

// Locale switching function
export const setLocale = async (locale: SupportedLocale) => {
  if (!SUPPORTED_LOCALES.includes(locale)) {
    console.warn(`Unsupported locale: ${locale}`);
    return;
  }

  try {
    // Load additional messages if needed
    await loadLocaleMessages(locale);
    
    // Update i18n locale
    i18n.global.locale.value = locale;
    currentLocale.value = locale;
    
    // Store preference
    setStoredLocale(locale);
    
    // Update document attributes for RTL support
    document.documentElement.lang = locale;
    document.documentElement.dir = LANGUAGE_CONFIG[locale].rtl ? 'rtl' : 'ltr';
    
    // Notify analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'language_change', {
        language: locale
      });
    }
  } catch (error) {
    console.error(`Failed to set locale to ${locale}:`, error);
  }
};

// Dynamic message loading for better performance
const loadLocaleMessages = async (locale: SupportedLocale) => {
  // Check if messages are already loaded
  if (i18n.global.messages[locale] && Object.keys(i18n.global.messages[locale]).length > 10) {
    return;
  }

  try {
    // Dynamically import locale-specific messages
    const localeMessages = await import(`./locales/${locale}.json`);
    i18n.global.setLocaleMessage(locale, localeMessages.default);
  } catch (error) {
    console.warn(`Failed to load messages for locale ${locale}, using fallback`);
  }
};

// Format functions for consistent display
export const formatDate = (date: Date | string | number, locale?: SupportedLocale): string => {
  const targetLocale = locale || currentLocale.value;
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(targetLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj);
};

export const formatTime = (date: Date | string | number, locale?: SupportedLocale): string => {
  const targetLocale = locale || currentLocale.value;
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(targetLocale, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

export const formatNumber = (number: number, locale?: SupportedLocale): string => {
  const targetLocale = locale || currentLocale.value;
  const options = LANGUAGE_CONFIG[targetLocale].numberFormat;
  
  return new Intl.NumberFormat(targetLocale, options).format(number);
};

export const formatCurrency = (amount: number, currency = 'USD', locale?: SupportedLocale): string => {
  const targetLocale = locale || currentLocale.value;
  
  return new Intl.NumberFormat(targetLocale, {
    style: 'currency',
    currency
  }).format(amount);
};

export const formatRelativeTime = (date: Date | string | number, locale?: SupportedLocale): string => {
  const targetLocale = locale || currentLocale.value;
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(targetLocale, { numeric: 'auto' });

  if (diffInSeconds < 60) {
    return rtf.format(-diffInSeconds, 'second');
  } else if (diffInSeconds < 3600) {
    return rtf.format(-Math.floor(diffInSeconds / 60), 'minute');
  } else if (diffInSeconds < 86400) {
    return rtf.format(-Math.floor(diffInSeconds / 3600), 'hour');
  } else {
    return rtf.format(-Math.floor(diffInSeconds / 86400), 'day');
  }
};

// Translation helper functions
export const t = (key: string, params?: Record<string, any>): string => {
  return i18n.global.t(key, params);
};

export const tc = (key: string, count: number, params?: Record<string, any>): string => {
  return i18n.global.tc(key, count, params);
};

export const te = (key: string): boolean => {
  return i18n.global.te(key);
};

// Initialize i18n on app start
export const initializeI18n = async () => {
  const locale = getStoredLocale();
  
  // Set initial document attributes
  document.documentElement.lang = locale;
  document.documentElement.dir = LANGUAGE_CONFIG[locale].rtl ? 'rtl' : 'ltr';
  
  // Load initial locale messages
  await loadLocaleMessages(locale);
  
  console.log(`i18n initialized with locale: ${locale}`);
};

// Crisis-specific translations with high priority loading
export const CRISIS_TRANSLATIONS = {
  en: {
    callEmergency: 'Call 911',
    crisisHotline: 'Crisis Hotline: 988',
    textCrisis: 'Text HOME to 741741',
    emergencyDisclaimer: 'If you are in immediate danger, call 911 or go to your nearest emergency room.',
    notAlone: 'You are not alone. Help is available.',
    stayingSafe: 'Your safety is our priority.'
  },
  es: {
    callEmergency: 'Llamar 911',
    crisisHotline: 'Línea de Crisis: 988',
    textCrisis: 'Envía INICIO al 741741',
    emergencyDisclaimer: 'Si estás en peligro inmediato, llama al 911 o ve a la sala de emergencias más cercana.',
    notAlone: 'No estás solo. Hay ayuda disponible.',
    stayingSafe: 'Tu seguridad es nuestra prioridad.'
  }
};

// Mental health specific term dictionary
export const MENTAL_HEALTH_TERMS = {
  en: {
    anxiety: 'Anxiety',
    depression: 'Depression',
    ptsd: 'PTSD',
    bipolar: 'Bipolar Disorder',
    ocd: 'OCD',
    adhd: 'ADHD',
    therapy: 'Therapy',
    counseling: 'Counseling',
    medication: 'Medication',
    selfCare: 'Self-Care',
    mindfulness: 'Mindfulness',
    coping: 'Coping Strategies',
    support: 'Support',
    recovery: 'Recovery',
    wellness: 'Wellness',
    mentalHealth: 'Mental Health'
  }
};

// Export everything for external use
export default {
  i18n,
  currentLocale,
  currentLanguageConfig,
  isRTL,
  setLocale,
  formatDate,
  formatTime,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  t,
  tc,
  te,
  initializeI18n,
  SUPPORTED_LOCALES,
  LANGUAGE_CONFIG,
  CRISIS_TRANSLATIONS,
  MENTAL_HEALTH_TERMS
};
