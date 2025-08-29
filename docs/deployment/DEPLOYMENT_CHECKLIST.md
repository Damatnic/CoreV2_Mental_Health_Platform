# CoreV2 Deployment Checklist

## Phase 5.3 - Deploy & Test
**Created:** 2025-08-14  
**Deployment Specialist:** Active

---

## Pre-Deployment Verification ✅

### Build Configuration
- [x] **netlify.toml** configured correctly
  - Build command: `npm run build:netlify-simple`
  - Publish directory: `dist`
  - Node version: 18.17.0
  - Headers configured for PWA, crisis resources, and security
  - Redirects for SPA routing and HTTPS
  
- [x] **package.json** scripts verified
  - `build` command works locally
  - `build:netlify-simple` configured for Netlify
  - All dependencies installed correctly

### Environment Variables Documentation
- [x] Development environment variables documented (development.env)
- [x] Production environment variables documented (production.env)
- [x] Staging environment variables documented (staging.env)
- [ ] All sensitive values replaced with placeholders in documentation

---

## Required Environment Variables for Netlify

### Critical Variables (Must Set)
```env
# Environment
NODE_ENV=production

# JWT Security (Generate new secrets!)
JWT_SECRET=[minimum-32-character-secret]
SESSION_SECRET=[minimum-32-character-secret]

# Encryption Keys (Generate new!)
ENCRYPTION_KEY=[32-characters-exactly]
ENCRYPTION_IV=[16-characters-exactly]

# Crisis Detection
CRISIS_DETECTION_ENABLED=true
CRISIS_HOTLINE=988
CRISIS_TEXT_LINE=741741

# Build Variables
VITE_BUILD_MODE=production
```

### Optional Variables (For Full Features)
```env
# Database (When ready)
DATABASE_URL=[neon-database-url]

# Auth0 (If using authentication)
VITE_AUTH0_DOMAIN=[your-domain]
VITE_AUTH0_CLIENT_ID=[your-client-id]

# Analytics (Optional)
SENTRY_DSN=[your-sentry-dsn]
GA_TRACKING_ID=[your-ga-id]

# Push Notifications (Future)
VITE_VAPID_PUBLIC_KEY=[generate-vapid-key]
```

---

## Deployment Steps

### 1. Initial Setup
- [ ] Create Netlify account (if not exists)
- [ ] Connect GitHub repository to Netlify
- [ ] Set site name (e.g., astralcorev2)

### 2. Configure Build Settings
- [ ] Build command: `npm run build:netlify-simple`
- [ ] Publish directory: `dist`
- [ ] Node version: Set to 18.17.0 in environment

### 3. Set Environment Variables
- [ ] Go to Site Settings → Environment Variables
- [ ] Add all critical variables (see above)
- [ ] Generate secure random values for secrets
- [ ] Save configuration

### 4. Deploy to Staging
- [ ] Trigger initial deploy
- [ ] Monitor build logs for errors
- [ ] Verify build completes successfully
- [ ] Check deployed site URL

### 5. Test Core Features
- [ ] **Homepage** loads correctly
- [ ] **Navigation** works (all menu items)
- [ ] **Crisis Resources** page accessible
- [ ] **Offline mode** works (disconnect internet and test)
- [ ] **PWA Installation** prompt appears
- [ ] **Service Worker** registered successfully

### 6. Test Mental Health Features
- [ ] **Mood Tracker** interface works
- [ ] **Journal** creation and viewing
- [ ] **Breathing Exercise** animations run
- [ ] **Safety Plan** form submits
- [ ] **Crisis Chat** interface loads
- [ ] **Community Feed** displays

### 7. Mobile Testing
- [ ] Site responsive on mobile devices
- [ ] Touch targets adequately sized
- [ ] Forms usable on mobile
- [ ] PWA installs on mobile
- [ ] Performance acceptable on 3G

### 8. Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast passes WCAG
- [ ] Focus indicators visible
- [ ] Alt text for images

### 9. Performance Verification
- [ ] Lighthouse score > 90
- [ ] First Contentful Paint < 2s
- [ ] Time to Interactive < 5s
- [ ] Bundle size reasonable
- [ ] Images optimized

### 10. Security Checks
- [ ] HTTPS enforced
- [ ] Security headers present
- [ ] No exposed API keys
- [ ] CSP headers configured
- [ ] Rate limiting active

---

## Post-Deployment Monitoring

### Immediate (First Hour)
- [ ] Check Netlify function logs
- [ ] Monitor browser console for errors
- [ ] Test critical user paths
- [ ] Verify offline functionality
- [ ] Check service worker caching

### First 24 Hours
- [ ] Monitor error tracking (if configured)
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Test on various devices
- [ ] Verify crisis resources load

### Ongoing
- [ ] Set up uptime monitoring
- [ ] Configure error alerting
- [ ] Plan regular security audits
- [ ] Schedule performance reviews
- [ ] Document any issues found

---

## Known Issues & Fixes

### Issue: Build fails with workbox error
**Status:** FIXED
**Solution:** Using simplified build script (`build:netlify-simple`)

### Issue: Service worker not registering
**Status:** MONITORING
**Solution:** Verify sw.js is in dist folder and headers are correct

### Issue: Environment variables not loading
**Status:** PREVENTED
**Solution:** Use VITE_ prefix for client-side variables

---

## Rollback Plan

If critical issues found:
1. Revert to previous deploy in Netlify dashboard
2. Identify root cause in staging environment
3. Fix issues and test thoroughly
4. Redeploy when stable

---

## Success Criteria

- [x] Build completes without errors
- [ ] All pages load correctly
- [ ] Mobile experience smooth
- [ ] Offline mode functional
- [ ] Crisis resources always accessible
- [ ] No critical errors in console
- [ ] Performance metrics acceptable
- [ ] Security headers in place

---

## Contact & Support

- **Netlify Status:** https://www.netlifystatus.com/
- **Netlify Support:** https://www.netlify.com/support/
- **Project Repository:** https://github.com/Damatnic/CoreV2
- **Crisis Resources:** Always accessible at /crisis

---

## Final Verification

Before marking deployment complete:
- [ ] All checklist items reviewed
- [ ] No blocking issues remain
- [ ] Performance acceptable
- [ ] Security configured
- [ ] Documentation updated
- [ ] Team notified of deployment

---

**Deployment Status:** 🔄 IN PROGRESS

*Last Updated: 2025-08-14*