# CoreV2 Mental Health Platform - Production Deployment Runbook

## CRITICAL: This is a Life-Critical System
**Mental health crisis detection and support services must maintain 99.99% uptime**

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Configuration](#environment-configuration)
3. [AI Services Setup](#ai-services-setup)
4. [Database Configuration](#database-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Validation](#post-deployment-validation)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Emergency Procedures](#emergency-procedures)
9. [Rollback Procedures](#rollback-procedures)
10. [Emergency Contacts](#emergency-contacts)

---

## Pre-Deployment Checklist

### Critical Requirements
- [ ] All AI API keys are valid and have sufficient credits
- [ ] 988 Lifeline integration is tested and confirmed
- [ ] Crisis detection algorithms pass all test cases
- [ ] Database backups are current (within last hour)
- [ ] Rollback plan is documented and tested
- [ ] On-call team is notified and available
- [ ] Emergency contacts are verified

### Environment Verification
```bash
# Verify Node.js version (18.x or higher required)
node --version

# Verify npm version
npm --version

# Check disk space (minimum 10GB required)
df -h

# Verify SSL certificates
openssl s_client -connect api.corev2-mental-health.app:443 -servername api.corev2-mental-health.app
```

### Security Audit
- [ ] All dependencies scanned for vulnerabilities
- [ ] HIPAA compliance verified
- [ ] SSL certificates valid for 90+ days
- [ ] Rate limiting configured
- [ ] DDoS protection enabled
- [ ] WAF rules active

---

## Environment Configuration

### Step 1: Configure Production Environment Variables

1. Copy the production environment template:
```bash
cp .env.crisis.example .env.production
```

2. Update with production values:
```bash
# CRITICAL: Replace all placeholder values with actual production keys

# AI Services - PRIMARY
VITE_OPENAI_API_KEY=sk-prod-YOUR_ACTUAL_KEY
VITE_ANTHROPIC_API_KEY=sk-ant-YOUR_ACTUAL_KEY
VITE_GOOGLE_GEMINI_API_KEY=AIza-YOUR_ACTUAL_KEY

# Crisis Services - MUST BE ACTIVE
VITE_988_API_KEY=YOUR_988_PRODUCTION_KEY
VITE_CRISIS_TEXT_API_KEY=YOUR_CRISIS_TEXT_KEY

# Database - Production
DATABASE_URL=postgresql://user:pass@prod-db.corev2.app:5432/corev2_prod?sslmode=require

# Redis Cache
REDIS_URL=rediss://default:password@redis.corev2.app:6380
```

### Step 2: Validate Environment
```bash
# Run environment validation script
npm run validate:env

# Expected output:
# ✅ All required environment variables are set
# ✅ API keys validated
# ✅ Database connection successful
# ✅ Redis connection successful
```

---

## AI Services Setup

### OpenAI GPT-4 Configuration
```javascript
// Test OpenAI connection
const testOpenAI = async () => {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${process.env.VITE_OPENAI_API_KEY}`
    }
  });
  console.log('OpenAI Status:', response.status === 200 ? '✅ Connected' : '❌ Failed');
};
```

### Anthropic Claude Configuration
```javascript
// Test Anthropic connection
const testAnthropic = async () => {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'X-API-Key': process.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'claude-3-opus-20240229',
      max_tokens: 10,
      messages: [{role: 'user', content: 'test'}]
    })
  });
  console.log('Anthropic Status:', response.status === 200 ? '✅ Connected' : '❌ Failed');
};
```

### Google Gemini Configuration
```javascript
// Test Google Gemini connection
const testGemini = async () => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.VITE_GOOGLE_GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{parts: [{text: 'test'}]}]
    })
  });
  console.log('Gemini Status:', response.status === 200 ? '✅ Connected' : '❌ Failed');
};
```

### Verify AI Failover Chain
```bash
# Run AI services health check
npm run test:ai-services

# Expected output:
# Primary (OpenAI): ✅ Healthy (Response: 1.2s)
# Secondary (Anthropic): ✅ Healthy (Response: 1.5s)
# Tertiary (Gemini): ✅ Healthy (Response: 0.9s)
# Fallback (Local): ✅ Ready
```

---

## Database Configuration

### Step 1: Database Migration
```bash
# Backup current database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Run migrations
npm run migrate:production

# Verify migrations
psql $DATABASE_URL -c "SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;"
```

### Step 2: Verify Database Indexes
```sql
-- Check critical indexes for performance
SELECT schemaname, tablename, indexname, idx_scan
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Ensure crisis-related tables have proper indexes
\d+ crisis_events
\d+ user_sessions
\d+ mood_entries
```

### Step 3: Configure Connection Pooling
```javascript
// Verify connection pool settings
const pool = {
  max: 25,              // Maximum connections
  min: 5,               // Minimum connections
  idle: 10000,          // Idle timeout
  acquire: 30000,       // Acquire timeout
  evict: 1000          // Eviction run interval
};
```

---

## Deployment Steps

### Step 1: Build Production Bundle
```bash
# Clean previous builds
rm -rf dist/
rm -rf .next/

# Install production dependencies
npm ci --production

# Build production bundle
npm run build:production

# Verify build output
ls -la dist/
# Expected: index.html, assets/, sw.js
```

### Step 2: Deploy to Production Servers

#### Option A: Docker Deployment
```bash
# Build Docker images
docker build -f Dockerfile.frontend -t corev2/frontend:latest .
docker build -f Dockerfile.backend -t corev2/backend:latest .
docker build -f Dockerfile.crisis-detector -t corev2/crisis:latest .

# Push to registry
docker push corev2/frontend:latest
docker push corev2/backend:latest
docker push corev2/crisis:latest

# Deploy with Docker Compose
docker-compose -f docker-compose.production.yml up -d
```

#### Option B: Direct Deployment
```bash
# Copy files to production server
rsync -avz --delete dist/ prod-server:/var/www/corev2/

# Restart services
ssh prod-server "sudo systemctl restart corev2-frontend"
ssh prod-server "sudo systemctl restart corev2-backend"
ssh prod-server "sudo systemctl restart corev2-crisis"
```

### Step 3: Update CDN
```bash
# Purge CDN cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'

# Upload static assets to CDN
aws s3 sync dist/assets/ s3://corev2-cdn/assets/ --cache-control "max-age=31536000"
```

---

## Post-Deployment Validation

### Critical System Tests

#### 1. Crisis Detection Test
```bash
# Test crisis keyword detection
curl -X POST https://api.corev2-mental-health.app/api/crisis/detect \
  -H "Content-Type: application/json" \
  -d '{"content": "I feel hopeless and want to end it all"}'

# Expected response (within 500ms):
# {
#   "isCrisis": true,
#   "severity": 9,
#   "confidence": 0.95,
#   "interventions": ["988_hotline", "emergency_contact"]
# }
```

#### 2. 988 Integration Test
```bash
# Test 988 connection capability
curl -X POST https://api.corev2-mental-health.app/api/988/test \
  -H "Content-Type: application/json" \
  -H "X-Test-Mode: true"

# Expected: {"status": "ready", "responseTime": 234}
```

#### 3. AI Services Health Check
```bash
# Check all AI providers
curl https://api.corev2-mental-health.app/api/ai/health

# Expected:
# {
#   "overall": "healthy",
#   "providers": {
#     "openai": "healthy",
#     "anthropic": "healthy",
#     "gemini": "healthy",
#     "fallback": "ready"
#   }
# }
```

#### 4. User Flow Tests
```bash
# Run automated E2E tests
npm run test:e2e:production

# Critical paths to verify:
# ✅ User registration and login
# ✅ Crisis alert triggering
# ✅ Mood tracking submission
# ✅ Emergency contact notification
# ✅ Therapy chat initiation
```

### Performance Validation
```bash
# Run performance tests
npm run lighthouse:production

# Required metrics:
# - First Contentful Paint: < 2s
# - Time to Interactive: < 3s
# - Crisis Detection Response: < 500ms
# - API Response Time (p95): < 2s
```

---

## Monitoring & Alerting

### Real-Time Monitoring Setup

#### 1. Application Monitoring
```javascript
// Verify monitoring endpoints
const endpoints = [
  'https://api.corev2-mental-health.app/health',
  'https://api.corev2-mental-health.app/metrics',
  'https://api.corev2-mental-health.app/api/crisis/status'
];

// All should return 200 OK
```

#### 2. Configure Alerts
```yaml
# PagerDuty alerts (critical)
- Crisis detection failure: Immediate page
- 988 service unavailable: Immediate page
- AI services all down: Immediate page
- Database connection lost: Immediate page

# Slack alerts (warning)
- Single AI provider down: Slack notification
- Response time > 3s: Slack notification
- Error rate > 5%: Slack notification
```

#### 3. Dashboard URLs
- **Main Dashboard**: https://monitoring.corev2-mental-health.app
- **Crisis Monitor**: https://monitoring.corev2-mental-health.app/crisis
- **AI Services**: https://monitoring.corev2-mental-health.app/ai
- **User Analytics**: https://monitoring.corev2-mental-health.app/analytics

---

## Emergency Procedures

### Crisis System Failure

**If crisis detection fails:**
1. Immediately activate fallback keyword detection
2. Route all crisis traffic to 988 directly
3. Page on-call crisis team
4. Enable emergency banner on site

```bash
# Emergency activation script
npm run emergency:activate-crisis-fallback
```

### AI Services Complete Failure

**If all AI services fail:**
1. Activate local crisis detection
2. Enable static response templates
3. Display service degradation notice
4. Escalate to engineering team

```bash
# Activate offline mode
npm run emergency:offline-mode
```

### Database Failure

**If primary database fails:**
1. Automatic failover to read replica
2. Enable read-only mode
3. Queue writes to Redis
4. Initiate database recovery

```bash
# Database failover
npm run emergency:db-failover
```

---

## Rollback Procedures

### Immediate Rollback (< 5 minutes)

```bash
# Step 1: Switch traffic to previous version
kubectl set image deployment/frontend frontend=corev2/frontend:previous

# Step 2: Verify rollback
curl https://api.corev2-mental-health.app/version
# Should show previous version number

# Step 3: Monitor for stability (5 minutes)
watch -n 5 'curl -s https://api.corev2-mental-health.app/health'
```

### Database Rollback

```bash
# Step 1: Stop application servers
kubectl scale deployment/backend --replicas=0

# Step 2: Restore database backup
pg_restore -d $DATABASE_URL backup_pre_deployment.sql

# Step 3: Restart application servers
kubectl scale deployment/backend --replicas=3

# Step 4: Verify data integrity
npm run verify:database
```

### Full System Rollback

```bash
# Execute complete rollback script
./scripts/emergency-rollback.sh --version=previous --confirm=yes

# This will:
# 1. Rollback application code
# 2. Restore database
# 3. Clear caches
# 4. Restart all services
# 5. Run validation tests
```

---

## Emergency Contacts

### Primary Crisis Team
- **Crisis Lead**: Dr. Sarah Johnson
  - Phone: +1-555-CRISIS-1 (24/7)
  - Email: crisis-lead@corev2-mental-health.app
  - Slack: @crisis-lead

- **Technical Lead**: John Smith
  - Phone: +1-555-TECH-911 (24/7)
  - Email: tech-lead@corev2-mental-health.app
  - PagerDuty: john.smith

### External Services
- **988 Technical Support**: +1-800-988-TECH
- **OpenAI Support**: enterprise-support@openai.com
- **Anthropic Support**: support@anthropic.com
- **Google Cloud Support**: Case #12345678

### Escalation Path
1. On-call engineer (0-5 mins)
2. Technical lead (5-15 mins)
3. Crisis team lead (15-30 mins)
4. CTO/CEO (30+ mins)

---

## Post-Deployment Checklist

### Within 1 Hour
- [ ] All critical tests passing
- [ ] Crisis detection verified
- [ ] 988 integration confirmed
- [ ] AI services healthy
- [ ] No critical errors in logs
- [ ] Performance metrics normal

### Within 24 Hours
- [ ] User feedback reviewed
- [ ] Error rates analyzed
- [ ] Performance regression check
- [ ] Security scan completed
- [ ] Backup verification
- [ ] Documentation updated

### Within 1 Week
- [ ] Full system audit
- [ ] User satisfaction metrics
- [ ] Cost analysis (AI usage)
- [ ] Capacity planning review
- [ ] Incident retrospective (if any)
- [ ] Team feedback session

---

## Important Notes

1. **NEVER deploy during:**
   - Peak usage hours (6 PM - 11 PM local time)
   - Holidays or weekends
   - Known mental health awareness days
   - Without full team availability

2. **ALWAYS ensure:**
   - Crisis detection is tested end-to-end
   - 988 failover is configured
   - At least 2 AI providers are healthy
   - Database backups are current
   - Rollback plan is ready

3. **In case of emergency:**
   - User safety is the #1 priority
   - Activate all fallback systems immediately
   - Communicate transparently with users
   - Document everything for post-incident review

---

## Deployment Sign-Off

| Role | Name | Signature | Date/Time |
|------|------|-----------|-----------|
| Deployment Lead | | | |
| Crisis Team Lead | | | |
| Security Officer | | | |
| Database Admin | | | |
| QA Lead | | | |

---

**Remember: This platform saves lives. Every deployment must be treated with the utmost care and attention.**

Last Updated: 2025-08-29
Version: 5.0.0