# 📚 COMPLETE NETLIFY DEPLOYMENT GUIDE
## Step-by-Step Instructions for Deploying Astral Core Mental Health Platform

### Last Updated: January 27, 2025
### GitHub Repository: https://github.com/Damatnic/CoreV2

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Netlify Account Setup](#netlify-account-setup)
3. [GitHub Connection](#github-connection)
4. [Environment Variables Configuration](#environment-variables-configuration)
5. [Database Setup (Neon PostgreSQL)](#database-setup-neon-postgresql)
6. [Build Configuration](#build-configuration)
7. [Deployment Process](#deployment-process)
8. [Post-Deployment Configuration](#post-deployment-configuration)
9. [Custom Domain Setup](#custom-domain-setup)
10. [Monitoring & Maintenance](#monitoring--maintenance)
11. [Troubleshooting](#troubleshooting)

---

## 1. PREREQUISITES

Before starting, ensure you have:

- ✅ GitHub account with repository access (https://github.com/Damatnic/CoreV2)
- ✅ Email address for Netlify account
- ✅ Credit card (optional, for paid features)
- ✅ Domain name (optional, for custom domain)

---

## 2. NETLIFY ACCOUNT SETUP

### Step 1: Create Netlify Account

1. **Navigate to Netlify**
   - Go to https://www.netlify.com
   - Click "Sign up" in the top right corner

2. **Choose Sign-up Method**
   - **Recommended**: Click "Sign up with GitHub"
   - This allows automatic repository access
   - Alternative: Use email signup, then connect GitHub later

3. **Authorize Netlify**
   - GitHub will ask to authorize Netlify
   - Click "Authorize netlify"
   - This grants Netlify access to your repositories

4. **Complete Profile**
   - Choose team name (can be your username)
   - Select free tier to start
   - You'll land on the Netlify dashboard

---

## 3. GITHUB CONNECTION

### Step 1: Import Project

1. **From Netlify Dashboard**
   - Click "Add new site" button
   - Select "Import an existing project"

2. **Connect to Git Provider**
   - Click "GitHub" button
   - If not connected, authorize Netlify for GitHub

3. **Select Repository**
   - Search for "CoreV2"
   - Click on "Damatnic/CoreV2" repository
   - If not visible, click "Configure Netlify on GitHub"
   - Add repository access for CoreV2

### Step 2: Configure Repository Access

If repository isn't showing:

1. **GitHub Settings**
   - Go to GitHub → Settings → Applications
   - Find Netlify under "Authorized OAuth Apps"
   - Click "Configure"
   
2. **Repository Access**
   - Select "Only select repositories"
   - Add "CoreV2" to the list
   - Click "Save"

3. **Return to Netlify**
   - Refresh the import page
   - Repository should now appear

---

## 4. ENVIRONMENT VARIABLES CONFIGURATION

### Critical Variables to Set

Before deployment, configure these environment variables in Netlify:

1. **Navigate to Environment Variables**
   - In Netlify site settings
   - Go to "Site configuration" → "Environment variables"
   - Click "Add a variable"

2. **Add Each Variable** (click "Add" for each):

```bash
# Database (REQUIRED - Get from Neon)
DATABASE_URL = "postgresql://user:password@host/database?sslmode=require"

# Auth0 (OPTIONAL - for authentication)
VITE_AUTH0_DOMAIN = "your-domain.auth0.com"
VITE_AUTH0_CLIENT_ID = "your-client-id"
AUTH0_CLIENT_SECRET = "your-client-secret"

# Security (REQUIRED - Generate new values)
JWT_SECRET = "generate-32-character-secret-here"
ENCRYPTION_KEY = "generate-32-character-key-here"

# Crisis Hotlines (OPTIONAL - defaults provided)
VITE_CRISIS_HOTLINE_PRIMARY = "988"
VITE_CRISIS_HOTLINE_TEXT = "741741"

# Push Notifications (OPTIONAL)
VITE_VAPID_PUBLIC_KEY = "your-vapid-public-key"
VAPID_PRIVATE_KEY = "your-vapid-private-key"

# API Keys (OPTIONAL - for AI features)
OPENAI_API_KEY = "sk-..."
ANTHROPIC_API_KEY = "sk-ant-..."

# Build Configuration
NODE_VERSION = "20.18.1"
NPM_VERSION = "10.9.2"
```

### How to Generate Secure Secrets

**For JWT_SECRET and ENCRYPTION_KEY:**

Option 1: Use an online generator
- Go to https://randomkeygen.com/
- Use "CodeIgniter Encryption Keys" section
- Copy a 32-character string

Option 2: Use command line (if available)
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Option 3: Use a password manager
- Generate a 32-character random string
- Use only alphanumeric characters

---

## 5. DATABASE SETUP (NEON POSTGRESQL)

### Step 1: Create Neon Account

1. **Sign up for Neon**
   - Go to https://neon.tech
   - Click "Start Free"
   - Sign up with GitHub (recommended) or email

2. **Create Project**
   - Click "Create project"
   - Project name: "astral-core-production"
   - Region: Choose closest to your users
   - Click "Create project"

### Step 2: Get Database URL

1. **From Neon Dashboard**
   - Select your project
   - Go to "Dashboard" tab
   - Find "Connection string"

2. **Copy Connection URL**
   - Click "Show password"
   - Copy the entire connection string
   - It looks like: `postgresql://username:password@host.neon.tech/database?sslmode=require`

3. **Add to Netlify**
   - Go back to Netlify environment variables
   - Add as `DATABASE_URL`
   - Paste the connection string

### Step 3: Initialize Database

1. **Run Migrations** (after first deployment)
   - The app will auto-create tables on first run
   - Check Netlify Functions logs to verify

---

## 6. BUILD CONFIGURATION

### Site Configuration

In Netlify's deployment settings:

1. **Build Settings**
   - Base directory: (leave empty)
   - Build command: `npm run build:netlify`
   - Publish directory: `dist`
   - Functions directory: `netlify/functions`

2. **Node Version** (already in netlify.toml)
   ```toml
   [build.environment]
   NODE_VERSION = "20.18.1"
   NPM_VERSION = "10.9.2"
   ```

3. **Build Optimizations**
   - Enable "Post processing"
   - ✅ Bundle CSS
   - ✅ Minify JS
   - ✅ Compress images
   - ✅ Pretty URLs

---

## 7. DEPLOYMENT PROCESS

### Step 1: Initial Deployment

1. **Review Settings**
   - Verify all environment variables are set
   - Check build command is correct
   - Confirm publish directory is `dist`

2. **Deploy Site**
   - Click "Deploy site" button
   - Netlify will start building
   - Takes 3-5 minutes typically

3. **Monitor Build**
   - Watch the deploy log
   - Look for any errors
   - Build should show "Published"

### Step 2: Verify Deployment

1. **Check Site URL**
   - Netlify provides a temporary URL
   - Format: `https://amazing-name-123.netlify.app`
   - Click to open your site

2. **Test Critical Features**
   - ✅ Homepage loads
   - ✅ Crisis resources accessible
   - ✅ Quick Exit button works (ESC 3 times)
   - ✅ Offline mode (disconnect internet, refresh)
   - ✅ PWA installation prompt

---

## 8. POST-DEPLOYMENT CONFIGURATION

### Enable Key Features

1. **Identity (Optional - for user auth)**
   - Go to "Identity" in Netlify
   - Click "Enable Identity"
   - Configure registration settings

2. **Forms (for contact/feedback)**
   - Netlify auto-detects forms
   - Add `netlify` attribute to forms
   - View submissions in Netlify dashboard

3. **Functions (API endpoints)**
   - Already configured in `netlify/functions`
   - Check "Functions" tab for logs
   - Monitor for errors

4. **Analytics (Optional)**
   - Enable Netlify Analytics ($9/month)
   - Or use privacy-focused alternative

### Security Headers (Already Configured)

The `netlify.toml` includes security headers:
- Content Security Policy
- HSTS (SSL enforcement)
- X-Frame-Options
- X-Content-Type-Options

---

## 9. CUSTOM DOMAIN SETUP

### Step 1: Add Custom Domain

1. **Domain Settings**
   - Go to "Domain management"
   - Click "Add domain alias"
   - Enter your domain: `yourdomain.com`

2. **Verify Ownership**
   - Netlify will check DNS
   - Follow verification steps

### Step 2: Configure DNS

**Option A: Netlify DNS (Recommended)**

1. **Switch to Netlify DNS**
   - Click "Use Netlify DNS"
   - Update nameservers at your registrar
   - Nameservers provided by Netlify

2. **Wait for Propagation**
   - Takes 24-48 hours
   - Check status in Netlify

**Option B: External DNS**

1. **Add DNS Records**
   - Type: A
   - Name: @
   - Value: 75.2.60.5

2. **Add www subdomain**
   - Type: CNAME
   - Name: www
   - Value: your-site.netlify.app

### Step 3: Enable HTTPS

1. **SSL Certificate**
   - Netlify provides free SSL
   - Go to "Domain management" → "HTTPS"
   - Click "Verify DNS configuration"
   - Click "Provision certificate"

2. **Force HTTPS**
   - Already configured in `netlify.toml`
   - All HTTP traffic redirects to HTTPS

---

## 10. MONITORING & MAINTENANCE

### Daily Monitoring

1. **Check Netlify Dashboard**
   - Build status
   - Function logs
   - Form submissions
   - Analytics (if enabled)

2. **Monitor Functions**
   - Go to "Functions" tab
   - Check for errors
   - Review execution time
   - Monitor usage limits

3. **Error Tracking**
   - Set up Sentry (optional)
   - Add `SENTRY_DSN` to environment variables
   - Monitor error reports

### Weekly Tasks

1. **Review Analytics**
   - User engagement
   - Crisis resource usage
   - Performance metrics

2. **Check Dependencies**
   - Review security alerts
   - Update if needed
   - Test after updates

3. **Backup Database**
   - Neon provides automatic backups
   - Download manual backup monthly

### Monthly Tasks

1. **Security Audit**
   - Review access logs
   - Check for suspicious activity
   - Update secrets if needed

2. **Performance Review**
   - Check Lighthouse scores
   - Review Core Web Vitals
   - Optimize if needed

---

## 11. TROUBLESHOOTING

### Common Issues & Solutions

#### Build Fails

**Error**: "Command failed with exit code 1"
```bash
# Solution: Check Node version
NODE_VERSION = "20.18.1"
```

**Error**: "Cannot find module"
```bash
# Solution: Clear cache and rebuild
- Go to "Deploys" → "Trigger deploy" → "Clear cache and deploy site"
```

#### Environment Variables Not Working

**Issue**: Features not working in production
- Double-check variable names (case-sensitive)
- Ensure VITE_ prefix for client-side variables
- Redeploy after adding variables

#### Database Connection Issues

**Error**: "Connection refused"
- Verify DATABASE_URL is correct
- Check SSL mode is set: `?sslmode=require`
- Ensure Neon project is active

#### Large Bundle Size

**Warning**: Bundle size exceeds limit
- Already optimized with code splitting
- Consider lazy loading more routes
- Review and remove unused dependencies

#### Crisis Features Not Working

**Issue**: Crisis resources not loading
- Check offline-crisis.html is cached
- Verify service worker is registered
- Clear browser cache and retry

---

## 📞 EMERGENCY SUPPORT

### For Mental Health Emergencies
- **988**: Suicide & Crisis Lifeline
- **741741**: Crisis Text Line (text "HELLO")
- **911**: Immediate emergency

### For Technical Support
- **Netlify Support**: https://www.netlify.com/support/
- **GitHub Issues**: https://github.com/Damatnic/CoreV2/issues
- **Community Forum**: https://answers.netlify.com/

---

## ✅ DEPLOYMENT CHECKLIST

Before going live, ensure:

- [ ] All environment variables configured
- [ ] Database connected and initialized
- [ ] Crisis hotline numbers verified
- [ ] Quick Exit button tested (ESC x3)
- [ ] Offline mode tested
- [ ] SSL certificate active
- [ ] Custom domain configured (optional)
- [ ] Error tracking setup (optional)
- [ ] Backup plan documented
- [ ] Team trained on crisis response

---

## 🎉 CONGRATULATIONS!

Your mental health support platform is now live and helping people in crisis. Remember to:

1. Monitor the platform regularly
2. Respond to user feedback
3. Keep crisis resources updated
4. Maintain security best practices
5. Scale resources as needed

**Thank you for providing this critical mental health resource to those in need.**

---

*Document Version: 1.0*
*Platform Version: Astral Core v1.0.0*
*Last Updated: January 27, 2025*