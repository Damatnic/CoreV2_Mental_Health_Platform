import React, { createContext, useState, useContext, ReactNode, useEffect, useMemo, useCallback } from 'react';

export type Theme = 'light' | 'dark';
export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: ThemeMode;
  systemTheme: Theme;
  changeTheme: (theme: Theme) => void;
  changeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isSystem: boolean;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: Theme;
  defaultMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'light',
  defaultMode = 'system'
}) => {
  const [theme, setTheme] = useState<Theme>(defaultTheme);
  const [mode, setMode] = useState<ThemeMode>(defaultMode);
  const [systemTheme, setSystemTheme] = useState<Theme>('light');

  // Detect system theme preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateSystemTheme = (e: MediaQueryListEvent | MediaQueryList) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    updateSystemTheme(mediaQuery);
    mediaQuery.addEventListener('change', updateSystemTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateSystemTheme);
    };
  }, []);

  // Update theme based on mode and system preference
  useEffect(() => {
    let effectiveTheme: Theme;
    
    switch (mode) {
      case 'light':
        effectiveTheme = 'light';
        break;
      case 'dark':
        effectiveTheme = 'dark';
        break;
      case 'system':
      default:
        effectiveTheme = systemTheme;
        break;
    }
    
    setTheme(effectiveTheme);
    document.documentElement.setAttribute('data-theme', effectiveTheme);
    document.documentElement.className = `theme-${effectiveTheme}`;
  }, [mode, systemTheme]);

  // Load saved theme preference on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('theme-mode') as ThemeMode;
    if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
      setMode(savedMode);
    }
  }, []);

  const changeTheme = useCallback((newTheme: Theme) => {
    setTheme(newTheme);
    setMode(newTheme);
    localStorage.setItem('theme-mode', newTheme);
  }, []);

  const changeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('theme-mode', newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    changeTheme(newTheme);
  }, [theme, changeTheme]);

  const contextValue = useMemo((): ThemeContextType => ({
    theme,
    mode,
    systemTheme,
    changeTheme,
    changeMode,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light',
    isSystem: mode === 'system'
  }), [theme, mode, systemTheme, changeTheme, changeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeProvider;