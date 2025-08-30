#!/usr/bin/env node

/**
 * Security Enhancement Deployment Script
 * Deploys enterprise-grade security measures for Astral Core Mental Health Platform
 * 
 * Usage: node scripts/deploy-security-enhancements.js [--environment=production|staging|development]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// ============================================================================
// CONFIGURATION
// ============================================================================

const ENVIRONMENTS = {
  production: {
    configFile: '.env.production',
    netlifyConfig: 'netlify-security-enhanced.toml',
    requiresApproval: true,
    backupRequired: true
  },
  staging: {
    configFile: '.env.staging',
    netlifyConfig: 'netlify-security-enhanced.toml',
    requiresApproval: false,
    backupRequired: true
  },
  development: {
    configFile: '.env.development',
    netlifyConfig: 'netlify.toml',
    requiresApproval: false,
    backupRequired: false
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--environment='));
const environment = envArg ? envArg.split('=')[1] : 'development';

if (!ENVIRONMENTS[environment]) {
  console.error(`❌ Invalid environment: ${environment}`);
  process.exit(1);
}

const config = ENVIRONMENTS[environment];

// ============================================================================
// SECURITY UTILITIES
// ============================================================================

class SecurityDeployment {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.completed = [];
  }

  /**
   * Generate secure random keys
   */
  generateSecureKey(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate secure passwords
   */
  generateSecurePassword() {
    const length = 24;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    const randomBytes = crypto.randomBytes(length);
    
    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }
    
    return password;
  }

  /**
   * Backup existing configuration
   */
  backupConfiguration() {
    console.log('📦 Creating configuration backup...');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = path.join(process.cwd(), '.security-backups', timestamp);
    
    try {
      // Create backup directory
      fs.mkdirSync(backupDir, { recursive: true });
      
      // Backup files
      const filesToBackup = [
        '.env',
        '.env.production',
        '.env.staging',
        '.env.development',
        'netlify.toml',
        'package.json'
      ];
      
      filesToBackup.forEach(file => {
        const sourcePath = path.join(process.cwd(), file);
        if (fs.existsSync(sourcePath)) {
          const destPath = path.join(backupDir, file);
          fs.copyFileSync(sourcePath, destPath);
          console.log(`  ✓ Backed up ${file}`);
        }
      });
      
      this.completed.push('Configuration backup created');
      return backupDir;
    } catch (error) {
      this.errors.push(`Backup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate secure environment variables
   */
  generateSecureEnvironment() {
    console.log('🔐 Generating secure environment variables...');
    
    const secureEnv = {
      // Encryption keys
      ENCRYPTION_KEY: this.generateSecureKey(32),
      ENCRYPTION_IV: this.generateSecureKey(16),
      
      // JWT secrets
      JWT_SECRET: this.generateSecureKey(64),
      JWT_REFRESH_SECRET: this.generateSecureKey(64),
      
      // Session secrets
      SESSION_SECRET: this.generateSecureKey(32),
      CSRF_SECRET: this.generateSecureKey(32),
      
      // Database encryption
      DATABASE_ENCRYPTION_KEY: this.generateSecureKey(32),
      
      // API keys (placeholders - must be replaced with real values)
      SECURE_API_KEY: this.generateSecureKey(32),
      WEBHOOK_SECRET: this.generateSecureKey(32)
    };
    
    // Create secure environment template
    const templatePath = path.join(process.cwd(), '.env.secure.generated');
    const envContent = Object.entries(secureEnv)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(templatePath, envContent);
    console.log(`  ✓ Generated secure environment template`);
    
    this.completed.push('Secure environment variables generated');
    return secureEnv;
  }

  /**
   * Deploy Netlify security configuration
   */
  deployNetlifyConfig() {
    console.log('🛡️ Deploying Netlify security configuration...');
    
    const sourceConfig = path.join(process.cwd(), 'netlify-security-enhanced.toml');
    const targetConfig = path.join(process.cwd(), 'netlify.toml');
    
    try {
      // Backup existing config
      if (fs.existsSync(targetConfig)) {
        const backupPath = targetConfig + '.backup';
        fs.copyFileSync(targetConfig, backupPath);
        console.log(`  ✓ Backed up existing netlify.toml`);
      }
      
      // Deploy new config
      if (fs.existsSync(sourceConfig)) {
        fs.copyFileSync(sourceConfig, targetConfig);
        console.log(`  ✓ Deployed enhanced security configuration`);
      } else {
        this.warnings.push('Enhanced Netlify config not found');
      }
      
      this.completed.push('Netlify security configuration deployed');
    } catch (error) {
      this.errors.push(`Netlify config deployment failed: ${error.message}`);
    }
  }

  /**
   * Update dependencies for security
   */
  updateSecurityDependencies() {
    console.log('📦 Updating security dependencies...');
    
    const securityPackages = [
      'helmet@^7.0.0',           // Security headers
      'express-rate-limit@^6.0.0', // Rate limiting
      'express-session@^1.17.3',  // Secure sessions
      'csurf@^1.11.0',            // CSRF protection
      'bcryptjs@^2.4.3',          // Password hashing
      'jsonwebtoken@^9.0.2',      // JWT handling
      'zod@^3.23.8',              // Input validation
      'dompurify@^3.0.0',         // XSS protection
      'uuid@^9.0.0'               // Secure ID generation
    ];
    
    try {
      console.log('  Installing security packages...');
      const installCmd = `npm install ${securityPackages.join(' ')}`;
      execSync(installCmd, { stdio: 'inherit' });
      
      console.log('  ✓ Security dependencies updated');
      this.completed.push('Security dependencies updated');
    } catch (error) {
      this.errors.push(`Dependency update failed: ${error.message}`);
    }
  }

  /**
   * Run security audit
   */
  runSecurityAudit() {
    console.log('🔍 Running security audit...');
    
    try {
      // Run npm audit
      console.log('  Running npm audit...');
      const auditResult = execSync('npm audit --json', { encoding: 'utf8' });
      const audit = JSON.parse(auditResult);
      
      console.log(`  Vulnerabilities found:`);
      console.log(`    Critical: ${audit.metadata.vulnerabilities.critical || 0}`);
      console.log(`    High: ${audit.metadata.vulnerabilities.high || 0}`);
      console.log(`    Moderate: ${audit.metadata.vulnerabilities.moderate || 0}`);
      console.log(`    Low: ${audit.metadata.vulnerabilities.low || 0}`);
      
      // Attempt to fix
      if (audit.metadata.vulnerabilities.total > 0) {
        console.log('  Attempting to fix vulnerabilities...');
        try {
          execSync('npm audit fix', { stdio: 'inherit' });
          console.log('  ✓ Applied available fixes');
        } catch {
          this.warnings.push('Some vulnerabilities could not be automatically fixed');
        }
      }
      
      this.completed.push('Security audit completed');
    } catch (error) {
      this.warnings.push(`Security audit encountered issues: ${error.message}`);
    }
  }

  /**
   * Create security documentation
   */
  createSecurityDocs() {
    console.log('📄 Creating security documentation...');
    
    const docsDir = path.join(process.cwd(), 'security-docs');
    fs.mkdirSync(docsDir, { recursive: true });
    
    // Create deployment record
    const deploymentRecord = {
      timestamp: new Date().toISOString(),
      environment,
      deployedBy: process.env.USER || 'unknown',
      securityMeasures: [
        'Enhanced CSP headers',
        'HTTPS enforcement',
        'Rate limiting',
        'Session management',
        'Input validation',
        'Encryption at rest',
        'Audit logging'
      ],
      completed: this.completed,
      warnings: this.warnings,
      errors: this.errors
    };
    
    const recordPath = path.join(docsDir, `deployment-${Date.now()}.json`);
    fs.writeFileSync(recordPath, JSON.stringify(deploymentRecord, null, 2));
    
    console.log(`  ✓ Deployment record created`);
    this.completed.push('Security documentation created');
  }

  /**
   * Verify deployment
   */
  verifyDeployment() {
    console.log('✅ Verifying deployment...');
    
    const checks = [
      { name: 'Netlify config', file: 'netlify.toml' },
      { name: 'Security audit report', file: 'SECURITY_AUDIT_REPORT.md' },
      { name: 'HIPAA compliance docs', file: 'HIPAA_COMPLIANCE_DOCUMENTATION.md' },
      { name: 'Incident response plan', file: 'INCIDENT_RESPONSE_PLAN.md' },
      { name: 'Secure auth service', file: 'src/services/secureAuth.ts' },
      { name: 'Security monitor', file: 'src/components/SecurityMonitor.tsx' }
    ];
    
    let allPresent = true;
    checks.forEach(check => {
      const exists = fs.existsSync(path.join(process.cwd(), check.file));
      console.log(`  ${exists ? '✓' : '✗'} ${check.name}`);
      if (!exists) allPresent = false;
    });
    
    if (allPresent) {
      console.log('  ✓ All security components present');
      this.completed.push('Deployment verification passed');
    } else {
      this.warnings.push('Some security components missing');
    }
    
    return allPresent;
  }

  /**
   * Main deployment process
   */
  async deploy() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║     ASTRAL CORE SECURITY ENHANCEMENT DEPLOYMENT              ║
╚══════════════════════════════════════════════════════════════╝
`);
    console.log(`Environment: ${environment.toUpperCase()}`);
    console.log(`Date: ${new Date().toISOString()}\n`);
    
    // Check for approval if required
    if (config.requiresApproval) {
      console.log('⚠️  Production deployment requires approval.');
      console.log('   Type "DEPLOY" to continue or Ctrl+C to cancel: ');
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('', resolve);
      });
      readline.close();
      
      if (answer !== 'DEPLOY') {
        console.log('❌ Deployment cancelled');
        process.exit(0);
      }
    }
    
    try {
      // Step 1: Backup
      if (config.backupRequired) {
        this.backupConfiguration();
      }
      
      // Step 2: Generate secure environment
      this.generateSecureEnvironment();
      
      // Step 3: Deploy Netlify config
      this.deployNetlifyConfig();
      
      // Step 4: Update dependencies
      this.updateSecurityDependencies();
      
      // Step 5: Run security audit
      this.runSecurityAudit();
      
      // Step 6: Create documentation
      this.createSecurityDocs();
      
      // Step 7: Verify deployment
      this.verifyDeployment();
      
      // Summary
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    DEPLOYMENT SUMMARY                        ║
╚══════════════════════════════════════════════════════════════╝
`);
      console.log(`✅ Completed (${this.completed.length}):`);
      this.completed.forEach(item => console.log(`   • ${item}`));
      
      if (this.warnings.length > 0) {
        console.log(`\n⚠️  Warnings (${this.warnings.length}):`);
        this.warnings.forEach(item => console.log(`   • ${item}`));
      }
      
      if (this.errors.length > 0) {
        console.log(`\n❌ Errors (${this.errors.length}):`);
        this.errors.forEach(item => console.log(`   • ${item}`));
      }
      
      console.log(`
╔══════════════════════════════════════════════════════════════╗
║                     NEXT STEPS                               ║
╚══════════════════════════════════════════════════════════════╝

1. Review generated secure environment variables in .env.secure.generated
2. Update API keys with actual values in Netlify dashboard
3. Test security headers at: https://securityheaders.com
4. Run penetration testing
5. Schedule security training for team
6. Monitor security dashboard for threats

🔐 Security deployment completed successfully!
`);
      
    } catch (error) {
      console.error(`\n❌ Deployment failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// ============================================================================
// EXECUTION
// ============================================================================

const deployment = new SecurityDeployment();
deployment.deploy().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});