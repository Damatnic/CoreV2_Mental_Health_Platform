import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Testing Configuration
 * Optimized for mental health platform critical user flows
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['json', { outputFile: 'test-results/test-results.json' }]
  ],
  use: {
    baseURL: process.env.CI ? 'https://astralcore.netlify.app' : 'http://localhost:8888',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable clipboard access for crisis resource sharing
        permissions: ['clipboard-read', 'clipboard-write'],
        // Mental health platform specific settings
        contextOptions: {
          // Ensure privacy for sensitive mental health data
          recordVideo: process.env.CI ? undefined : { dir: 'test-results/videos' },
          recordHar: process.env.CI ? undefined : { path: 'test-results/har/test.har' }
        }
      },
    },
    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },

    // Mobile testing for crisis scenarios on the go
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
        permissions: ['clipboard-read', 'clipboard-write', 'geolocation']
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
        permissions: ['clipboard-read', 'clipboard-write', 'geolocation']
      },
    },

    // Accessibility testing configuration
    {
      name: 'accessibility',
      use: {
        ...devices['Desktop Chrome'],
        // Screen reader simulation
        extraHTTPHeaders: {
          'User-Agent': 'accessibility-test-runner'
        }
      },
    }
  ],

  // Development server for testing
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 8888,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes for mental health platform to start
  },

  // Global setup for crisis testing environment
  globalSetup: require.resolve('./tests/e2e/global-setup'),
  globalTeardown: require.resolve('./tests/e2e/global-teardown'),

  // Test timeout optimized for mental health workflows
  timeout: 30000,
  expect: {
    // Crisis response timeouts
    timeout: 5000
  },

  // Output directories
  outputDir: 'test-results/'
});
