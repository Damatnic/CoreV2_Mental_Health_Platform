/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: [
    '<rootDir>/src/setupTests.ts'
  ],
  setupFiles: ['<rootDir>/jest-env-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(expo-auth-session|expo-constants|@expo|react-markdown|remark-gfm)/)'
  ],
  moduleNameMapper: {
    '^workbox-(.*)$': '<rootDir>/tests/__mocks__/workbox-$1.js',
    '\\.css$': 'identity-obj-proxy',
    '\\.module\\.css$': 'identity-obj-proxy',
    '^../contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx',
    '^./contexts/AuthContext$': '<rootDir>/src/contexts/__mocks__/AuthContext.tsx',
    '^../contexts/ThemeContext$': '<rootDir>/src/contexts/__mocks__/ThemeContext.tsx',
    '^./contexts/ThemeContext$': '<rootDir>/src/contexts/__mocks__/ThemeContext.tsx',
    '^../contexts/NotificationContext$': '<rootDir>/src/contexts/__mocks__/NotificationContext.tsx',
    '^./contexts/NotificationContext$': '<rootDir>/src/contexts/__mocks__/NotificationContext.tsx'
  },
  testMatch: [
    '<rootDir>/src/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/accessibility/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/integration/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/performance/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/service-worker/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/services/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/unit/**/*.test.{js,jsx,ts,tsx}',
    '<rootDir>/tests/views/**/*.test.{js,jsx,ts,tsx}'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/',
    '/tests/mobile/',
    '/tests/pwa/',
    '\\.spec\\.(ts|tsx|js|jsx)$'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/test-utils.tsx'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageDirectory: 'coverage',
  verbose: true,
  // Service Worker specific configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        types: ['jest', '@testing-library/jest-dom', 'node']
      },
      useESM: false
    }]
  },
  preset: 'ts-jest',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testTimeout: 10000
};
