# Environment Variables Configuration Guide

## Required Variables

### Authentication (Auth0)
```env
# Auth0 Domain - Your Auth0 tenant domain
VITE_AUTH0_DOMAIN=your-tenant.auth0.com

# Auth0 Client ID - Application client ID from Auth0 dashboard
VITE_AUTH0_CLIENT_ID=your-client-id-here

# Auth0 Redirect URI - Where Auth0 redirects after login
VITE_AUTH0_REDIRECT_URI=http://localhost:3000

# Auth0 API Audience - API identifier for Auth0
VITE_AUTH0_AUDIENCE=https://your-api.com
```

### Database
```env
# PostgreSQL connection string for Neon database
DATABASE_URL=postgresql://username:password@host.neon.tech/database?sslmode=require

# Database pool size (optional, default: 10)
DATABASE_POOL_SIZE=10
```

### API Configuration
```env
# Base URL for API calls (Netlify Functions)
VITE_API_BASE_URL=/.netlify/functions

# API timeout in milliseconds (optional, default: 30000)
VITE_API_TIMEOUT=30000
```

### Error Tracking (Optional)
```env
# Sentry DSN for error tracking
VITE_SENTRY_DSN=https://your-key@sentry.io/project-id

# Sentry environment (development, staging, production)
VITE_SENTRY_ENVIRONMENT=production

# Sentry release version
VITE_SENTRY_RELEASE=1.0.0
```

### Analytics (Optional)
```env
# Google Analytics Measurement ID
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Mixpanel Token
VITE_MIXPANEL_TOKEN=your-mixpanel-token
```

### Feature Flags
```env
# Enable/disable features
VITE_ENABLE_CRISIS_DETECTION=true
VITE_ENABLE_AI_CHAT=true
VITE_ENABLE_VIDEO_CHAT=false
VITE_ENABLE_TELEMETRY=false
```

### Security
```env
# Content Security Policy settings
VITE_CSP_REPORT_URI=https://your-csp-report-endpoint.com

# Encryption key for sensitive data (32 characters)
VITE_ENCRYPTION_KEY=your-32-character-encryption-key
```

### Netlify Specific
```env
# Netlify site ID
NETLIFY_SITE_ID=your-site-id

# Netlify access token (for deployment)
NETLIFY_AUTH_TOKEN=your-auth-token

# Build context (production, deploy-preview, branch-deploy)
CONTEXT=production
```

## Environment Files

### Development (.env.development)
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:8888/.netlify/functions
VITE_AUTH0_REDIRECT_URI=http://localhost:3000
VITE_SENTRY_ENVIRONMENT=development
VITE_ENABLE_TELEMETRY=false
```

### Staging (.env.staging)
```env
NODE_ENV=staging
VITE_API_BASE_URL=https://staging.yourapp.netlify.app/.netlify/functions
VITE_AUTH0_REDIRECT_URI=https://staging.yourapp.netlify.app
VITE_SENTRY_ENVIRONMENT=staging
VITE_ENABLE_TELEMETRY=true
```

### Production (.env.production)
```env
NODE_ENV=production
VITE_API_BASE_URL=https://yourapp.netlify.app/.netlify/functions
VITE_AUTH0_REDIRECT_URI=https://yourapp.com
VITE_SENTRY_ENVIRONMENT=production
VITE_ENABLE_TELEMETRY=true
```

## Setting Environment Variables

### Local Development
1. Create a `.env` file in the project root
2. Copy variables from `.env.example`
3. Fill in your values
4. Never commit `.env` to version control

### Netlify Dashboard
1. Go to Site Settings > Environment Variables
2. Add each variable with its value
3. Variables are available during build and runtime
4. Use different values for different deploy contexts

### Using Netlify CLI
```bash
# Set a variable
netlify env:set VARIABLE_NAME value

# Import from .env file
netlify env:import .env

# List all variables
netlify env:list
```

## Variable Validation

The application uses Zod for environment variable validation. See `src/utils/envValidator.ts`:

```typescript
const envSchema = z.object({
  VITE_AUTH0_DOMAIN: z.string().min(1),
  VITE_AUTH0_CLIENT_ID: z.string().min(1),
  VITE_API_BASE_URL: z.string().url(),
  // ... other validations
});
```

## Security Best Practices

1. **Never commit secrets**: Keep `.env` in `.gitignore`
2. **Use different values per environment**: Don't reuse production keys in development
3. **Rotate keys regularly**: Update sensitive keys periodically
4. **Limit access**: Only give team members access to necessary environments
5. **Use secret management**: Consider using Netlify's secret management or external tools
6. **Validate all inputs**: Always validate environment variables at runtime

## Troubleshooting

### Variable not available
- Ensure variable name starts with `VITE_` for client-side access
- Restart dev server after changing `.env`
- Check Netlify dashboard for production variables

### Build failures
- Verify all required variables are set
- Check for typos in variable names
- Ensure URLs are properly formatted
- Check database connection string format

### Type errors
- Run `npm run typecheck` to validate
- Update `envValidator.ts` if adding new variables
- Ensure types match expected values

## Example .env.example

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=
VITE_AUTH0_CLIENT_ID=
VITE_AUTH0_REDIRECT_URI=http://localhost:3000
VITE_AUTH0_AUDIENCE=

# Database
DATABASE_URL=

# API
VITE_API_BASE_URL=/.netlify/functions

# Optional Services
VITE_SENTRY_DSN=
VITE_GA_MEASUREMENT_ID=

# Feature Flags
VITE_ENABLE_CRISIS_DETECTION=true
VITE_ENABLE_AI_CHAT=true
```

## Contact

For questions about environment configuration, contact the development team or check the internal documentation.