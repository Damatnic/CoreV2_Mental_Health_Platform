import { Handler } from '@netlify/functions';
import { sql } from './db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { auth0_id, email, name } = JSON.parse(event.body || '{}');

    if (!auth0_id || !email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Check if user exists
    let user = await sql`
      SELECT * FROM users WHERE auth0_id = ${auth0_id}
    `;

    if (user.length === 0) {
      // Create new user
      const newUser = await sql`
        INSERT INTO users (auth0_id, email, name)
        VALUES (${auth0_id}, ${email}, ${name})
        RETURNING *
      `;
      
      // Create default preferences
      await sql`
        INSERT INTO user_preferences (user_id)
        VALUES (${newUser[0].id})
      `;
      
      user = newUser;
    } else {
      // Update last login
      await sql`
        UPDATE users 
        SET last_login = NOW()
        WHERE id = ${user[0].id}
      `;
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user[0].id,
        auth0Id: user[0].auth0_id,
        email: user[0].email,
      },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        token,
        user: {
          id: user[0].id,
          email: user[0].email,
          name: user[0].name,
          locale: user[0].locale,
          timezone: user[0].timezone,
        },
      }),
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};