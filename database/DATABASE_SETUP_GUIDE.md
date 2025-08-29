# CoreV2 Mental Health Platform - Complete Database Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Neon Database Setup](#neon-database-setup)
4. [Database Schema](#database-schema)
5. [Environment Configuration](#environment-configuration)
6. [Migration Guide](#migration-guide)
7. [API Integration](#api-integration)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

## Overview

The CoreV2 Mental Health Platform uses Neon PostgreSQL as its primary database. This guide provides comprehensive instructions for setting up the database from scratch.

### Database Architecture

- **PostgreSQL 15+** with Neon serverless
- **4 Main Schema Modules:**
  - Users & Authentication
  - Wellness Tracking
  - Safety & Crisis Management
  - Community Features
- **Row Level Security (RLS)** for data isolation
- **Connection pooling** for serverless optimization

## Prerequisites

Before starting, ensure you have:

1. A Neon account (sign up at [neon.tech](https://neon.tech))
2. Node.js 18.17.0 or higher
3. Access to your Netlify dashboard
4. Basic knowledge of SQL and PostgreSQL

## Neon Database Setup

### Step 1: Create a Neon Project

1. Log in to your [Neon Console](https://console.neon.tech)
2. Click "Create Project"
3. Configure your project:
   - **Project Name:** `corev2-mental-health`
   - **Region:** Choose closest to your users
   - **PostgreSQL Version:** 15 (recommended)
   - **Compute Size:** Start with 0.25 vCPU (can scale later)

4. Save your connection details:
   ```
   Host: [your-project].neon.tech
   Database: neondb
   Username: [your-username]
   Password: [your-password]
   ```

### Step 2: Configure Connection Pooling

1. In Neon Console, go to "Settings" → "Connection Pooling"
2. Enable pooling with these settings:
   - **Pool Mode:** Transaction
   - **Pool Size:** 25

3. Note your pooled connection string:
   ```
   postgresql://[user]:[password]@[host]/neondb?sslmode=require&pgbouncer=true
   ```

## Database Schema

### Step 3: Create Database Tables

Connect to your Neon database using the SQL Editor in the console, then run the following scripts in order:

#### 3.1 Run Core Schema Scripts

Execute each schema file in the `database/schema/` directory:

1. **Users Schema** (`01_users.sql`):
   - Creates user authentication tables
   - Sets up profiles and preferences
   - Configures helper/counselor profiles

2. **Wellness Schema** (`02_wellness.sql`):
   - Mood tracking tables
   - Journal entries
   - Habits and goals
   - Meditation and breathing exercises

3. **Safety Schema** (`03_safety.sql`):
   - Safety plans
   - Crisis resources
   - Emergency contacts
   - Crisis intervention tracking

4. **Community Schema** (`04_community.sql`):
   - Community posts and comments
   - Support groups
   - Direct messaging
   - Peer connections

#### 3.2 Alternative: Use Migration Script

Run the complete migration:

```sql
-- In Neon SQL Editor, run:
\i database/migrations/001_initial_setup.sql
\i database/migrations/002_seed_data.sql
```

Or manually copy and paste the contents of each file into the SQL editor.

### Step 4: Verify Schema Creation

Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

You should see approximately 40+ tables including:
- users, user_profiles, user_preferences
- mood_entries, wellness_checkins, journal_entries
- safety_plans, crisis_resources, crisis_assessments
- community_posts, support_groups, direct_messages

## Environment Configuration

### Step 5: Configure Environment Variables

#### For Local Development

Create a `.env.local` file in your project root:

```env
# Database
DATABASE_URL=postgresql://[user]:[password]@[host]/neondb?sslmode=require
DIRECT_URL=postgresql://[user]:[password]@[host]/neondb?sslmode=require&pgbouncer=true

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-refresh-token-secret

# Optional: Separate connection details
NEON_DATABASE_HOST=[your-host].neon.tech
NEON_DATABASE_NAME=neondb
NEON_DATABASE_USER=[your-user]
NEON_DATABASE_PASS=[your-password]
```

#### For Netlify Production

1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add the following variables:

```env
DATABASE_URL=[your-pooled-connection-string]
DIRECT_URL=[your-direct-connection-string]
JWT_SECRET=[generate-secure-secret]
JWT_REFRESH_SECRET=[generate-secure-refresh-secret]
```

**Generate secure secrets:**
```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Migration Guide

### Step 6: Run Database Migrations

#### Option A: Using Neon Console

1. Open SQL Editor in Neon Console
2. Copy contents of migration files
3. Execute in order:
   - `001_initial_setup.sql`
   - `002_seed_data.sql`

#### Option B: Using psql CLI

```bash
# Install PostgreSQL client if needed
# Connect to your database
psql postgresql://[user]:[password]@[host]/neondb?sslmode=require

# Run migrations
\i database/migrations/001_initial_setup.sql
\i database/migrations/002_seed_data.sql
```

#### Option C: Using Migration Script

Create `database/scripts/migrate.js`:

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    
    const migrations = [
      '001_initial_setup.sql',
      '002_seed_data.sql'
    ];
    
    for (const migration of migrations) {
      const sql = fs.readFileSync(
        path.join(__dirname, '../migrations', migration),
        'utf8'
      );
      
      console.log(`Running migration: ${migration}`);
      await client.query(sql);
      console.log(`Completed: ${migration}`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
```

Run with: `node database/scripts/migrate.js`

## API Integration

### Step 7: Update Netlify Functions

The Netlify functions are already configured to use the database. Ensure these files exist:

1. **Database Connection** (`netlify/functions/utils/db-connection.ts`):
   - Handles connection pooling
   - Provides query helpers
   - Manages transactions

2. **Authentication** (`netlify/functions/utils/auth.ts`):
   - JWT token management
   - User authentication
   - Session management

3. **API Endpoints**:
   - `api-auth.ts` - Authentication endpoints
   - `api-wellness.ts` - Wellness tracking
   - `api-safety.ts` - Safety plans and crisis resources
   - `api-community.ts` - Community features

### Step 8: Install Dependencies

```bash
cd netlify/functions
npm install @neondatabase/serverless @netlify/functions jsonwebtoken bcryptjs
npm install --save-dev @types/jsonwebtoken @types/bcryptjs @types/node
```

## Testing

### Step 9: Test Database Connection

Create `netlify/functions/test-db.js`:

```javascript
const { getDb, healthCheck } = require('./utils/db-connection');

exports.handler = async (event) => {
  try {
    const isHealthy = await healthCheck();
    
    if (isHealthy) {
      const sql = getDb();
      const result = await sql`SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public'`;
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          connected: true,
          tableCount: result[0].table_count,
          timestamp: new Date().toISOString()
        })
      };
    }
    
    throw new Error('Health check failed');
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

Deploy and test: `https://your-site.netlify.app/.netlify/functions/test-db`

### Step 10: Test API Endpoints

Use these curl commands to test your endpoints:

```bash
# Test authentication
curl -X POST https://your-site.netlify.app/.netlify/functions/api-auth \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123"}'

# Test wellness endpoint (requires auth token)
curl https://your-site.netlify.app/.netlify/functions/api-wellness/mood \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Timeout
```
Error: Connection timeout
```
**Solution:** Check if your IP is allowed in Neon settings or use pooled connection string.

#### 2. SSL Certificate Error
```
Error: Self signed certificate
```
**Solution:** Ensure `sslmode=require` is in your connection string.

#### 3. Too Many Connections
```
Error: Too many connections for role
```
**Solution:** Use connection pooling and ensure proper connection cleanup.

#### 4. Migration Already Executed
```
Error: Migration 001_initial_setup has already been executed
```
**Solution:** This is expected if running migrations multiple times. Check the migrations table.

### Debug Mode

Enable debug logging in your functions:

```javascript
// In db-connection.ts
if (process.env.NODE_ENV === 'development') {
  console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
}
```

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files to git
- Use different secrets for development and production
- Rotate JWT secrets regularly

### 2. Database Security
- Enable Row Level Security (RLS) on all tables
- Use prepared statements to prevent SQL injection
- Implement rate limiting on API endpoints

### 3. Connection Security
- Always use SSL connections (`sslmode=require`)
- Use connection pooling for better resource management
- Implement connection timeout handling

### 4. Data Protection
- Encrypt sensitive data (medical info, personal details)
- Implement GDPR compliance measures
- Regular database backups

### 5. Access Control
```sql
-- Example: Grant limited permissions to app user
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
REVOKE DELETE ON sensitive_tables FROM app_user;
```

## Monitoring and Maintenance

### Database Monitoring

1. **Neon Dashboard Metrics:**
   - Monitor compute usage
   - Track storage growth
   - Review query performance

2. **Set up Alerts:**
   - High connection count
   - Slow queries (>1s)
   - Storage approaching limit

### Regular Maintenance

```sql
-- Weekly maintenance queries
-- Analyze tables for query optimization
ANALYZE;

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Review slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC
LIMIT 10;
```

## Next Steps

After completing the database setup:

1. ✅ Test all API endpoints
2. ✅ Implement caching strategy
3. ✅ Set up database backups
4. ✅ Configure monitoring alerts
5. ✅ Document API endpoints
6. ⏳ Implement AI features (Phase 7.1)
7. ⏳ Add WebSocket support (Phase 7.2)
8. ⏳ Enable push notifications (Phase 7.3)

## Support Resources

- **Neon Documentation:** [neon.tech/docs](https://neon.tech/docs)
- **PostgreSQL Docs:** [postgresql.org/docs](https://www.postgresql.org/docs/)
- **Netlify Functions:** [docs.netlify.com/functions](https://docs.netlify.com/functions/overview/)
- **Project Repository:** [github.com/yourusername/CoreV2](https://github.com/yourusername/CoreV2)

## Conclusion

Your database is now fully configured and ready for production use. The schema supports all core features of the mental health platform including user management, wellness tracking, crisis support, and community features.

Remember to:
- Regularly backup your data
- Monitor performance metrics
- Keep dependencies updated
- Follow security best practices

For questions or issues, refer to the troubleshooting section or consult the support resources listed above.