import React, { createContext, useContext, ReactNode } from 'react';
import { Theme } from '../../types';

interface AppTheme {
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    accentPrimary: string;
    accentPrimaryHover: string;
    accentPrimaryText: string;
    accentDanger: string;
    accentSuccess: string;
    borderColor: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
}

interface ThemeContextType {
  theme: Theme;
  themeConfig: AppTheme;
  toggleTheme: () => void;
}

const mockThemeConfig: AppTheme = {
  colors: {
    bgPrimary: "#f7f9fc",
    bgSecondary: '#FFFFFF',
    bgTertiary: "#eef2f7",
    textPrimary: "#2c3e50",
    textSecondary: "#7f8c8d",
    accentPrimary: "#3498db",
    accentPrimaryHover: '#2980b9',
    accentPrimaryText: "#ffffff",
    accentDanger: "#e74c3c",
    accentSuccess: '#2ecc71',
    borderColor: "#e0e6ed"
  },
  spacing: {
    xs: "0.25rem",
    sm: "0.5rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2.5rem"
  },
  radius: {
    sm: "4px",
    md: "8px",
    lg: "12px"
  }
};

const defaultThemeContext: ThemeContextType = {
  theme: "light",
  themeConfig: mockThemeConfig,
  toggleTheme: jest.fn()
};

const ThemeContext = createContext<ThemeContextType>(defaultThemeContext);

export { ThemeContext };

export const ThemeProvider: React.FC<{ children: ReactNode; value?: Partial<ThemeContextType> }> = ({
  children,
  value = {}
}) => {
  const contextValue = { ...defaultThemeContext, ...value };
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    return defaultThemeContext;
  }
  return context;
};