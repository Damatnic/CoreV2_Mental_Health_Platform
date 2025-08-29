import { Handler } from '@netlify/functions';
import { sql } from './db';
import jwt from 'jsonwebtoken';

const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return null;
  }
};

// Get user identifier - supports both authenticated and anonymous users
const getUserIdentifier = (event: any): { userId: string; isAnonymous: boolean } | null => {
  // Try to get authenticated user first
  const token = event.headers.authorization?.replace('Bearer ', '');
  if (token) {
    const decoded = verifyToken(token) as any;
    if (decoded) {
      return { userId: decoded.userId, isAnonymous: false };
    }
  }
  
  // Fall back to anonymous user ID from headers
  const anonymousId = event.headers['x-anonymous-id'];
  if (anonymousId) {
    return { userId: `anon_${anonymousId}`, isAnonymous: true };
  }
  
  return null;
};

const calculateRiskLevel = (score: number, type: string): string => {
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
};

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Support both authenticated and anonymous users
  const userInfo = getUserIdentifier(event);
  if (!userInfo) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'No user identifier provided' }),
    };
  }

  const { userId, isAnonymous } = userInfo;

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const type = event.queryStringParameters?.type;
        const limit = event.queryStringParameters?.limit || '10';
        
        let query;
        if (type) {
          query = sql`
            SELECT * FROM wellness_assessments 
            WHERE user_id = ${userId} 
            AND assessment_type = ${type}
            ORDER BY created_at DESC
            LIMIT ${parseInt(limit)}
          `;
        } else {
          query = sql`
            SELECT * FROM wellness_assessments 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${parseInt(limit)}
          `;
        }
        
        const assessments = await query;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(assessments),
        };
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}');
        const { assessment_type, responses } = body;
        
        // Calculate score
        const score = Object.values(responses as Record<string, number>)
          .reduce((sum, val) => sum + val, 0);
        
        // Determine risk level
        const risk_level = calculateRiskLevel(score, assessment_type);
        
        // Generate recommendations based on risk level
        const recommendations = {
          minimal: ['Continue self-care practices', 'Maintain healthy routines'],
          mild: ['Consider stress reduction techniques', 'Monitor symptoms'],
          moderate: ['Speak with a counselor', 'Practice daily coping strategies'],
          moderately_severe: ['Seek professional help', 'Contact crisis support if needed'],
          severe: ['Immediate professional help recommended', 'Use crisis resources'],
        }[risk_level] || [];
        
        const result = await sql`
          INSERT INTO wellness_assessments (
            user_id, assessment_type, responses, score, risk_level, recommendations
          ) VALUES (
            ${userId},
            ${assessment_type},
            ${JSON.stringify(responses)},
            ${score},
            ${risk_level},
            ${JSON.stringify(recommendations)}
          )
          RETURNING *
        `;
        
        // Log crisis support if severe
        if (risk_level === 'severe') {
          await sql`
            INSERT INTO crisis_support_logs (
              user_id, action_type, severity_level
            ) VALUES (
              ${userId},
              'high_risk_assessment',
              'severe'
            )
          `;
        }
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify(result[0]),
        };
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Database error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};