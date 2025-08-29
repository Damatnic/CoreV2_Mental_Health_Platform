# 🚀 Deploy from GitHub to Netlify

## Option 1: One-Click Deploy (EASIEST)

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Damatnic/CoreV2)

Click the button above to automatically:
1. Fork this repository to your GitHub account
2. Create a new Netlify site
3. Connect the site to your forked repository
4. Deploy the site

After deployment, set your environment variable:
- Go to Site settings → Environment variables
- Add: `JWT_SECRET` = `1f1dee261a67dfa101773ba725204e5ced40572b0a68cd387fd45d69c4d60bd9`

---

## Option 2: Connect Existing Repository

### Step 1: Connect GitHub to Netlify

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "Deploy with GitHub"
4. Authorize Netlify to access your GitHub account
5. Select repository: `Damatnic/CoreV2`

### Step 2: Configure Build Settings

Netlify will auto-detect these settings, but verify:
- **Build command:** `npm run build`
- **Publish directory:** `dist`
- **Functions directory:** `netlify/functions`

### Step 3: Set Environment Variables

1. Before deploying, click "Show advanced"
2. Add environment variable:
   - Key: `JWT_SECRET`
   - Value: `1f1dee261a67dfa101773ba725204e5ced40572b0a68cd387fd45d69c4d60bd9`

### Step 4: Deploy

Click "Deploy site" and wait 2-3 minutes for the build to complete.

---

## Option 3: GitHub Actions Deployment

### Setup Automatic Deployment

1. **Get Netlify Credentials:**
   - Go to https://app.netlify.com/user/applications#personal-access-tokens
   - Create a new access token
   - Copy the token

2. **Get Site ID:**
   - In Netlify, go to Site settings → General
   - Copy the Site ID

3. **Add GitHub Secrets:**
   - Go to your GitHub repository
   - Settings → Secrets and variables → Actions
   - Add these secrets:
     - `NETLIFY_AUTH_TOKEN`: Your personal access token
     - `NETLIFY_SITE_ID`: Your site ID

4. **Enable GitHub Actions:**
   - The workflow file is already in `.github/workflows/deploy.yml`
   - Every push to `master` will automatically deploy

---

## 🔗 Your Live URLs

After deployment, your site will be available at:

### Primary URL
```
https://[your-site-name].netlify.app
```

### Example URLs
- `https://corev2-mental-health.netlify.app`
- `https://amazing-wilson-abc123.netlify.app` (auto-generated)

### Custom Domain (Optional)
1. Go to Domain settings in Netlify
2. Add custom domain
3. Follow DNS configuration instructions

---

## ✅ Post-Deployment Checklist

After your site is live:

- [ ] Visit the site and verify it loads
- [ ] Test login: `demo@example.com` / `demo123`
- [ ] Check crisis resources (988 hotline visible)
- [ ] Test offline mode (disconnect internet)
- [ ] Try PWA installation
- [ ] Verify mobile responsiveness

---

## 🔧 Troubleshooting

### Build Fails
- Check Node version is 18+ in Netlify settings
- Verify all dependencies are in package.json
- Check build logs for specific errors

### Functions Not Working
- Ensure JWT_SECRET is set in environment variables
- Check function logs in Netlify dashboard
- Verify functions directory is set to `netlify/functions`

### Site Not Loading
- Clear browser cache
- Check for console errors
- Verify service worker is registered

---

## 📊 GitHub Repository Info

**Repository:** https://github.com/Damatnic/CoreV2

**Features:**
- ✅ 0 TypeScript errors
- ✅ Production build optimized
- ✅ PWA ready
- ✅ Crisis resources included
- ✅ Offline support
- ✅ Mobile responsive

**Tech Stack:**
- React 18.3
- TypeScript 5.6
- Vite 5.4
- Netlify Functions
- JWT Authentication

---

## 🆘 Crisis Resources

This platform includes 24/7 crisis support:
- 988 Suicide & Crisis Lifeline
- Crisis Text Line (741741)
- Emergency contacts
- Offline resources

---

## 💙 Ready to Help

Your mental health platform is configured for immediate deployment from GitHub. The repository includes all necessary files, configurations, and documentation.

**Deploy now and start making a difference!**

---

*Repository: https://github.com/Damatnic/CoreV2*
*Last Updated: 2025-08-14*