# Production Environment Setup for Netlify

## Required Environment Variables

### Database Configuration
```bash
# Neon Database Connection String
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"

# Example format:
# DATABASE_URL="postgresql://user:pass@ep-example.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### API Configuration
```bash
# Base API URL (automatically set for Netlify functions)
VITE_API_BASE_URL="/.netlify/functions"

# WebSocket URL (optional - for real-time features)
VITE_WS_URL="wss://your-websocket-server.com"
```

### Authentication (Optional - for user accounts)
```bash
# Auth0 Configuration (if using Auth0)
VITE_AUTH0_DOMAIN="your-domain.auth0.com"
VITE_AUTH0_CLIENT_ID="your-client-id"
VITE_AUTH0_AUDIENCE="https://your-api-audience"

# JWT Secret for simple auth (if not using Auth0)
JWT_SECRET="your-secure-jwt-secret-min-32-chars"
```

### AI Services (Optional)
```bash
# OpenAI API Key (for AI chat features)
OPENAI_API_KEY="sk-..."

# Anthropic API Key (alternative AI provider)
ANTHROPIC_API_KEY="sk-ant-..."
```

### Push Notifications (Optional)
```bash
# VAPID Keys for Web Push
VITE_VAPID_PUBLIC_KEY="your-public-vapid-key"
VAPID_PRIVATE_KEY="your-private-vapid-key"
```

### Error Tracking (Optional)
```bash
# Sentry Configuration
VITE_SENTRY_DSN="https://...@sentry.io/..."
VITE_SENTRY_ENVIRONMENT="production"
```

### Real-time Services (Optional)
```bash
# Pusher Configuration (for real-time features)
PUSHER_APP_ID="your-app-id"
PUSHER_KEY="your-key"
PUSHER_SECRET="your-secret"
PUSHER_CLUSTER="us2"
```

## Setting Environment Variables in Netlify

### Method 1: Netlify UI (Recommended)
1. Go to your Netlify dashboard
2. Select your site
3. Navigate to "Site configuration" → "Environment variables"
4. Click "Add a variable"
5. Add each variable with its key and value
6. Variables are automatically encrypted and secure

### Method 2: Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Set environment variables
netlify env:set DATABASE_URL "your-connection-string"
netlify env:set JWT_SECRET "your-secret"
# ... repeat for each variable
```

### Method 3: netlify.toml (NOT for secrets)
Only use this for non-sensitive configuration:
```toml
[build.environment]
  NODE_VERSION = "20.18.1"
  VITE_BUILD_MODE = "production"
```

## Minimum Required Variables for Basic Functionality

These are the absolute minimum variables needed:

```bash
# Database (Required for data persistence)
DATABASE_URL="your-neon-database-url"

# JWT Secret (Required for session management)
JWT_SECRET="minimum-32-character-secure-random-string"
```

## Environment Variable Validation

The app includes automatic validation on startup. If critical variables are missing:
- In development: Detailed error messages in console
- In production: Graceful fallback to default values where possible

## Security Best Practices

1. **Never commit secrets to git**
   - Use `.env.local` for local development
   - Add `.env*` to `.gitignore`

2. **Use strong secrets**
   - JWT_SECRET: Minimum 32 characters, randomly generated
   - Database passwords: Use Neon's generated passwords

3. **Rotate secrets regularly**
   - Update JWT_SECRET quarterly
   - Rotate API keys annually or on suspicion of compromise

4. **Principle of least privilege**
   - Database user should only have necessary permissions
   - API keys should be scoped to minimum required access

## Testing Environment Variables

### Local Testing
```bash
# Create .env.local file
cp .env.example .env.local

# Edit with your values
nano .env.local

# Test locally
npm run dev
```

### Production Testing
```bash
# Check if variables are set
netlify env:list

# Test build with production variables
netlify build

# Test functions locally with production variables
netlify dev
```

## Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL includes `?sslmode=require`
- Check Neon dashboard for connection pooling settings
- Verify IP allowlist if configured

### Build Failures
- Check Netlify build logs for missing variables
- Ensure all VITE_ prefixed variables are set
- Verify Node version matches package.json requirements

### Runtime Errors
- Check browser console for missing VITE_ variables
- Check Netlify function logs for server-side variable issues
- Use Netlify's real-time log streaming: `netlify functions:log`

## Default Values and Fallbacks

The application includes sensible defaults for non-critical features:

| Variable | Default | Feature Impact |
|----------|---------|----------------|
| VITE_WS_URL | None | Real-time features disabled |
| VITE_SENTRY_DSN | None | Error tracking disabled |
| OPENAI_API_KEY | None | AI chat uses mock responses |
| PUSHER_* | None | Real-time updates disabled |
| VITE_VAPID_PUBLIC_KEY | None | Push notifications disabled |

## Contact for Support

If you need help with environment setup:
1. Check the [Netlify documentation](https://docs.netlify.com/environment-variables/overview/)
2. Review the [Neon documentation](https://neon.tech/docs/connect/connect-from-any-app)
3. Open an issue in the repository with the `deployment` tag