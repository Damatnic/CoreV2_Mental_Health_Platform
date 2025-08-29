// K6 Test Configuration for Mental Health Platform
// This file contains shared configuration and utilities for all K6 tests

export const config = {
  // Base URLs for different environments
  environments: {
    local: 'http://localhost:3000',
    staging: 'https://staging.mentalhealthapp.test',
    production: 'https://api.mentalhealthapp.com'
  },
  
  // WebSocket URLs
  wsEnvironments: {
    local: 'ws://localhost:3000',
    staging: 'wss://staging.mentalhealthapp.test',
    production: 'wss://ws.mentalhealthapp.com'
  },
  
  // Common test thresholds for mental health app
  commonThresholds: {
    // Response time thresholds
    'http_req_duration': ['avg<1000', 'p(95)<2000', 'p(99)<5000'],
    'http_req_failed': ['rate<0.01'], // Less than 1% failure rate
    
    // Critical service thresholds (stricter)
    'http_req_duration{endpoint:crisis_detection}': ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{endpoint:emergency_escalation}': ['p(99)<200'],
    'http_req_duration{endpoint:988_connection}': ['p(95)<300'],
    
    // Authentication thresholds
    'http_req_duration{endpoint:auth_login}': ['p(90)<800'],
    'http_req_duration{endpoint:auth_register}': ['p(95)<1500'],
    
    // Teletherapy session thresholds
    'http_req_duration{endpoint:session_join}': ['p(95)<3000'],
    'http_req_duration{endpoint:media_negotiation}': ['p(90)<1000'],
  },
  
  // Test data templates
  testData: {
    users: {
      regular: {
        email: 'test@example.com',
        password: 'SecurePassword123!',
        role: 'user'
      },
      therapist: {
        email: 'therapist@example.com',
        password: 'TherapistPassword123!',
        role: 'therapist'
      },
      admin: {
        email: 'admin@example.com',
        password: 'AdminPassword123!',
        role: 'admin'
      }
    },
    
    crisisScenarios: {
      low: {
        input: 'I feel a bit sad today but I know it will pass',
        expectedRisk: 'low',
        shouldEscalate: false
      },
      moderate: {
        input: 'I have been feeling hopeless for weeks and don\'t see the point',
        expectedRisk: 'moderate',
        shouldEscalate: false
      },
      high: {
        input: 'I don\'t want to live anymore and think about dying every day',
        expectedRisk: 'high',
        shouldEscalate: true
      },
      critical: {
        input: 'I have pills and I am going to take them all tonight',
        expectedRisk: 'critical',
        shouldEscalate: true
      }
    }
  },
  
  // Load test scenarios
  loadScenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
    },
    
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 20 },
        { duration: '5m', target: 20 },
        { duration: '2m', target: 0 },
      ],
    },
    
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '5m', target: 50 },
        { duration: '2m', target: 100 },
        { duration: '5m', target: 100 },
        { duration: '2m', target: 0 },
      ],
    },
    
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '10s', target: 0 },
      ],
    },
    
    volume: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 50 },
        { duration: '10m', target: 100 },
        { duration: '5m', target: 200 },
        { duration: '10m', target: 200 },
        { duration: '5m', target: 0 },
      ],
    }
  }
};

// Utility functions for K6 tests
export class TestUtils {
  static getEnvironmentConfig(env = 'local') {
    return {
      baseUrl: config.environments[env] || config.environments.local,
      wsUrl: config.wsEnvironments[env] || config.wsEnvironments.local
    };
  }
  
  static generateTestUser(role = 'regular') {
    const baseUser = config.testData.users[role] || config.testData.users.regular;
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    
    return {
      ...baseUser,
      email: `test-${timestamp}-${random}@example.com`,
      userId: `user-${timestamp}-${random}`
    };
  }
  
  static getCrisisScenario(riskLevel = 'low') {
    return config.testData.crisisScenarios[riskLevel] || config.testData.crisisScenarios.low;
  }
  
  static getLoadScenario(scenarioType = 'load') {
    return config.loadScenarios[scenarioType] || config.loadScenarios.load;
  }
  
  static createAuthHeaders(token = 'test-token') {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Requested-With': 'XMLHttpRequest',
      'User-Agent': 'K6-LoadTest/1.0'
    };
  }
  
  static generateSessionId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  static validateResponse(response, expectedStatus = 200) {
    return {
      'status is correct': (r) => r.status === expectedStatus,
      'response time acceptable': (r) => r.timings.duration < 5000,
      'no server errors': (r) => r.status < 500,
      'content type is JSON': (r) => r.headers['Content-Type'] && r.headers['Content-Type'].includes('application/json')
    };
  }
  
  static validateCrisisResponse(response) {
    return {
      ...TestUtils.validateResponse(response),
      'risk level provided': (r) => r.json('riskLevel') !== undefined,
      'confidence score present': (r) => r.json('confidence') !== undefined && r.json('confidence') >= 0 && r.json('confidence') <= 1,
      'recommendations provided': (r) => r.json('recommendations') && Array.isArray(r.json('recommendations')),
      'intervention ID present': (r) => r.json('interventionId') !== undefined
    };
  }
  
  static validateSessionResponse(response) {
    return {
      ...TestUtils.validateResponse(response),
      'session ID provided': (r) => r.json('sessionId') !== undefined,
      'WebRTC config present': (r) => r.json('webrtcConfig') !== undefined,
      'meeting room created': (r) => r.json('meetingRoom') !== undefined
    };
  }
  
  static simulateThinkTime(min = 1, max = 3) {
    return Math.random() * (max - min) + min;
  }
  
  static createMetricTags(endpoint, userType = 'user', scenario = 'default') {
    return {
      endpoint: endpoint,
      user_type: userType,
      scenario: scenario,
      environment: __ENV.ENVIRONMENT || 'local'
    };
  }
  
  // HIPAA compliance validation
  static validateHIPAACompliance(response) {
    return {
      'uses HTTPS': (r) => r.url.startsWith('https://') || __ENV.ENVIRONMENT === 'local',
      'has security headers': (r) => {
        const headers = r.headers;
        return headers['Strict-Transport-Security'] || 
               headers['X-Content-Type-Options'] || 
               headers['X-Frame-Options'];
      },
      'no sensitive data in logs': (r) => {
        const body = typeof r.body === 'string' ? r.body : JSON.stringify(r.body);
        return !body.includes('ssn') && 
               !body.includes('social-security') && 
               !body.includes('medical-record');
      }
    };
  }
  
  // Performance benchmarking
  static createPerformanceBenchmark(operationName) {
    return {
      start: Date.now(),
      end: null,
      duration: function() {
        this.end = Date.now();
        return this.end - this.start;
      },
      logResult: function() {
        const duration = this.duration();
        console.log(`${operationName} completed in ${duration}ms`);
        return duration;
      }
    };
  }
}

// Export default configuration
export default config;