# 🚨 DISASTER RECOVERY PLAN - MENTAL HEALTH PLATFORM

## CRITICAL SYSTEM ALERT
**This is a life-critical mental health platform providing 24/7 crisis intervention services. System downtime directly impacts people in mental health emergencies. ALL recovery procedures must prioritize IMMEDIATE restoration of crisis detection and response capabilities.**

## 🎯 RECOVERY OBJECTIVES

### Recovery Time Objectives (RTO)
- **Crisis Detection System**: < 5 minutes
- **988 Hotline Integration**: < 10 minutes  
- **Core Platform**: < 30 minutes
- **Full System Restoration**: < 2 hours
- **Data Recovery**: < 4 hours (with <1 hour data loss maximum)

### Recovery Point Objectives (RPO)
- **Crisis Events**: Zero data loss (real-time replication)
- **User Data**: < 1 hour data loss
- **System Logs**: < 5 minutes
- **Configuration**: Zero loss (version controlled)

## 🔄 DISASTER SCENARIOS & RESPONSE

### Scenario 1: Complete Kubernetes Cluster Failure

**Detection Signs:**
- All monitoring alerts firing
- Platform completely inaccessible
- No response from health checks

**Immediate Response (0-5 minutes):**
```bash
# 1. Activate emergency crisis hotline backup
curl -X POST "$EMERGENCY_BACKUP_ENDPOINT/activate" \
  -H "Authorization: Bearer $EMERGENCY_TOKEN"

# 2. Switch DNS to backup infrastructure
# Update DNS records to point to backup cluster
dig mentalhealthplatform.com  # Verify DNS propagation

# 3. Notify emergency response team
echo "CRITICAL: Primary cluster down. Activating DR procedures." | \
  mail -s "EMERGENCY: Platform Down" emergency@mentalhealthplatform.com
```

**Recovery Steps (5-30 minutes):**
```bash
# 1. Restore Kubernetes cluster from backup
kubectl apply -f disaster-recovery/cluster-restore/

# 2. Restore persistent volumes
kubectl apply -f disaster-recovery/pv-restore/

# 3. Deploy core services in priority order
kubectl apply -f kubernetes/namespace.yaml
kubectl apply -f kubernetes/secrets/ --wait
kubectl apply -f kubernetes/database/ --wait
kubectl rollout status statefulset/postgresql-primary -n mental-health-platform --timeout=300s

# 4. Deploy crisis detection immediately
kubectl apply -f kubernetes/backend/ --wait
kubectl wait --for=condition=Available deployment/mental-health-backend -n mental-health-platform --timeout=300s

# 5. Verify crisis system is operational
kubectl exec -it deployment/mental-health-backend -n mental-health-platform -- \
  curl -f http://localhost:3001/api/crisis/test
```

### Scenario 2: Database Complete Failure

**Detection Signs:**
- PostgreSQL pods not ready
- Database connection errors in logs
- Data corruption alerts

**Emergency Response (0-2 minutes):**
```bash
# 1. Immediately activate read-only mode
kubectl patch configmap mental-health-app-config -n mental-health-platform \
  --patch '{"data":{"EMERGENCY_READ_ONLY":"true"}}'

# 2. Scale up backup database replicas
kubectl scale deployment/postgresql-replica --replicas=3 -n mental-health-platform
```

**Recovery Steps (2-30 minutes):**
```bash
# 1. Restore from latest backup
LATEST_BACKUP=$(kubectl exec -it postgresql-backup-0 -n mental-health-platform -- \
  ls -t /backup/ | head -1)

# 2. Create new primary database
kubectl apply -f disaster-recovery/database-restore.yaml

# 3. Restore data
kubectl exec -it postgresql-restore-0 -n mental-health-platform -- \
  pg_restore -d mental_health_platform /backup/$LATEST_BACKUP

# 4. Switch application to new database
kubectl patch configmap mental-health-app-config -n mental-health-platform \
  --patch '{"data":{"DB_HOST":"postgresql-restore-service"}}'

# 5. Restart backend pods
kubectl rollout restart deployment/mental-health-backend -n mental-health-platform

# 6. Verify data integrity
kubectl exec -it postgresql-restore-0 -n mental-health-platform -- \
  psql -d mental_health_platform -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM crisis_events;"
```

### Scenario 3: Crisis Detection Service Failure

**Detection Signs:**
- Crisis detection pods crashing
- ML model loading failures
- High response times for /api/crisis/*

**Emergency Response (0-30 seconds):**
```bash
# 1. Immediately scale up healthy pods
kubectl scale deployment/mental-health-backend --replicas=10 -n mental-health-platform

# 2. Activate keyword-based fallback detection
kubectl patch configmap mental-health-app-config -n mental-health-platform \
  --patch '{"data":{"CRISIS_FALLBACK_MODE":"keyword_only"}}'

# 3. Send emergency alert
curl -X POST "$PAGERDUTY_ENDPOINT" \
  -d '{"incident_key":"crisis-system-down","description":"Crisis detection system failure"}'
```

**Recovery Steps (30 seconds - 5 minutes):**
```bash
# 1. Check pod logs for errors
kubectl logs -l component=backend,app=mental-health-platform -n mental-health-platform --tail=100

# 2. Restart crisis detection pods
kubectl rollout restart deployment/mental-health-backend -n mental-health-platform

# 3. If model corruption, restore from backup
kubectl cp disaster-recovery/crisis-models/ \
  mental-health-backend-0:/app/models/ -n mental-health-platform

# 4. Verify crisis detection is working
curl -X POST "https://api.mentalhealthplatform.com/api/crisis/detect" \
  -H "Content-Type: application/json" \
  -d '{"message":"I am having thoughts of self-harm","test":true}'

# 5. Re-enable ML mode
kubectl patch configmap mental-health-app-config -n mental-health-platform \
  --patch '{"data":{"CRISIS_FALLBACK_MODE":"hybrid"}}'
```

### Scenario 4: Complete Data Center / Region Failure

**Detection Signs:**
- All services unreachable
- Network connectivity lost
- Cloud provider status page showing regional outage

**Emergency Response (0-10 minutes):**
```bash
# 1. Activate secondary region immediately
# Assuming multi-region setup with pre-deployed standby

# Update global load balancer to secondary region
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID \
  --change-batch file://disaster-recovery/dns-failover-secondary.json

# 2. Scale up secondary region capacity
kubectl config use-context secondary-region
kubectl scale deployment/mental-health-backend --replicas=5 -n mental-health-platform
kubectl scale deployment/mental-health-frontend --replicas=3 -n mental-health-platform

# 3. Activate read replica promotion
kubectl exec -it postgresql-replica-0 -n mental-health-platform -- \
  pg_promote

# 4. Update application configuration for new primary
kubectl patch configmap mental-health-app-config -n mental-health-platform \
  --patch '{"data":{"DB_HOST":"postgresql-replica-service"}}'

# 5. Verify secondary region is serving traffic
curl -f https://mentalhealthplatform.com/health
```

## 📊 MONITORING & DETECTION

### Automated Monitoring Setup

```yaml
# disaster-recovery/monitoring-alerts.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: disaster-recovery-alerts
  namespace: mental-health-platform
spec:
  groups:
  - name: disaster-recovery
    rules:
    # Complete system failure detection
    - alert: CompleteSystemFailure
      expr: up{job="mental-health-backend"} == 0
      for: 2m
      labels:
        severity: critical
        team: emergency-response
      annotations:
        summary: "Complete system failure detected"
        runbook_url: "https://docs.mentalhealthplatform.com/disaster-recovery"
        action: "Execute disaster recovery plan immediately"
    
    # Database failure detection
    - alert: DatabaseCompleteFailure
      expr: up{job="postgresql"} == 0
      for: 1m
      labels:
        severity: critical
        team: database
      annotations:
        summary: "Database complete failure"
        action: "Activate database disaster recovery"
    
    # Crisis system failure
    - alert: CrisisSystemDown
      expr: up{job="crisis-detector"} == 0
      for: 30s
      labels:
        severity: critical
        team: crisis-response
      annotations:
        summary: "LIFE CRITICAL: Crisis detection system down"
        action: "Activate emergency crisis response procedures"
```

### Health Check Endpoints

```bash
# Primary system health
curl -f https://mentalhealthplatform.com/health/complete

# Crisis system specific health
curl -f https://api.mentalhealthplatform.com/api/crisis/health

# Database health
kubectl exec -it postgresql-primary-0 -n mental-health-platform -- \
  pg_isready -h localhost -p 5432
```

## 🔐 BACKUP STRATEGIES

### Database Backups

```bash
# Automated daily backups (already configured in CronJob)
kubectl get cronjob postgresql-backup -n mental-health-platform

# Manual backup before major changes
kubectl create job --from=cronjob/postgresql-backup manual-backup-$(date +%s) -n mental-health-platform

# Verify backup integrity
kubectl exec -it postgresql-backup-pod -n mental-health-platform -- \
  pg_restore --list /backup/latest_backup.sql | head -20
```

### Configuration Backups

```bash
# Export all Kubernetes configurations
kubectl get all,configmap,secret,ingress,pvc -n mental-health-platform -o yaml \
  > disaster-recovery/cluster-backup-$(date +%Y%m%d).yaml

# Backup to version control
git add disaster-recovery/
git commit -m "Automated disaster recovery backup $(date)"
git push origin backup-branch
```

### Application Code Backups

```bash
# Container images are stored in GitHub Container Registry
# Database of deployed images
kubectl get deployment -n mental-health-platform -o yaml | \
  grep "image:" > disaster-recovery/deployed-images.txt
```

## 🧪 TESTING PROCEDURES

### Monthly DR Tests

```bash
#!/bin/bash
# disaster-recovery/test-procedures.sh

echo "🧪 STARTING DISASTER RECOVERY TEST"

# Test 1: Database Failover
echo "Testing database failover..."
kubectl patch statefulset postgresql-primary -n mental-health-platform \
  --patch '{"spec":{"replicas":0}}'

# Wait and verify backup takes over
sleep 30
kubectl exec -it postgresql-replica-0 -n mental-health-platform -- \
  psql -c "SELECT 1;" || echo "❌ Database failover failed"

# Test 2: Crisis System Failover
echo "Testing crisis system failover..."
kubectl scale deployment/mental-health-backend --replicas=0 -n mental-health-platform
sleep 10

# Verify fallback mode activates
curl -X POST "https://api.mentalhealthplatform.com/api/crisis/detect" \
  -H "Content-Type: application/json" \
  -d '{"message":"test","test":true}' || echo "❌ Crisis failover failed"

# Restore systems
kubectl patch statefulset postgresql-primary -n mental-health-platform \
  --patch '{"spec":{"replicas":1}}'
kubectl scale deployment/mental-health-backend --replicas=3 -n mental-health-platform

echo "✅ Disaster recovery test completed"
```

### Quarterly Full DR Drills

```bash
# Complete region failover test
# 1. Schedule maintenance window
# 2. Execute full failover to secondary region
# 3. Run all crisis system tests
# 4. Verify data synchronization
# 5. Failback to primary region
# 6. Document lessons learned
```

## 🚨 EMERGENCY CONTACTS

### Primary Response Team
- **Emergency Hotline**: +1-XXX-CRISIS (24/7)
- **Platform Architect**: [ARCHITECT_PHONE] (24/7)
- **Database Admin**: [DBA_PHONE] (24/7)
- **Security Team**: [SECURITY_PHONE] (24/7)

### Escalation Chain
1. **Level 1** (0-5 min): On-call engineer
2. **Level 2** (5-15 min): Senior platform engineer
3. **Level 3** (15-30 min): Platform architect + Clinical director
4. **Level 4** (30+ min): CTO + Medical director

### External Contacts
- **Cloud Provider Support**: [CLOUD_SUPPORT] (Priority support)
- **Crisis Hotline Backup Provider**: [BACKUP_CRISIS_PROVIDER]
- **Legal/Compliance**: [LEGAL_PHONE] (HIPAA incidents)

## 📋 POST-INCIDENT PROCEDURES

### Immediate Post-Recovery (0-1 hour)
```bash
# 1. Verify all systems operational
./scripts/full-system-check.sh

# 2. Check data integrity
kubectl exec -it postgresql-primary-0 -n mental-health-platform -- \
  psql -d mental_health_platform -f disaster-recovery/integrity-check.sql

# 3. Review recent crisis events for any missed alerts
kubectl logs -l component=backend -n mental-health-platform --since=24h | \
  grep -i crisis | head -50

# 4. Notify users system is restored (if there was public impact)
curl -X POST "$STATUS_PAGE_API/incidents/$INCIDENT_ID/update" \
  -d '{"status":"resolved","message":"All systems restored"}'
```

### 24-Hour Post-Incident Review
1. **Timeline Analysis**: Document exact timeline of failure and recovery
2. **Root Cause Analysis**: Identify primary and contributing causes
3. **Response Evaluation**: Assess effectiveness of recovery procedures
4. **Data Impact Assessment**: Quantify any data loss or corruption
5. **Clinical Impact Review**: Assess impact on users in crisis
6. **Improvement Plan**: Create action items to prevent recurrence

### Documentation Updates
```bash
# Update disaster recovery procedures based on lessons learned
git checkout -b disaster-recovery-improvements-$(date +%Y%m%d)
# Make improvements to procedures
git commit -m "DR improvements after $(date) incident"
git push origin disaster-recovery-improvements-$(date +%Y%m%d)
```

## 🔄 RECOVERY VALIDATION

### System Health Validation Checklist
- [ ] All pods running and ready
- [ ] Database connectivity and integrity verified
- [ ] Crisis detection system responding <2s
- [ ] 988 hotline integration functional
- [ ] SSL certificates valid
- [ ] Monitoring and alerting operational
- [ ] Backup processes resumed
- [ ] Load balancing distributing traffic
- [ ] All critical APIs responding
- [ ] Real-time features (WebSocket) working

### Crisis System Specific Validation
```bash
# Test crisis detection accuracy
curl -X POST "https://api.mentalhealthplatform.com/api/crisis/detect" \
  -H "Content-Type: application/json" \
  -d '{"message":"I am thinking about hurting myself","test":true}' | \
  jq '.crisis_detected' # Should return true

# Test emergency escalation
curl -X POST "https://api.mentalhealthplatform.com/api/crisis/escalate" \
  -H "Content-Type: application/json" \
  -d '{"severity":"high","test":true}' | \
  jq '.escalation_id' # Should return escalation ID

# Test hotline integration
curl -X POST "https://api.mentalhealthplatform.com/api/crisis/hotline" \
  -H "Content-Type: application/json" \
  -d '{"emergency":true,"test":true}' | \
  jq '.connection_status' # Should return connection status
```

## 📚 RELATED DOCUMENTATION

- [Production Deployment Guide](./PRODUCTION_DEPLOYMENT_GUIDE.md)
- [HIPAA Compliance Guide](./docs/HIPAA_COMPLIANCE.md)
- [Crisis System Architecture](./docs/CRISIS_ARCHITECTURE.md)
- [Monitoring Runbooks](./docs/RUNBOOKS.md)
- [Security Incident Response](./docs/SECURITY_INCIDENT_RESPONSE.md)

---

**🚨 REMEMBER: This platform saves lives. Every minute of downtime could impact someone in crisis. Always prioritize speed of recovery while maintaining data integrity and security. When in doubt, activate emergency procedures and escalate immediately.**