/**
 * Global service mocks for tests
 * These mocks provide default implementations for commonly used services
 */

// Crisis Detection Service Mock
export const mockCrisisDetectionService = {
  detectCrisis: jest.fn(() => ({
    isInCrisis: false,
    severity: 'none' as const,
    confidence: 0,
    keywords: [],
    suggestedActions: []
  })),
  analyzeMoodPattern: jest.fn(() => ({
    trend: 'stable' as const,
    riskLevel: 'low' as const,
    recommendations: []
  })),
  updateContext: jest.fn(),
  reset: jest.fn(),
  getState: jest.fn(() => ({
    isInCrisis: false,
    lastCheck: Date.now()
  }))
};

// Performance Monitor Service Mock
export const mockPerformanceMonitor = {
  startMeasure: jest.fn(),
  endMeasure: jest.fn(() => 100),
  trackMetric: jest.fn(),
  trackEvent: jest.fn(),
  trackError: jest.fn(),
  getMetrics: jest.fn(() => ({
    pageLoad: 1000,
    firstContentfulPaint: 500,
    timeToInteractive: 1500
  })),
  clearMetrics: jest.fn(),
  flush: jest.fn(() => Promise.resolve())
};

// Analytics Service Mock
export const mockAnalyticsService = {
  track: jest.fn(),
  identify: jest.fn(),
  page: jest.fn(),
  trackEvent: jest.fn(),
  trackError: jest.fn(),
  setUserProperties: jest.fn(),
  reset: jest.fn()
};

// Auth Service Mock
export const mockAuthService = {
  login: jest.fn(() => Promise.resolve({
    token: 'mock-token',
    user: {
      id: 'test-user',
      email: 'test@example.com'
    }
  })),
  logout: jest.fn(() => Promise.resolve()),
  register: jest.fn(() => Promise.resolve({
    token: 'mock-token',
    user: {
      id: 'test-user',
      email: 'test@example.com'
    }
  })),
  refreshToken: jest.fn(() => Promise.resolve('new-mock-token')),
  getCurrentUser: jest.fn(() => ({
    id: 'test-user',
    email: 'test@example.com'
  })),
  isAuthenticated: jest.fn(() => true),
  getToken: jest.fn(() => 'mock-token')
};

// Notification Service Mock
export const mockNotificationService = {
  requestPermission: jest.fn(() => Promise.resolve('granted')),
  showNotification: jest.fn(() => Promise.resolve()),
  scheduleNotification: jest.fn(() => Promise.resolve('notification-id')),
  cancelNotification: jest.fn(() => Promise.resolve()),
  getPermissionStatus: jest.fn(() => 'granted'),
  isSupported: jest.fn(() => true)
};

// WebSocket Service Mock
export const mockWebSocketService = {
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(),
  send: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn(),
  getState: jest.fn(() => 'connected'),
  isConnected: jest.fn(() => true)
};

// Cache Service Mock
export const mockCacheService = {
  get: jest.fn((_key) => Promise.resolve(null)),
  set: jest.fn(() => Promise.resolve()),
  delete: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
  has: jest.fn(() => Promise.resolve(false)),
  getAll: jest.fn(() => Promise.resolve({})),
  size: jest.fn(() => Promise.resolve(0))
};

// Enhanced Crisis Detection Service Mock
export const mockEnhancedCrisisDetectionService = {
  analyzeCrisisContent: jest.fn(() => ({
    hasCrisisIndicators: false,
    severityLevel: 'low',
    crisisTypes: [],
    confidence: 0.1,
    keywords: [],
    interventionRecommendations: []
  })),
  analyzeMessageRisk: jest.fn(() => ({
    riskLevel: 'low',
    indicators: [],
    confidence: 0.1
  })),
  getInterventionRecommendations: jest.fn(() => []),
  updateThresholds: jest.fn(),
  reset: jest.fn()
};

// AI Moderation Service Mock
export const mockAIModerationService = {
  moderateMessage: jest.fn(() => ({
    safe: true,
    category: null,
    escalate: false,
    confidence: 0.9
  })),
  generateSafeResponse: jest.fn(() => 'Content has been moderated for safety.'),
  sanitizeForDisplay: jest.fn((text) => text),
  needsHumanIntervention: jest.fn(() => false),
  reportViolation: jest.fn(() => Promise.resolve()),
  updateRules: jest.fn()
};

// Error Tracking Service Mock
export const mockErrorTrackingService = {
  captureError: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setContext: jest.fn(),
  setTag: jest.fn(),
  setUser: jest.fn(),
  withScope: jest.fn((callback) => callback({})),
  flush: jest.fn(() => Promise.resolve())
};

// Core Web Vitals Service Mock
export const mockCoreWebVitalsService = {
  initialize: jest.fn(() => Promise.resolve()),
  generateReport: jest.fn(() => Promise.resolve({
    timestamp: Date.now(),
    url: 'http://localhost',
    metrics: {
      lcp: 1200,
      fid: 80,
      cls: 0.05,
      fcp: 800,
      ttfb: 200
    },
    grade: 'A'
  })),
  getPerformanceSummary: jest.fn(() => ({
    overall: 'good',
    metrics: {},
    recommendations: []
  })),
  trackMetric: jest.fn(),
  reset: jest.fn()
};

// Privacy Preserving Analytics Service Mock
export const mockPrivacyPreservingAnalyticsService = {
  initialize: jest.fn(() => Promise.resolve()),
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  setUserProperties: jest.fn(),
  flush: jest.fn(() => Promise.resolve()),
  getInsights: jest.fn(() => Promise.resolve({})),
  reset: jest.fn()
};

// Enhanced Offline Service Mock
export const mockEnhancedOfflineService = {
  initialize: jest.fn(() => Promise.resolve()),
  isOnline: jest.fn(() => true),
  getOfflineCapabilities: jest.fn(() => ({
    canCache: true,
    canSync: true,
    hasStorageQuota: true
  })),
  addToSyncQueue: jest.fn(),
  processSyncQueue: jest.fn(() => Promise.resolve()),
  getQueueStatus: jest.fn(() => ({ pending: 0, failed: 0 })),
  clearQueue: jest.fn()
};

// Peer Support Network Service Mock
export const mockPeerSupportNetworkService = {
  initialize: jest.fn(() => Promise.resolve()),
  connect: jest.fn(() => Promise.resolve()),
  disconnect: jest.fn(),
  sendMessage: jest.fn(),
  joinGroup: jest.fn(() => Promise.resolve()),
  leaveGroup: jest.fn(),
  getActiveConnections: jest.fn(() => []),
  reportUser: jest.fn(() => Promise.resolve())
};

// Export all mocks as a single object for easy importing
export const serviceMocks = {
  crisisDetection: mockCrisisDetectionService,
  enhancedCrisisDetection: mockEnhancedCrisisDetectionService,
  aiModeration: mockAIModerationService,
  performance: mockPerformanceMonitor,
  analytics: mockAnalyticsService,
  auth: mockAuthService,
  notification: mockNotificationService,
  websocket: mockWebSocketService,
  cache: mockCacheService,
  errorTracking: mockErrorTrackingService,
  coreWebVitals: mockCoreWebVitalsService,
  privacyAnalytics: mockPrivacyPreservingAnalyticsService,
  enhancedOffline: mockEnhancedOfflineService,
  peerSupport: mockPeerSupportNetworkService
};

// Helper function to reset all service mocks
export const resetAllServiceMocks = () => {
  Object.values(serviceMocks).forEach(service => {
    Object.values(service).forEach(method => {
      if (typeof method === 'function' && method.mockReset) {
        method.mockReset();
      }
    });
  });
};

// Helper function to setup default mock implementations
export const setupDefaultMocks = () => {
  // Ensure storage mocks are working and populate with default values
  if (typeof localStorage !== 'undefined' && localStorage.setItem) {
    localStorage.setItem('theme', 'light');
    localStorage.setItem('userPreferences', JSON.stringify({
      notifications: true,
      soundEnabled: false
    }));
  }

  if (typeof sessionStorage !== 'undefined' && sessionStorage.setItem) {
    sessionStorage.setItem('sessionId', 'test-session');
  }

  // Setup fetch to return successful responses by default
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    headers: new Headers(),
    clone: () => ({
      ok: true,
      status: 200,
      json: async () => ({})
    })
  });
};

export default serviceMocks;