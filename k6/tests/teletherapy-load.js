import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';
import ws from 'k6/ws';

// Teletherapy-specific metrics
const sessionConnectionRate = new Rate('session_connection_success_rate');
const sessionJoinTime = new Trend('session_join_time');
const videoQualityMaintenance = new Rate('video_quality_maintenance_rate');
const audioLatency = new Trend('audio_latency');
const sessionsCompleted = new Counter('therapy_sessions_completed');
const reconnectionRate = new Rate('session_reconnection_success_rate');

export const options = {
  scenarios: {
    // Scenario 1: Regular therapy session load
    therapy_sessions: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '1m', target: 5 },   // 5 concurrent sessions
        { duration: '5m', target: 25 },  // 25 concurrent sessions (peak)
        { duration: '10m', target: 25 }, // Maintain peak load
        { duration: '2m', target: 5 },   // Ramp down
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'therapy_sessions' },
    },
    
    // Scenario 2: Emergency therapy session spikes
    emergency_sessions: {
      executor: 'ramping-arrival-rate',
      startRate: 0,
      timeUnit: '1m',
      preAllocatedVUs: 10,
      maxVUs: 20,
      stages: [
        { duration: '2m', target: 2 },  // 2 emergency sessions per minute
        { duration: '1m', target: 8 },  // Spike to 8 sessions per minute
        { duration: '2m', target: 8 },  // Maintain spike
        { duration: '1m', target: 2 },  // Return to normal
      ],
      tags: { scenario: 'emergency_sessions' },
    },
    
    // Scenario 3: Group therapy load
    group_sessions: {
      executor: 'constant-vus',
      vus: 10,
      duration: '8m',
      tags: { scenario: 'group_sessions' },
    },
  },
  
  thresholds: {
    // Session quality thresholds
    'session_join_time': ['p(95)<3000'], // Join within 3 seconds
    'session_connection_success_rate': ['rate>0.99'], // 99% successful connections
    'video_quality_maintenance_rate': ['rate>0.95'], // 95% maintain good quality
    'audio_latency': ['p(90)<100'], // Audio latency under 100ms
    'session_reconnection_success_rate': ['rate>0.98'], // 98% successful reconnections
    'http_req_duration{scenario:emergency_sessions}': ['p(99)<1500'], // Emergency sessions prioritized
    'http_req_failed': ['rate<0.02'], // Less than 2% failures
  },
};

const therapySessionTypes = [
  'individual-therapy',
  'couples-therapy', 
  'family-therapy',
  'group-therapy',
  'crisis-intervention'
];

const sessionDurations = [30, 45, 60, 90]; // minutes

export function setup() {
  console.log('Starting teletherapy session load test');
  
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const wsUrl = __ENV.WS_URL || 'ws://localhost:3000';
  
  // Verify teletherapy services
  const healthCheck = http.get(`${baseUrl}/api/teletherapy/health`);
  check(healthCheck, {
    'teletherapy services healthy': (r) => r.status === 200,
  });
  
  return { baseUrl, wsUrl };
}

export default function (data) {
  const scenario = __ENV.K6_SCENARIO;
  
  switch (scenario) {
    case 'therapy_sessions':
      testIndividualTherapySession(data);
      break;
    case 'emergency_sessions':
      testEmergencyTherapySession(data);
      break;
    case 'group_sessions':
      testGroupTherapySession(data);
      break;
    default:
      // Distribute tests based on realistic usage patterns
      const sessionType = Math.random();
      if (sessionType < 0.6) {
        testIndividualTherapySession(data);
      } else if (sessionType < 0.8) {
        testGroupTherapySession(data);
      } else {
        testEmergencyTherapySession(data);
      }
  }
  
  sleep(Math.random() * 2 + 1); // Think time between actions
}

function testIndividualTherapySession(data) {
  const sessionType = therapySessionTypes[0]; // individual-therapy
  const duration = sessionDurations[Math.floor(Math.random() * sessionDurations.length)];
  const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Step 1: Book session
  const bookingResponse = bookTherapySession(data.baseUrl, sessionType, duration);
  if (!bookingResponse) return;
  
  // Step 2: Join session (WebRTC simulation)
  const joinResponse = joinTherapySession(data.baseUrl, sessionId);
  if (!joinResponse) return;
  
  // Step 3: Establish media connections
  testMediaConnections(data.baseUrl, sessionId);
  
  // Step 4: Simulate session duration with periodic quality checks
  simulateSessionActivities(data.baseUrl, sessionId, duration);
  
  // Step 5: End session gracefully
  endTherapySession(data.baseUrl, sessionId);
}

function testEmergencyTherapySession(data) {
  const sessionStart = Date.now();
  const sessionId = `emergency-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Emergency sessions should be immediately available
  const emergencyPayload = JSON.stringify({
    urgency: 'high',
    crisisType: 'anxiety_panic',
    immediateRisk: false,
    preferredTherapist: null, // Any available
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'emergency_session_request' },
  };
  
  const response = http.post(`${data.baseUrl}/api/teletherapy/emergency-session`, emergencyPayload, params);
  
  const joinTime = Date.now() - sessionStart;
  sessionJoinTime.add(joinTime);
  
  const connectionSuccess = check(response, {
    'emergency session created': (r) => r.status === 200,
    'immediate availability': (r) => joinTime < 2000, // Under 2 seconds
    'therapist assigned': (r) => r.json('therapistId') !== undefined,
    'session room created': (r) => r.json('sessionRoom') !== undefined,
    'crisis support enabled': (r) => r.json('crisisSupportEnabled') === true,
  });
  
  sessionConnectionRate.add(connectionSuccess);
  
  if (connectionSuccess) {
    // Test WebSocket connection for real-time communication
    testEmergencyWebSocketConnection(data.wsUrl, sessionId);
    sessionsCompleted.add(1);
  }
}

function testGroupTherapySession(data) {
  const groupId = `group-${Math.floor(Math.random() * 10)}`; // Simulate multiple groups
  const participantId = `participant-${Math.random().toString(36).substr(2, 9)}`;
  
  // Join existing group session
  const joinPayload = JSON.stringify({
    groupId,
    participantId,
    participantName: 'Anonymous User',
    micMuted: true, // Start muted
    videoEnabled: false, // Video off initially
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'group_session_join' },
  };
  
  const response = http.post(`${data.baseUrl}/api/teletherapy/group-session/join`, joinPayload, params);
  
  const connectionSuccess = check(response, {
    'group session joined': (r) => r.status === 200,
    'participant list received': (r) => r.json('participants') && Array.isArray(r.json('participants')),
    'facilitator identified': (r) => r.json('facilitator') !== undefined,
    'group guidelines provided': (r) => r.json('guidelines') !== undefined,
  });
  
  sessionConnectionRate.add(connectionSuccess);
  
  if (connectionSuccess) {
    // Simulate group interaction patterns
    simulateGroupInteraction(data.baseUrl, groupId, participantId);
    sessionsCompleted.add(1);
  }
}

function bookTherapySession(baseUrl, sessionType, duration) {
  const bookingPayload = JSON.stringify({
    sessionType,
    duration,
    preferredTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
    therapistId: `therapist-${Math.floor(Math.random() * 10)}`,
    notes: 'Load testing session',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'session_booking' },
  };
  
  const response = http.post(`${baseUrl}/api/appointments/book`, bookingPayload, params);
  
  return check(response, {
    'session booked successfully': (r) => r.status === 200,
    'session ID provided': (r) => r.json('sessionId') !== undefined,
    'meeting room created': (r) => r.json('meetingRoom') !== undefined,
  });
}

function joinTherapySession(baseUrl, sessionId) {
  const joinStart = Date.now();
  
  const joinPayload = JSON.stringify({
    sessionId,
    deviceCapabilities: {
      video: true,
      audio: true,
      screen: false,
    },
    connectionType: 'broadband',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'session_join' },
  };
  
  const response = http.post(`${baseUrl}/api/teletherapy/session/join`, joinPayload, params);
  
  const joinTime = Date.now() - joinStart;
  sessionJoinTime.add(joinTime);
  
  const joinSuccess = check(response, {
    'session joined successfully': (r) => r.status === 200,
    'WebRTC configuration received': (r) => r.json('webrtcConfig') !== undefined,
    'STUN servers provided': (r) => r.json('webrtcConfig.iceServers') !== undefined,
    'session metadata received': (r) => r.json('sessionMetadata') !== undefined,
  });
  
  sessionConnectionRate.add(joinSuccess);
  return joinSuccess;
}

function testMediaConnections(baseUrl, sessionId) {
  // Simulate media quality negotiation
  const mediaPayload = JSON.stringify({
    sessionId,
    videoSettings: {
      resolution: '720p',
      frameRate: 30,
      bitrate: 1500,
    },
    audioSettings: {
      codec: 'opus',
      sampleRate: 48000,
      bitrate: 64,
    },
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'media_negotiation' },
  };
  
  const response = http.post(`${baseUrl}/api/teletherapy/session/media-config`, mediaPayload, params);
  
  const qualityMaintained = check(response, {
    'media configuration accepted': (r) => r.status === 200,
    'video quality confirmed': (r) => r.json('videoQuality') === 'good',
    'audio quality confirmed': (r) => r.json('audioQuality') === 'good',
    'latency acceptable': (r) => r.json('latency') < 100,
  });
  
  videoQualityMaintenance.add(qualityMaintained);
  
  if (response.json('latency')) {
    audioLatency.add(response.json('latency'));
  }
}

function simulateSessionActivities(baseUrl, sessionId, duration) {
  // Simulate various session activities over time
  const activities = Math.floor(duration / 5); // Activity every 5 minutes
  
  for (let i = 0; i < activities; i++) {
    // Simulate network quality check
    const qualityCheck = http.get(`${baseUrl}/api/teletherapy/session/${sessionId}/quality`, {
      headers: { 'Authorization': 'Bearer test-token' },
      tags: { endpoint: 'quality_check' },
    });
    
    check(qualityCheck, {
      'quality check successful': (r) => r.status === 200,
      'connection stable': (r) => r.json('connectionQuality') === 'good',
    });
    
    // Simulate brief pause between activities
    sleep(1);
    
    // Occasionally simulate reconnection scenarios
    if (Math.random() < 0.1) { // 10% chance of reconnection test
      testSessionReconnection(baseUrl, sessionId);
    }
  }
}

function testSessionReconnection(baseUrl, sessionId) {
  const reconnectStart = Date.now();
  
  const reconnectPayload = JSON.stringify({
    sessionId,
    reason: 'network_interruption',
    lastKnownState: 'connected',
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'session_reconnect' },
  };
  
  const response = http.post(`${baseUrl}/api/teletherapy/session/reconnect`, reconnectPayload, params);
  
  const reconnectTime = Date.now() - reconnectStart;
  
  const reconnectSuccess = check(response, {
    'reconnection successful': (r) => r.status === 200,
    'session state restored': (r) => r.json('sessionRestored') === true,
    'reconnect time acceptable': (r) => reconnectTime < 2000,
  });
  
  reconnectionRate.add(reconnectSuccess);
}

function simulateGroupInteraction(baseUrl, groupId, participantId) {
  // Simulate group therapy interactions
  const interactions = [
    'raise_hand',
    'send_message',
    'enable_video',
    'share_screen',
    'react_to_message'
  ];
  
  interactions.forEach(interaction => {
    const interactionPayload = JSON.stringify({
      groupId,
      participantId,
      action: interaction,
      timestamp: new Date().toISOString(),
    });
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      tags: { endpoint: 'group_interaction' },
    };
    
    http.post(`${baseUrl}/api/teletherapy/group-session/interaction`, interactionPayload, params);
    sleep(0.5); // Brief pause between interactions
  });
}

function testEmergencyWebSocketConnection(wsUrl, sessionId) {
  const url = `${wsUrl}/emergency-session/${sessionId}`;
  
  const response = ws.connect(url, {
    headers: { 'Authorization': 'Bearer test-token' }
  }, function (socket) {
    socket.on('open', () => {
      console.log('Emergency WebSocket connected');
      
      // Send heartbeat messages
      socket.setInterval(() => {
        socket.send(JSON.stringify({ type: 'heartbeat', timestamp: Date.now() }));
      }, 10000);
      
      // Simulate crisis communication
      socket.send(JSON.stringify({
        type: 'crisis_message',
        content: 'I need immediate support',
        priority: 'high'
      }));
    });
    
    socket.on('message', (message) => {
      const data = JSON.parse(message);
      if (data.type === 'crisis_response') {
        console.log('Received crisis response');
      }
    });
    
    socket.on('close', () => {
      console.log('Emergency WebSocket disconnected');
    });
    
    // Keep connection open for emergency session duration
    socket.setTimeout(() => {
      socket.close();
    }, 30000); // 30 seconds for load test
  });
  
  check(response, {
    'WebSocket connection established': (r) => r && r.status === 101,
  });
}

function endTherapySession(baseUrl, sessionId) {
  const endPayload = JSON.stringify({
    sessionId,
    endReason: 'completed',
    sessionSummary: {
      duration: 60,
      qualityRating: 5,
      technicalIssues: false,
    },
  });
  
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-token',
    },
    tags: { endpoint: 'session_end' },
  };
  
  const response = http.post(`${baseUrl}/api/teletherapy/session/end`, endPayload, params);
  
  check(response, {
    'session ended successfully': (r) => r.status === 200,
    'session recorded': (r) => r.json('sessionRecorded') !== undefined,
    'followup scheduled': (r) => r.json('followupScheduled') !== undefined,
  });
  
  sessionsCompleted.add(1);
}

export function teardown(data) {
  console.log('Teletherapy load test completed');
  console.log(`Total therapy sessions completed: ${sessionsCompleted.count}`);
}