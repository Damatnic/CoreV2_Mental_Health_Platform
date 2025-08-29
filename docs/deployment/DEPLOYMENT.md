# 🚀 CoreV2 Deployment Guide

## Table of Contents
- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Deployment Options](#deployment-options)
- [Netlify Deployment](#netlify-deployment)
- [Vercel Deployment](#vercel-deployment)
- [Docker Deployment](#docker-deployment)
- [Post-Deployment](#post-deployment)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- Node.js 18.x or higher
- npm 9.x or higher
- Git
- 2GB RAM minimum (4GB recommended)
- 1GB free disk space

### Required Accounts
- GitHub account (for CI/CD)
- Netlify account (recommended) or Vercel account
- Auth0 account (for authentication)
- Sentry account (optional, for error tracking)
- Google Analytics account (optional)

## Environment Setup

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/corev2.git
cd corev2
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables

Create environment files for each environment:

#### Development (.env.development)
```env
# Core Configuration
NODE_ENV=development
VITE_BUILD_MODE=development
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001

# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:3000/callback
VITE_AUTH0_AUDIENCE=https://api.astralcore.com

# Crisis Resources
VITE_CRISIS_HOTLINE=988
VITE_CRISIS_TEXT=741741
VITE_CRISIS_CHAT_URL=https://988lifeline.org/chat

# Optional Services
VITE_SENTRY_DSN=
VITE_GA_MEASUREMENT_ID=
VITE_PUSH_NOTIFICATIONS_ENABLED=false
```

#### Production (.env.production)
```env
# Core Configuration
NODE_ENV=production
VITE_BUILD_MODE=production
VITE_API_URL=https://api.astralcore.com/api
VITE_WS_URL=wss://api.astralcore.com

# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-production-client-id
VITE_AUTH0_REDIRECT_URI=https://astralcore.com/callback
VITE_AUTH0_AUDIENCE=https://api.astralcore.com

# Crisis Resources
VITE_CRISIS_HOTLINE=988
VITE_CRISIS_TEXT=741741
VITE_CRISIS_CHAT_URL=https://988lifeline.org/chat

# Services
VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_PUSH_NOTIFICATIONS_ENABLED=true
VITE_PUSH_VAPID_PUBLIC_KEY=your-vapid-public-key
```

### 4. Build the Application

#### Development Build
```bash
npm run build
```

#### Production Build
```bash
npm run build:production
```

#### Optimized Build
```bash
npm run build:optimized
```

### 5. Verify Build
```bash
npm run verify:sw
```

## Deployment Options

## Netlify Deployment

### Method 1: Netlify CLI (Recommended)

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login to Netlify**
```bash
netlify login
```

3. **Initialize Netlify Site**
```bash
netlify init
```

4. **Configure Build Settings**
- Build command: `npm run build:netlify`
- Publish directory: `dist`
- Functions directory: `netlify/functions`

5. **Set Environment Variables**
```bash
netlify env:set VITE_AUTH0_DOMAIN your-domain.auth0.com
netlify env:set VITE_AUTH0_CLIENT_ID your-client-id
# Add all other environment variables
```

6. **Deploy**
```bash
# Deploy to draft URL
netlify deploy

# Deploy to production
netlify deploy --prod
```

### Method 2: GitHub Integration

1. **Connect GitHub Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Select GitHub and choose repository

2. **Configure Build Settings**
   - Branch to deploy: `main` or `master`
   - Build command: `npm run build:netlify`
   - Publish directory: `dist`

3. **Set Environment Variables**
   - Go to Site settings → Environment variables
   - Add all required environment variables

4. **Deploy**
   - Push to main branch triggers automatic deployment
   - Pull requests create preview deployments

### Method 3: Manual Deploy

1. **Build Locally**
```bash
npm run build:production
```

2. **Drag & Drop**
   - Go to [Netlify Drop](https://app.netlify.com/drop)
   - Drag the `dist` folder to deploy

## Vercel Deployment

### Method 1: Vercel CLI

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **Configure**
   - Framework: Vite
   - Build Command: `npm run build:production`
   - Output Directory: `dist`

### Method 2: GitHub Integration

1. **Import Project**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Import Project"
   - Import from GitHub

2. **Configure**
   - Framework Preset: Vite
   - Build Command: `npm run build:production`
   - Output Directory: `dist`

3. **Set Environment Variables**
   - Add all required variables in project settings

## Docker Deployment

### 1. Build Docker Image

Create `Dockerfile` if not exists:
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Build and Run
```bash
# Build image
docker build -t corev2:latest .

# Run container
docker run -p 80:80 -d corev2:latest
```

### 3. Deploy to Cloud

#### AWS ECS
```bash
# Tag image
docker tag corev2:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/corev2:latest

# Push to ECR
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/corev2:latest
```

#### Google Cloud Run
```bash
# Tag image
docker tag corev2:latest gcr.io/<project-id>/corev2:latest

# Push to GCR
docker push gcr.io/<project-id>/corev2:latest

# Deploy
gcloud run deploy corev2 --image gcr.io/<project-id>/corev2:latest
```

## Post-Deployment

### 1. Verify Deployment

#### Check Site Availability
```bash
curl -I https://your-domain.com
```

#### Check Service Worker
```bash
curl https://your-domain.com/sw.js
```

#### Check Critical Resources
```bash
curl https://your-domain.com/crisis-resources.json
curl https://your-domain.com/manifest.json
curl https://your-domain.com/offline.html
```

### 2. Configure DNS

#### Netlify
1. Go to Domain settings
2. Add custom domain
3. Configure DNS:
   - Type: A
   - Name: @
   - Value: 75.2.60.5
   - Type: CNAME
   - Name: www
   - Value: your-site.netlify.app

#### Vercel
1. Go to Project settings → Domains
2. Add domain
3. Follow DNS configuration instructions

### 3. Enable HTTPS

#### Netlify
- Automatic with Let's Encrypt
- Force HTTPS in Site settings → Domain management

#### Vercel
- Automatic with Let's Encrypt

### 4. Configure CDN

The application automatically uses CDN for:
- Static assets (`/assets/*`)
- Images (`*.png`, `*.jpg`, `*.svg`)
- Crisis resources (with appropriate cache headers)

### 5. Set Up Monitoring

#### Health Check Endpoint
```bash
# Netlify Function
curl https://your-domain.com/api/health

# Direct endpoint
curl https://your-domain.com/.netlify/functions/health
```

#### Uptime Monitoring
1. Use services like:
   - UptimeRobot
   - Pingdom
   - StatusCake

2. Monitor endpoints:
   - `/` (main site)
   - `/api/health` (health check)
   - `/crisis-resources.json` (critical resource)

## Monitoring

### 1. Application Performance

#### Lighthouse CI
- Automated in CI/CD pipeline
- Manual check: Chrome DevTools → Lighthouse

#### Web Vitals
```javascript
// Monitored metrics:
- FCP (First Contentful Paint) < 2s
- LCP (Largest Contentful Paint) < 3s
- FID (First Input Delay) < 100ms
- CLS (Cumulative Layout Shift) < 0.1
- TTI (Time to Interactive) < 5s
```

### 2. Error Tracking

#### Sentry Setup
1. Create project at [sentry.io](https://sentry.io)
2. Add DSN to environment variables
3. Errors automatically tracked

#### View Errors
```bash
# Check Sentry dashboard
# Or use CLI
sentry-cli releases list
```

### 3. Analytics

#### Google Analytics
1. Create property in Google Analytics
2. Add Measurement ID to environment
3. View reports in GA dashboard

### 4. Service Worker Analytics
```javascript
// Monitored in sw.js:
- Cache hit rate
- Offline usage
- Background sync events
- Push notification engagement
```

## Troubleshooting

### Common Issues

#### Build Failures

**TypeScript Errors**
```bash
# Skip TypeScript checking temporarily
npx tsc --noEmit --skipLibCheck

# Fix imports
npm run lint:fix
```

**Memory Issues**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### Deployment Issues

**Netlify Build Timeout**
```toml
# netlify.toml
[build]
  command = "npm run build:netlify"
  commandTimeout = 1200  # 20 minutes
```

**Large Bundle Size**
```bash
# Analyze bundle
npm run analyze:bundle

# Use optimized build
npm run build:optimized
```

#### Service Worker Issues

**Not Updating**
```javascript
// Force update in browser console
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  for(let registration of registrations) {
    registration.unregister();
  }
});
```

**Cache Issues**
```bash
# Clear all caches
npm run clear:cache

# In browser console
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

#### Crisis Resources Not Loading

1. Check CORS headers in `netlify.toml`
2. Verify files exist in `dist/`
3. Check network tab for 404s
4. Ensure service worker registered

### Debug Mode

Enable debug logging:
```javascript
// In browser console
localStorage.setItem('debug', '*');

// Specific namespaces
localStorage.setItem('debug', 'sw:*,offline:*,crisis:*');
```

### Performance Issues

#### Slow Initial Load
1. Check bundle size: `npm run analyze:bundle`
2. Enable compression in Netlify/Vercel
3. Verify CDN is working
4. Check for render-blocking resources

#### Memory Leaks
1. Use Chrome DevTools → Memory Profiler
2. Check for event listener cleanup
3. Verify component unmounting

### Security Checks

#### Before Each Deployment
```bash
# Check for vulnerabilities
npm audit

# Fix automatically
npm audit fix

# Check secrets
npm run security:scan
```

#### Headers Verification
```bash
# Check security headers
curl -I https://your-domain.com | grep -E "X-Frame-Options|X-Content-Type|Content-Security-Policy"
```

## CI/CD Pipeline

### GitHub Actions

The repository includes a comprehensive CI/CD pipeline that:

1. **On Push/PR:**
   - Runs ESLint
   - Checks TypeScript
   - Runs tests
   - Builds application
   - Runs Lighthouse CI
   - Security scanning

2. **On Main Branch:**
   - Deploys to Netlify
   - Runs health checks
   - Sends notifications

### Manual Deployment Checklist

- [ ] All tests passing
- [ ] TypeScript errors resolved
- [ ] Environment variables set
- [ ] Build successful
- [ ] Service worker verified
- [ ] Crisis resources accessible
- [ ] Health check passing
- [ ] SSL certificate active
- [ ] Monitoring configured
- [ ] Backup created

## Support

### Resources
- [Documentation](./README.md)
- [Contributing Guide](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Environment Variables](./ENVIRONMENT_VARIABLES.md)

### Getting Help
- GitHub Issues: [Report bugs](https://github.com/your-org/corev2/issues)
- Email: support@astralcore.com
- Crisis Support: Always available at 988

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

**Last Updated:** November 2024
**Version:** 1.0.0