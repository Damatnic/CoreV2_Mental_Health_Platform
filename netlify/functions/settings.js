const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Mock database for user settings
const userSettings = new Map();

// Helper to verify token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

// Default settings
const DEFAULT_SETTINGS = {
  theme: 'light',
  language: 'en',
  notifications: {
    enabled: true,
    dailyReminders: true,
    crisisAlerts: true,
    weeklyReports: false,
    reminderTime: '09:00'
  },
  privacy: {
    shareAnonymousData: false,
    allowAnalytics: false,
    dataRetention: '90days'
  },
  accessibility: {
    fontSize: 'medium',
    highContrast: false,
    reduceMotion: false,
    screenReaderMode: false
  },
  crisis: {
    emergencyContacts: [],
    showCrisisButton: true,
    crisisButtonPosition: 'bottom-right',
    autoDetectCrisis: true
  },
  wellness: {
    defaultMoodScale: 5,
    enableAIInsights: true,
    trackLocation: false,
    shareWithTherapist: false
  }
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
  const path = event.path.replace('/.netlify/functions/settings', '');
  const method = event.httpMethod;

  try {
    const body = event.body ? JSON.parse(event.body) : {};

    switch (true) {
      // Get all settings
      case path === '' && method === 'GET': {
        const settings = userSettings.get(userId) || DEFAULT_SETTINGS;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: settings
          })
        };
      }

      // Update all settings
      case path === '' && method === 'PUT': {
        const currentSettings = userSettings.get(userId) || DEFAULT_SETTINGS;
        const updatedSettings = {
          ...currentSettings,
          ...body,
          lastUpdated: new Date().toISOString()
        };
        
        userSettings.set(userId, updatedSettings);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: updatedSettings
          })
        };
      }

      // Update specific setting category
      case path.startsWith('/') && method === 'PUT': {
        const category = path.substring(1);
        const currentSettings = userSettings.get(userId) || DEFAULT_SETTINGS;
        
        if (!currentSettings[category]) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Setting category not found' })
          };
        }
        
        currentSettings[category] = {
          ...currentSettings[category],
          ...body
        };
        currentSettings.lastUpdated = new Date().toISOString();
        
        userSettings.set(userId, currentSettings);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: currentSettings[category]
          })
        };
      }

      // Reset to defaults
      case path === '/reset' && method === 'POST': {
        userSettings.set(userId, DEFAULT_SETTINGS);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Settings reset to defaults',
            data: DEFAULT_SETTINGS
          })
        };
      }

      // Export settings
      case path === '/export' && method === 'GET': {
        const settings = userSettings.get(userId) || DEFAULT_SETTINGS;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: {
              settings,
              exportDate: new Date().toISOString(),
              userId: decoded.email
            }
          })
        };
      }

      // Import settings
      case path === '/import' && method === 'POST': {
        const { settings: importedSettings } = body;
        
        if (!importedSettings) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'No settings provided' })
          };
        }
        
        const mergedSettings = {
          ...DEFAULT_SETTINGS,
          ...importedSettings,
          lastUpdated: new Date().toISOString()
        };
        
        userSettings.set(userId, mergedSettings);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Settings imported successfully',
            data: mergedSettings
          })
        };
      }

      // Get emergency contacts
      case path === '/emergency-contacts' && method === 'GET': {
        const settings = userSettings.get(userId) || DEFAULT_SETTINGS;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: settings.crisis.emergencyContacts || []
          })
        };
      }

      // Add emergency contact
      case path === '/emergency-contacts' && method === 'POST': {
        const currentSettings = userSettings.get(userId) || DEFAULT_SETTINGS;
        const contact = {
          id: Date.now().toString(),
          ...body,
          createdAt: new Date().toISOString()
        };
        
        if (!currentSettings.crisis.emergencyContacts) {
          currentSettings.crisis.emergencyContacts = [];
        }
        
        currentSettings.crisis.emergencyContacts.push(contact);
        userSettings.set(userId, currentSettings);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            data: contact
          })
        };
      }

      // Delete emergency contact
      case path.startsWith('/emergency-contacts/') && method === 'DELETE': {
        const contactId = path.split('/')[2];
        const currentSettings = userSettings.get(userId) || DEFAULT_SETTINGS;
        
        if (!currentSettings.crisis.emergencyContacts) {
          currentSettings.crisis.emergencyContacts = [];
        }
        
        currentSettings.crisis.emergencyContacts = currentSettings.crisis.emergencyContacts
          .filter(c => c.id !== contactId);
        
        userSettings.set(userId, currentSettings);
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Contact deleted'
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
    console.error('Settings API error:', error);
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