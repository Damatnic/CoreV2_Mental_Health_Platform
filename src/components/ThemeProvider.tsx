/**
 * Theme Provider Component
 * Provides theme context and management for the application
 */

import * as React from 'react';
const { useState, useEffect, useCallback, useMemo } = React;
import { ThemeContext, Theme, ThemeMode } from '../contexts/ThemeContext';

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  defaultMode?: ThemeMode;
}

const ThemeProvider: React.FC<ThemeProviderProps> = ({
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

    // Set initial system theme
    updateSystemTheme(mediaQuery);
    
    // Listen for changes
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
    
    // Apply theme to document
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
    setMode(newTheme); // When manually setting theme, mode follows theme
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

  const contextValue = useMemo(() => ({
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

export { ThemeProvider };
export default ThemeProvider;