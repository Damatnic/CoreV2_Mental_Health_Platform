# 🚨 MENTAL HEALTH PLATFORM - PRODUCTION DEPLOYMENT GUIDE

## CRITICAL NOTICE: LIFE-SAVING INFRASTRUCTURE

This deployment guide covers the production-grade Kubernetes infrastructure for a mental health platform that provides **life-critical crisis intervention services**. Every component has been designed with HIPAA compliance, 99.99% uptime requirements, and sub-second crisis response times.

## 🎯 DEPLOYMENT OBJECTIVES

- **Primary**: Deploy bulletproof crisis detection and intervention system
- **Compliance**: Full HIPAA compliance with encryption at rest and in transit
- **Performance**: <2s crisis response time, 99.99% uptime
- **Scalability**: Auto-scaling from 3-100 pods based on crisis load
- **Security**: Zero-trust architecture with network policies and admission controllers
- **Monitoring**: Real-time alerting for all life-critical components

## 📋 PRE-DEPLOYMENT REQUIREMENTS

### Infrastructure Prerequisites
- Kubernetes cluster v1.26+ with RBAC enabled
- Persistent storage with encryption at rest
- Load balancer with SSL termination
- DNS management (Route53 or equivalent)
- Container registry (GitHub Container Registry)
- Monitoring stack compatibility (Prometheus/Grafana)

### Security Requirements
- cert-manager for TLS certificate management
- OPA Gatekeeper for admission control
- Network policies enabled
- Pod Security Standards enforced
- Secrets management configured

### Compliance Requirements
- HIPAA-compliant infrastructure
- Encrypted storage volumes
- Audit logging enabled
- Data retention policies configured
- Backup and disaster recovery procedures

## 🚀 DEPLOYMENT PROCEDURE

### Phase 1: Infrastructure Preparation

```bash
# 1. Create namespace and apply resource quotas
kubectl apply -f kubernetes/namespace.yaml

# 2. Verify storage classes are available
kubectl get storageclass

# 3. Install cert-manager (if not already installed)
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# 4. Wait for cert-manager to be ready
kubectl wait --for=condition=Available --timeout=300s deployment/cert-manager -n cert-manager
```

### Phase 2: Security Configuration

```bash
# 1. Apply security policies and RBAC
kubectl apply -f kubernetes/security/

# 2. Create TLS certificates
kubectl apply -f kubernetes/certificates/

# 3. Wait for certificates to be issued
kubectl wait --for=condition=Ready --timeout=300s certificate/mental-health-platform-tls -n mental-health-platform
```

### Phase 3: Secrets Management

```bash
# 1. Create production secrets (CRITICAL: Use real values)
kubectl create secret generic mental-health-secrets \
  --namespace=mental-health-platform \
  --from-literal=DB_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=REDIS_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=JWT_SECRET="$(openssl rand -base64 64)" \
  --from-literal=JWT_REFRESH_SECRET="$(openssl rand -base64 64)" \
  --from-literal=ENCRYPTION_KEY="$(openssl rand -hex 32)" \
  --from-literal=CRISIS_OVERRIDE_KEY="$(openssl rand -base64 32)" \
  --from-literal=SENDGRID_API_KEY="YOUR_SENDGRID_KEY" \
  --from-literal=TWILIO_ACCOUNT_SID="YOUR_TWILIO_SID" \
  --from-literal=TWILIO_AUTH_TOKEN="YOUR_TWILIO_TOKEN" \
  --from-literal=OPENAI_API_KEY="YOUR_OPENAI_KEY" \
  --from-literal=SENTRY_DSN="YOUR_SENTRY_DSN"
```

### Phase 4: Database Deployment

```bash
# 1. Deploy PostgreSQL with HIPAA compliance
kubectl apply -f kubernetes/database/

# 2. Wait for database to be ready
kubectl wait --for=condition=Ready --timeout=600s statefulset/postgresql-primary -n mental-health-platform

# 3. Verify database connectivity
kubectl exec -it postgresql-primary-0 -n mental-health-platform -- pg_isready -h localhost -p 5432
```

### Phase 5: Cache Layer Deployment

```bash
# 1. Deploy Redis cluster
kubectl apply -f kubernetes/redis/

# 2. Wait for Redis to be ready
kubectl wait --for=condition=Available --timeout=300s deployment/redis -n mental-health-platform

# 3. Test Redis connectivity
kubectl exec -it deployment/redis -n mental-health-platform -- redis-cli -a $REDIS_PASSWORD ping
```

### Phase 6: Application Deployment

```bash
# 1. Apply configuration
kubectl apply -f kubernetes/configmaps/

# 2. Deploy backend services
kubectl apply -f kubernetes/backend/

# 3. Deploy frontend
kubectl apply -f kubernetes/frontend/

# 4. Wait for all deployments
kubectl wait --for=condition=Available --timeout=600s deployment/mental-health-backend -n mental-health-platform
kubectl wait --for=condition=Available --timeout=600s deployment/mental-health-frontend -n mental-health-platform
```

### Phase 7: Monitoring Setup

```bash
# 1. Deploy Prometheus
kubectl apply -f kubernetes/monitoring/prometheus.yaml

# 2. Deploy Grafana
kubectl apply -f kubernetes/monitoring/grafana.yaml

# 3. Wait for monitoring stack
kubectl wait --for=condition=Available --timeout=300s deployment/prometheus -n mental-health-platform
kubectl wait --for=condition=Available --timeout=300s deployment/grafana -n mental-health-platform
```

## 🔍 DEPLOYMENT VALIDATION

### Critical System Checks

```bash
# 1. Verify all pods are running
kubectl get pods -n mental-health-platform

# 2. Check service health
kubectl get svc -n mental-health-platform

# 3. Verify ingress is configured
kubectl get ingress -n mental-health-platform

# 4. Test external connectivity
curl -f https://mentalhealthplatform.com/health

# 5. Validate crisis endpoints
curl -X POST https://api.mentalhealthplatform.com/api/crisis/test \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

### Crisis System Validation

```bash
# 1. Test crisis detection API
kubectl port-forward service/backend-service 8080:3001 -n mental-health-platform &
curl -X POST http://localhost:8080/api/crisis/detect \
  -H "Content-Type: application/json" \
  -d '{"message": "I am having thoughts of self-harm", "test": true}'

# 2. Test 988 hotline integration
curl -X POST http://localhost:8080/api/crisis/hotline \
  -H "Content-Type: application/json" \
  -d '{"emergency": true, "test": true}'

# 3. Test emergency escalation
curl -X POST http://localhost:8080/api/crisis/escalate \
  -H "Content-Type: application/json" \
  -d '{"severity": "high", "test": true}'
```

### Performance Testing

```bash
# Run comprehensive load test
k6 run --vus 50 --duration 5m k6/crisis-load-test.js
```

## 📊 MONITORING & ALERTING

### Dashboard Access
- **Grafana**: https://monitoring.mentalhealthplatform.com
- **Prometheus**: https://monitoring.mentalhealthplatform.com/prometheus
- **Default Login**: monitoring-user / [see kubernetes/monitoring/grafana.yaml]

### Critical Alerts
- Crisis system down (30s threshold)
- Response time >2s (critical)
- Database connection pool >90%
- Memory usage >90%
- Certificate expiry <30 days

### Key Metrics to Monitor
```prometheus
# Crisis system health
up{job="crisis-detector"}

# Response time
histogram_quantile(0.95, rate(crisis_response_duration_seconds_bucket[5m]))

# Active crises
crisis_active_count

# System resource usage
container_memory_working_set_bytes / container_spec_memory_limit_bytes
```

## 🔐 SECURITY CHECKLIST

### Network Security
- [ ] Network policies applied and tested
- [ ] TLS certificates valid and auto-renewing
- [ ] Ingress controller configured with security headers
- [ ] Pod Security Standards enforced
- [ ] RBAC permissions minimal and tested

### Data Protection
- [ ] Database encryption at rest enabled
- [ ] Redis TLS connections configured
- [ ] Secrets properly sealed and rotated
- [ ] Backup encryption verified
- [ ] Audit logging enabled

### Compliance Verification
- [ ] HIPAA security controls implemented
- [ ] Data retention policies configured
- [ ] User access controls tested
- [ ] Incident response procedures documented
- [ ] Vulnerability scanning automated

## 🆘 EMERGENCY PROCEDURES

### Crisis System Failure
```bash
# 1. Check crisis detector status
kubectl get pods -l component=crisis-detector -n mental-health-platform

# 2. Scale up crisis detection pods immediately
kubectl scale deployment/mental-health-backend --replicas=10 -n mental-health-platform

# 3. Check backend logs
kubectl logs -l component=backend -n mental-health-platform --tail=100

# 4. Restart crisis services if needed
kubectl rollout restart deployment/mental-health-backend -n mental-health-platform
```

### Database Emergency
```bash
# 1. Check database status
kubectl exec postgresql-primary-0 -n mental-health-platform -- pg_isready

# 2. Scale read replicas if needed
kubectl scale deployment/postgresql-replica --replicas=3 -n mental-health-platform

# 3. Restore from backup if necessary
kubectl exec postgresql-primary-0 -n mental-health-platform -- pg_restore --help
```

### Complete System Recovery
```bash
# 1. Restore from disaster recovery backup
# 2. Redeploy all components
# 3. Verify crisis system functionality
# 4. Notify stakeholders of system status
```

## 📞 ESCALATION CONTACTS

- **Critical System Issues**: [CRISIS_ESCALATION_EMAIL]
- **Security Incidents**: [SECURITY_EMAIL]
- **HIPAA Compliance**: [COMPLIANCE_EMAIL]
- **On-Call Engineer**: [ONCALL_PHONE]

## 🔄 MAINTENANCE PROCEDURES

### Regular Maintenance
- **Weekly**: Review metrics and performance
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Full disaster recovery test
- **Annually**: Security audit and penetration testing

### Updates and Rollbacks
```bash
# Rolling update
kubectl set image deployment/mental-health-backend backend=newimage:tag -n mental-health-platform

# Monitor rollout
kubectl rollout status deployment/mental-health-backend -n mental-health-platform

# Rollback if needed
kubectl rollout undo deployment/mental-health-backend -n mental-health-platform
```

## ⚠️ IMPORTANT WARNINGS

1. **NEVER** disable crisis detection system without proper failover
2. **ALWAYS** test changes in staging environment first
3. **VERIFY** all certificate renewals before expiry
4. **MONITOR** response times continuously during peak hours
5. **BACKUP** before any major configuration changes
6. **VALIDATE** HIPAA compliance after any infrastructure changes

## 📚 ADDITIONAL RESOURCES

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [HIPAA Compliance Guide](./docs/HIPAA_COMPLIANCE.md)
- [Crisis System Architecture](./docs/CRISIS_ARCHITECTURE.md)
- [Disaster Recovery Plan](./docs/DISASTER_RECOVERY.md)
- [Runbook Templates](./docs/RUNBOOKS.md)

---

**REMEMBER: This is life-critical infrastructure. Every decision impacts real people's mental health and safety. Deploy with care, monitor continuously, and prioritize system reliability above all else.**