# 🗄️ Netlify Database Setup Guide

## Prerequisites
Your site must be deployed to Netlify first. Once deployed, follow these steps:

## Step 1: Link Your Local Project to Netlify

Run this command and follow the prompts:
```bash
npx netlify link
```

Choose: "Use current git remote origin (https://github.com/Damatnic/CoreV2)"

## Step 2: Initialize Netlify Database

After linking, run:
```bash
npx netlify db:init
```

This will:
- Create a PostgreSQL database on Neon
- Set up connection strings
- Add DATABASE_URL to your environment

## Step 3: Create Database Schema

Create the schema for your mental health platform:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Mood entries
CREATE TABLE mood_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 10),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  content TEXT NOT NULL,
  mood INTEGER CHECK (mood >= 1 AND mood <= 10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Safety plans
CREATE TABLE safety_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  warning_signs JSONB,
  coping_strategies JSONB,
  support_contacts JSONB,
  safe_environments JSONB,
  professional_contacts JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessments
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- PHQ9, GAD7, etc.
  score INTEGER NOT NULL,
  answers JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crisis events (for tracking and analysis)
CREATE TABLE crisis_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  severity VARCHAR(20), -- low, medium, high, critical
  trigger_keywords TEXT[],
  action_taken VARCHAR(100),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_crisis_events_user_id ON crisis_events(user_id);
CREATE INDEX idx_crisis_events_severity ON crisis_events(severity);
```

## Step 4: Run Database Migrations

Save the schema above as `netlify/functions/db-init.sql` (already created), then run:

```bash
npx netlify db:push netlify/functions/db-init.sql
```

## Step 5: Update Your Functions to Use Database

Your functions can now access the database using the DATABASE_URL environment variable:

```javascript
// Example in netlify/functions/wellness.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

exports.handler = async (event, context) => {
  try {
    const { rows } = await pool.query('SELECT * FROM mood_entries WHERE user_id = $1', [userId]);
    return {
      statusCode: 200,
      body: JSON.stringify(rows)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};
```

## Step 6: Install PostgreSQL Client

Add the pg package to your Netlify functions:

```bash
cd netlify/functions
npm install pg
cd ../..
```

## Step 7: Environment Variables

The DATABASE_URL will be automatically set by Netlify. You can view it in:
- Netlify Dashboard → Site settings → Environment variables

## Step 8: Test Database Connection

Create a test function to verify connection:

```javascript
// netlify/functions/db-test.js
const { Pool } = require('pg');

exports.handler = async (event) => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query('SELECT NOW()');
    await pool.end();
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Database connected successfully',
        time: result.rows[0].now
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Database connection failed',
        details: error.message
      })
    };
  }
};
```

Test it:
```bash
netlify functions:invoke db-test
```

## Alternative: Manual Neon Setup

If you prefer to set up Neon manually:

1. Go to https://neon.tech
2. Create a new project
3. Copy the connection string
4. Add to Netlify environment variables:
   - Key: `DATABASE_URL`
   - Value: `postgresql://username:password@host/database?sslmode=require`

## Benefits of Using Netlify Database

- **Automatic backups**: Daily backups included
- **SSL encrypted**: Secure connections by default
- **Scalable**: Handles growth automatically
- **Integrated**: Works seamlessly with Netlify Functions
- **Free tier**: Generous free tier for development

## Troubleshooting

### Connection Issues
- Ensure DATABASE_URL is set in environment variables
- Check that SSL is configured correctly
- Verify the database is active in Neon dashboard

### Migration Issues
- Check SQL syntax is compatible with PostgreSQL
- Ensure tables don't already exist
- Verify user permissions

### Function Issues
- Install pg package in functions directory
- Use connection pooling for better performance
- Handle connection errors gracefully

## Next Steps

1. Link your project: `npx netlify link`
2. Initialize database: `npx netlify db:init`
3. Run migrations
4. Update functions to use database
5. Test with real data

Your mental health platform will now have a real, production-ready database!

---

*Note: The database feature requires a deployed Netlify site. Deploy first, then set up the database.*