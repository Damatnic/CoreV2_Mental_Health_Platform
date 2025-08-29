# Complete Netlify + Neon Setup Guide for CoreV2

## Step 1: Neon Database Setup

1. **Create Neon Account**
   - Go to https://neon.tech
   - Sign up with your GitHub account
   - Create a new project named "corev2-mental-health"
   - Select the US East region (closest to Netlify)

2. **Get Database Credentials**
   - In Neon dashboard, go to "Connection Details"
   - Copy both connection strings:
     - `DATABASE_URL` (pooled connection)
     - `DIRECT_DATABASE_URL` (direct connection)

3. **Initialize Database Schema**
   - In Neon SQL Editor, run the contents of `netlify/functions/db-init.sql`
   - This creates all necessary tables and indexes

## Step 2: Auth0 Setup

1. **Create Auth0 Application**
   - Go to https://auth0.com
   - Create new Single Page Application
   - Name: "CoreV2 Mental Health Platform"
   
2. **Configure Auth0 Settings**
   - Allowed Callback URLs: `https://astralcorev2.netlify.app/callback`
   - Allowed Logout URLs: `https://astralcorev2.netlify.app`
   - Allowed Web Origins: `https://astralcorev2.netlify.app`
   - Allowed CORS Origins: `https://astralcorev2.netlify.app`

3. **Get Auth0 Credentials**
   - Domain: `your-tenant.auth0.com`
   - Client ID: `your-client-id`
   - Client Secret: `your-client-secret` (from Settings)

## Step 3: Netlify Environment Variables

Add these environment variables in Netlify Dashboard → Site Settings → Environment Variables:

```bash
# Frontend URLs
NEXT_PUBLIC_APP_URL=https://astralcorev2.netlify.app
NEXT_PUBLIC_API_URL=/.netlify/functions

# Neon Database (from Step 1)
DATABASE_URL=postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require
DIRECT_DATABASE_URL=postgresql://[user]:[password]@[endpoint]/[database]?sslmode=require

# Auth0 (from Step 2)
NEXT_PUBLIC_AUTH0_DOMAIN=[your-tenant].auth0.com
NEXT_PUBLIC_AUTH0_CLIENT_ID=[your-auth0-client-id]
AUTH0_CLIENT_SECRET=[your-auth0-client-secret]
AUTH0_ISSUER_BASE_URL=https://[your-tenant].auth0.com
AUTH0_BASE_URL=https://astralcorev2.netlify.app

# JWT & Session (generate these)
JWT_SECRET=[generate-64-char-string]
SESSION_SECRET=[generate-64-char-string]

# OpenAI (optional - for AI features)
OPENAI_API_KEY=sk-[your-openai-key]
OPENAI_ASSISTANT_ID=asst_[your-assistant-id]

# Google Analytics
NEXT_PUBLIC_GA_TRACKING_ID=AIzaSyAEpBsYR4n54DmT1h2vm8ZO_448x5s6uMs

# Encryption (generate this)
ENCRYPTION_KEY=[generate-32-char-string]

# Environment
NODE_ENV=production
```

### Generate Secret Keys

Use this Node.js script to generate secure keys:

```javascript
// Run in Node.js console or create generate-keys.js
const crypto = require('crypto');

console.log('JWT_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('ENCRYPTION_KEY=' + crypto.randomBytes(16).toString('hex'));
```

## Step 4: Deploy to Netlify

1. **Connect Repository**
   - In Netlify Dashboard, click "New site from Git"
   - Connect to your GitHub repository
   - Select the CoreV2 repository

2. **Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

3. **Deploy**
   - Click "Deploy site"
   - Wait for initial deployment to complete

## Step 5: Install Dependencies for Functions

After deployment, the Netlify Functions need their dependencies:

```bash
cd netlify/functions
npm install
```

This is handled automatically by Netlify during deployment.

## Step 6: Update Frontend API Service

Create `src/services/apiService.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/.netlify/functions';

class ApiService {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}/${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        this.clearToken();
        window.location.href = '/login';
      }
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Auth methods
  async login(auth0Data: any) {
    const result = await this.request('api-auth', {
      method: 'POST',
      body: JSON.stringify(auth0Data),
    });
    this.setToken(result.token);
    return result;
  }

  // Mood tracking
  async getMoodEntries(limit = 30) {
    return this.request(`api-mood?limit=${limit}`);
  }

  async createMoodEntry(data: any) {
    return this.request('api-mood', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Wellness assessments
  async getWellnessAssessments(type?: string, limit = 10) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    params.append('limit', limit.toString());
    return this.request(`api-wellness?${params}`);
  }

  async submitWellnessAssessment(data: any) {
    return this.request('api-wellness', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();
```

## Step 7: Test Your Deployment

1. **Check Functions**
   - Go to Netlify Dashboard → Functions tab
   - Verify all functions are deployed

2. **Test Database Connection**
   - Try logging in with Auth0
   - Check Neon dashboard for new user record

3. **Monitor Logs**
   - Netlify Dashboard → Functions → View logs
   - Neon Dashboard → Monitoring tab

## Available API Endpoints

Your Netlify Functions provide these endpoints:

- `POST /.netlify/functions/api-auth` - User authentication
- `GET /.netlify/functions/api-mood` - Get mood entries
- `POST /.netlify/functions/api-mood` - Create mood entry
- `GET /.netlify/functions/api-wellness` - Get assessments
- `POST /.netlify/functions/api-wellness` - Submit assessment

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL includes `?sslmode=require`
- Check Neon dashboard for connection limits
- Ensure IP allowlist is disabled in Neon

### Function Timeouts
- Netlify Functions have 10-second timeout
- Use connection pooling for database
- Implement caching where appropriate

### CORS Issues
- Headers are configured in each function
- Check browser console for specific CORS errors
- Verify NEXT_PUBLIC_APP_URL matches your domain

## Security Considerations

1. **Environment Variables**
   - Never commit .env files
   - Use Netlify's environment variables UI
   - Rotate secrets regularly

2. **Database Security**
   - Use connection pooling
   - Implement rate limiting
   - Sanitize all user inputs

3. **Authentication**
   - Verify JWT tokens on every request
   - Implement refresh token rotation
   - Use HTTPS everywhere

## Next Steps

1. Set up monitoring with Netlify Analytics
2. Configure error tracking (e.g., Sentry)
3. Implement backup strategy for Neon
4. Set up staging environment
5. Configure custom domain if needed

## Support Resources

- Netlify Docs: https://docs.netlify.com
- Neon Docs: https://neon.tech/docs
- Auth0 Docs: https://auth0.com/docs
- Project Issues: https://github.com/yourusername/CoreV2/issues
