# CoreV2 Environment Variables Documentation

This document provides comprehensive documentation for all environment variables used in the CoreV2 Mental Health Platform.

## Table of Contents
- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Environment-Specific Requirements](#environment-specific-requirements)
- [Security Considerations](#security-considerations)
- [Variable Reference](#variable-reference)

## Required Variables

These variables MUST be set for the application to function properly.

### Core Configuration
| Variable | Description | Example | Environment |
|----------|-------------|---------|-------------|
| `NODE_ENV` | Application environment | `production` | All |
| `VITE_API_BASE_URL` | Backend API URL | `https://api.corev2.com` | All |
| `VITE_AUTH0_DOMAIN` | Auth0 domain | `corev2.auth0.com` | All |
| `VITE_AUTH0_CLIENT_ID` | Auth0 client ID | `abc123...` | All |
| `VITE_AUTH0_CALLBACK_URL` | Auth0 callback URL | `https://app.corev2.com/callback` | All |

### Production-Only Required
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret (min 32 chars) | `[secure-random-string]` |
| `SESSION_SECRET` | Session encryption secret (min 32 chars) | `[secure-random-string]` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `REDIS_URL` | Redis connection string | `redis://user:pass@host:6379` |
| `VITE_AUTH0_CLIENT_SECRET` | Auth0 client secret | `[secure-secret]` |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience | `https://api.corev2.com` |

## Optional Variables

These variables have sensible defaults but can be customized.

### Feature Flags
| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `VITE_ENABLE_AI_CHAT` | Enable AI chat feature | `true` | `true/false` |
| `VITE_ENABLE_VIDEO_CHAT` | Enable video chat | `true` | `true/false` |
| `VITE_ENABLE_PUSH_NOTIFICATIONS` | Enable push notifications | `true` | `true/false` |
| `VITE_ENABLE_OFFLINE_MODE` | Enable offline mode | `true` | `true/false` |
| `VITE_ENABLE_TWO_FACTOR` | Enable 2FA | `false` | `true/false` |
| `VITE_ENABLE_DEVICE_FINGERPRINTING` | Enable device fingerprinting | `false` | `true/false` |

### Security Configuration
| Variable | Description | Default | Production Recommendation |
|----------|-------------|---------|---------------------------|
| `JWT_ALGORITHM` | JWT signing algorithm | `HS256` | `RS256` |
| `JWT_EXPIRES_IN` | JWT expiration | `1h` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | `7d` |
| `SESSION_MAX_AGE` | Session max age (ms) | `86400000` | `1800000` (30 min) |
| `HSTS_ENABLED` | Enable HSTS | `false` | `true` |
| `HSTS_MAX_AGE` | HSTS max age (seconds) | `0` | `31536000` (1 year) |
| `CSP_REPORT_ONLY` | CSP report-only mode | `true` | `false` |

### Rate Limiting
| Variable | Description | Default | Unit |
|----------|-------------|---------|------|
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` | milliseconds (15 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Global max requests | `1000` | requests per window |
| `RATE_LIMIT_AUTH_MAX` | Auth endpoint max | `5` | requests per window |
| `RATE_LIMIT_CRISIS_MAX` | Crisis endpoint max | `100` | requests per window |

### Database & Cache
| Variable | Description | Default | Required For |
|----------|-------------|---------|--------------|
| `DATABASE_SSL` | Enable database SSL | `false` | Production |
| `DATABASE_POOL_SIZE` | Connection pool size | `10` | Production |
| `REDIS_PASSWORD` | Redis password | - | Production |
| `REDIS_DB` | Redis database number | `0` | All |
| `CACHE_TTL` | Cache TTL (seconds) | `3600` | All |

### Logging & Monitoring
| Variable | Description | Default | Values |
|----------|-------------|---------|--------|
| `LOG_LEVEL` | Logging level | `info` | `error/warn/info/debug/trace` |
| `LOG_FORMAT` | Log format | `json` | `json/dev/combined` |
| `LOG_ALL_REQUESTS` | Log all HTTP requests | `false` | `true/false` |
| `LOG_AUTH_EVENTS` | Log authentication events | `true` | `true/false` |
| `LOG_DATA_ACCESS` | Log data access | `true` | `true/false` |
| `LOG_SECURITY_EVENTS` | Log security events | `true` | `true/false` |
| `LOG_RETENTION_DAYS` | Log retention period | `90` | days (min 2555 for HIPAA) |

### Email Configuration
| Variable | Description | Example | Required For |
|----------|-------------|---------|--------------|
| `SMTP_HOST` | SMTP server host | `smtp.sendgrid.net` | Email features |
| `SMTP_PORT` | SMTP server port | `587` | Email features |
| `SMTP_SECURE` | Use TLS/SSL | `true` | Production |
| `SMTP_USER` | SMTP username | `apikey` | Email features |
| `SMTP_PASS` | SMTP password | `[secure-password]` | Email features |
| `EMAIL_FROM` | From email address | `noreply@corev2.com` | Email features |

### Push Notifications
| Variable | Description | Required For |
|----------|-------------|--------------|
| `VITE_VAPID_PUBLIC_KEY` | VAPID public key | Push notifications |
| `VITE_VAPID_PRIVATE_KEY` | VAPID private key | Push notifications |

### External Services
| Variable | Description | Required For |
|----------|-------------|--------------|
| `VITE_SENTRY_DSN` | Sentry error tracking DSN | Error tracking |
| `VITE_GA_TRACKING_ID` | Google Analytics ID | Analytics |
| `STRIPE_SECRET_KEY` | Stripe secret key | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Payments |

### PWA Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_PWA_NAME` | PWA full name | `CoreV2 - Mental Health Support` |
| `VITE_PWA_SHORT_NAME` | PWA short name | `CoreV2` |
| `VITE_PWA_THEME_COLOR` | Theme color | `#667eea` |
| `VITE_PWA_BACKGROUND_COLOR` | Background color | `#ffffff` |
| `VITE_PWA_DISPLAY` | Display mode | `standalone` |
| `VITE_PWA_ORIENTATION` | Orientation | `portrait` |

### Service Worker
| Variable | Description | Default | Unit |
|----------|-------------|---------|------|
| `VITE_SW_UPDATE_INTERVAL` | Update check interval | `60000` | milliseconds |
| `VITE_SW_CACHE_NAME` | Cache name | `corev2` | - |
| `VITE_SW_ENABLE_BACKGROUND_SYNC` | Enable background sync | `true` | `true/false` |
| `VITE_SW_ENABLE_PUSH_SYNC` | Enable push sync | `true` | `true/false` |

### Crisis Resources
| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_CRISIS_HOTLINE` | Crisis hotline number | `988` |
| `VITE_CRISIS_TEXT_LINE` | Crisis text line | `741741` |
| `CRISIS_ALERT_WEBHOOK` | Crisis alert webhook URL | - |

### Development Settings
| Variable | Description | Default | ⚠️ Warning |
|----------|-------------|---------|------------|
| `VITE_DEBUG_MODE` | Enable debug mode | `false` | Never enable in production |
| `VITE_SHOW_DEV_TOOLS` | Show dev tools | `false` | Never enable in production |

## Environment-Specific Requirements

### Development Environment
```env
NODE_ENV=development
VITE_API_BASE_URL=http://localhost:3000/api
VITE_AUTH0_DOMAIN=dev-corev2.auth0.com
VITE_AUTH0_CLIENT_ID=dev-client-id
VITE_AUTH0_CALLBACK_URL=http://localhost:5173/callback
```

### Staging Environment
Requires all development variables plus:
```env
JWT_SECRET=[min-32-char-secret]
SESSION_SECRET=[min-32-char-secret]
DATABASE_URL=postgresql://user:pass@host/staging_db
```

### Production Environment
Requires all staging variables plus:
```env
VITE_AUTH0_CLIENT_SECRET=[secure-secret]
VITE_AUTH0_AUDIENCE=https://api.corev2.com
REDIS_URL=redis://user:pass@host:6379
VITE_VAPID_PUBLIC_KEY=[vapid-public-key]
VITE_VAPID_PRIVATE_KEY=[vapid-private-key]
SMTP_HOST=smtp.provider.com
SMTP_USER=username
SMTP_PASS=[secure-password]
EMAIL_FROM=support@corev2.com
```

## Security Considerations

### 🔴 CRITICAL Security Rules

1. **Never commit actual values to version control**
   - Use `.env.example` for templates only
   - Add `.env` to `.gitignore`

2. **Secret Requirements**
   - JWT_SECRET: Minimum 32 characters, cryptographically random
   - SESSION_SECRET: Minimum 32 characters, cryptographically random
   - Never use default or example values in production

3. **VITE_ Prefix Warning**
   - Variables with `VITE_` prefix are exposed to the client
   - Never put secrets in VITE_ variables
   - Only use for public configuration

4. **Production Requirements**
   - Enable HTTPS/TLS everywhere
   - Use strong encryption algorithms (RS256 for JWT)
   - Enable all security features (2FA, device fingerprinting)
   - Set short session timeouts
   - Enable audit logging

5. **HIPAA Compliance**
   - LOG_RETENTION_DAYS must be at least 2555 (7 years)
   - Enable all audit logging
   - Use encryption at rest and in transit
   - Implement access controls

## Validation

The application includes automatic environment variable validation. To test your configuration:

```bash
# Validate environment variables
npm run validate:env

# Run security audit
node scripts/security/audit.js
```

## Environment File Templates

### Creating Your Environment File

1. Copy the appropriate template:
```bash
# For development
cp development.env .env

# For staging
cp staging.env .env

# For production
cp production.env .env
```

2. Fill in the actual values for your environment

3. Validate the configuration:
```bash
npm run validate:env
```

## Troubleshooting

### Common Issues

1. **Missing required variable**
   - Check the required variables list for your environment
   - Ensure the variable is set in your `.env` file

2. **Invalid variable format**
   - Check the expected format in the Variable Reference
   - Ensure URLs include protocol (http:// or https://)
   - Ensure colors are valid hex codes

3. **Security validation failures**
   - Ensure secrets are at least 32 characters
   - Don't use default or example values
   - Use strong algorithms (RS256 vs HS256)

4. **CORS issues**
   - Ensure CORS_ORIGINS includes your frontend URL
   - Check that credentials are enabled if using cookies

### Getting Help

For additional help with environment configuration:
1. Run the validation script for detailed error messages
2. Check the security audit script output
3. Review the example environment files
4. Consult the security configuration documentation

## Best Practices

1. **Use Environment-Specific Files**
   - Maintain separate `.env` files for each environment
   - Never share configurations between environments

2. **Rotate Secrets Regularly**
   - Change JWT_SECRET and SESSION_SECRET every 90 days
   - Update API keys periodically
   - Use key rotation for encryption keys

3. **Monitor Configuration**
   - Log configuration changes
   - Alert on validation failures
   - Review security settings regularly

4. **Use Secret Management**
   - Consider using AWS Secrets Manager or similar
   - Never store secrets in code
   - Use environment variables or secure vaults

5. **Document Changes**
   - Update this documentation when adding new variables
   - Document the purpose and format of each variable
   - Include migration notes for breaking changes