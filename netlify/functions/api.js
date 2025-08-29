/**
 * Main API Handler for CoreV2
 * Handles all API routes through Netlify Functions
 */

// Mock database (replace with real database connection)
const mockDatabase = {
  users: [],
  moodEntries: [],
  assessments: [],
  safetyPlans: [],
  journals: []
};

// CORS headers for local development
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  const path = event.path.replace('/.netlify/functions/api', '');
  const method = event.httpMethod;

  try {
    // Parse body for POST/PUT requests
    const body = event.body ? JSON.parse(event.body) : null;

    // Route handling
    switch (true) {
      // Health check
      case path === '/health' && method === 'GET':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
          })
        };

      // User endpoints
      case path === '/users/register' && method === 'POST':
        const newUser = {
          id: Date.now().toString(),
          email: body.email,
          role: body.role || 'seeker',
          createdAt: new Date().toISOString()
        };
        mockDatabase.users.push(newUser);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ 
            success: true,
            user: newUser 
          })
        };

      case path === '/users/profile' && method === 'GET':
        // Mock user profile (in production, verify JWT token)
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: '1',
            email: 'user@example.com',
            name: 'Test User',
            role: 'seeker',
            preferences: {
              notifications: true,
              darkMode: false
            }
          })
        };

      // Mood tracking endpoints
      case path === '/mood' && method === 'POST':
        const moodEntry = {
          id: Date.now().toString(),
          userId: body.userId || '1',
          mood: body.mood,
          score: body.score,
          notes: body.notes,
          triggers: body.triggers || [],
          activities: body.activities || [],
          createdAt: new Date().toISOString()
        };
        mockDatabase.moodEntries.push(moodEntry);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            entry: moodEntry
          })
        };

      case path === '/mood' && method === 'GET':
        // Return mock mood history
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            entries: mockDatabase.moodEntries.slice(-30), // Last 30 entries
            analytics: {
              averageMood: 6.5,
              trend: 'improving',
              mostCommonTriggers: ['work', 'sleep']
            }
          })
        };

      // Assessment endpoints
      case path === '/assessments/submit' && method === 'POST':
        const assessment = {
          id: Date.now().toString(),
          userId: body.userId || '1',
          type: body.type, // PHQ-9, GAD-7, etc.
          responses: body.responses,
          score: calculateAssessmentScore(body.type, body.responses),
          severity: getSeverityLevel(body.type, body.responses),
          createdAt: new Date().toISOString()
        };
        mockDatabase.assessments.push(assessment);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            assessment,
            recommendations: getRecommendations(assessment.severity)
          })
        };

      // Safety plan endpoints
      case path === '/safety-plan' && method === 'GET':
        const userPlan = mockDatabase.safetyPlans.find(p => p.userId === '1');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(userPlan || {
            warningSignals: [],
            copingStrategies: [],
            distractions: [],
            supportContacts: [],
            professionalContacts: [],
            safeEnvironment: [],
            reasonsToLive: []
          })
        };

      case path === '/safety-plan' && method === 'POST':
        const safetyPlan = {
          id: Date.now().toString(),
          userId: body.userId || '1',
          ...body,
          updatedAt: new Date().toISOString()
        };
        
        // Update or create safety plan
        const existingIndex = mockDatabase.safetyPlans.findIndex(p => p.userId === safetyPlan.userId);
        if (existingIndex >= 0) {
          mockDatabase.safetyPlans[existingIndex] = safetyPlan;
        } else {
          mockDatabase.safetyPlans.push(safetyPlan);
        }
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            safetyPlan
          })
        };

      // Journal endpoints
      case path === '/journal' && method === 'POST':
        const journalEntry = {
          id: Date.now().toString(),
          userId: body.userId || '1',
          title: body.title,
          content: body.content,
          mood: body.mood,
          tags: body.tags || [],
          createdAt: new Date().toISOString()
        };
        mockDatabase.journals.push(journalEntry);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            entry: journalEntry
          })
        };

      case path === '/journal' && method === 'GET':
        const userJournals = mockDatabase.journals.filter(j => j.userId === '1');
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            entries: userJournals,
            total: userJournals.length
          })
        };

      // Crisis resources endpoint
      case path === '/crisis/resources' && method === 'GET':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            hotlines: [
              { name: '988 Suicide & Crisis Lifeline', number: '988', available: '24/7' },
              { name: 'Crisis Text Line', number: 'Text HOME to 741741', available: '24/7' },
              { name: 'SAMHSA National Helpline', number: '1-800-662-4357', available: '24/7' }
            ],
            localResources: [
              { name: 'Local Emergency Room', address: 'Nearest ER', phone: '911' },
              { name: 'Community Mental Health Center', address: 'Local', phone: 'Directory' }
            ],
            onlineResources: [
              { name: 'NAMI', url: 'https://www.nami.org', description: 'National Alliance on Mental Illness' },
              { name: 'Mental Health America', url: 'https://www.mhanational.org', description: 'Resources and screening tools' }
            ]
          })
        };

      // Default 404
      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ 
            error: 'Not Found',
            message: `Route ${method} ${path} not found`
          })
        };
    }
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};

// Helper functions
function calculateAssessmentScore(type, responses) {
  if (!responses || !Array.isArray(responses)) return 0;
  
  // Simple sum for PHQ-9 and GAD-7 (each question scored 0-3)
  return responses.reduce((sum, response) => sum + (response.value || 0), 0);
}

function getSeverityLevel(type, responses) {
  const score = calculateAssessmentScore(type, responses);
  
  if (type === 'PHQ-9') {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    if (score <= 19) return 'moderately_severe';
    return 'severe';
  }
  
  if (type === 'GAD-7') {
    if (score <= 4) return 'minimal';
    if (score <= 9) return 'mild';
    if (score <= 14) return 'moderate';
    return 'severe';
  }
  
  return 'unknown';
}

function getRecommendations(severity) {
  const recommendations = {
    minimal: [
      'Continue self-care practices',
      'Maintain regular sleep schedule',
      'Stay connected with support network'
    ],
    mild: [
      'Consider starting a mood journal',
      'Practice relaxation techniques daily',
      'Schedule regular check-ins with a counselor'
    ],
    moderate: [
      'Seek professional mental health support',
      'Develop a safety plan',
      'Consider therapy or counseling'
    ],
    moderately_severe: [
      'Urgently seek professional help',
      'Contact your healthcare provider',
      'Consider intensive outpatient program'
    ],
    severe: [
      'Immediate professional intervention needed',
      'Contact crisis hotline: 988',
      'Go to nearest emergency room if in crisis'
    ]
  };
  
  return recommendations[severity] || recommendations.minimal;
}