/**
 * Security Audit Script for CoreV2
 * Performs comprehensive security checks and generates compliance reports
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class SecurityAuditor {
  constructor() {
    this.auditResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      checks: [],
      vulnerabilities: [],
      compliance: {
        hipaa: false,
        gdpr: false,
        owasp: false,
      },
      score: 0,
    };
  }

  /**
   * Run complete security audit
   */
  async runAudit() {
    console.log('🔒 Starting CoreV2 Security Audit...\n');
    
    await this.checkEnvironmentVariables();
    await this.checkDependencyVulnerabilities();
    await this.checkSecurityHeaders();
    await this.checkSSLConfiguration();
    await this.checkAuthentication();
    await this.checkDataEncryption();
    await this.checkHIPAACompliance();
    await this.checkGDPRCompliance();
    await this.checkOWASPTop10();
    await this.checkFilePermissions();
    await this.checkAPIEndpoints();
    await this.checkRateLimiting();
    await this.checkLogging();
    await this.checkBackupSecurity();
    
    this.calculateSecurityScore();
    this.generateReport();
  }

  /**
   * Check environment variables for security issues
   */
  async checkEnvironmentVariables() {
    console.log('📋 Checking environment variables...');
    const issues = [];
    
    // Check for default/weak secrets
    const secretEnvVars = [
      'JWT_SECRET',
      'SESSION_SECRET',
      'ENCRYPTION_KEY',
      'DATABASE_PASSWORD',
      'REDIS_PASSWORD',
    ];
    
    secretEnvVars.forEach(envVar => {
      const value = process.env[envVar];
      if (!value) {
        issues.push(`Missing required secret: ${envVar}`);
      } else if (value.includes('change-this') || value.includes('dev-') || value.length < 32) {
        issues.push(`Weak or default secret detected: ${envVar}`);
      }
    });
    
    // Check for required security configs
    const requiredConfigs = [
      'CSP_ENABLED',
      'HSTS_ENABLED',
      'RATE_LIMIT_ENABLED',
      'AUDIT_ENABLED',
    ];
    
    requiredConfigs.forEach(config => {
      if (process.env[config] !== 'true') {
        issues.push(`Security feature not enabled: ${config}`);
      }
    });
    
    this.auditResults.checks.push({
      name: 'Environment Variables',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check for dependency vulnerabilities
   */
  async checkDependencyVulnerabilities() {
    console.log('📦 Checking dependency vulnerabilities...');
    const issues = [];
    
    try {
      // Run npm audit
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      if (audit.metadata.vulnerabilities.total > 0) {
        issues.push(`Found ${audit.metadata.vulnerabilities.total} vulnerabilities`);
        issues.push(`Critical: ${audit.metadata.vulnerabilities.critical}`);
        issues.push(`High: ${audit.metadata.vulnerabilities.high}`);
        issues.push(`Moderate: ${audit.metadata.vulnerabilities.moderate}`);
        issues.push(`Low: ${audit.metadata.vulnerabilities.low}`);
        
        // Add specific vulnerabilities
        Object.values(audit.vulnerabilities || {}).forEach(vuln => {
          this.auditResults.vulnerabilities.push({
            name: vuln.name,
            severity: vuln.severity,
            via: vuln.via,
          });
        });
      }
    } catch (error) {
      issues.push('Failed to run npm audit');
    }
    
    this.auditResults.checks.push({
      name: 'Dependency Vulnerabilities',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check security headers configuration
   */
  async checkSecurityHeaders() {
    console.log('🛡️ Checking security headers...');
    const issues = [];
    
    const requiredHeaders = [
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'Content-Security-Policy',
      'Referrer-Policy',
      'Permissions-Policy',
    ];
    
    // Check if headers are configured in security.config.ts
    const configPath = path.join(__dirname, '../../src/config/security.config.ts');
    if (fs.existsSync(configPath)) {
      const config = fs.readFileSync(configPath, 'utf8');
      
      requiredHeaders.forEach(header => {
        if (!config.includes(header.replace(/-/g, ''))) {
          issues.push(`Missing security header configuration: ${header}`);
        }
      });
    } else {
      issues.push('Security configuration file not found');
    }
    
    this.auditResults.checks.push({
      name: 'Security Headers',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check SSL/TLS configuration
   */
  async checkSSLConfiguration() {
    console.log('🔐 Checking SSL/TLS configuration...');
    const issues = [];
    
    if (process.env.NODE_ENV === 'production') {
      if (process.env.TLS_VERSION !== '1.3') {
        issues.push('TLS 1.3 not enforced');
      }
      
      if (process.env.CERTIFICATE_PINNING !== 'true') {
        issues.push('Certificate pinning not enabled');
      }
      
      if (process.env.HSTS_ENABLED !== 'true') {
        issues.push('HSTS not enabled');
      }
    }
    
    this.auditResults.checks.push({
      name: 'SSL/TLS Configuration',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check authentication mechanisms
   */
  async checkAuthentication() {
    console.log('🔑 Checking authentication...');
    const issues = [];
    
    if (process.env.VITE_ENABLE_TWO_FACTOR !== 'true' && process.env.NODE_ENV === 'production') {
      issues.push('Two-factor authentication not enabled');
    }
    
    if (process.env.SESSION_TIMEOUT > 3600000) {
      issues.push('Session timeout too long');
    }
    
    if (!process.env.JWT_ALGORITHM || process.env.JWT_ALGORITHM === 'HS256') {
      issues.push('Weak JWT algorithm (use RS256 or better)');
    }
    
    this.auditResults.checks.push({
      name: 'Authentication',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check data encryption
   */
  async checkDataEncryption() {
    console.log('🔒 Checking data encryption...');
    const issues = [];
    
    if (process.env.CRYPTO_ALGORITHM !== 'aes-256-gcm') {
      issues.push('Not using AES-256-GCM for encryption');
    }
    
    if (!process.env.DATA_ENCRYPTION_AT_REST || process.env.DATA_ENCRYPTION_AT_REST !== 'true') {
      issues.push('Data encryption at rest not enabled');
    }
    
    if (!process.env.DATA_ENCRYPTION_IN_TRANSIT || process.env.DATA_ENCRYPTION_IN_TRANSIT !== 'true') {
      issues.push('Data encryption in transit not enforced');
    }
    
    this.auditResults.checks.push({
      name: 'Data Encryption',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check HIPAA compliance
   */
  async checkHIPAACompliance() {
    console.log('🏥 Checking HIPAA compliance...');
    const issues = [];
    
    // Check data retention
    if (!process.env.DATA_RETENTION_DAYS || parseInt(process.env.DATA_RETENTION_DAYS) < 2555) {
      issues.push('Data retention period less than HIPAA requirement (7 years)');
    }
    
    // Check audit logging
    if (process.env.AUDIT_ENABLED !== 'true') {
      issues.push('Audit logging not enabled (HIPAA requirement)');
    }
    
    // Check access controls
    if (process.env.RBAC_ENABLED !== 'true') {
      issues.push('Role-based access control not enabled');
    }
    
    // Check encryption
    if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
      issues.push('Encryption key does not meet HIPAA standards');
    }
    
    // Check data minimization
    if (process.env.DATA_MINIMIZATION !== 'true') {
      issues.push('Data minimization not enabled');
    }
    
    this.auditResults.compliance.hipaa = issues.length === 0;
    
    this.auditResults.checks.push({
      name: 'HIPAA Compliance',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check GDPR compliance
   */
  async checkGDPRCompliance() {
    console.log('🇪🇺 Checking GDPR compliance...');
    const issues = [];
    
    if (process.env.RIGHT_TO_FORGETTING !== 'true') {
      issues.push('Right to be forgotten not implemented');
    }
    
    if (process.env.CONSENT_MANAGEMENT !== 'true') {
      issues.push('Consent management not enabled');
    }
    
    if (process.env.DATA_PORTABILITY !== 'true') {
      issues.push('Data portability not implemented');
    }
    
    if (process.env.PRIVACY_BY_DESIGN !== 'true') {
      issues.push('Privacy by design not implemented');
    }
    
    this.auditResults.compliance.gdpr = issues.length === 0;
    
    this.auditResults.checks.push({
      name: 'GDPR Compliance',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check OWASP Top 10 vulnerabilities
   */
  async checkOWASPTop10() {
    console.log('🛡️ Checking OWASP Top 10...');
    const issues = [];
    
    // A01:2021 – Broken Access Control
    if (process.env.RBAC_ENABLED !== 'true') {
      issues.push('A01: Broken Access Control - RBAC not enabled');
    }
    
    // A02:2021 – Cryptographic Failures
    if (process.env.CRYPTO_ALGORITHM !== 'aes-256-gcm') {
      issues.push('A02: Cryptographic Failures - Weak encryption');
    }
    
    // A03:2021 – Injection
    if (process.env.SQL_INJECTION_PROTECTION !== 'true') {
      issues.push('A03: Injection - SQL injection protection not enabled');
    }
    
    // A04:2021 – Insecure Design
    if (process.env.THREAT_MODELING !== 'true') {
      issues.push('A04: Insecure Design - No threat modeling');
    }
    
    // A05:2021 – Security Misconfiguration
    if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE === 'true') {
      issues.push('A05: Security Misconfiguration - Debug mode in production');
    }
    
    // A06:2021 – Vulnerable Components
    if (this.auditResults.vulnerabilities.length > 0) {
      issues.push('A06: Vulnerable and Outdated Components detected');
    }
    
    // A07:2021 – Identification and Authentication Failures
    if (process.env.VITE_ENABLE_TWO_FACTOR !== 'true') {
      issues.push('A07: Authentication Failures - 2FA not enabled');
    }
    
    // A08:2021 – Software and Data Integrity Failures
    if (process.env.INTEGRITY_CHECKS !== 'true') {
      issues.push('A08: Integrity Failures - No integrity checks');
    }
    
    // A09:2021 – Security Logging and Monitoring Failures
    if (process.env.SECURITY_EVENT_LOGGING !== 'true') {
      issues.push('A09: Logging Failures - Security logging not enabled');
    }
    
    // A10:2021 – Server-Side Request Forgery
    if (process.env.SSRF_PROTECTION !== 'true') {
      issues.push('A10: SSRF - No SSRF protection');
    }
    
    this.auditResults.compliance.owasp = issues.length === 0;
    
    this.auditResults.checks.push({
      name: 'OWASP Top 10',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check file permissions
   */
  async checkFilePermissions() {
    console.log('📁 Checking file permissions...');
    const issues = [];
    
    const sensitiveFiles = [
      '.env',
      'production.env',
      'staging.env',
      'development.env',
    ];
    
    sensitiveFiles.forEach(file => {
      const filePath = path.join(__dirname, '../../', file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const mode = '0' + (stats.mode & parseInt('777', 8)).toString(8);
        
        if (mode !== '0600' && mode !== '0400') {
          issues.push(`Insecure permissions on ${file}: ${mode}`);
        }
      }
    });
    
    this.auditResults.checks.push({
      name: 'File Permissions',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check API endpoints security
   */
  async checkAPIEndpoints() {
    console.log('🌐 Checking API endpoints...');
    const issues = [];
    
    if (process.env.API_KEY_REQUIRED !== 'true' && process.env.NODE_ENV === 'production') {
      issues.push('API key authentication not required');
    }
    
    if (!process.env.API_RATE_LIMIT) {
      issues.push('API rate limiting not configured');
    }
    
    if (process.env.API_TIMEOUT > 60000) {
      issues.push('API timeout too long');
    }
    
    this.auditResults.checks.push({
      name: 'API Security',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check rate limiting configuration
   */
  async checkRateLimiting() {
    console.log('⏱️ Checking rate limiting...');
    const issues = [];
    
    const rateLimits = {
      RATE_LIMIT_MAX_REQUESTS: 1000,
      RATE_LIMIT_AUTH_MAX: 5,
      RATE_LIMIT_CRISIS_MAX: 100,
    };
    
    Object.entries(rateLimits).forEach(([key, maxValue]) => {
      const value = parseInt(process.env[key] || '0');
      if (value === 0) {
        issues.push(`${key} not configured`);
      } else if (value > maxValue && process.env.NODE_ENV === 'production') {
        issues.push(`${key} too permissive: ${value} > ${maxValue}`);
      }
    });
    
    this.auditResults.checks.push({
      name: 'Rate Limiting',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check logging configuration
   */
  async checkLogging() {
    console.log('📝 Checking logging configuration...');
    const issues = [];
    
    const requiredLogs = [
      'LOG_AUTH_EVENTS',
      'LOG_DATA_ACCESS',
      'LOG_SECURITY_EVENTS',
    ];
    
    requiredLogs.forEach(log => {
      if (process.env[log] !== 'true') {
        issues.push(`${log} not enabled`);
      }
    });
    
    if (!process.env.LOG_RETENTION_DAYS || parseInt(process.env.LOG_RETENTION_DAYS) < 90) {
      issues.push('Log retention period too short');
    }
    
    this.auditResults.checks.push({
      name: 'Logging',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Check backup security
   */
  async checkBackupSecurity() {
    console.log('💾 Checking backup security...');
    const issues = [];
    
    if (process.env.BACKUP_ENCRYPTION !== 'true') {
      issues.push('Backup encryption not enabled');
    }
    
    if (!process.env.BACKUP_RETENTION_DAYS) {
      issues.push('Backup retention not configured');
    }
    
    if (process.env.DISASTER_RECOVERY_ENABLED !== 'true') {
      issues.push('Disaster recovery not enabled');
    }
    
    this.auditResults.checks.push({
      name: 'Backup Security',
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
    });
  }

  /**
   * Calculate overall security score
   */
  calculateSecurityScore() {
    const totalChecks = this.auditResults.checks.length;
    const passedChecks = this.auditResults.checks.filter(c => c.status === 'PASS').length;
    
    this.auditResults.score = Math.round((passedChecks / totalChecks) * 100);
    
    // Adjust for critical vulnerabilities
    if (this.auditResults.vulnerabilities.some(v => v.severity === 'critical')) {
      this.auditResults.score = Math.max(0, this.auditResults.score - 20);
    }
    
    if (this.auditResults.vulnerabilities.some(v => v.severity === 'high')) {
      this.auditResults.score = Math.max(0, this.auditResults.score - 10);
    }
  }

  /**
   * Generate audit report
   */
  generateReport() {
    const reportPath = path.join(__dirname, '../../audit-reports');
    if (!fs.existsSync(reportPath)) {
      fs.mkdirSync(reportPath, { recursive: true });
    }
    
    const filename = `security-audit-${Date.now()}.json`;
    const filepath = path.join(reportPath, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(this.auditResults, null, 2));
    
    console.log('\n' + '='.repeat(60));
    console.log('SECURITY AUDIT REPORT');
    console.log('='.repeat(60));
    console.log(`Environment: ${this.auditResults.environment}`);
    console.log(`Timestamp: ${this.auditResults.timestamp}`);
    console.log(`Security Score: ${this.auditResults.score}/100`);
    console.log('\nCompliance Status:');
    console.log(`  HIPAA: ${this.auditResults.compliance.hipaa ? '✅' : '❌'}`);
    console.log(`  GDPR: ${this.auditResults.compliance.gdpr ? '✅' : '❌'}`);
    console.log(`  OWASP: ${this.auditResults.compliance.owasp ? '✅' : '❌'}`);
    
    console.log('\nCheck Results:');
    this.auditResults.checks.forEach(check => {
      const icon = check.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${icon} ${check.name}: ${check.status}`);
      if (check.issues.length > 0) {
        check.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      }
    });
    
    if (this.auditResults.vulnerabilities.length > 0) {
      console.log('\n⚠️ Vulnerabilities Found:');
      this.auditResults.vulnerabilities.forEach(vuln => {
        console.log(`  - ${vuln.name} (${vuln.severity})`);
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`Full report saved to: ${filepath}`);
    console.log('='.repeat(60));
    
    // Exit with error code if score is below threshold
    if (this.auditResults.score < 70) {
      console.error('\n❌ Security audit failed! Score below 70%');
      process.exit(1);
    } else {
      console.log('\n✅ Security audit passed!');
    }
  }
}

// Run the audit
const auditor = new SecurityAuditor();
auditor.runAudit().catch(error => {
  console.error('Audit failed:', error);
  process.exit(1);
});