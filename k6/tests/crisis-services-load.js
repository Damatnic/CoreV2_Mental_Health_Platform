import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Crisis-specific metrics
const crisisDetectionRate = new Rate('crisis_detection_success_rate');
const crisisResponseTime = new Trend('crisis_response_time');
const emergencyEscalationTime = new Trend('emergency_escalation_time');
const safetyPlanAccess = new Rate('safety_plan_access_rate');
const crisisInterventions = new Counter('crisis_interventions_total');

export const options = {
  scenarios: {
    // Scenario 1: Normal crisis detection load
    crisis_detection: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '2m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      tags: { scenario: 'crisis_detection' },
    },
    
    // Scenario 2: Emergency escalation spike
    emergency_spike: {
      executor: 'ramping-arrival-rate',
      startRate: 1,
      timeUnit: '1s',
      preAllocatedVUs: 10,
      maxVUs: 50,
      stages: [
        { duration: '1m', target: 2 },
        { duration: '30s', target: 10 }, // Sudden spike
        { duration: '1m', target: 10 },
        { duration: '30s', target: 1 },
      ],
      tags: { scenario: 'emergency_spike' },
    },
    
    // Scenario 3: Safety plan access under load
    safety_plan_load: {
      executor: 'constant-arrival-rate',
      rate: 15,
      timeUnit: '1s',
      duration: '3m',
      preAllocatedVUs: 20,
      tags: { scenario: 'safety_plan' },
    },
  },
  
  thresholds: {
    // Critical thresholds for crisis services
    'crisis_response_time': ['p(95)<500', 'p(99)<1000'],
    'emergency_escalation_time': ['p(99)<200'], // Emergency must be immediate
    'crisis_detection_success_rate': ['rate>0.999'], // 99.9% uptime
    'safety_plan_access_rate': ['rate>0.99'],
    'http_req_failed{scenario:emergency_spike}': ['rate<0.001'], // Near-zero failures for emergencies
    'http_req_duration{scenario:crisis_detection}': ['p(90)<800'],
  },
};

const crisisScenarios = [
  {
    input: 'I feel sad today but I know it will pass',
    expectedRisk: 'low',
    type: 'mild_distress'
  },
  {
    input: 'I have been feeling hopeless for weeks and don\'t see the point anymore',
    expectedRisk: 'moderate',
    type: 'depression_concern'
  },
  {
    input: 'I don\'t want to live anymore and I think about dying every day',
    expectedRisk: 'high',
    type: 'suicidal_ideation'
  },
  {
    input: 'I have pills and I am going to take them all tonight',
    expectedRisk: 'critical',
    type: 'imminent_danger'
  }
];

export function setup() {
  console.log('Starting crisis services load test');
  
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  
  // Verify crisis services are available
  const healthCheck = http.get(`${baseUrl}/api/crisis/health`);
  check(healthCheck, {
    'crisis services healthy': (r) => r.status === 200,
  });
  
  return { baseUrl };
}

export default function (data) {
  const scenario = __ENV.K6_SCENARIO;
  
  switch (scenario) {
    case 'crisis_detection':
      testCrisisDetection(data.baseUrl);
      break;
    case 'emergency_spike':
      testEmergencyEscalation(data.baseUrl);
      break;
    case 'safety_plan':
      testSafetyPlanAccess(data.baseUrl);
      break;
    default:
      // Run all tests with weighted distribution
      const testType = Math.random();
      if (testType < 0.5) {
        testCrisisDetection(data.baseUrl);
      } else if (testType < 0.8) {
        testSafetyPlanAccess(data.baseUrl);
      } else {
        testEmergencyEscalation(data.baseUrl);
      }
  }
  
  sleep(Math.random() * 2 + 0.5); // Random think time
}

function testCrisisDetection(baseUrl) {
  const scenario = crisisScenarios[Math.floor(Math.random() * crisisScenarios.length)];
  const detectionStart = Date.now();
  
  const payload = JSON.stringify({
    input: scenario.input,
    userId: `test-user-${Math.floor(Math.random() * 1000)}`,
    context: 'mood_entry',
    timestamp: new Date().toISOString(),
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
      'X-Session-ID': `session-${Math.random().toString(36).substr(2, 9)}`,
    },
    tags: { 
      endpoint: 'crisis_detection',
      scenario_type: scenario.type,
      expected_risk: scenario.expectedRisk,
    },
  };
  
  const response = http.post(`${baseUrl}/api/crisis/analyze`, payload, params);
  
  const detectionTime = Date.now() - detectionStart;
  crisisResponseTime.add(detectionTime);
  
  const detectionSuccess = check(response, {
    'crisis analysis successful': (r) => r.status === 200,
    'risk level provided': (r) => r.json('riskLevel') !== undefined,
    'confidence score provided': (r) => r.json('confidence') !== undefined,
    'recommendations included': (r) => r.json('recommendations') && Array.isArray(r.json('recommendations')),
    'response time acceptable': (r) => detectionTime < 1000,
  });
  
  crisisDetectionRate.add(detectionSuccess);
  crisisInterventions.add(1);
  
  // If high or critical risk, test follow-up intervention
  if (response.json('riskLevel') === 'high' || response.json('riskLevel') === 'critical') {
    testInterventionFollowup(baseUrl, response.json());
  }
}

function testEmergencyEscalation(baseUrl) {
  const escalationStart = Date.now();
  
  const emergencyPayload = JSON.stringify({
    riskLevel: 'critical',
    userId: `emergency-user-${Math.floor(Math.random() * 100)}`,
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
    },
    indicators: ['immediate_plan', 'access_to_means'],
    emergencyContact: {
      name: 'Test Contact',
      phone: '555-0123',
    },
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
      'X-Emergency-Request': 'true',
    },
    tags: { endpoint: 'emergency_escalation' },
  };
  
  const response = http.post(`${baseUrl}/api/crisis/emergency-escalation`, emergencyPayload, params);
  
  const escalationTime = Date.now() - escalationStart;
  emergencyEscalationTime.add(escalationTime);
  
  check(response, {
    'emergency escalation successful': (r) => r.status === 200,
    'incident number generated': (r) => r.json('incidentNumber') !== undefined,
    'emergency services contacted': (r) => r.json('emergencyServicesContacted') === true,
    'emergency response time': (r) => escalationTime < 200, // Must be immediate
    'crisis team notified': (r) => r.json('crisisTeamNotified') === true,
  });
  
  // Test 988 Lifeline connection as part of escalation
  test988Connection(baseUrl);
}

function testSafetyPlanAccess(baseUrl) {
  const userId = `user-${Math.floor(Math.random() * 500)}`;
  
  const params = {
    headers: {
      'Authorization': 'Bearer test-token',
      'X-User-ID': userId,
    },
    tags: { endpoint: 'safety_plan_access' },
  };
  
  const response = http.get(`${baseUrl}/api/user/${userId}/safety-plan`, params);
  
  const safetyPlanSuccess = check(response, {
    'safety plan retrieved': (r) => r.status === 200,
    'has warning signs': (r) => r.json('warningSignsL') && Array.isArray(r.json('warningSignsL')),
    'has coping strategies': (r) => r.json('copingStrategies') && Array.isArray(r.json('copingStrategies')),
    'has support contacts': (r) => r.json('supportContacts') && Array.isArray(r.json('supportContacts')),
    'has professional contacts': (r) => r.json('professionalContacts') && Array.isArray(r.json('professionalContacts')),
  });
  
  safetyPlanAccess.add(safetyPlanSuccess);
  
  // Test safety plan activation
  if (safetyPlanSuccess) {
    testSafetyPlanActivation(baseUrl, userId);
  }
}

function testSafetyPlanActivation(baseUrl, userId) {
  const activationPayload = JSON.stringify({
    userId,
    triggerReason: 'high_risk_detected',
    warningSignsL: ['feeling_hopeless', 'social_withdrawal'],
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'safety_plan_activation' },
  };
  
  const response = http.post(`${baseUrl}/api/safety-plan/activate`, activationPayload, params);
  
  check(response, {
    'safety plan activated': (r) => r.status === 200,
    'support contacts notified': (r) => r.json('contactsNotified') === true,
    'coping strategies provided': (r) => r.json('copingStrategies') && Array.isArray(r.json('copingStrategies')),
  });
}

function test988Connection(baseUrl) {
  const connectionPayload = JSON.stringify({
    urgency: 'high',
    preferredLanguage: 'en',
    specialNeeds: [],
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: '988_connection' },
  };
  
  const response = http.post(`${baseUrl}/api/crisis/988-connect`, connectionPayload, params);
  
  check(response, {
    '988 connection initiated': (r) => r.status === 200,
    'session ID provided': (r) => r.json('sessionId') !== undefined,
    'wait time estimated': (r) => r.json('estimatedWaitTime') !== undefined,
    'connection successful': (r) => r.json('success') === true,
  });
}

function testInterventionFollowup(baseUrl, crisisData) {
  const followupPayload = JSON.stringify({
    originalRiskLevel: crisisData.riskLevel,
    interventionType: 'immediate_support',
    resourcesProvided: crisisData.recommendations,
    userResponse: 'acknowledged',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'intervention_followup' },
  };
  
  const response = http.post(`${baseUrl}/api/crisis/intervention-followup`, followupPayload, params);
  
  check(response, {
    'followup recorded': (r) => r.status === 200,
    'intervention tracked': (r) => r.json('interventionId') !== undefined,
  });
}

export function teardown(data) {
  console.log('Crisis services load test completed');
  
  // Generate summary report
  console.log(`Total crisis interventions processed: ${crisisInterventions.count}`);
}