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

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const token = event.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const decoded = verifyToken(token) as any;
  if (!decoded) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' }),
    };
  }

  try {
    switch (event.httpMethod) {
      case 'GET': {
        const limit = event.queryStringParameters?.limit || '30';
        const entries = await sql`
          SELECT * FROM mood_entries 
          WHERE user_id = ${decoded.userId}
          ORDER BY created_at DESC
          LIMIT ${parseInt(limit)}
        `;
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(entries),
        };
      }

      case 'POST': {
        const body = JSON.parse(event.body || '{}');
        const result = await sql`
          INSERT INTO mood_entries (
            user_id, mood_value, mood_label, notes, activities, encrypted_data
          ) VALUES (
            ${decoded.userId},
            ${body.mood_value},
            ${body.mood_label},
            ${body.notes},
            ${JSON.stringify(body.activities || [])},
            ${body.encrypted_data || null}
          )
          RETURNING *
        `;
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