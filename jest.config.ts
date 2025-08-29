/**
 * Jest Configuration for Mental Health Platform
 * Provides comprehensive test infrastructure with TypeScript support
 */

import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Test environment configuration
  testEnvironment: 'jsdom',
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
  setupFiles: ['<rootDir>/jest-env-setup.js'],
  
  // Module resolution
  moduleNameMapper: {
    // Mock CSS modules
    '\\.css$': 'identity-obj-proxy',
    '\\.module\\.css$': 'identity-obj-proxy',
    
    // Mock static assets
    '\\.(jpg|jpeg|png|gif|svg|webp)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '\\.(mp4|webm|ogg|mp3|wav|flac|aac)$': '<rootDir>/tests/__mocks__/fileMock.js',
    
    // Mock service worker
    '^workbox-(.*)$': '<rootDir>/tests/__mocks__/workbox-$1.js',
    
    // Path aliases
    '^@/(.*)$': '<rootDir>/src/$1',
    
    // Mock contexts for testing
    '^../contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx',
    '^./contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx',
    '^../contexts/ThemeContext$': '<rootDir>/src/contexts/__mocks__/ThemeContext.tsx',
    '^./contexts/ThemeContext$': '<rootDir>/src/contexts/__mocks__/ThemeContext.tsx',
    '^../contexts/NotificationContext$': '<rootDir>/src/contexts/__mocks__/NotificationContext.tsx',
    '^./contexts/NotificationContext$': '<rootDir>/src/contexts/__mocks__/NotificationContext.tsx'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        types: ['jest', '@testing-library/jest-dom', 'node'],
        moduleResolution: 'node',
        strict: false,
        noImplicitAny: false
      },
      useESM: false,
      isolatedModules: true
    }]
  },
  
  // Ignore transformation for certain packages
  transformIgnorePatterns: [
    'node_modules/(?!(expo-auth-session|expo-constants|@expo|react-markdown|remark-gfm)/)'
  ],
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.{test,spec}.{ts,tsx}',
    '<rootDir>/tests/**/*.test.{ts,tsx}',
    '<rootDir>/tests/**/*.spec.{ts,tsx}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/.next/',
    '/coverage/',
    '/tests/e2e/', // E2E tests use Playwright
    '/tests/mobile/', // Mobile-specific tests
    '/tests/pwa/' // PWA-specific tests
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/test-utils/**',
    '!src/types/**',
    '!src/index.tsx',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70
    },
    // Critical mental health components require higher coverage
    './src/services/crisisDetectionService.ts': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95
    },
    './src/services/emergencyProtocolService.ts': {
      branches: 90,
      functions: 90,
      lines: 95,
      statements: 95
    }
  },
  
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageDirectory: 'coverage',
  
  // Test execution configuration
  verbose: true,
  testTimeout: 10000,
  maxWorkers: '50%',
  
  // Globals configuration
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  },
  
  // Watch mode configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Roots for module resolution
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  // Display configuration
  displayName: {
    name: 'Mental Health Platform',
    color: 'blue'
  },
  
  // Error handling
  bail: false,
  errorOnDeprecated: true,
  
  // Notification configuration (for local development)
  notify: false,
  notifyMode: 'failure-change'
};

export default config;