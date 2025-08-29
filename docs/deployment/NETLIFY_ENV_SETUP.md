# Netlify Environment Variables Setup Guide

## Quick Start - Essential Variables Only

For a basic deployment, you only need these variables in Netlify:

```env
NODE_ENV=production
VITE_BUILD_MODE=production
JWT_SECRET=your-super-secret-key-minimum-32-chars-long-change-this
```

That's it! The app will work with just these three variables.

---

## Complete Setup Guide

### Step 1: Access Netlify Environment Variables

1. Log into Netlify Dashboard
2. Select your site (astralcorev2)
3. Go to **Site configuration** → **Environment variables**
4. Click **Add a variable**

### Step 2: Add Essential Variables (Required)

Copy and paste these one by one:

#### NODE_ENV
- **Key:** `NODE_ENV`
- **Value:** `production`
- **Scopes:** All (Production, Deploy Previews, Branch deploys, Local development)

#### Build Mode
- **Key:** `VITE_BUILD_MODE`
- **Value:** `production`
- **Scopes:** Production only

#### JWT Secret (IMPORTANT: Generate a new one!)
- **Key:** `JWT_SECRET`
- **Value:** Generate using: https://randomkeygen.com/ (use 504-bit WPA Key)
- **Scopes:** Production only
- **Example:** `k7x9Q3mN5pR8vT2wY6zB4dF7hJ9kL3nP5qS8tV2xZ4bC6eG8jK3mN5pQ7rT9vW2yA4cF6hJ8kL2nP4qS7tV9xZ3bD5eG7jK9mN6pR8vT2wY4zB6dF8hJ`

### Step 3: Add Security Variables (Recommended)

#### Session Secret
- **Key:** `SESSION_SECRET`
- **Value:** Generate another unique 32+ character string
- **Scopes:** Production only

#### Encryption Key (exactly 32 characters)
- **Key:** `ENCRYPTION_KEY`
- **Value:** `prod-encryption-key-32-chars-ok`
- **Scopes:** Production only

#### Encryption IV (exactly 16 characters)
- **Key:** `ENCRYPTION_IV`
- **Value:** `prod-iv-16-chars`
- **Scopes:** Production only

### Step 4: Add Crisis Detection Variables (Recommended)

```env
CRISIS_DETECTION_ENABLED=true
CRISIS_HOTLINE=988
CRISIS_TEXT_LINE=741741
```

### Step 5: Optional - Database Connection (When Ready)

If you have a Neon database set up:

- **Key:** `DATABASE_URL`
- **Value:** `postgresql://[user]:[password]@[host].neon.tech/neondb?sslmode=require`
- **Scopes:** Production only

### Step 6: Optional - Analytics

#### Sentry Error Tracking
- **Key:** `SENTRY_DSN`
- **Value:** Your Sentry DSN from https://sentry.io

#### Google Analytics
- **Key:** `GA_TRACKING_ID`
- **Value:** Your GA4 measurement ID (G-XXXXXXXXXX)

---

## Security Best Practices

### Generating Secure Secrets

1. **Online Generator (Easy):**
   - Visit: https://randomkeygen.com/
   - Use "504-bit WPA Key" for maximum security
   - Copy and use for JWT_SECRET and SESSION_SECRET

2. **Command Line (Mac/Linux):**
   ```bash
   openssl rand -base64 32
   ```

3. **Node.js:**
   ```javascript
   require('crypto').randomBytes(32).toString('hex')
   ```

### Important Security Notes

- **NEVER** use the example values from documentation
- **NEVER** commit real secrets to GitHub
- **ALWAYS** generate new secrets for production
- **ROTATE** secrets every 90 days
- **USE** different secrets for staging and production

---

## Verification Steps

After adding variables:

1. **Trigger a new deploy** (or click "Clear cache and deploy site")
2. **Check build logs** for any environment variable errors
3. **Test the deployed site** to ensure variables are working

### How to Test Variables Are Working:

1. Open browser console on deployed site
2. Check for any authentication errors
3. Try crisis resources page
4. Verify service worker registration

---

## Troubleshooting

### Variables not working?

1. **Clear cache and redeploy:**
   - Deploys → Trigger deploy → Clear cache and deploy site

2. **Check variable scopes:**
   - Make sure "Production" is selected for production variables

3. **Verify VITE_ prefix:**
   - Client-side variables must start with `VITE_`

4. **Check build logs:**
   - Look for "Environment variables loaded" in build output

### Build failing?

Most likely causes:
- Missing NODE_ENV variable
- Typo in variable names
- Wrong Node version (should be 18.17.0)

---

## Minimal Working Configuration

If you just want to get it working quickly:

```env
NODE_ENV=production
VITE_BUILD_MODE=production
JWT_SECRET=temporary-dev-secret-change-this-in-production-123456789
```

You can always add more variables later!

---

## Support

- **Netlify Docs:** https://docs.netlify.com/environment-variables/overview/
- **Project Issues:** https://github.com/Damatnic/CoreV2/issues
- **Crisis Resources:** Always available at /crisis

---

*Last Updated: 2025-08-14*