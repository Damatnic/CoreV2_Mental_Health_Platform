# CoreV2 Mental Health Platform - Deployment Guide

## Quick Start Deployment (5 minutes)

### Step 1: Prepare for Deployment
```bash
# Ensure you're in the project root
cd C:\Users\damat\_REPOS\CoreV2

# Check git status
git status

# If there are changes, commit them
git add .
git commit -m "Ready for production deployment - all features verified"
```

### Step 2: Deploy to Netlify

#### Method 1: Git Push (Automatic - Recommended)
```bash
# Push to your repository
git push origin master

# Netlify will automatically:
# 1. Detect the push
# 2. Run the build command from netlify.toml
# 3. Deploy the site
# 4. Provide you with a URL
```

#### Method 2: Netlify CLI
```bash
# Install Netlify CLI if needed
npm install -g netlify-cli

# Login to Netlify
netlify login

# Link your site (if not already linked)
netlify link

# Deploy directly to production
netlify deploy --prod

# Or build and deploy
npm run build:netlify && netlify deploy --prod --dir=dist
```

#### Method 3: Manual Upload
1. Build locally: `npm run build:netlify`
2. Go to https://app.netlify.com
3. Drag the `dist` folder to the deployment area
4. Wait for processing
5. Your site is live!

---

## Detailed Deployment Instructions

### Pre-Deployment Checklist

#### 1. Verify Local Build
```bash
# Clean previous build
npm run clean

# Run the production build
npm run build:netlify

# Check the output
# You should see:
# - "BUILD COMPLETED SUCCESSFULLY!"
# - "JS Files: 30" (or similar)
# - "CSS Files: 4" (or similar)
```

#### 2. Test Locally
```bash
# Serve the build locally
npx http-server dist -p 8080

# Open http://localhost:8080 in browser
# Verify:
# - [ ] Site loads without errors
# - [ ] Crisis button is visible
# - [ ] Can navigate to different pages
# - [ ] Console has no critical errors
```

#### 3. Check Critical Files
```bash
# Verify all critical files exist
ls dist/
# Should see: index.html, sw.js, offline.html, assets/, etc.

ls dist/assets/js/ | wc -l
# Should show ~30 JavaScript files

ls dist/assets/css/ | wc -l
# Should show ~4 CSS files
```

### Netlify Dashboard Configuration

#### 1. Site Settings
Navigate to: Site Settings > General

- **Site name:** astralcorev2 (or your preferred name)
- **Custom domain:** (optional) Add your domain

#### 2. Build & Deploy Settings
Navigate to: Site Settings > Build & Deploy

Verify these settings:
- **Base directory:** (leave empty)
- **Build command:** `npm run build:netlify`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

#### 3. Environment Variables (if needed)
Navigate to: Site Settings > Environment Variables

Add any required variables:
```
NODE_VERSION=20.18.1
NODE_ENV=production
```

Note: Most features work without environment variables since the app supports anonymous usage.

#### 4. Deploy Contexts
Navigate to: Site Settings > Build & Deploy > Deploy contexts

- **Production branch:** master (or main)
- **Deploy previews:** Enabled for pull requests
- **Branch deploys:** None or specific branches only

### Deployment Commands Reference

#### Build Commands
```bash
# Primary build command (used by Netlify)
npm run build:netlify

# Alternative build commands (fallbacks)
npm run build:netlify-foolproof    # Extra safety checks
npm run build:netlify-bulletproof  # Maximum reliability
npm run build:netlify-guaranteed   # Guaranteed JS output

# Local testing build
npm run build:full  # Standard Vite build
```

#### Verification Commands
```bash
# After deployment, verify the live site
curl -I https://astralcorev2.netlify.app
# Should return 200 OK

# Check critical resources
curl https://astralcorev2.netlify.app/crisis-resources.json
# Should return JSON data

# Test service worker
curl https://astralcorev2.netlify.app/sw.js
# Should return JavaScript content
```

### Post-Deployment Verification

#### 1. Basic Functionality Check
Visit your deployed site and verify:

- **Homepage loads** ✓
  - No white screen
  - Navigation visible
  - Content renders

- **Crisis Support** ✓
  - Crisis button accessible
  - Emergency contacts load
  - Resources available

- **Core Features** ✓
  - Mood tracking works
  - Can create entries
  - Data saves locally

#### 2. Browser Console Check
Open Developer Tools (F12) and check:
- No critical errors (red text)
- No 404 errors for JS/CSS files
- No MIME type warnings

#### 3. Network Tab Verification
In Developer Tools > Network:
- All JS files load (status 200)
- All CSS files load (status 200)
- No failed requests for critical resources

#### 4. Mobile Responsiveness
Test on mobile device or responsive mode:
- Site is usable on small screens
- Navigation works on mobile
- Touch interactions function

### Troubleshooting Common Issues

#### Issue: White Screen / App Won't Load

**Solution 1:** Check browser console for errors
```javascript
// If you see module errors, clear cache:
// Chrome: Ctrl+Shift+R
// Firefox: Ctrl+F5
```

**Solution 2:** Verify build output
```bash
# Rebuild with verbose output
npm run build:netlify

# Check if all files were created
ls -la dist/assets/js/
```

#### Issue: 404 Errors for Assets

**Solution:** Check _headers file
```bash
# Ensure _headers file exists in dist
cat dist/_headers

# Should contain MIME type definitions
```

#### Issue: Service Worker Not Registering

**Solution:** Check SW scope
```javascript
// SW should be at root level
// Path should be /sw.js not /assets/sw.js
```

#### Issue: Build Fails on Netlify

**Solution 1:** Check Node version
```toml
# In netlify.toml
[build.environment]
  NODE_VERSION = "20.18.1"
```

**Solution 2:** Use fallback build
```toml
# Change build command to
command = "npm run build:netlify-foolproof"
```

### Monitoring & Maintenance

#### 1. Setup Monitoring
- Enable Netlify Analytics (if available)
- Check build logs regularly
- Monitor deploy webhooks

#### 2. Regular Updates
```bash
# Weekly dependency updates
npm update

# Monthly security audit
npm audit fix

# Rebuild and redeploy
npm run build:netlify
git add .
git commit -m "Dependencies update"
git push
```

#### 3. Backup Strategy
- Keep local build artifacts
- Save successful deploy SHAs
- Document configuration changes

### Emergency Procedures

#### Immediate Rollback
1. Go to Netlify Dashboard
2. Navigate to Deploys
3. Find last working deployment
4. Click "Publish deploy"

#### Fix and Redeploy
```bash
# Revert problematic changes
git revert HEAD
git push

# Or fix and push
git add .
git commit -m "Emergency fix: [description]"
git push
```

#### Contact Support
If critical issues persist:
1. Check Netlify Status: https://www.netlifystatus.com/
2. Review build logs in Netlify Dashboard
3. Contact Netlify Support with deploy ID

---

## Success Metrics

After deployment, verify success by checking:

1. **Uptime:** Site accessible 24/7
2. **Performance:** Load time < 3 seconds
3. **Functionality:** All features working
4. **User Access:** Anonymous users can use app
5. **Crisis Support:** Emergency resources available

---

## Final Notes

- The app is designed to work **without a backend**
- All data is stored **locally in the browser**
- Crisis resources are **cached for offline use**
- The build process is **optimized for reliability**
- Deployment typically takes **2-3 minutes**

**Your mental health platform is ready to help people in need!**

For questions or issues, refer to:
- Build logs in Netlify Dashboard
- Browser console for client-side errors
- Network tab for resource loading issues
- This guide for troubleshooting steps

---

*Last Updated: January 15, 2025*
*Version: 1.0.0*
*Status: Production Ready*