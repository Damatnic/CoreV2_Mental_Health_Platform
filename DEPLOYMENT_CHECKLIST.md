# 🚀 Deployment Checklist - Astral Core Mental Health Platform

## Environment Configuration Status
*Last Updated: 2025-08-30 by Agent Delta*

---

## ✅ Completed Configuration Tasks

### 1. Environment Variables ✓
- [x] Complete `.env` file configured with production variables
- [x] `.env.example` template created with all required variables
- [x] `.env.production` configured for production deployment
- [x] `.env.staging` configured for staging environment
- [x] All API keys and secrets placeholders added

### 2. Build Configuration ✓
- [x] Vite configuration optimized for production
- [x] TypeScript configuration updated with strict settings
- [x] ESLint configuration with comprehensive rules
- [x] Prettier configuration for code formatting
- [x] Bundle splitting and optimization configured

### 3. Deployment Configuration ✓
- [x] Netlify.toml enhanced with production settings
- [x] PM2 ecosystem.config.js for process management
- [x] Security headers configured
- [x] CORS policies set up
- [x] Rate limiting configured

### 4. Security Configuration ✓
- [x] JWT secrets configured
- [x] Encryption keys set up
- [x] Session management configured
- [x] HIPAA compliance settings
- [x] CSP headers configured

### 5. Monitoring & Logging ✓
- [x] Sentry error tracking configuration
- [x] Google Analytics setup
- [x] Performance monitoring settings
- [x] Audit logging configured
- [x] Health check endpoints configured

---

## 📋 Pre-Deployment Checklist

### Required Actions Before Deployment:

#### 1. **API Keys Setup** (CRITICAL)
```bash
# Replace all placeholder keys in .env.production with actual values:
```
- [ ] OpenAI API Key: `VITE_OPENAI_API_KEY`
- [ ] Anthropic API Key: `VITE_ANTHROPIC_API_KEY`
- [ ] Google Gemini API Key: `VITE_GEMINI_API_KEY`
- [ ] 988 Hotline API Key: `VITE_988_API_KEY`
- [ ] Crisis Text Line API Key: `VITE_CRISIS_TEXT_API_KEY`
- [ ] Sentry DSN: `VITE_SENTRY_DSN`

#### 2. **Database Setup** (CRITICAL)
- [ ] Create production database on Neon/Supabase
- [ ] Update `DATABASE_URL` with actual connection string
- [ ] Run database migrations: `npm run migrate:up`
- [ ] Verify database connectivity
- [ ] Set up database backups

#### 3. **Authentication Setup** (CRITICAL)
- [ ] Generate secure JWT secret (min 256-bit)
- [ ] Generate session secret
- [ ] Generate encryption keys
- [ ] Configure Auth0 (if using)
- [ ] Set up OAuth providers (Google, Apple, etc.)

#### 4. **Domain & Hosting** (HIGH)
- [ ] Configure custom domain in Netlify
- [ ] Set up SSL certificate
- [ ] Configure DNS records
- [ ] Set up CDN (CloudFlare/Netlify CDN)
- [ ] Configure email domain verification

#### 5. **Crisis Services Integration** (HIGH)
- [ ] Register with 988 Lifeline API
- [ ] Register with Crisis Text Line API
- [ ] Configure emergency services integration
- [ ] Test crisis detection thresholds
- [ ] Set up crisis alert contacts

#### 6. **Monitoring Setup** (MEDIUM)
- [ ] Create Sentry project and get DSN
- [ ] Set up Google Analytics property
- [ ] Configure Hotjar (optional)
- [ ] Set up uptime monitoring
- [ ] Configure alert emails

#### 7. **Communication Services** (MEDIUM)
- [ ] SendGrid API key for emails
- [ ] Twilio account for SMS (optional)
- [ ] Pusher for real-time features
- [ ] Configure push notifications

---

## 🔧 Deployment Commands

### Local Testing
```bash
# Verify deployment readiness
node scripts/verify-deployment.js

# Test production build locally
npm run build:production
npm run preview

# Run all tests
npm test
npm run test:e2e
```

### Netlify Deployment
```bash
# Deploy to staging
git push origin staging

# Deploy to production
git push origin master

# Manual deploy with Netlify CLI
netlify deploy --prod
```

### PM2 Deployment (VPS/Cloud)
```bash
# Start application
pm2 start ecosystem.config.js --env production

# Monitor application
pm2 monit

# View logs
pm2 logs astralcore-app
```

---

## 🔍 Post-Deployment Verification

### 1. **Functional Testing**
- [ ] User registration and login
- [ ] AI chatbot responses
- [ ] Crisis detection triggers
- [ ] 988 hotline integration
- [ ] Video/audio calls
- [ ] Offline functionality
- [ ] Push notifications

### 2. **Performance Testing**
- [ ] Page load time < 3s
- [ ] Time to Interactive < 5s
- [ ] Lighthouse score > 90
- [ ] Mobile responsiveness
- [ ] PWA installation

### 3. **Security Testing**
- [ ] SSL certificate valid
- [ ] Security headers active
- [ ] CORS properly configured
- [ ] Rate limiting working
- [ ] Data encryption verified

### 4. **Monitoring Verification**
- [ ] Error tracking active
- [ ] Analytics collecting data
- [ ] Health checks responding
- [ ] Logs being collected
- [ ] Alerts configured

---

## 🚨 Emergency Procedures

### Rollback Process
```bash
# Netlify: Rollback to previous deployment
netlify rollback

# PM2: Rollback application
pm2 reload ecosystem.config.js --update-env

# Database: Restore from backup
npm run migrate:down
npm run db:restore
```

### Emergency Contacts
- **Crisis Services**: Configure in `.env.production`
- **Technical Support**: Update contact information
- **Compliance Officer**: HIPAA breach procedures

---

## 📊 Environment Variables Reference

### Critical Variables (Must Set)
```env
NODE_ENV=production
DATABASE_URL=<actual_database_url>
JWT_SECRET=<generate_secure_secret>
ENCRYPTION_KEY=<generate_secure_key>
VITE_OPENAI_API_KEY=<actual_api_key>
VITE_ANTHROPIC_API_KEY=<actual_api_key>
```

### Important Variables (Should Set)
```env
VITE_988_API_KEY=<actual_api_key>
VITE_SENTRY_DSN=<actual_dsn>
SENDGRID_API_KEY=<actual_api_key>
VITE_PUSHER_APP_KEY=<actual_key>
```

### Optional Variables (Nice to Have)
```env
VITE_GOOGLE_ANALYTICS_ID=<ga_id>
VITE_HOTJAR_ID=<hotjar_id>
STRIPE_PUBLIC_KEY=<stripe_key>
TWILIO_ACCOUNT_SID=<twilio_sid>
```

---

## 📝 Notes

1. **Security**: Never commit actual API keys to version control
2. **Testing**: Always test in staging before production deployment
3. **Backups**: Set up automated backups before going live
4. **Monitoring**: Ensure all monitoring is active before launch
5. **Documentation**: Keep this checklist updated with any changes

---

## ✅ Final Verification

Run the deployment verification script:
```bash
node scripts/verify-deployment.js
```

If all checks pass, the application is ready for deployment!

---

*Configuration completed by Agent Delta - Environment & Configuration Specialist*