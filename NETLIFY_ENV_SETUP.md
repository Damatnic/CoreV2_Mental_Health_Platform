# 🔐 Netlify Environment Variables Setup

## ⚠️ IMPORTANT: OpenAI API Key Configuration

To enable the AI Therapist feature, you need to add your OpenAI API key to Netlify's environment variables.

### Step 1: Access Netlify Site Settings
1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your deployed site (astral-core-v2)
3. Navigate to **Site settings** → **Environment variables**

### Step 2: Add OpenAI API Key
Click "Add a variable" and add:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `[Your OpenAI API key - starts with sk-proj-]` |

### Step 3: Trigger Redeploy
After adding the environment variable:
1. Go to the **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

### Optional Environment Variables

You can also add these optional variables for additional features:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_AUTH0_DOMAIN` | Your Auth0 domain | For user authentication |
| `VITE_AUTH0_CLIENT_ID` | Your Auth0 client ID | For user authentication |
| `CLAUDE_API_KEY` | Your Claude API key | For Claude AI integration |
| `VITE_GA_TRACKING_ID` | Your Google Analytics ID | For analytics tracking |

### Feature Flags (Optional)

These are already set to `true` by default, but you can override them:

| Key | Default | Description |
|-----|---------|-------------|
| `VITE_ENABLE_AI_CHAT` | `true` | Enable AI chat feature |
| `VITE_ENABLE_PEER_SUPPORT` | `true` | Enable peer support |
| `VITE_ENABLE_CRISIS_DETECTION` | `true` | Enable crisis detection |
| `VITE_ENABLE_OFFLINE_MODE` | `true` | Enable offline features |

### Verification

After redeployment, verify the AI features are working:
1. Visit your deployed site
2. Navigate to the AI Chat feature
3. Send a test message
4. The AI should respond using the OpenAI API

### Security Notes

⚠️ **NEVER commit API keys to your repository**
- API keys should only be stored in Netlify's environment variables
- The `.env` file is git-ignored and should not be committed
- Rotate your API keys regularly for security

### Troubleshooting

If the AI features aren't working after adding the API key:

1. **Check the build logs**:
   - Go to Deploys → Click on the latest deploy
   - Check for any errors related to environment variables

2. **Verify the variable name**:
   - Make sure it's exactly `OPENAI_API_KEY` (case-sensitive)

3. **Clear cache and redeploy**:
   - Sometimes a fresh build is needed
   - Use "Clear cache and deploy site" option

4. **Check API key validity**:
   - Ensure your OpenAI API key is active
   - Check your OpenAI account for any usage limits

### Support

If you need help:
- Check the [Netlify Documentation](https://docs.netlify.com/environment-variables/overview/)
- Open an issue on [GitHub](https://github.com/Damatnic/astral-core-v2/issues)

---

**Remember**: The platform works without the API key - only the AI Therapist feature requires it. All crisis support, safety planning, and wellness tools function without any API keys!

## ⚠️ IMPORTANT: OpenAI API Key Configuration

To enable the AI Therapist feature, you need to add your OpenAI API key to Netlify's environment variables.

### Step 1: Access Netlify Site Settings
1. Go to your Netlify dashboard: https://app.netlify.com
2. Select your deployed site (astral-core-v2)
3. Navigate to **Site settings** → **Environment variables**

### Step 2: Add OpenAI API Key
Click "Add a variable" and add:

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `[Your OpenAI API key - starts with sk-proj-]` |

### Step 3: Trigger Redeploy
After adding the environment variable:
1. Go to the **Deploys** tab
2. Click **Trigger deploy** → **Clear cache and deploy site**

### Optional Environment Variables

You can also add these optional variables for additional features:

| Key | Value | Description |
|-----|-------|-------------|
| `VITE_AUTH0_DOMAIN` | Your Auth0 domain | For user authentication |
| `VITE_AUTH0_CLIENT_ID` | Your Auth0 client ID | For user authentication |
| `CLAUDE_API_KEY` | Your Claude API key | For Claude AI integration |
| `VITE_GA_TRACKING_ID` | Your Google Analytics ID | For analytics tracking |

### Feature Flags (Optional)

These are already set to `true` by default, but you can override them:

| Key | Default | Description |
|-----|---------|-------------|
| `VITE_ENABLE_AI_CHAT` | `true` | Enable AI chat feature |
| `VITE_ENABLE_PEER_SUPPORT` | `true` | Enable peer support |
| `VITE_ENABLE_CRISIS_DETECTION` | `true` | Enable crisis detection |
| `VITE_ENABLE_OFFLINE_MODE` | `true` | Enable offline features |

### Verification

After redeployment, verify the AI features are working:
1. Visit your deployed site
2. Navigate to the AI Chat feature
3. Send a test message
4. The AI should respond using the OpenAI API

### Security Notes

⚠️ **NEVER commit API keys to your repository**
- API keys should only be stored in Netlify's environment variables
- The `.env` file is git-ignored and should not be committed
- Rotate your API keys regularly for security

### Troubleshooting

If the AI features aren't working after adding the API key:

1. **Check the build logs**:
   - Go to Deploys → Click on the latest deploy
   - Check for any errors related to environment variables

2. **Verify the variable name**:
   - Make sure it's exactly `OPENAI_API_KEY` (case-sensitive)

3. **Clear cache and redeploy**:
   - Sometimes a fresh build is needed
   - Use "Clear cache and deploy site" option

4. **Check API key validity**:
   - Ensure your OpenAI API key is active
   - Check your OpenAI account for any usage limits

### Support

If you need help:
- Check the [Netlify Documentation](https://docs.netlify.com/environment-variables/overview/)
- Open an issue on [GitHub](https://github.com/Damatnic/astral-core-v2/issues)

---

**Remember**: The platform works without the API key - only the AI Therapist feature requires it. All crisis support, safety planning, and wellness tools function without any API keys!