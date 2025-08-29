# 🚀 Netlify Deployment Guide - Mental Health Platform

## 📋 Pre-Deployment Checklist

### ✅ Repository Setup
- [ ] Code pushed to GitHub repository
- [ ] `.env.example` configured with placeholder keys
- [ ] `netlify.toml` configuration file present
- [ ] Build scripts in `package.json` verified

### ✅ Environment Variables Preparation
- [ ] OpenAI API key ready
- [ ] Anthropic Claude API key ready  
- [ ] Google Gemini API key ready
- [ ] Crisis services configuration confirmed

---

## 🔧 Netlify Deployment Steps

### 1. **Connect Repository to Netlify**
```bash
# Login to Netlify Dashboard
https://app.netlify.com/

# Create new site from Git
- Choose "Import an existing project"
- Select GitHub
- Choose your mental health platform repository
- Configure build settings
```

### 2. **Build Configuration** 
```yaml
# Netlify will auto-detect these from netlify.toml:
Build command: npm run build
Publish directory: dist
Node version: 18
```

### 3. **Environment Variables Setup**
In Netlify Dashboard → Site Settings → Environment Variables:

```env
# AI Services (CRITICAL - Replace with actual keys)
VITE_OPENAI_API_KEY=sk-proj-your-actual-openai-key
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-actual-anthropic-key
VITE_GEMINI_API_KEY=AIza-your-actual-gemini-key

# Application Configuration
VITE_APP_TITLE=Mental Health Platform
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production

# Crisis Services
VITE_988_HOTLINE_ENABLED=true
VITE_CRISIS_DETECTION_ENABLED=true
VITE_EMERGENCY_SERVICES_ENABLED=true

# Features
VITE_AI_CHATBOT_ENABLED=true
VITE_TELETHERAPY_ENABLED=true
VITE_PWA_ENABLED=true

# Security
VITE_HIPAA_MODE=true
VITE_ANALYTICS_ENABLED=false
VITE_DEBUG_MODE=false
```

### 4. **Deploy Commands**
```bash
# Manual deployment (if needed)
netlify deploy --prod --dir=dist

# Or use GitHub integration for auto-deploy
git push origin main  # Triggers automatic deployment
```

---

## 🔒 Security Configuration

### **CSP Headers** (Already configured in netlify.toml)
```
Content-Security-Policy: 
  default-src 'self';
  connect-src 'self' https://api.openai.com https://api.anthropic.com;
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
```

### **API Key Security**
- ✅ Environment variables stored securely in Netlify
- ✅ No keys committed to repository
- ✅ CSP headers restrict API domains
- ✅ HTTPS enforced for all connections

---

## 🧪 Post-Deployment Testing

### **Critical System Validation**
```bash
# Test crisis detection system
curl https://your-site.netlify.app/api/health
curl https://your-site.netlify.app/api/crisis/test

# Verify AI services
# (These will be frontend tests through the deployed app)
```

### **Manual Testing Checklist**
- [ ] **AI Chatbot**: Test OpenAI integration
- [ ] **Crisis Detection**: Test keyword detection
- [ ] **988 Integration**: Verify hotline connection
- [ ] **PWA**: Test offline functionality
- [ ] **Mobile**: Test responsive design
- [ ] **Performance**: Lighthouse audit

---

## 📊 Monitoring & Alerts

### **Netlify Analytics** (Built-in)
- Site performance metrics
- Build success/failure notifications
- Traffic and usage statistics

### **Custom Monitoring** (Recommended)
```javascript
// Add to your app for production monitoring
if (import.meta.env.PROD) {
  // Sentry error tracking
  // LogRocket session replay
  // Crisis event monitoring
}
```

---

## 🚨 Crisis System Verification

### **988 Hotline Integration Test**
1. Deploy to Netlify
2. Navigate to crisis detection page
3. Test with sample crisis text
4. Verify 988 hotline connection works
5. Check emergency escalation flow

### **AI Services Health Check**
```javascript
// Test each AI service endpoint
const testAI = async () => {
  try {
    // OpenAI test
    const openaiResponse = await fetch('/api/ai/openai/health');
    
    // Anthropic test  
    const anthropicResponse = await fetch('/api/ai/anthropic/health');
    
    // Gemini test
    const geminiResponse = await fetch('/api/ai/gemini/health');
    
    console.log('AI Services Status:', {
      openai: openaiResponse.ok,
      anthropic: anthropicResponse.ok,
      gemini: geminiResponse.ok
    });
  } catch (error) {
    console.error('AI Services Error:', error);
  }
};
```

---

## 🔧 Troubleshooting

### **Common Issues**

**Build Failures:**
```bash
# Check build logs in Netlify dashboard
# Common issues:
- Missing environment variables
- Node/NPM version conflicts  
- TypeScript compilation errors
- Missing dependencies
```

**AI API Errors:**
```bash
# Verify environment variables are set
# Check API key validity
# Confirm API quotas/billing
# Test individual service endpoints
```

**Crisis Detection Issues:**
```bash
# Test keyword detection locally
# Verify 988 integration endpoints
# Check WebSocket connections
# Validate emergency service APIs
```

---

## 📈 Performance Optimization

### **Build Optimization**
```javascript
// vite.config.ts optimizations already included:
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        ai: ['openai', '@anthropic-ai/sdk']
      }
    }
  }
}
```

### **Netlify Features**
- ✅ **Edge Functions**: For low-latency crisis detection
- ✅ **CDN**: Global content delivery
- ✅ **Build Plugins**: Lighthouse performance auditing
- ✅ **Split Testing**: A/B test crisis intervention flows

---

## 🚀 Go-Live Checklist

### **Pre-Launch (Final Steps)**
- [ ] All environment variables configured with real API keys
- [ ] Crisis detection tested end-to-end
- [ ] 988 hotline integration verified
- [ ] Mobile responsiveness confirmed
- [ ] PWA installation tested
- [ ] Performance audit passed (Lighthouse > 90)
- [ ] Security headers validated
- [ ] Monitoring and alerting configured

### **Launch Day**
- [ ] Deploy to production Netlify site
- [ ] Monitor build process completion
- [ ] Verify all AI services responding
- [ ] Test crisis flows manually
- [ ] Confirm real-time features working
- [ ] Monitor error rates and performance
- [ ] Have rollback plan ready

### **Post-Launch (First 24 hours)**
- [ ] Monitor crisis detection accuracy
- [ ] Track AI API usage and costs
- [ ] Verify user registration flows
- [ ] Check mobile app performance
- [ ] Monitor security alerts
- [ ] Review user feedback channels

---

## 📞 Support & Emergency Contacts

### **Technical Issues**
- **Netlify Support**: https://answers.netlify.com/
- **Build Issues**: Check Netlify build logs
- **DNS Issues**: Netlify DNS settings panel

### **Crisis System Issues**
- **988 Integration**: National Suicide Prevention Lifeline support  
- **Emergency Services**: Local emergency services coordination
- **AI Services**: OpenAI/Anthropic/Google support channels

---

## 🎯 Success Metrics

### **Technical KPIs**
- **Uptime**: 99.9%+ (Netlify SLA)
- **Build Success**: 100% (automated deployments)
- **Performance**: Lighthouse score > 90
- **Security**: No critical vulnerabilities

### **Mental Health KPIs**
- **Crisis Detection Accuracy**: 95%+
- **988 Connection Success**: 99%+
- **Response Time**: <2 seconds
- **User Safety**: Zero false negatives for high-risk situations

---

**🚀 Ready for deployment! Follow this guide step-by-step to safely deploy your life-critical mental health platform.**

**Remember: This platform helps people in crisis. Test thoroughly and monitor closely after deployment.**