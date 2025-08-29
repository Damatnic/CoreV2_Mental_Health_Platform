# Neon Database Setup Guide

## Overview
This guide helps you complete the Neon database setup for your CoreV2 Mental Health Platform.

## Step 1: Environment Variables
Add these to your Netlify environment variables:

```env
# Database Connection
DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
DIRECT_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require

# JWT Secret (already set)
JWT_SECRET=[your-secret-key]

# Optional: Neon-specific
NEON_DATABASE_HOST=[your-host].neon.tech
NEON_DATABASE_NAME=neondb
NEON_DATABASE_USER=[your-user]
NEON_DATABASE_PASS=[your-password]
```

## Step 2: Database Schema
Run this SQL in your Neon dashboard:

```sql
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User profiles
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  bio TEXT,
  avatar_url TEXT,
  emergency_contact JSONB,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mood entries
CREATE TABLE IF NOT EXISTS mood_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  mood_label VARCHAR(50),
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safety plans
CREATE TABLE IF NOT EXISTS safety_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  warning_signs TEXT[],
  coping_strategies TEXT[],
  support_contacts JSONB,
  safe_places TEXT[],
  reasons_to_live TEXT[],
  professional_contacts JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crisis resources
CREATE TABLE IF NOT EXISTS crisis_resources (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  text_number VARCHAR(50),
  website VARCHAR(255),
  description TEXT,
  country VARCHAR(2) DEFAULT 'US',
  language VARCHAR(10) DEFAULT 'en',
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Wellness videos
CREATE TABLE IF NOT EXISTS wellness_videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  duration INTEGER, -- in seconds
  category VARCHAR(100),
  tags TEXT[],
  view_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT,
  mood_score INTEGER,
  is_private BOOLEAN DEFAULT true,
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Peer support messages
CREATE TABLE IF NOT EXISTS peer_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  recipient_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- AI chat sessions
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  session_id UUID DEFAULT gen_random_uuid(),
  messages JSONB,
  sentiment_scores JSONB,
  crisis_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);
CREATE INDEX idx_safety_plans_user_id ON safety_plans(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_peer_messages_recipient ON peer_messages(recipient_id);
CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);

-- Insert default crisis resources
INSERT INTO crisis_resources (name, phone, text_number, website, description, category, priority) VALUES
('988 Suicide & Crisis Lifeline', '988', '988', 'https://988lifeline.org', 'Free, confidential crisis support 24/7', 'crisis', 1),
('Crisis Text Line', NULL, '741741', 'https://www.crisistextline.org', 'Text HOME to connect with a crisis counselor', 'crisis', 2),
('SAMHSA National Helpline', '1-800-662-4357', NULL, 'https://www.samhsa.gov/find-help/national-helpline', 'Treatment referral and information service', 'substance', 3),
('NAMI HelpLine', '1-800-950-6264', NULL, 'https://www.nami.org/help', 'Monday-Friday 10am-10pm ET', 'mental-health', 4),
('Veterans Crisis Line', '988', '838255', 'https://www.veteranscrisisline.net', 'Press 1 after calling 988', 'veterans', 5);
```

## Step 3: Update Netlify Functions
The functions are already configured to use environment variables. Just ensure these are set in Netlify:

1. Go to Netlify Dashboard
2. Site Settings → Environment Variables
3. Add the DATABASE_URL from your Neon dashboard
4. Save and redeploy

## Step 4: Test Database Connection
Create a test function to verify connection:

```javascript
// netlify/functions/test-db.js
const { Client } = require('pg');

exports.handler = async (event, context) => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const result = await client.query('SELECT NOW()');
    await client.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        time: result.rows[0].now
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
};
```

## Step 5: Verify Deployment

1. **Check Build Status**
   - Go to Netlify Dashboard → Deploys
   - Verify build succeeded with simplified build command

2. **Test Database Connection**
   - Visit: `https://your-site.netlify.app/.netlify/functions/test-db`
   - Should return current timestamp

3. **Test Authentication**
   - Visit: `https://your-site.netlify.app/api/auth/verify`
   - Should return authentication status

## Next Steps

1. ✅ Database tables created
2. ✅ Environment variables set
3. ✅ Functions deployed
4. ⏳ Test all endpoints
5. ⏳ Monitor for errors

## Troubleshooting

### If build still fails:
1. Check Node version matches: 18.17.0
2. Verify DATABASE_URL is properly formatted
3. Check Netlify build logs for specific errors

### If database connection fails:
1. Verify DATABASE_URL includes `?sslmode=require`
2. Check Neon dashboard for connection limits
3. Ensure IP allowlist includes Netlify

### If functions timeout:
1. Increase function timeout in netlify.toml
2. Add connection pooling for database
3. Check query performance in Neon dashboard

## Support
- Neon Docs: https://neon.tech/docs
- Netlify Functions: https://docs.netlify.com/functions/overview/
- Project Repo: https://github.com/Damatnic/CoreV2