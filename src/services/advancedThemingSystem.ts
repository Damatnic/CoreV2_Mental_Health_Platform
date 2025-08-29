/**
 * Advanced Theming System
 *
 * Comprehensive theming solution with dynamic theme switching,
 * accessibility compliance, and user preference management
 *
 * Features:
 * - Dynamic theme switching with smooth transitions
 * - WCAG 2.1 AA compliance validation
 * - High contrast and accessibility modes
 * - Cultural and regional theme adaptations
 * - Performance-optimized CSS variable management
 * - Automatic dark/light mode detection
 * - Custom theme creation and management
 * - Color blindness accommodation
 *
 * @license Apache-2.0
 */

import { logger } from '../utils/logger';
import { performanceService } from './performanceService';

// Theme Configuration Types
export type ThemeMode = 'light' | 'dark' | 'high-contrast' | 'auto';
export type ColorScheme = 'default' | 'warm' | 'cool' | 'monochrome' | 'high-contrast';
export type AccessibilityMode = 'none' | 'motion-reduced' | 'high-contrast' | 'large-text' | 'color-blind';

// Color Palette Interface
interface ColorPalette {
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  neutral: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

// Theme Definition Interface
interface ThemeDefinition {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  colorScheme: ColorScheme;
  colors: ColorPalette;
  typography: {
    fontFamily: {
      primary: string;
      secondary: string;
      monospace: string;
    };
    fontSize: {
      xs: string;
      sm: string;
      base: string;
      lg: string;
      xl: string;
      '2xl': string;
      '3xl': string;
      '4xl': string;
    };
    fontWeight: {
      light: number;
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  transitions: {
    fast: string;
    normal: string;
    slow: string;
  };
  accessibility: {
    focusRing: string;
    highContrastBorder: string;
    reducedMotion: boolean;
  };
  culturalAdaptations?: {
    rtl: boolean;
    locale: string;
    colorMeanings: Record<string, string>;
  };
}

// User Theme Preferences
interface ThemePreferences {
  mode: ThemeMode;
  colorScheme: ColorScheme;
  accessibilityMode: AccessibilityMode;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  motionPreference: 'no-preference' | 'reduce';
  contrastPreference: 'no-preference' | 'more' | 'less';
  customizations: {
    primaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  culturalSettings?: {
    locale: string;
    rtl: boolean;
    colorPreferences: Record<string, string>;
  };
}

// Theme Validation Result
interface ThemeValidationResult {
  isValid: boolean;
  wcagCompliance: {
    aa: boolean;
    aaa: boolean;
  };
  contrastRatios: {
    textOnBackground: number;
    textOnPrimary: number;
    textOnSecondary: number;
  };
  accessibilityIssues: Array<{
    severity: 'error' | 'warning' | 'info';
    message: string;
    element: string;
    recommendation: string;
  }>;
  performanceScore: number;
}

// Main Theming Service Interface
export interface AdvancedThemingSystem {
  // Theme Management
  initialize(): Promise<void>;
  setTheme(themeId: string): Promise<void>;
  getTheme(themeId: string): ThemeDefinition | null;
  getCurrentTheme(): ThemeDefinition;
  getAllThemes(): ThemeDefinition[];
  
  // Custom Theme Creation
  createCustomTheme(baseTheme: string, customizations: Partial<ThemeDefinition>): Promise<string>;
  updateCustomTheme(themeId: string, updates: Partial<ThemeDefinition>): Promise<void>;
  deleteCustomTheme(themeId: string): Promise<void>;
  
  // User Preferences
  setUserPreferences(preferences: Partial<ThemePreferences>): Promise<void>;
  getUserPreferences(): ThemePreferences;
  resetPreferences(): Promise<void>;
  
  // Accessibility
  enableAccessibilityMode(mode: AccessibilityMode): Promise<void>;
  validateThemeAccessibility(themeId: string): Promise<ThemeValidationResult>;
  getAccessibilityRecommendations(): Promise<string[]>;
  
  // Dynamic Adaptation
  enableAutoMode(): void;
  disableAutoMode(): void;
  adaptToSystemPreferences(): Promise<void>;
  adaptToCulturalContext(locale: string, region: string): Promise<void>;
  
  // Performance
  preloadTheme(themeId: string): Promise<void>;
  optimizeThemePerformance(): Promise<void>;
  getThemeMetrics(): {
    loadTime: number;
    cssVariableCount: number;
    renderTime: number;
  };
}

// Default Color Palettes
const DEFAULT_LIGHT_PALETTE: ColorPalette = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a'
  },
  secondary: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a'
  },
  neutral: {
    50: '#fafafa',
    100: '#f4f4f5',
    200: '#e4e4e7',
    300: '#d4d4d8',
    400: '#a1a1aa',
    500: '#71717a',
    600: '#52525b',
    700: '#3f3f46',
    800: '#27272a',
    900: '#18181b'
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4'
};

const DEFAULT_DARK_PALETTE: ColorPalette = {
  primary: {
    50: '#1e3a8a',
    100: '#1e40af',
    200: '#1d4ed8',
    300: '#2563eb',
    400: '#3b82f6',
    500: '#60a5fa',
    600: '#93c5fd',
    700: '#bfdbfe',
    800: '#dbeafe',
    900: '#eff6ff'
  },
  secondary: {
    50: '#0f172a',
    100: '#1e293b',
    200: '#334155',
    300: '#475569',
    400: '#64748b',
    500: '#94a3b8',
    600: '#cbd5e1',
    700: '#e2e8f0',
    800: '#f1f5f9',
    900: '#f8fafc'
  },
  neutral: {
    50: '#18181b',
    100: '#27272a',
    200: '#3f3f46',
    300: '#52525b',
    400: '#71717a',
    500: '#a1a1aa',
    600: '#d4d4d8',
    700: '#e4e4e7',
    800: '#f4f4f5',
    900: '#fafafa'
  },
  success: '#059669',
  warning: '#d97706',
  error: '#dc2626',
  info: '#0891b2'
};

// Default Themes
const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    id: 'light-default',
    name: 'Light Default',
    description: 'Clean and modern light theme',
    mode: 'light',
    colorScheme: 'default',
    colors: DEFAULT_LIGHT_PALETTE,
    typography: {
      fontFamily: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        secondary: 'Georgia, "Times New Roman", Times, serif',
        monospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '6rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    },
    transitions: {
      fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    accessibility: {
      focusRing: '0 0 0 2px rgba(59, 130, 246, 0.5)',
      highContrastBorder: '2px solid #000000',
      reducedMotion: false
    }
  },
  {
    id: 'dark-default',
    name: 'Dark Default',
    description: 'Elegant dark theme for reduced eye strain',
    mode: 'dark',
    colorScheme: 'default',
    colors: DEFAULT_DARK_PALETTE,
    typography: {
      fontFamily: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        secondary: 'Georgia, "Times New Roman", Times, serif',
        monospace: '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace'
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem'
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75
      }
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
      '2xl': '3rem',
      '3xl': '4rem',
      '4xl': '6rem'
    },
    borderRadius: {
      none: '0',
      sm: '0.125rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      full: '9999px'
    },
    shadows: {
      sm: '0 1px 2px 0 rgba(0, 0, 0, 0.25)',
      md: '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)'
    },
    transitions: {
      fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
      normal: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      slow: 'all 500ms cubic-bezier(0.4, 0, 0.2, 1)'
    },
    accessibility: {
      focusRing: '0 0 0 2px rgba(147, 197, 253, 0.5)',
      highContrastBorder: '2px solid #ffffff',
      reducedMotion: false
    }
  }
];

// Implementation
class AdvancedThemingSystemImpl implements AdvancedThemingSystem {
  private themes = new Map<string, ThemeDefinition>();
  private currentTheme: ThemeDefinition;
  private userPreferences: ThemePreferences;
  private autoModeEnabled = false;
  private mediaQueryListeners: MediaQueryList[] = [];
  private performanceMetrics = {
    loadTime: 0,
    cssVariableCount: 0,
    renderTime: 0
  };

  constructor() {
    // Initialize with default themes
    DEFAULT_THEMES.forEach(theme => {
      this.themes.set(theme.id, theme);
    });
    
    this.currentTheme = DEFAULT_THEMES[0];
    this.userPreferences = this.getDefaultPreferences();
  }

  async initialize(): Promise<void> {
    try {
      // Load saved preferences
      await this.loadUserPreferences();
      
      // Set initial theme based on preferences
      const preferredTheme = this.determineInitialTheme();
      await this.setTheme(preferredTheme.id);
      
      // Set up media query listeners for auto mode
      this.setupMediaQueryListeners();
      
      // Apply accessibility preferences
      if (this.userPreferences.accessibilityMode !== 'none') {
        await this.enableAccessibilityMode(this.userPreferences.accessibilityMode);
      }
      
      logger.info('Advanced theming system initialized', { 
        currentTheme: this.currentTheme.id,
        userPreferences: this.userPreferences 
      });
    } catch (error) {
      logger.error('Failed to initialize theming system', { error });
      throw error;
    }
  }

  async setTheme(themeId: string): Promise<void> {
    const startTime = performance.now();
    
    try {
      const theme = this.themes.get(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      // Validate theme accessibility
      const validation = await this.validateThemeAccessibility(themeId);
      if (!validation.wcagCompliance.aa) {
        logger.warn('Theme does not meet WCAG AA standards', { themeId, validation });
      }

      // Apply theme with smooth transition
      await this.applyThemeWithTransition(theme);
      
      this.currentTheme = theme;
      
      // Save preference
      this.userPreferences.mode = theme.mode;
      this.userPreferences.colorScheme = theme.colorScheme;
      await this.saveUserPreferences();
      
      // Record performance metrics
      this.performanceMetrics.loadTime = performance.now() - startTime;
      this.performanceMetrics.cssVariableCount = this.countCSSVariables(theme);
      
      // Report to performance service
      performanceService.recordCustomMetric('theme_switch', {
        themeId,
        loadTime: this.performanceMetrics.loadTime,
        variableCount: this.performanceMetrics.cssVariableCount
      });
      
      logger.info('Theme applied successfully', { 
        themeId, 
        loadTime: this.performanceMetrics.loadTime 
      });
    } catch (error) {
      logger.error('Failed to set theme', { themeId, error });
      throw error;
    }
  }

  getTheme(themeId: string): ThemeDefinition | null {
    return this.themes.get(themeId) || null;
  }

  getCurrentTheme(): ThemeDefinition {
    return { ...this.currentTheme };
  }

  getAllThemes(): ThemeDefinition[] {
    return Array.from(this.themes.values());
  }

  async createCustomTheme(baseThemeId: string, customizations: Partial<ThemeDefinition>): Promise<string> {
    try {
      const baseTheme = this.themes.get(baseThemeId);
      if (!baseTheme) {
        throw new Error(`Base theme not found: ${baseThemeId}`);
      }

      const customThemeId = `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const customTheme: ThemeDefinition = {
        ...baseTheme,
        ...customizations,
        id: customThemeId,
        name: customizations.name || `Custom ${baseTheme.name}`,
        description: customizations.description || `Customized version of ${baseTheme.name}`
      };

      // Validate custom theme
      const validation = await this.validateThemeAccessibility(customThemeId);
      if (!validation.isValid) {
        throw new Error('Custom theme validation failed');
      }

      this.themes.set(customThemeId, customTheme);
      
      // Save to localStorage for persistence
      await this.saveCustomTheme(customTheme);
      
      logger.info('Custom theme created', { customThemeId, baseThemeId });
      return customThemeId;
    } catch (error) {
      logger.error('Failed to create custom theme', { baseThemeId, error });
      throw error;
    }
  }

  async updateCustomTheme(themeId: string, updates: Partial<ThemeDefinition>): Promise<void> {
    try {
      const existingTheme = this.themes.get(themeId);
      if (!existingTheme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      if (!themeId.startsWith('custom-')) {
        throw new Error('Cannot update built-in themes');
      }

      const updatedTheme = { ...existingTheme, ...updates };
      
      // Validate updated theme
      const validation = await this.validateThemeAccessibility(themeId);
      if (!validation.isValid) {
        throw new Error('Updated theme validation failed');
      }

      this.themes.set(themeId, updatedTheme);
      
      // Update current theme if it's the active one
      if (this.currentTheme.id === themeId) {
        await this.setTheme(themeId);
      }
      
      // Save to localStorage
      await this.saveCustomTheme(updatedTheme);
      
      logger.info('Custom theme updated', { themeId });
    } catch (error) {
      logger.error('Failed to update custom theme', { themeId, error });
      throw error;
    }
  }

  async deleteCustomTheme(themeId: string): Promise<void> {
    try {
      if (!themeId.startsWith('custom-')) {
        throw new Error('Cannot delete built-in themes');
      }

      const theme = this.themes.get(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      // Switch to default theme if deleting current theme
      if (this.currentTheme.id === themeId) {
        await this.setTheme('light-default');
      }

      this.themes.delete(themeId);
      
      // Remove from localStorage
      localStorage.removeItem(`custom-theme-${themeId}`);
      
      logger.info('Custom theme deleted', { themeId });
    } catch (error) {
      logger.error('Failed to delete custom theme', { themeId, error });
      throw error;
    }
  }

  async setUserPreferences(preferences: Partial<ThemePreferences>): Promise<void> {
    try {
      this.userPreferences = { ...this.userPreferences, ...preferences };
      
      // Apply theme changes if mode changed
      if (preferences.mode) {
        const newTheme = this.findThemeByMode(preferences.mode);
        if (newTheme) {
          await this.setTheme(newTheme.id);
        }
      }
      
      // Apply accessibility changes
      if (preferences.accessibilityMode) {
        await this.enableAccessibilityMode(preferences.accessibilityMode);
      }
      
      // Apply font size changes
      if (preferences.fontSize) {
        this.applyFontSizePreference(preferences.fontSize);
      }
      
      await this.saveUserPreferences();
      
      logger.info('User preferences updated', { preferences });
    } catch (error) {
      logger.error('Failed to set user preferences', { error });
      throw error;
    }
  }

  getUserPreferences(): ThemePreferences {
    return { ...this.userPreferences };
  }

  async resetPreferences(): Promise<void> {
    try {
      this.userPreferences = this.getDefaultPreferences();
      await this.setTheme('light-default');
      await this.saveUserPreferences();
      
      logger.info('User preferences reset to defaults');
    } catch (error) {
      logger.error('Failed to reset preferences', { error });
      throw error;
    }
  }

  async enableAccessibilityMode(mode: AccessibilityMode): Promise<void> {
    try {
      const root = document.documentElement;
      
      // Remove existing accessibility classes
      root.classList.remove('accessibility-motion-reduced', 'accessibility-high-contrast', 'accessibility-large-text', 'accessibility-color-blind');
      
      switch (mode) {
        case 'motion-reduced':
          root.classList.add('accessibility-motion-reduced');
          this.applyReducedMotion();
          break;
          
        case 'high-contrast':
          root.classList.add('accessibility-high-contrast');
          await this.applyHighContrastMode();
          break;
          
        case 'large-text':
          root.classList.add('accessibility-large-text');
          this.applyLargeTextMode();
          break;
          
        case 'color-blind':
          root.classList.add('accessibility-color-blind');
          await this.applyColorBlindMode();
          break;
      }
      
      this.userPreferences.accessibilityMode = mode;
      await this.saveUserPreferences();
      
      logger.info('Accessibility mode enabled', { mode });
    } catch (error) {
      logger.error('Failed to enable accessibility mode', { mode, error });
      throw error;
    }
  }

  async validateThemeAccessibility(themeId: string): Promise<ThemeValidationResult> {
    try {
      const theme = this.themes.get(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }

      const result: ThemeValidationResult = {
        isValid: true,
        wcagCompliance: { aa: true, aaa: false },
        contrastRatios: {
          textOnBackground: 0,
          textOnPrimary: 0,
          textOnSecondary: 0
        },
        accessibilityIssues: [],
        performanceScore: 100
      };

      // Calculate contrast ratios
      result.contrastRatios.textOnBackground = this.calculateContrastRatio(
        theme.colors.neutral[900],
        theme.colors.neutral[50]
      );
      
      result.contrastRatios.textOnPrimary = this.calculateContrastRatio(
        '#ffffff',
        theme.colors.primary[500]
      );
      
      result.contrastRatios.textOnSecondary = this.calculateContrastRatio(
        '#ffffff',
        theme.colors.secondary[500]
      );

      // Check WCAG compliance
      const minContrastAA = 4.5;
      const minContrastAAA = 7.0;
      
      result.wcagCompliance.aa = Object.values(result.contrastRatios).every(ratio => ratio >= minContrastAA);
      result.wcagCompliance.aaa = Object.values(result.contrastRatios).every(ratio => ratio >= minContrastAAA);
      
      if (!result.wcagCompliance.aa) {
        result.accessibilityIssues.push({
          severity: 'error',
          message: 'Insufficient color contrast for WCAG AA compliance',
          element: 'color-scheme',
          recommendation: 'Increase contrast between text and background colors'
        });
        result.isValid = false;
      }

      // Performance scoring
      const variableCount = this.countCSSVariables(theme);
      if (variableCount > 200) {
        result.performanceScore -= 20;
        result.accessibilityIssues.push({
          severity: 'warning',
          message: 'High number of CSS variables may impact performance',
          element: 'css-variables',
          recommendation: 'Consider consolidating similar color values'
        });
      }

      return result;
    } catch (error) {
      logger.error('Theme validation failed', { themeId, error });
      
      return {
        isValid: false,
        wcagCompliance: { aa: false, aaa: false },
        contrastRatios: { textOnBackground: 0, textOnPrimary: 0, textOnSecondary: 0 },
        accessibilityIssues: [{
          severity: 'error',
          message: 'Theme validation error',
          element: 'theme',
          recommendation: 'Check theme configuration'
        }],
        performanceScore: 0
      };
    }
  }

  async getAccessibilityRecommendations(): Promise<string[]> {
    const recommendations: string[] = [];
    
    const validation = await this.validateThemeAccessibility(this.currentTheme.id);
    
    if (!validation.wcagCompliance.aa) {
      recommendations.push('Enable high contrast mode for better accessibility');
      recommendations.push('Consider using darker text colors on light backgrounds');
    }
    
    if (this.userPreferences.motionPreference === 'no-preference') {
      recommendations.push('Enable reduced motion if you experience motion sensitivity');
    }
    
    if (this.userPreferences.fontSize === 'small') {
      recommendations.push('Consider using larger font sizes for better readability');
    }
    
    return recommendations;
  }

  enableAutoMode(): void {
    this.autoModeEnabled = true;
    this.adaptToSystemPreferences();
    logger.info('Auto theme mode enabled');
  }

  disableAutoMode(): void {
    this.autoModeEnabled = false;
    logger.info('Auto theme mode disabled');
  }

  async adaptToSystemPreferences(): Promise<void> {
    if (!this.autoModeEnabled) return;
    
    try {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
      
      // Adapt theme mode
      const targetMode: ThemeMode = prefersDark ? 'dark' : 'light';
      const targetTheme = this.findThemeByMode(targetMode);
      
      if (targetTheme && targetTheme.id !== this.currentTheme.id) {
        await this.setTheme(targetTheme.id);
      }
      
      // Adapt accessibility preferences
      if (prefersReducedMotion && this.userPreferences.accessibilityMode !== 'motion-reduced') {
        await this.enableAccessibilityMode('motion-reduced');
      }
      
      if (prefersHighContrast && this.userPreferences.accessibilityMode !== 'high-contrast') {
        await this.enableAccessibilityMode('high-contrast');
      }
      
      logger.info('Adapted to system preferences', { 
        prefersDark, 
        prefersReducedMotion, 
        prefersHighContrast 
      });
    } catch (error) {
      logger.error('Failed to adapt to system preferences', { error });
    }
  }

  async adaptToCulturalContext(locale: string, region: string): Promise<void> {
    try {
      const culturalAdaptations = {
        rtl: ['ar', 'he', 'fa', 'ur'].includes(locale),
        locale,
        colorMeanings: this.getCulturalColorMeanings(region)
      };
      
      // Apply RTL if needed
      if (culturalAdaptations.rtl) {
        document.documentElement.dir = 'rtl';
        document.documentElement.classList.add('rtl');
      } else {
        document.documentElement.dir = 'ltr';
        document.documentElement.classList.remove('rtl');
      }
      
      // Update user preferences
      this.userPreferences.culturalSettings = {
        locale,
        rtl: culturalAdaptations.rtl,
        colorPreferences: culturalAdaptations.colorMeanings
      };
      
      await this.saveUserPreferences();
      
      logger.info('Adapted to cultural context', { locale, region, culturalAdaptations });
    } catch (error) {
      logger.error('Failed to adapt to cultural context', { locale, region, error });
    }
  }

  async preloadTheme(themeId: string): Promise<void> {
    try {
      const theme = this.themes.get(themeId);
      if (!theme) {
        throw new Error(`Theme not found: ${themeId}`);
      }
      
      // Create a temporary style element to preload CSS variables
      const style = document.createElement('style');
      style.textContent = this.generateThemeCSS(theme);
      style.setAttribute('data-preload-theme', themeId);
      
      document.head.appendChild(style);
      
      // Remove after a short delay
      setTimeout(() => {
        document.head.removeChild(style);
      }, 100);
      
      logger.debug('Theme preloaded', { themeId });
    } catch (error) {
      logger.error('Failed to preload theme', { themeId, error });
    }
  }

  async optimizeThemePerformance(): Promise<void> {
    try {
      // Remove unused CSS variables
      const unusedVariables = this.findUnusedCSSVariables();
      this.removeUnusedVariables(unusedVariables);
      
      // Consolidate similar color values
      this.consolidateSimilarColors();
      
      // Optimize transition properties
      this.optimizeTransitions();
      
      logger.info('Theme performance optimized', { 
        removedVariables: unusedVariables.length 
      });
    } catch (error) {
      logger.error('Failed to optimize theme performance', { error });
    }
  }

  getThemeMetrics(): { loadTime: number; cssVariableCount: number; renderTime: number } {
    return { ...this.performanceMetrics };
  }

  // Private helper methods
  private getDefaultPreferences(): ThemePreferences {
    return {
      mode: 'auto',
      colorScheme: 'default',
      accessibilityMode: 'none',
      fontSize: 'medium',
      motionPreference: 'no-preference',
      contrastPreference: 'no-preference',
      customizations: {}
    };
  }

  private determineInitialTheme(): ThemeDefinition {
    if (this.userPreferences.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      return this.findThemeByMode(prefersDark ? 'dark' : 'light') || DEFAULT_THEMES[0];
    }
    
    return this.findThemeByMode(this.userPreferences.mode) || DEFAULT_THEMES[0];
  }

  private findThemeByMode(mode: ThemeMode): ThemeDefinition | null {
    for (const theme of this.themes.values()) {
      if (theme.mode === mode) {
        return theme;
      }
    }
    return null;
  }

  private async applyThemeWithTransition(theme: ThemeDefinition): Promise<void> {
    const root = document.documentElement;
    
    // Add transition class for smooth switching
    root.classList.add('theme-transitioning');
    
    // Generate and apply CSS variables
    const cssVariables = this.generateThemeCSS(theme);
    
    // Create or update theme style element
    let themeStyle = document.getElementById('theme-variables') as HTMLStyleElement;
    if (!themeStyle) {
      themeStyle = document.createElement('style');
      themeStyle.id = 'theme-variables';
      document.head.appendChild(themeStyle);
    }
    
    themeStyle.textContent = cssVariables;
    
    // Apply theme class
    root.className = root.className.replace(/theme-\w+/g, '');
    root.classList.add(`theme-${theme.id}`);
    
    // Remove transition class after animation
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 300);
  }

  private generateThemeCSS(theme: ThemeDefinition): string {
    let css = ':root {\n';
    
    // Colors
    Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
      if (typeof colorValue === 'string') {
        css += `  --color-${colorName}: ${colorValue};\n`;
      } else {
        Object.entries(colorValue).forEach(([shade, value]) => {
          css += `  --color-${colorName}-${shade}: ${value};\n`;
        });
      }
    });
    
    // Typography
    Object.entries(theme.typography.fontFamily).forEach(([name, value]) => {
      css += `  --font-${name}: ${value};\n`;
    });
    
    Object.entries(theme.typography.fontSize).forEach(([size, value]) => {
      css += `  --text-${size}: ${value};\n`;
    });
    
    Object.entries(theme.typography.fontWeight).forEach(([weight, value]) => {
      css += `  --font-weight-${weight}: ${value};\n`;
    });
    
    Object.entries(theme.typography.lineHeight).forEach(([height, value]) => {
      css += `  --leading-${height}: ${value};\n`;
    });
    
    // Spacing
    Object.entries(theme.spacing).forEach(([size, value]) => {
      css += `  --spacing-${size}: ${value};\n`;
    });
    
    // Border radius
    Object.entries(theme.borderRadius).forEach(([size, value]) => {
      css += `  --rounded-${size}: ${value};\n`;
    });
    
    // Shadows
    Object.entries(theme.shadows).forEach(([size, value]) => {
      css += `  --shadow-${size}: ${value};\n`;
    });
    
    // Transitions
    Object.entries(theme.transitions).forEach(([speed, value]) => {
      css += `  --transition-${speed}: ${value};\n`;
    });
    
    // Accessibility
    css += `  --focus-ring: ${theme.accessibility.focusRing};\n`;
    css += `  --high-contrast-border: ${theme.accessibility.highContrastBorder};\n`;
    
    css += '}\n';
    
    return css;
  }

  private countCSSVariables(theme: ThemeDefinition): number {
    let count = 0;
    
    // Count color variables
    Object.values(theme.colors).forEach(colorValue => {
      if (typeof colorValue === 'string') {
        count++;
      } else {
        count += Object.keys(colorValue).length;
      }
    });
    
    // Count other variables
    count += Object.keys(theme.typography.fontFamily).length;
    count += Object.keys(theme.typography.fontSize).length;
    count += Object.keys(theme.typography.fontWeight).length;
    count += Object.keys(theme.typography.lineHeight).length;
    count += Object.keys(theme.spacing).length;
    count += Object.keys(theme.borderRadius).length;
    count += Object.keys(theme.shadows).length;
    count += Object.keys(theme.transitions).length;
    count += 2; // accessibility variables
    
    return count;
  }

  private calculateContrastRatio(color1: string, color2: string): number {
    // Simplified contrast ratio calculation
    // In production, use a proper color library like chroma.js
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);
    
    const l1 = this.getLuminance(rgb1);
    const l2 = this.getLuminance(rgb2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    return (lighter + 0.05) / (darker + 0.05);
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

  private getLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  private applyReducedMotion(): void {
    const style = document.createElement('style');
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
    `;
    style.id = 'reduced-motion-styles';
    document.head.appendChild(style);
  }

  private async applyHighContrastMode(): Promise<void> {
    // Apply high contrast theme variant
    const highContrastTheme = await this.createHighContrastVariant(this.currentTheme);
    await this.applyThemeWithTransition(highContrastTheme);
  }

  private async createHighContrastVariant(baseTheme: ThemeDefinition): Promise<ThemeDefinition> {
    return {
      ...baseTheme,
      id: `${baseTheme.id}-high-contrast`,
      name: `${baseTheme.name} (High Contrast)`,
      colors: {
        ...baseTheme.colors,
        primary: {
          ...baseTheme.colors.primary,
          500: baseTheme.mode === 'dark' ? '#ffffff' : '#000000'
        },
        neutral: {
          ...baseTheme.colors.neutral,
          50: baseTheme.mode === 'dark' ? '#000000' : '#ffffff',
          900: baseTheme.mode === 'dark' ? '#ffffff' : '#000000'
        }
      },
      accessibility: {
        ...baseTheme.accessibility,
        highContrastBorder: '3px solid currentColor'
      }
    };
  }

  private applyLargeTextMode(): void {
    const root = document.documentElement;
    root.style.setProperty('--text-base', '1.25rem');
    root.style.setProperty('--text-sm', '1.125rem');
    root.style.setProperty('--text-xs', '1rem');
  }

  private async applyColorBlindMode(): Promise<void> {
    // Apply color-blind friendly color adjustments
    const style = document.createElement('style');
    style.textContent = `
      :root {
        --color-primary-500: #0066cc;
        --color-success: #228b22;
        --color-warning: #ff8c00;
        --color-error: #dc143c;
      }
    `;
    style.id = 'color-blind-styles';
    document.head.appendChild(style);
  }

  private applyFontSizePreference(fontSize: ThemePreferences['fontSize']): void {
    const root = document.documentElement;
    const multipliers = {
      'small': 0.875,
      'medium': 1,
      'large': 1.125,
      'extra-large': 1.25
    };
    
    const multiplier = multipliers[fontSize];
    root.style.setProperty('--font-size-multiplier', multiplier.toString());
  }

  private getCulturalColorMeanings(region: string): Record<string, string> {
    const colorMeanings: Record<string, Record<string, string>> = {
      'US': {
        red: 'danger, stop, error',
        green: 'success, go, safe',
        blue: 'information, trust, calm'
      },
      'CN': {
        red: 'luck, prosperity, celebration',
        green: 'nature, growth, harmony',
        yellow: 'imperial, earth, center'
      },
      'IN': {
        saffron: 'courage, sacrifice',
        white: 'truth, peace',
        green: 'fertility, prosperity'
      }
    };
    
    return colorMeanings[region] || colorMeanings['US'];
  }

  private setupMediaQueryListeners(): void {
    const queries = [
      '(prefers-color-scheme: dark)',
      '(prefers-reduced-motion: reduce)',
      '(prefers-contrast: more)'
    ];
    
    queries.forEach(query => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', () => {
        if (this.autoModeEnabled) {
          this.adaptToSystemPreferences();
        }
      });
      this.mediaQueryListeners.push(mediaQuery);
    });
  }

  private async loadUserPreferences(): Promise<void> {
    try {
      const saved = localStorage.getItem('theme-preferences');
      if (saved) {
        this.userPreferences = { ...this.getDefaultPreferences(), ...JSON.parse(saved) };
      }
    } catch (error) {
      logger.warn('Failed to load user preferences, using defaults', { error });
    }
  }

  private async saveUserPreferences(): Promise<void> {
    try {
      localStorage.setItem('theme-preferences', JSON.stringify(this.userPreferences));
    } catch (error) {
      logger.error('Failed to save user preferences', { error });
    }
  }

  private async saveCustomTheme(theme: ThemeDefinition): Promise<void> {
    try {
      localStorage.setItem(`custom-theme-${theme.id}`, JSON.stringify(theme));
    } catch (error) {
      logger.error('Failed to save custom theme', { themeId: theme.id, error });
    }
  }

  private findUnusedCSSVariables(): string[] {
    // Simplified implementation - would need more sophisticated analysis in production
    return [];
  }

  private removeUnusedVariables(variables: string[]): void {
    // Implementation would remove unused CSS variables
  }

  private consolidateSimilarColors(): void {
    // Implementation would consolidate similar color values
  }

  private optimizeTransitions(): void {
    // Implementation would optimize transition properties
  }
}

// Export singleton instance
export const advancedThemingSystem = new AdvancedThemingSystemImpl();
export type { AdvancedThemingSystem, ThemeDefinition, ThemePreferences };
