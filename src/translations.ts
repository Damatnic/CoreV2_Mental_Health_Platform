// Internationalization and translation management for the Mental Health Platform

export interface Translation {
  [key: string]: string | Translation;
}

export interface LanguageConfig {
  code: string;
  name: string;
  nativeName: string;
  rtl?: boolean;
  fallback?: string;
}

// Supported languages
export const SUPPORTED_LANGUAGES: Record<string, LanguageConfig> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English'
  },
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    fallback: 'en'
  },
  fr: {
    code: 'fr',
    name: 'French',
    nativeName: 'Français',
    fallback: 'en'
  },
  de: {
    code: 'de',
    name: 'German',
    nativeName: 'Deutsch',
    fallback: 'en'
  },
  pt: {
    code: 'pt',
    name: 'Portuguese',
    nativeName: 'Português',
    fallback: 'en'
  },
  zh: {
    code: 'zh',
    name: 'Chinese',
    nativeName: '中文',
    fallback: 'en'
  }
};

// English (base) translations
export const EN_TRANSLATIONS: Translation = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit'
  },
  auth: {
    login: 'Log In',
    logout: 'Log Out',
    signup: 'Sign Up',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    loginAnonymously: 'Continue Anonymously'
  },
  dashboard: {
    welcome: 'Welcome',
    moodToday: 'How are you feeling today?',
    quickActions: 'Quick Actions',
    recentActivity: 'Recent Activity',
    upcomingAppointments: 'Upcoming Appointments'
  },
  chat: {
    startChat: 'Start Chat',
    typing: 'typing...',
    sendMessage: 'Send Message',
    aiHelper: 'AI Helper',
    crisisSupport: 'Crisis Support',
    peerSupport: 'Peer Support'
  },
  crisis: {
    emergencyTitle: 'Emergency Support',
    needHelpNow: 'I Need Help Now',
    callCrisisLine: 'Call Crisis Line',
    safetyPlan: 'Safety Plan',
    crisisResources: 'Crisis Resources',
    youAreNotAlone: 'You are not alone'
  },
  mood: {
    trackMood: 'Track Mood',
    moodHistory: 'Mood History',
    howFeeling: 'How are you feeling?',
    veryHappy: 'Very Happy',
    happy: 'Happy',
    neutral: 'Neutral',
    sad: 'Sad',
    verySad: 'Very Sad'
  },
  privacy: {
    anonymousMode: 'Anonymous Mode',
    dataProtection: 'Data Protection',
    privacySettings: 'Privacy Settings',
    deleteMyData: 'Delete My Data',
    dataRetention: 'Data Retention'
  }
};

// Spanish translations (sample)
export const ES_TRANSLATIONS: Translation = {
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
    no: 'No',
    ok: 'OK',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar'
  },
  auth: {
    login: 'Iniciar Sesión',
    logout: 'Cerrar Sesión',
    signup: 'Registrarse',
    email: 'Email',
    password: 'Contraseña',
    forgotPassword: '¿Olvidaste tu contraseña?',
    rememberMe: 'Recordarme',
    loginAnonymously: 'Continuar Anónimamente'
  },
  crisis: {
    emergencyTitle: 'Apoyo de Emergencia',
    needHelpNow: 'Necesito Ayuda Ahora',
    callCrisisLine: 'Llamar Línea de Crisis',
    safetyPlan: 'Plan de Seguridad',
    crisisResources: 'Recursos de Crisis',
    youAreNotAlone: 'No estás solo'
  }
};

// Translation store
class TranslationStore {
  private translations: Record<string, Translation> = {
    en: EN_TRANSLATIONS,
    es: ES_TRANSLATIONS
  };
  
  private currentLanguage: string = 'en';
  private fallbackLanguage: string = 'en';

  setLanguage(languageCode: string): void {
    if (this.translations[languageCode]) {
      this.currentLanguage = languageCode;
      localStorage.setItem('preferred_language', languageCode);
    }
  }

  getLanguage(): string {
    return this.currentLanguage;
  }

  translate(key: string, params?: Record<string, string>): string {
    const keys = key.split('.');
    let translation: any = this.translations[this.currentLanguage];
    
    // Navigate through nested keys
    for (const k of keys) {
      if (translation && typeof translation === 'object') {
        translation = translation[k];
      } else {
        translation = undefined;
        break;
      }
    }

    let result = typeof translation === 'string' ? translation : undefined;

    // Fallback to English if translation not found
    if (!result && this.currentLanguage !== this.fallbackLanguage) {
      translation = this.translations[this.fallbackLanguage];
      for (const k of keys) {
        if (translation && typeof translation === 'object') {
          translation = translation[k];
        } else {
          translation = undefined;
          break;
        }
      }
      result = typeof translation === 'string' ? translation : undefined;
    }

    // Return key if no translation found
    if (!result) {
      return key;
    }

    // Replace parameters
    if (params) {
      Object.keys(params).forEach(param => {
        result = result.replace(new RegExp(`{{${param}}}`, 'g'), params[param]);
      });
    }

    return result;
  }

  addTranslations(languageCode: string, translations: Translation): void {
    this.translations[languageCode] = {
      ...this.translations[languageCode],
      ...translations
    };
  }
}

export const translationStore = new TranslationStore();

// Hook for React components
export const useTranslation = () => {
  const t = (key: string, params?: Record<string, string>) => 
    translationStore.translate(key, params);
  
  const setLanguage = (language: string) => 
    translationStore.setLanguage(language);
  
  const currentLanguage = translationStore.getLanguage();

  return { t, setLanguage, currentLanguage };
};

// Initialize language from localStorage (with safety checks)
if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
  const savedLanguage = localStorage.getItem('preferred_language');
  const browserLanguage = navigator?.language?.split('-')[0] || 'en';

  if (savedLanguage && SUPPORTED_LANGUAGES[savedLanguage]) {
    translationStore.setLanguage(savedLanguage);
  } else if (SUPPORTED_LANGUAGES[browserLanguage]) {
    translationStore.setLanguage(browserLanguage);
  }
}

export default translationStore;
