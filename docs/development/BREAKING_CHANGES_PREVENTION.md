# Astral Core - Breaking Changes Prevention Guide

*Last Updated: August 3, 2025*

## 🚨 Critical System Components - DO NOT MODIFY

These components are essential for user safety and platform integrity. Any changes require explicit approval and extensive testing.

### 🔒 Crisis Detection System
**Files:**
- `src/components/CrisisAlert.tsx`
- `src/components/CrisisAlertBanner.tsx`
- `src/services/aiService.ts` (crisis detection logic)
- `netlify/functions/ai.ts` (crisis analysis)

**Why Critical:** False negatives could miss users in crisis, false positives could overwhelm support systems.

**Before Changing:**
1. Get approval from mental health professional
2. Test with extensive crisis scenario datasets
3. Have rollback plan ready
4. Monitor for 48 hours post-deployment

### 🔐 Authentication & Authorization
**Files:**
- `src/contexts/AuthContext.tsx`
- `src/services/authService.ts`
- `netlify/functions/auth.ts`
- Helper role verification logic

**Why Critical:** Security vulnerabilities could expose user data or allow unauthorized access.

**Before Changing:**
1. Security review required
2. Test all permission scenarios
3. Verify token validation logic
4. Check for privilege escalation vulnerabilities

### 🧠 AI Content Analysis
**Files:**
- `netlify/functions/ai.ts`
- `src/services/aiService.ts`
- Content moderation logic

**Why Critical:** Poor AI responses could provide harmful advice to vulnerable users.

**Before Changing:**
1. Test with diverse input scenarios
2. Verify safety guardrails remain intact
3. Check for bias in responses
4. Maintain audit trail of changes

## ⚠️ High-Risk Components - Require Careful Testing

### 📊 Data Storage & Privacy
**Files:**
- `src/utils/ApiClient.ts`
- `src/services/dataExportService.ts`
- `src/services/securityService.ts`
- Local storage implementations

**Risks:** Data loss, privacy breaches, GDPR violations

**Testing Required:**
- Data integrity verification
- Privacy compliance check
- Backup/restore functionality
- Cross-browser compatibility

### 🎯 Navigation & Routing
**Files:**
- `index.tsx` (main routing logic)
- `src/components/Sidebar.tsx`
- View transition logic

**Risks:** Users unable to access help, broken emergency flows

**Testing Required:**
- All navigation paths work
- Emergency routes accessible
- Mobile navigation functional
- Back button behavior correct

### 💬 Chat System
**Files:**
- `src/views/ChatView.tsx`
- `src/stores/chatStore.ts`
- `netlify/functions/chat.ts`
- Real-time messaging logic

**Risks:** Communication failures during crisis situations

**Testing Required:**
- Message delivery confirmation
- Connection failure handling
- Multiple concurrent chats
- Mobile chat functionality

## 🧪 Testing Requirements by Component Type

### Crisis-Related Components
```bash
# Required tests before deployment
npm test -- --testPathPattern="crisis|emergency"
npm run test:e2e -- --spec="crisis-flow.spec.ts"

# Manual testing scenarios
1. Test crisis keyword detection
2. Verify crisis resource links work
3. Check emergency contact functionality
4. Validate crisis banner appearance
```

### Authentication Components
```bash
# Security testing
npm test -- --testPathPattern="auth|security"
npm run security:audit

# Manual verification
1. Test login/logout flows
2. Verify role-based access
3. Check token expiration handling
4. Test password reset flow
```

### AI Integration
```bash
# AI safety testing
npm test -- --testPathPattern="ai|chat"
npm run ai:safety-check

# Content verification
1. Test inappropriate content blocking
2. Verify crisis detection accuracy
3. Check response quality
4. Test rate limiting
```

## 🔍 Code Review Checklist for Sensitive Areas

### Before Submitting PR
- [ ] **Impact Assessment**: Document what could break
- [ ] **Rollback Plan**: How to quickly undo changes
- [ ] **Test Coverage**: All edge cases covered
- [ ] **Security Review**: No new vulnerabilities introduced
- [ ] **Performance Impact**: No significant slowdown
- [ ] **Accessibility**: No regressions in a11y
- [ ] **Mobile Testing**: Works on mobile devices
- [ ] **Documentation**: Updated relevant docs

### Crisis Detection Changes
- [ ] Test with known crisis keywords
- [ ] Verify resource links are current
- [ ] Check AI response appropriateness
- [ ] Test escalation procedures
- [ ] Validate multi-language support (if applicable)

### Authentication Changes
- [ ] Test all user roles and permissions
- [ ] Verify token security
- [ ] Check session management
- [ ] Test logout functionality
- [ ] Validate redirect behavior

### Data Handling Changes
- [ ] Verify data encryption
- [ ] Check privacy compliance
- [ ] Test data export/deletion
- [ ] Validate data integrity
- [ ] Check backup procedures

## 🚫 Absolutely Forbidden Changes

### Without Mental Health Professional Approval
1. **Crisis keyword lists** - Could miss critical situations
2. **Emergency contact information** - Must be verified and current
3. **Crisis response protocols** - Could endanger users
4. **Safety plan templates** - Professional guidance required

### Without Security Expert Review
1. **Authentication logic** - Could create security vulnerabilities
2. **Input sanitization** - Could allow XSS attacks
3. **API endpoint security** - Could expose sensitive data
4. **Encryption implementations** - Could weaken data protection

### Without Accessibility Expert Review
1. **Screen reader compatibility** - Critical for visually impaired users
2. **Keyboard navigation** - Essential for mobility-impaired users
3. **Color contrast changes** - Could affect users with visual impairments
4. **Focus management** - Critical for assistive technology users

## 🛡️ Safe Change Practices

### 1. Feature Flags for Risky Changes
```typescript
// ✅ Use feature flags for experimental features
const useNewCrisisDetection = import.meta.env.VITE_FEATURE_NEW_CRISIS_DETECTION === 'true';

if (useNewCrisisDetection) {
  // New logic (can be disabled quickly)
} else {
  // Existing stable logic
}
```

### 2. Gradual Rollouts
```typescript
// ✅ Gradual user rollout
const userRolloutPercentage = import.meta.env.VITE_ROLLOUT_PERCENTAGE || '0';
const isInRollout = Math.random() * 100 < parseInt(userRolloutPercentage);
```

### 3. Monitoring & Alerts
```typescript
// ✅ Add monitoring for critical changes
const trackCriticalChange = (componentName: string, action: string) => {
  analyticsService.track('critical_component_used', {
    component: componentName,
    action: action,
    timestamp: new Date().toISOString()
  });
};
```

### 4. Backward Compatibility
```typescript
// ✅ Maintain backward compatibility
interface NewAPIResponse {
  data: DataType[];
  version: string;
}

interface LegacyAPIResponse {
  items: DataType[]; // Old format
}

const handleResponse = (response: NewAPIResponse | LegacyAPIResponse) => {
  // Handle both formats
  const data = 'data' in response ? response.data : response.items;
  return data;
};
```

## 🔄 Change Management Process

### 1. Pre-Development Phase
```markdown
1. **Impact Assessment**
   - What components are affected?
   - What could break?
   - Who needs to review?

2. **Risk Classification**
   - Low Risk: UI tweaks, copy changes
   - Medium Risk: New features, performance improvements
   - High Risk: Security, crisis detection, data handling
   - Critical Risk: Core safety systems

3. **Approval Requirements**
   - Low: Self-review + 1 peer review
   - Medium: 2 peer reviews + QA testing
   - High: Senior developer + domain expert + security review
   - Critical: All above + stakeholder approval
```

### 2. Development Phase
```markdown
1. **Feature Branch**
   - Use descriptive branch names
   - Include risk level in branch name
   - Example: `high-risk/update-crisis-detection`

2. **Testing Requirements**
   - Unit tests for all new/changed code
   - Integration tests for API changes
   - E2E tests for user flow changes
   - Manual testing for UI changes

3. **Documentation**
   - Update relevant documentation
   - Add ADR (Architecture Decision Record) for significant changes
   - Document rollback procedures
```

### 3. Review Phase
```markdown
1. **Code Review**
   - Security implications reviewed
   - Performance impact assessed
   - Accessibility verified
   - Mobile compatibility confirmed

2. **Testing Review**
   - Test coverage adequate
   - Edge cases covered
   - Error scenarios handled
   - Performance benchmarks met

3. **Documentation Review**
   - User-facing changes documented
   - API changes documented
   - Deployment notes updated
```

### 4. Deployment Phase
```markdown
1. **Staging Deployment**
   - Deploy to staging environment
   - Run full test suite
   - Manual QA testing
   - Stakeholder approval

2. **Production Deployment**
   - Deploy during low-traffic hours
   - Monitor error rates
   - Check critical user flows
   - Be ready to rollback

3. **Post-Deployment**
   - Monitor for 24 hours
   - Check user feedback
   - Verify analytics data
   - Document lessons learned
```

## 🚨 Emergency Rollback Procedures

### Quick Rollback Steps
1. **Identify the issue** - What's broken?
2. **Assess severity** - How many users affected?
3. **Communicate** - Notify team immediately
4. **Rollback** - Use git revert or Netlify rollback
5. **Verify** - Test that rollback fixes the issue
6. **Post-mortem** - What went wrong and how to prevent it?

### Rollback Commands
```bash
# Git rollback
git revert <commit-hash>
git push origin main

# Netlify rollback
netlify sites:list
netlify rollback --site-id <site-id>
```

### Communication Template
```markdown
🚨 INCIDENT ALERT

**Issue**: Brief description of the problem
**Severity**: Critical/High/Medium/Low
**Users Affected**: Number or percentage
**ETA for Fix**: Time estimate
**Status**: Investigating/Rolling back/Fixed
**Owner**: Person responsible for fix

**Updates**: 
- [Timestamp] Issue identified
- [Timestamp] Rollback initiated
- [Timestamp] Service restored
```

## 📋 Component-Specific Guidelines

### Crisis Detection Components
- Never deploy during peak crisis hours (evenings/weekends)
- Always have mental health professional on standby
- Test with real crisis scenarios (anonymized)
- Monitor closely for false positives/negatives

### Authentication Components
- Deploy only during business hours
- Have security team available
- Test all authentication flows
- Monitor for unusual login patterns

### AI Components
- Test extensively with diverse inputs
- Monitor response quality
- Check for bias or inappropriate responses
- Have human review process for AI outputs

### Data Components
- Always backup before changes
- Test data migration scripts
- Verify data integrity
- Check privacy compliance

Remember: **When in doubt, don't deploy.** It's better to delay a feature than to risk user safety or platform integrity.
