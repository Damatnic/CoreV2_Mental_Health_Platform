/**
 * Advanced Theming System Tests
 * 
 * Tests for dynamic theming, accessibility features, and mental health-specific themes
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock theme data and interfaces
interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

interface MentalHealthTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    colorBlindFriendly: boolean;
    wcagLevel: 'AA' | 'AAA';
  };
  mentalHealthContext: {
    moodColors: Record<string, string>;
    crisisColors: {
      warning: string;
      critical: string;
      safe: string;
    };
    supportiveElements: {
      backgroundColor: string;
      borderColor: string;
      textColor: string;
    };
  };
  typography: {
    fontFamily: string;
    fontSize: Record<string, string>;
    lineHeight: Record<string, number>;
  };
}

// Advanced Theming System implementation (would be imported in real app)
class AdvancedThemingSystem {
  private themes: Map<string, MentalHealthTheme> = new Map();
  private currentTheme: string = 'light';
  private userPreferences: {
    prefersDarkMode: boolean;
    prefersReducedMotion: boolean;
    prefersHighContrast: boolean;
    colorBlindnessType?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
  } = {
    prefersDarkMode: false,
    prefersReducedMotion: false,
    prefersHighContrast: false,
    colorBlindnessType: 'none'
  };
  private observers: ((theme: MentalHealthTheme) => void)[] = [];

  constructor() {
    this.initializeDefaultThemes();
    this.detectUserPreferences();
  }

  private initializeDefaultThemes(): void {
    const lightTheme: MentalHealthTheme = {
      id: 'light',
      name: 'Light Theme',
      description: 'Clean and bright theme for daily use',
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        accent: '#10b981',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#111827',
        textMuted: '#6b7280',
        border: '#e5e7eb',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        colorBlindFriendly: true,
        wcagLevel: 'AA'
      },
      mentalHealthContext: {
        moodColors: {
          excellent: '#10b981',
          good: '#6366f1',
          okay: '#f59e0b',
          'not-good': '#f97316',
          terrible: '#ef4444'
        },
        crisisColors: {
          warning: '#f59e0b',
          critical: '#ef4444',
          safe: '#10b981'
        },
        supportiveElements: {
          backgroundColor: '#ecfdf5',
          borderColor: '#bbf7d0',
          textColor: '#047857'
        }
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      }
    };

    const darkTheme: MentalHealthTheme = {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Gentle on the eyes for evening use',
      colors: {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        accent: '#34d399',
        background: '#111827',
        surface: '#1f2937',
        text: '#f9fafb',
        textMuted: '#9ca3af',
        border: '#374151',
        success: '#34d399',
        warning: '#fbbf24',
        error: '#f87171',
        info: '#60a5fa'
      },
      accessibility: {
        highContrast: false,
        reducedMotion: false,
        colorBlindFriendly: true,
        wcagLevel: 'AA'
      },
      mentalHealthContext: {
        moodColors: {
          excellent: '#34d399',
          good: '#818cf8',
          okay: '#fbbf24',
          'not-good': '#fb923c',
          terrible: '#f87171'
        },
        crisisColors: {
          warning: '#fbbf24',
          critical: '#f87171',
          safe: '#34d399'
        },
        supportiveElements: {
          backgroundColor: '#064e3b',
          borderColor: '#047857',
          textColor: '#6ee7b7'
        }
      },
      typography: {
        fontFamily: 'Inter, sans-serif',
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem'
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75
        }
      }
    };

    const highContrastTheme: MentalHealthTheme = {
      id: 'high-contrast',
      name: 'High Contrast',
      description: 'Maximum contrast for accessibility',
      colors: {
        primary: '#000000',
        secondary: '#333333',
        accent: '#000000',
        background: '#ffffff',
        surface: '#ffffff',
        text: '#000000',
        textMuted: '#333333',
        border: '#000000',
        success: '#008000',
        warning: '#ff8c00',
        error: '#ff0000',
        info: '#0000ff'
      },
      accessibility: {
        highContrast: true,
        reducedMotion: true,
        colorBlindFriendly: true,
        wcagLevel: 'AAA'
      },
      mentalHealthContext: {
        moodColors: {
          excellent: '#008000',
          good: '#0066cc',
          okay: '#ff8c00',
          'not-good': '#cc6600',
          terrible: '#ff0000'
        },
        crisisColors: {
          warning: '#ff8c00',
          critical: '#ff0000',
          safe: '#008000'
        },
        supportiveElements: {
          backgroundColor: '#f0f8f0',
          borderColor: '#008000',
          textColor: '#004400'
        }
      },
      typography: {
        fontFamily: 'Arial, sans-serif',
        fontSize: {
          xs: '0.875rem',
          sm: '1rem',
          base: '1.125rem',
          lg: '1.25rem',
          xl: '1.375rem'
        },
        lineHeight: {
          tight: 1.4,
          normal: 1.6,
          relaxed: 1.8
        }
      }
    };

    this.themes.set(lightTheme.id, lightTheme);
    this.themes.set(darkTheme.id, darkTheme);
    this.themes.set(highContrastTheme.id, highContrastTheme);
  }

  private detectUserPreferences(): void {
    if (typeof window === 'undefined') return;

    this.userPreferences.prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.userPreferences.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.userPreferences.prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
  }

  setTheme(themeId: string): boolean {
    const theme = this.themes.get(themeId);
    if (!theme) return false;

    this.currentTheme = themeId;
    this.applyTheme(theme);
    this.notifyObservers(theme);
    this.saveUserPreference(themeId);

    return true;
  }

  getCurrentTheme(): MentalHealthTheme | null {
    return this.themes.get(this.currentTheme) || null;
  }

  getAllThemes(): MentalHealthTheme[] {
    return Array.from(this.themes.values());
  }

  addCustomTheme(theme: MentalHealthTheme): void {
    this.themes.set(theme.id, theme);
  }

  removeCustomTheme(themeId: string): boolean {
    if (['light', 'dark', 'high-contrast'].includes(themeId)) {
      return false; // Can't remove default themes
    }
    return this.themes.delete(themeId);
  }

  private applyTheme(theme: MentalHealthTheme): void {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Apply color variables
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Apply typography variables
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value.toString());
    });

    // Apply mental health specific variables
    Object.entries(theme.mentalHealthContext.moodColors).forEach(([mood, color]) => {
      root.style.setProperty(`--mood-${mood}`, color);
    });

    Object.entries(theme.mentalHealthContext.crisisColors).forEach(([level, color]) => {
      root.style.setProperty(`--crisis-${level}`, color);
    });

    // Apply accessibility settings
    if (theme.accessibility.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
      root.style.setProperty('--transition-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
      root.style.setProperty('--transition-duration', '0.2s');
    }
  }

  private notifyObservers(theme: MentalHealthTheme): void {
    this.observers.forEach(observer => observer(theme));
  }

  subscribe(observer: (theme: MentalHealthTheme) => void): () => void {
    this.observers.push(observer);
    return () => {
      const index = this.observers.indexOf(observer);
      if (index >= 0) {
        this.observers.splice(index, 1);
      }
    };
  }

  private saveUserPreference(themeId: string): void {
    localStorage.setItem('user-theme', themeId);
  }

  loadUserPreference(): void {
    const savedTheme = localStorage.getItem('user-theme');
    if (savedTheme && this.themes.has(savedTheme)) {
      this.setTheme(savedTheme);
    } else {
      // Auto-select based on user preferences
      if (this.userPreferences.prefersHighContrast) {
        this.setTheme('high-contrast');
      } else if (this.userPreferences.prefersDarkMode) {
        this.setTheme('dark');
      } else {
        this.setTheme('light');
      }
    }
  }

  generateAccessibilityReport(themeId: string): {
    contrastRatios: Record<string, number>;
    wcagCompliance: boolean;
    recommendations: string[];
  } {
    const theme = this.themes.get(themeId);
    if (!theme) {
      return {
        contrastRatios: {},
        wcagCompliance: false,
        recommendations: ['Theme not found']
      };
    }

    // Mock contrast ratio calculations
    const contrastRatios = {
      'text-background': this.calculateContrastRatio(theme.colors.text, theme.colors.background),
      'primary-background': this.calculateContrastRatio(theme.colors.primary, theme.colors.background),
      'error-background': this.calculateContrastRatio(theme.colors.error, theme.colors.background)
    };

    const wcagCompliance = Object.values(contrastRatios).every(ratio => 
      theme.accessibility.wcagLevel === 'AAA' ? ratio >= 7 : ratio >= 4.5
    );

    const recommendations: string[] = [];
    if (!wcagCompliance) {
      recommendations.push('Improve color contrast ratios for better accessibility');
    }
    if (!theme.accessibility.colorBlindFriendly) {
      recommendations.push('Consider color-blind friendly alternatives');
    }

    return {
      contrastRatios,
      wcagCompliance,
      recommendations
    };
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation (mock implementation)
    // In reality, this would convert colors to RGB and calculate luminance
    const hash1 = this.hashColor(color1);
    const hash2 = this.hashColor(color2);
    return Math.abs(hash1 - hash2) / 255 * 21; // Mock ratio between 1 and 21
  }

  private hashColor(color: string): number {
    let hash = 0;
    for (let i = 0; i < color.length; i++) {
      const char = color.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 256;
  }

  adaptThemeForColorBlindness(themeId: string, type: 'protanopia' | 'deuteranopia' | 'tritanopia'): MentalHealthTheme | null {
    const originalTheme = this.themes.get(themeId);
    if (!originalTheme) return null;

    const adaptedTheme: MentalHealthTheme = {
      ...originalTheme,
      id: `${themeId}-${type}`,
      name: `${originalTheme.name} (${type})`,
      colors: { ...originalTheme.colors },
      accessibility: {
        ...originalTheme.accessibility,
        colorBlindFriendly: true
      }
    };

    // Apply color blind adaptations
    switch (type) {
      case 'protanopia':
      case 'deuteranopia':
        // Replace reds and greens with blues and yellows
        adaptedTheme.colors.error = '#0066cc';
        adaptedTheme.colors.success = '#ffcc00';
        adaptedTheme.mentalHealthContext.moodColors.terrible = '#0066cc';
        adaptedTheme.mentalHealthContext.moodColors.excellent = '#ffcc00';
        break;
      case 'tritanopia':
        // Replace blues and yellows with reds and greens
        adaptedTheme.colors.info = '#10b981';
        adaptedTheme.colors.warning = '#ef4444';
        break;
    }

    return adaptedTheme;
  }

  exportTheme(themeId: string): string | null {
    const theme = this.themes.get(themeId);
    if (!theme) return null;

    return JSON.stringify(theme, null, 2);
  }

  importTheme(themeJson: string): boolean {
    try {
      const theme = JSON.parse(themeJson) as MentalHealthTheme;
      
      // Validate theme structure
      if (!theme.id || !theme.name || !theme.colors || !theme.accessibility || !theme.mentalHealthContext) {
        return false;
      }

      this.addCustomTheme(theme);
      return true;
    } catch {
      return false;
    }
  }
}

describe('AdvancedThemingSystem', () => {
  let themingSystem: AdvancedThemingSystem;

  beforeEach(() => {
    themingSystem = new AdvancedThemingSystem();
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn()
      },
      writable: true
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      value: jest.fn(() => ({
        matches: false,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }))
    });

    // Mock document
    Object.defineProperty(document, 'documentElement', {
      value: {
        style: {
          setProperty: jest.fn()
        }
      },
      writable: true
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Theme Management', () => {
    it('should initialize with default themes', () => {
      const themes = themingSystem.getAllThemes();
      
      expect(themes).toHaveLength(3);
      expect(themes.map(t => t.id)).toContain('light');
      expect(themes.map(t => t.id)).toContain('dark');
      expect(themes.map(t => t.id)).toContain('high-contrast');
    });

    it('should set and retrieve current theme', () => {
      const success = themingSystem.setTheme('dark');
      
      expect(success).toBe(true);
      
      const currentTheme = themingSystem.getCurrentTheme();
      expect(currentTheme?.id).toBe('dark');
      expect(currentTheme?.name).toBe('Dark Theme');
    });

    it('should return false for invalid theme ID', () => {
      const success = themingSystem.setTheme('nonexistent');
      expect(success).toBe(false);
    });

    it('should add and remove custom themes', () => {
      const customTheme: MentalHealthTheme = {
        id: 'custom-theme',
        name: 'Custom Theme',
        description: 'A custom theme for testing',
        colors: {
          primary: '#ff0000',
          secondary: '#00ff00',
          accent: '#0000ff',
          background: '#ffffff',
          surface: '#f0f0f0',
          text: '#000000',
          textMuted: '#666666',
          border: '#cccccc',
          success: '#00ff00',
          warning: '#ff8800',
          error: '#ff0000',
          info: '#0088ff'
        },
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          colorBlindFriendly: true,
          wcagLevel: 'AA'
        },
        mentalHealthContext: {
          moodColors: {
            excellent: '#00ff00',
            good: '#88ff00',
            okay: '#ffff00',
            'not-good': '#ff8800',
            terrible: '#ff0000'
          },
          crisisColors: {
            warning: '#ff8800',
            critical: '#ff0000',
            safe: '#00ff00'
          },
          supportiveElements: {
            backgroundColor: '#f0fff0',
            borderColor: '#00ff00',
            textColor: '#004400'
          }
        },
        typography: {
          fontFamily: 'Arial, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem'
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        }
      };

      themingSystem.addCustomTheme(customTheme);
      const themes = themingSystem.getAllThemes();
      expect(themes).toHaveLength(4);
      expect(themes.find(t => t.id === 'custom-theme')).toBeDefined();

      const removed = themingSystem.removeCustomTheme('custom-theme');
      expect(removed).toBe(true);
      
      const themesAfterRemoval = themingSystem.getAllThemes();
      expect(themesAfterRemoval).toHaveLength(3);
    });

    it('should not remove default themes', () => {
      const removed = themingSystem.removeCustomTheme('light');
      expect(removed).toBe(false);
      
      const themes = themingSystem.getAllThemes();
      expect(themes).toHaveLength(3);
    });
  });

  describe('Theme Application', () => {
    it('should apply theme to DOM', () => {
      themingSystem.setTheme('dark');
      
      const mockSetProperty = document.documentElement.style.setProperty as jest.Mock;
      
      expect(mockSetProperty).toHaveBeenCalledWith('--color-primary', '#60a5fa');
      expect(mockSetProperty).toHaveBeenCalledWith('--color-background', '#111827');
      expect(mockSetProperty).toHaveBeenCalledWith('--font-family', 'Inter, sans-serif');
    });

    it('should save theme preference to localStorage', () => {
      themingSystem.setTheme('high-contrast');
      
      expect(localStorage.setItem).toHaveBeenCalledWith('user-theme', 'high-contrast');
    });

    it('should load saved theme preference', () => {
      (localStorage.getItem as jest.Mock).mockReturnValue('dark');
      
      themingSystem.loadUserPreference();
      
      const currentTheme = themingSystem.getCurrentTheme();
      expect(currentTheme?.id).toBe('dark');
    });
  });

  describe('Theme Observers', () => {
    it('should notify observers when theme changes', () => {
      const observer = jest.fn();
      const unsubscribe = themingSystem.subscribe(observer);
      
      themingSystem.setTheme('dark');
      
      expect(observer).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'dark', name: 'Dark Theme' })
      );
      
      unsubscribe();
      
      themingSystem.setTheme('light');
      expect(observer).toHaveBeenCalledTimes(1); // Should not be called again after unsubscribe
    });
  });

  describe('Accessibility Features', () => {
    it('should generate accessibility report', () => {
      const report = themingSystem.generateAccessibilityReport('light');
      
      expect(report).toHaveProperty('contrastRatios');
      expect(report).toHaveProperty('wcagCompliance');
      expect(report).toHaveProperty('recommendations');
      expect(typeof report.wcagCompliance).toBe('boolean');
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should return error report for invalid theme', () => {
      const report = themingSystem.generateAccessibilityReport('invalid');
      
      expect(report.wcagCompliance).toBe(false);
      expect(report.recommendations).toContain('Theme not found');
    });

    it('should adapt themes for color blindness', () => {
      const adaptedTheme = themingSystem.adaptThemeForColorBlindness('light', 'protanopia');
      
      expect(adaptedTheme).not.toBeNull();
      expect(adaptedTheme?.id).toBe('light-protanopia');
      expect(adaptedTheme?.name).toBe('Light Theme (protanopia)');
      expect(adaptedTheme?.accessibility.colorBlindFriendly).toBe(true);
      
      // Check color adaptations
      expect(adaptedTheme?.colors.error).toBe('#0066cc'); // Red replaced with blue
      expect(adaptedTheme?.colors.success).toBe('#ffcc00'); // Green replaced with yellow
    });

    it('should return null for invalid theme in color blind adaptation', () => {
      const adaptedTheme = themingSystem.adaptThemeForColorBlindness('invalid', 'deuteranopia');
      expect(adaptedTheme).toBeNull();
    });
  });

  describe('Mental Health Context', () => {
    it('should include mood colors in themes', () => {
      const lightTheme = themingSystem.getCurrentTheme();
      
      expect(lightTheme?.mentalHealthContext.moodColors).toHaveProperty('excellent');
      expect(lightTheme?.mentalHealthContext.moodColors).toHaveProperty('terrible');
      expect(lightTheme?.mentalHealthContext.moodColors.excellent).toBe('#10b981');
      expect(lightTheme?.mentalHealthContext.moodColors.terrible).toBe('#ef4444');
    });

    it('should include crisis colors in themes', () => {
      const darkTheme = themingSystem.getAllThemes().find(t => t.id === 'dark');
      
      expect(darkTheme?.mentalHealthContext.crisisColors).toHaveProperty('warning');
      expect(darkTheme?.mentalHealthContext.crisisColors).toHaveProperty('critical');
      expect(darkTheme?.mentalHealthContext.crisisColors).toHaveProperty('safe');
    });

    it('should include supportive elements styling', () => {
      const highContrastTheme = themingSystem.getAllThemes().find(t => t.id === 'high-contrast');
      
      expect(highContrastTheme?.mentalHealthContext.supportiveElements).toHaveProperty('backgroundColor');
      expect(highContrastTheme?.mentalHealthContext.supportiveElements).toHaveProperty('borderColor');
      expect(highContrastTheme?.mentalHealthContext.supportiveElements).toHaveProperty('textColor');
    });
  });

  describe('Theme Import/Export', () => {
    it('should export theme as JSON', () => {
      const exported = themingSystem.exportTheme('light');
      
      expect(exported).not.toBeNull();
      expect(() => JSON.parse(exported!)).not.toThrow();
      
      const parsed = JSON.parse(exported!);
      expect(parsed.id).toBe('light');
      expect(parsed.name).toBe('Light Theme');
    });

    it('should return null for invalid theme export', () => {
      const exported = themingSystem.exportTheme('invalid');
      expect(exported).toBeNull();
    });

    it('should import valid theme JSON', () => {
      const themeJson = JSON.stringify({
        id: 'imported-theme',
        name: 'Imported Theme',
        description: 'An imported theme',
        colors: {
          primary: '#123456',
          secondary: '#654321',
          accent: '#abcdef',
          background: '#ffffff',
          surface: '#f0f0f0',
          text: '#000000',
          textMuted: '#666666',
          border: '#cccccc',
          success: '#00ff00',
          warning: '#ff8800',
          error: '#ff0000',
          info: '#0088ff'
        },
        accessibility: {
          highContrast: false,
          reducedMotion: false,
          colorBlindFriendly: true,
          wcagLevel: 'AA' as const
        },
        mentalHealthContext: {
          moodColors: {
            excellent: '#00ff00',
            good: '#88ff00',
            okay: '#ffff00',
            'not-good': '#ff8800',
            terrible: '#ff0000'
          },
          crisisColors: {
            warning: '#ff8800',
            critical: '#ff0000',
            safe: '#00ff00'
          },
          supportiveElements: {
            backgroundColor: '#f0fff0',
            borderColor: '#00ff00',
            textColor: '#004400'
          }
        },
        typography: {
          fontFamily: 'Arial, sans-serif',
          fontSize: {
            xs: '0.75rem',
            sm: '0.875rem',
            base: '1rem',
            lg: '1.125rem',
            xl: '1.25rem'
          },
          lineHeight: {
            tight: 1.25,
            normal: 1.5,
            relaxed: 1.75
          }
        }
      });

      const success = themingSystem.importTheme(themeJson);
      expect(success).toBe(true);
      
      const themes = themingSystem.getAllThemes();
      expect(themes.find(t => t.id === 'imported-theme')).toBeDefined();
    });

    it('should reject invalid theme JSON', () => {
      const invalidJson = '{"invalid": "theme"}';
      
      const success = themingSystem.importTheme(invalidJson);
      expect(success).toBe(false);
    });

    it('should reject malformed JSON', () => {
      const malformedJson = '{"invalid": theme}';
      
      const success = themingSystem.importTheme(malformedJson);
      expect(success).toBe(false);
    });
  });

  describe('Accessibility Settings', () => {
    it('should apply reduced motion settings', () => {
      themingSystem.setTheme('high-contrast');
      
      const mockSetProperty = document.documentElement.style.setProperty as jest.Mock;
      
      expect(mockSetProperty).toHaveBeenCalledWith('--animation-duration', '0s');
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0s');
    });

    it('should apply normal motion for themes without reduced motion', () => {
      themingSystem.setTheme('light');
      
      const mockSetProperty = document.documentElement.style.setProperty as jest.Mock;
      
      expect(mockSetProperty).toHaveBeenCalledWith('--animation-duration', '0.3s');
      expect(mockSetProperty).toHaveBeenCalledWith('--transition-duration', '0.2s');
    });
  });

  describe('Typography Support', () => {
    it('should apply typography settings from theme', () => {
      themingSystem.setTheme('high-contrast');
      
      const mockSetProperty = document.documentElement.style.setProperty as jest.Mock;
      
      expect(mockSetProperty).toHaveBeenCalledWith('--font-family', 'Arial, sans-serif');
      expect(mockSetProperty).toHaveBeenCalledWith('--font-size-base', '1.125rem');
      expect(mockSetProperty).toHaveBeenCalledWith('--line-height-normal', '1.6');
    });
  });
});

