import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for crisis system monitoring
export const crisisResponseTime = new Trend('crisis_response_time');
export const crisisSuccessRate = new Rate('crisis_success_rate');
export const crisisDetectionRate = new Rate('crisis_detection_rate');
export const hotlineConnectionRate = new Rate('hotline_connection_rate');
export const emergencyEscalationRate = new Rate('emergency_escalation_rate');
export const crisisRequests = new Counter('crisis_requests_total');

// Test configuration
export const options = {
  stages: [
    // Ramp up: simulate gradual increase in crisis situations
    { duration: '2m', target: 10 }, // Normal load
    { duration: '3m', target: 20 }, // Increased mental health activity
    { duration: '2m', target: 50 }, // Crisis peak (multiple emergencies)
    { duration: '3m', target: 80 }, // Extreme crisis load
    { duration: '2m', target: 100 }, // Maximum crisis capacity test
    { duration: '3m', target: 50 }, // Scale down
    { duration: '2m', target: 0 }, // Cool down
  ],
  thresholds: {
    // Critical thresholds for life-saving system
    'crisis_response_time': ['p(95)<2000', 'p(99)<5000'], // 95% under 2s, 99% under 5s
    'crisis_success_rate': ['rate>0.99'], // 99% success rate minimum
    'crisis_detection_rate': ['rate>0.95'], // 95% detection accuracy
    'hotline_connection_rate': ['rate>0.98'], // 98% hotline connection success
    'emergency_escalation_rate': ['rate>0.99'], // 99% escalation success
    'http_req_failed': ['rate<0.01'], // Less than 1% HTTP errors
    'http_req_duration': ['p(95)<3000'], // 95% of requests under 3s
  },
};

// Test data for crisis scenarios
const crisisMessages = [
  "I'm having thoughts of self-harm",
  "I don't want to live anymore",
  "I'm planning to hurt myself",
  "I feel like ending it all",
  "I can't take this pain anymore",
  "I'm thinking about suicide",
  "I want to die",
  "I feel completely hopeless",
  "I'm going to kill myself",
  "I have a plan to harm myself"
];

const urgentMessages = [
  "I'm really struggling today",
  "I feel very depressed",
  "I'm having a panic attack",
  "I can't stop crying",
  "I feel so anxious",
  "I'm having a mental breakdown",
  "I need help right now",
  "I'm in emotional crisis",
  "I'm feeling suicidal thoughts",
  "This is an emergency"
];

const normalMessages = [
  "I'm feeling a bit down today",
  "Can someone talk to me?",
  "I'm having trouble sleeping",
  "I'm feeling stressed about work",
  "I need some support",
  "How do I cope with anxiety?",
  "I'm looking for resources",
  "Can you help me find a therapist?",
  "I want to improve my mental health",
  "I'm seeking guidance"
];

// Base URL configuration
const BASE_URL = __ENV.API_URL || 'http://localhost:8080';

export default function() {
  const sessionId = `session_${Math.random().toString(36).substr(2, 9)}`;
  const userId = `user_${Math.random().toString(36).substr(2, 9)}`;
  
  // Headers for all requests
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'K6-Crisis-Load-Test/1.0',
    'X-Session-ID': sessionId,
    'X-User-ID': userId,
  };

  group('Crisis Detection System Tests', function() {
    // Test 1: Crisis message detection
    group('Crisis Message Detection', function() {
      const crisisMessage = crisisMessages[Math.floor(Math.random() * crisisMessages.length)];
      const payload = {
        message: crisisMessage,
        userId: userId,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        priority: 'high'
      };

      const startTime = Date.now();
      const response = http.post(`${BASE_URL}/api/crisis/detect`, JSON.stringify(payload), {
        headers: headers,
        timeout: '10s',
      });
      const responseTime = Date.now() - startTime;

      crisisRequests.add(1);
      crisisResponseTime.add(responseTime);

      const success = check(response, {
        'Crisis detection status is 200': (r) => r.status === 200,
        'Crisis response time < 2s': (r) => responseTime < 2000,
        'Crisis detected correctly': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.crisis_detected === true && body.severity === 'high';
          } catch {
            return false;
          }
        },
        'Response contains crisis resources': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.resources && body.resources.length > 0;
          } catch {
            return false;
          }
        }
      });

      crisisSuccessRate.add(success);
      crisisDetectionRate.add(success);
    });

    // Test 2: 988 Hotline integration
    group('988 Hotline Integration', function() {
      const payload = {
        emergency: true,
        location: 'test',
        userId: userId,
        sessionId: sessionId,
        phoneNumber: '+1234567890', // Test number
        urgent: true
      };

      const startTime = Date.now();
      const response = http.post(`${BASE_URL}/api/crisis/hotline`, JSON.stringify(payload), {
        headers: headers,
        timeout: '15s', // Hotline connections may take longer
      });
      const responseTime = Date.now() - startTime;

      const success = check(response, {
        'Hotline integration status is 200': (r) => r.status === 200,
        'Hotline response time < 5s': (r) => responseTime < 5000,
        'Hotline connection established': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.connection_status === 'established' || body.connection_status === 'queued';
          } catch {
            return false;
          }
        }
      });

      hotlineConnectionRate.add(success);
    });

    // Test 3: Emergency escalation workflow
    group('Emergency Escalation', function() {
      const payload = {
        severity: 'critical',
        userId: userId,
        sessionId: sessionId,
        reason: 'automated_test_escalation',
        location: {
          lat: 40.7128,
          lng: -74.0060,
          address: 'Test Location'
        },
        contactInfo: {
          phone: '+1234567890',
          emergencyContact: '+0987654321'
        }
      };

      const startTime = Date.now();
      const response = http.post(`${BASE_URL}/api/crisis/escalate`, JSON.stringify(payload), {
        headers: headers,
        timeout: '10s',
      });
      const responseTime = Date.now() - startTime;

      const success = check(response, {
        'Escalation status is 200': (r) => r.status === 200,
        'Escalation response time < 3s': (r) => responseTime < 3000,
        'Escalation initiated': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.escalation_id && body.status === 'initiated';
          } catch {
            return false;
          }
        },
        'Emergency services notified': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.emergency_services_notified === true;
          } catch {
            return false;
          }
        }
      });

      emergencyEscalationRate.add(success);
    });

    // Test 4: Real-time crisis monitoring
    group('Crisis Monitoring Dashboard', function() {
      const response = http.get(`${BASE_URL}/api/crisis/monitoring/dashboard`, {
        headers: headers,
        timeout: '5s',
      });

      check(response, {
        'Monitoring dashboard status is 200': (r) => r.status === 200,
        'Dashboard data is valid': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.active_crises !== undefined && 
                   body.response_times !== undefined &&
                   body.system_status !== undefined;
          } catch {
            return false;
          }
        }
      });
    });

    // Test 5: Crisis chat system
    group('Crisis Chat System', function() {
      // Simulate urgent message in chat
      const urgentMessage = urgentMessages[Math.floor(Math.random() * urgentMessages.length)];
      const payload = {
        message: urgentMessage,
        userId: userId,
        sessionId: sessionId,
        chatId: `crisis_chat_${userId}`,
        priority: 'urgent'
      };

      const response = http.post(`${BASE_URL}/api/chat/crisis`, JSON.stringify(payload), {
        headers: headers,
        timeout: '5s',
      });

      check(response, {
        'Crisis chat status is 200': (r) => r.status === 200,
        'Crisis counselor available': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.counselor_available === true || body.estimated_wait_time < 300; // 5 minutes max
          } catch {
            return false;
          }
        }
      });
    });

    // Test 6: Health check during crisis load
    group('System Health Under Crisis Load', function() {
      const response = http.get(`${BASE_URL}/health`, {
        headers: headers,
        timeout: '3s',
      });

      check(response, {
        'Health check status is 200': (r) => r.status === 200,
        'System healthy under load': (r) => {
          try {
            const body = JSON.parse(r.body);
            return body.status === 'healthy' && body.crisis_system === 'operational';
          } catch {
            return false;
          }
        }
      });
    });
  });

  // Random sleep between 0.5-2 seconds to simulate realistic user behavior
  sleep(Math.random() * 1.5 + 0.5);
}

// Setup function - runs once before test
export function setup() {
  console.log('🚨 Starting Crisis System Load Test');
  console.log(`Target URL: ${BASE_URL}`);
  console.log('Testing life-critical mental health infrastructure...');
  
  // Verify system is ready
  const healthCheck = http.get(`${BASE_URL}/health`);
  if (healthCheck.status !== 200) {
    throw new Error(`System health check failed: ${healthCheck.status}`);
  }
  
  console.log('✅ System health check passed - beginning crisis load test');
  return { startTime: Date.now() };
}

// Teardown function - runs once after test
export function teardown(data) {
  const duration = (Date.now() - data.startTime) / 1000;
  console.log(`🏁 Crisis load test completed in ${duration}s`);
  console.log('📊 Critical metrics summary:');
  console.log(`   - Test duration: ${duration}s`);
  console.log(`   - Crisis response time threshold: <2s (95th percentile)`);
  console.log(`   - Success rate threshold: >99%`);
  console.log(`   - Detection accuracy threshold: >95%`);
  console.log('⚠️  Review detailed metrics in Grafana dashboard');
  console.log('🔍 Any failures in this test indicate potential life-threatening system issues');
}

// Helper function for WebSocket testing (if needed)
export function testCrisisWebSocket() {
  // WebSocket testing would require additional k6 configuration
  // This is a placeholder for future WebSocket crisis alert testing
  console.log('WebSocket crisis testing not implemented in this version');
}