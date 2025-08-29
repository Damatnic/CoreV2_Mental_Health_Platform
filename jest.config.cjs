/** @type {import('jest').Config} */
module.exports = {
  // Use node test environment 
  testEnvironment: 'node',
  
  setupFilesAfterEnv: [
    '<rootDir>/jest-setup-node.js'
  ],
  setupFiles: ['<rootDir>/jest-env-setup.js'],
  
  // Skip transforms for now
  transform: {},
  
  transformIgnorePatterns: [
    'node_modules/(?!(expo-auth-session|expo-constants|@expo|react-markdown|remark-gfm)/)'
  ],
  
  moduleNameMapper: {
    '^workbox-(.*)$': '<rootDir>/tests/__mocks__/workbox-$1.js',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/tests/__mocks__/fileMock.js',
    '^@/(.*)$': '<rootDir>/src/$1'
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
  
  coverageReporters: ['text', 'lcov', 'clover', 'html'],
  coverageDirectory: 'coverage',
  
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    './src/components/safety/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './src/services/crisis*': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  verbose: true,
  testTimeout: 10000
};
