const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Mock database
const wellnessData = new Map();

// Helper to verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Initialize user wellness data
const initUserWellness = (userId) => {
  if (!wellnessData.has(userId)) {
    wellnessData.set(userId, {
      checkIns: [],
      journalEntries: [],
      habits: [],
      moodHistory: [],
      safetyPlan: null,
      settings: {}
    });
  }
  return wellnessData.get(userId);
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Check authentication
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No token provided' })
    };
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);
  
  if (!decoded) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    };
  }

  const userId = decoded.userId;
  const userWellness = initUserWellness(userId);
  const path = event.path.replace('/.netlify/functions/wellness', '');
  const method = event.httpMethod;

  try {
    // Parse body if present
    const body = event.body ? JSON.parse(event.body) : {};

    // Route handling
    switch (true) {
      // Check-ins
      case path === '/checkins' && method === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: userWellness.checkIns
          })
        };
      }

      case path === '/checkins' && method === 'POST': {
        const checkIn = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          moodScore: body.moodScore || 3,
          anxietyLevel: body.anxietyLevel || 3,
          sleepQuality: body.sleepQuality || 3,
          energyLevel: body.energyLevel || 3,
          tags: body.tags || [],
          notes: body.notes || ''
        };
        
        userWellness.checkIns.unshift(checkIn);
        // Keep only last 100 check-ins
        if (userWellness.checkIns.length > 100) {
          userWellness.checkIns = userWellness.checkIns.slice(0, 100);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: checkIn
          })
        };
      }

      // Journal entries
      case path === '/journal' && method === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: userWellness.journalEntries
          })
        };
      }

      case path === '/journal' && method === 'POST': {
        const entry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          content: body.content || '',
          mood: body.mood,
          tags: body.tags || []
        };
        
        userWellness.journalEntries.unshift(entry);
        // Keep only last 50 entries
        if (userWellness.journalEntries.length > 50) {
          userWellness.journalEntries = userWellness.journalEntries.slice(0, 50);
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: entry
          })
        };
      }

      // Habits
      case path === '/habits' && method === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: userWellness.habits
          })
        };
      }

      case path === '/habits' && method === 'POST': {
        const habit = {
          id: Date.now().toString(),
          habitId: body.habitId,
          name: body.name,
          currentStreak: 0,
          longestStreak: 0,
          lastCompleted: null,
          createdAt: new Date().toISOString()
        };
        
        userWellness.habits.push(habit);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: habit
          })
        };
      }

      case path.startsWith('/habits/') && path.endsWith('/complete') && method === 'POST': {
        const habitId = path.split('/')[2];
        const habit = userWellness.habits.find(h => h.id === habitId);
        
        if (!habit) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Habit not found' })
          };
        }
        
        const today = new Date().toISOString().split('T')[0];
        const lastCompleted = habit.lastCompleted ? habit.lastCompleted.split('T')[0] : null;
        
        if (lastCompleted === today) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Already completed today' })
          };
        }
        
        // Update streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastCompleted === yesterdayStr) {
          habit.currentStreak++;
        } else {
          habit.currentStreak = 1;
        }
        
        habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);
        habit.lastCompleted = new Date().toISOString();
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: habit
          })
        };
      }

      // Safety Plan
      case path === '/safety-plan' && method === 'GET': {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: userWellness.safetyPlan
          })
        };
      }

      case path === '/safety-plan' && method === 'POST': {
        userWellness.safetyPlan = {
          ...body,
          lastUpdated: new Date().toISOString()
        };
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: userWellness.safetyPlan
          })
        };
      }

      // Mood history (for AI insights)
      case path === '/mood-history' && method === 'GET': {
        const limit = parseInt(event.queryStringParameters?.limit) || 30;
        const moodData = userWellness.checkIns
          .slice(0, limit)
          .map(c => ({
            date: c.timestamp,
            mood: c.moodScore,
            anxiety: c.anxietyLevel,
            sleep: c.sleepQuality,
            energy: c.energyLevel,
            tags: c.tags
          }));
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: moodData,
            insights: generateMoodInsights(moodData)
          })
        };
      }

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Not found' })
        };
    }
  } catch (error) {
    console.error('Wellness API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    };
  }
};

// Generate AI-like insights from mood data
function generateMoodInsights(moodData) {
  if (!moodData || moodData.length === 0) {
    return {
      trend: 'No data',
      message: 'Start tracking your mood to see insights',
      suggestions: ['Try doing a daily check-in', 'Use tags to track patterns']
    };
  }

  const avgMood = moodData.reduce((sum, d) => sum + d.mood, 0) / moodData.length;
  const avgAnxiety = moodData.reduce((sum, d) => sum + d.anxiety, 0) / moodData.length;
  const avgSleep = moodData.reduce((sum, d) => sum + d.sleep, 0) / moodData.length;
  
  // Calculate trend
  const recentMood = moodData.slice(0, 7).reduce((sum, d) => sum + d.mood, 0) / Math.min(7, moodData.length);
  const olderMood = moodData.slice(7, 14).reduce((sum, d) => sum + d.mood, 0) / Math.min(7, moodData.slice(7, 14).length) || avgMood;
  
  const trend = recentMood > olderMood ? 'improving' : recentMood < olderMood ? 'declining' : 'stable';
  
  // Generate insights
  const insights = {
    trend,
    averageMood: avgMood.toFixed(1),
    averageAnxiety: avgAnxiety.toFixed(1),
    averageSleep: avgSleep.toFixed(1),
    message: '',
    suggestions: []
  };
  
  // Create personalized message
  if (avgMood >= 4) {
    insights.message = "You're doing well! Keep up the positive momentum.";
  } else if (avgMood >= 3) {
    insights.message = "You're managing okay. Small improvements can make a big difference.";
  } else {
    insights.message = "It looks like you're going through a tough time. Remember, help is available.";
  }
  
  // Add suggestions based on data
  if (avgAnxiety > 3) {
    insights.suggestions.push("Try breathing exercises to manage anxiety");
  }
  if (avgSleep < 3) {
    insights.suggestions.push("Focus on improving your sleep hygiene");
  }
  if (trend === 'declining') {
    insights.suggestions.push("Consider reaching out to your support network");
  }
  if (moodData.length < 7) {
    insights.suggestions.push("Track daily for better insights");
  }
  
  // Find patterns in tags
  const allTags = moodData.flatMap(d => d.tags || []);
  const tagCounts = allTags.reduce((acc, tag) => {
    acc[tag] = (acc[tag] || 0) + 1;
    return acc;
  }, {});
  
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([tag]) => tag);
  
  if (topTags.length > 0) {
    insights.topTags = topTags;
  }
  
  return insights;
}