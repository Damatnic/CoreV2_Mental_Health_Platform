/**
 * Simple Authentication API for CoreV2
 * This is a temporary solution until Auth0 is fully configured
 */

const jwt = require('jsonwebtoken');

// Use environment variable or fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production';

// Mock user database (in production, use real database)
const users = new Map();

// Demo users for testing
users.set('demo@example.com', {
  id: '1',
  email: 'demo@example.com',
  password: 'demo123', // In production, use hashed passwords
  name: 'Demo User',
  role: 'seeker',
  createdAt: new Date().toISOString()
});

users.set('helper@example.com', {
  id: '2',
  email: 'helper@example.com',
  password: 'helper123',
  name: 'Helper Demo',
  role: 'helper',
  createdAt: new Date().toISOString()
});

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

// Generate JWT token
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

exports.handler = async (event, context) => {
  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  const path = event.path.replace('/.netlify/functions/auth', '');
  const method = event.httpMethod;

  try {
    const body = event.body ? JSON.parse(event.body) : null;

    switch (true) {
      // Login endpoint
      case path === '/login' && method === 'POST': {
        const { email, password } = body;
        
        if (!email || !password) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email and password required' })
          };
        }
        
        const user = users.get(email);
        
        if (!user || user.password !== password) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid credentials' })
          };
        }
        
        const token = generateToken(user);
        const { password: _, ...userWithoutPassword } = user;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            token,
            user: userWithoutPassword
          })
        };
      }

      // Register endpoint
      case path === '/register' && method === 'POST': {
        const { email: newEmail, password: newPassword, name, role = 'seeker' } = body;
        
        if (!newEmail || !newPassword || !name) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Email, password, and name required' })
          };
        }
        
        if (users.has(newEmail)) {
          return {
            statusCode: 409,
            headers,
            body: JSON.stringify({ error: 'User already exists' })
          };
        }
        
        const newUser = {
          id: Date.now().toString(),
          email: newEmail,
          password: newPassword, // In production, hash this
          name,
          role,
          createdAt: new Date().toISOString()
        };
        
        users.set(newEmail, newUser);
        
        const newToken = generateToken(newUser);
        const { password: __, ...newUserWithoutPassword } = newUser;
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            success: true,
            token: newToken,
            user: newUserWithoutPassword
          })
        };
      }

      // Verify token endpoint
      case path === '/verify' && method === 'GET': {
        const authHeader = event.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'No token provided' })
          };
        }
        
        const token = authHeader.slice(7);
        const decoded = verifyToken(token);
        
        if (!decoded) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid token' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            user: decoded
          })
        };
      }

      // Logout endpoint (just for completeness, token invalidation would be handled client-side)
      case path === '/logout' && method === 'POST':
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: 'Logged out successfully'
          })
        };

      // Get current user
      case path === '/me' && method === 'GET': {
        const meAuthHeader = event.headers.authorization;
        
        if (!meAuthHeader || !meAuthHeader.startsWith('Bearer ')) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Not authenticated' })
          };
        }
        
        const meToken = meAuthHeader.slice(7);
        const meDecoded = verifyToken(meToken);
        
        if (!meDecoded) {
          return {
            statusCode: 401,
            headers,
            body: JSON.stringify({ error: 'Invalid token' })
          };
        }
        
        const currentUser = users.get(meDecoded.email);
        if (!currentUser) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }
        
        const { password: ___, ...currentUserWithoutPassword } = currentUser;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            user: currentUserWithoutPassword
          })
        };
      }

      default:
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Endpoint not found' })
        };
    }
  } catch (error) {
    console.error('Auth API Error:', error);
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