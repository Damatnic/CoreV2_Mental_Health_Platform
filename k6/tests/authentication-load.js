import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for mental health app
const loginRate = new Rate('login_success_rate');
const loginDuration = new Trend('login_duration');
const crisisResponseTime = new Trend('crisis_response_time');

// Test configuration for different load scenarios
export const options = {
  stages: [
    // Ramp up
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '3m', target: 100 },  // Ramp up to 100 users
    { duration: '10m', target: 100 }, // Stay at 100 users for 10 minutes
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    // Authentication must be fast and reliable
    'http_req_duration': ['p(95)<2000'], // 95% of requests under 2s
    'login_success_rate': ['rate>0.99'], // 99% success rate
    'login_duration': ['p(90)<1500'],    // 90% of logins under 1.5s
    'crisis_response_time': ['p(99)<1000'], // Crisis responses under 1s
    'http_req_failed': ['rate<0.01'],    // Less than 1% errors
  },
};

// Test data
const testUsers = [
  { email: 'load1@test.com', password: 'LoadTest123!' },
  { email: 'load2@test.com', password: 'LoadTest123!' },
  { email: 'load3@test.com', password: 'LoadTest123!' },
  { email: 'load4@test.com', password: 'LoadTest123!' },
  { email: 'load5@test.com', password: 'LoadTest123!' },
];

export function setup() {
  // Setup test data if needed
  console.log('Starting authentication load test for Mental Health Platform');
  
  // Health check
  const healthCheck = http.get(`${__ENV.BASE_URL}/health`);
  check(healthCheck, {
    'health check passes': (r) => r.status === 200,
  });
  
  return { baseUrl: __ENV.BASE_URL || 'http://localhost:3000' };
}

export default function (data) {
  const baseUrl = data.baseUrl;
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  // Test user authentication flow
  testLoginFlow(baseUrl, user);
  
  // Test crisis detection endpoint (if user stays logged in)
  if (Math.random() < 0.1) { // 10% of users trigger crisis test
    testCrisisEndpoint(baseUrl);
  }
  
  sleep(Math.random() * 3 + 1); // Random think time 1-4 seconds
}

function testLoginFlow(baseUrl, user) {
  const loginStart = Date.now();
  
  // Step 1: Get auth page
  const authPage = http.get(`${baseUrl}/auth`);
  check(authPage, {
    'auth page loads': (r) => r.status === 200,
    'auth page has login form': (r) => r.body.includes('data-testid="login-button"'),
  });
  
  // Step 2: Attempt login
  const loginPayload = JSON.stringify({
    email: user.email,
    password: user.password,
  });
  
  const loginParams = {
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
    tags: { endpoint: 'auth_login' },
  };
  
  const loginResponse = http.post(
    `${baseUrl}/api/auth/login`,
    loginPayload,
    loginParams
  );
  
  const loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'receives auth token': (r) => r.json('accessToken') !== undefined,
    'user data returned': (r) => r.json('user') !== undefined,
  });
  
  // Record metrics
  const loginTime = Date.now() - loginStart;
  loginRate.add(loginSuccess);
  loginDuration.add(loginTime);
  
  // If login successful, test protected route
  if (loginSuccess && loginResponse.json('accessToken')) {
    const token = loginResponse.json('accessToken');
    
    const dashboardParams = {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      tags: { endpoint: 'dashboard' },
    };
    
    const dashboard = http.get(`${baseUrl}/api/dashboard`, dashboardParams);
    check(dashboard, {
      'dashboard loads': (r) => r.status === 200,
      'dashboard has user data': (r) => r.json('user') !== undefined,
    });
  }
}

function testCrisisEndpoint(baseUrl) {
  const crisisStart = Date.now();
  
  // Mock crisis detection request
  const crisisPayload = JSON.stringify({
    input: 'I am feeling very depressed and hopeless today',
    userId: 'test-user-123',
    context: 'mood_entry',
  });
  
  const crisisParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer mock-token`,
    },
    tags: { endpoint: 'crisis_detection' },
  };
  
  const crisisResponse = http.post(
    `${baseUrl}/api/crisis/analyze`,
    crisisPayload,
    crisisParams
  );
  
  check(crisisResponse, {
    'crisis detection responds': (r) => r.status === 200,
    'risk level assessed': (r) => r.json('riskLevel') !== undefined,
    'recommendations provided': (r) => r.json('recommendations') !== undefined,
  });
  
  const crisisTime = Date.now() - crisisStart;
  crisisResponseTime.add(crisisTime);
}

export function teardown(data) {
  console.log('Authentication load test completed');
  
  // Could add cleanup logic here if needed
  // For example, cleaning up test data or sending results to monitoring
}