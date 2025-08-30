#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Validates environment configuration and deployment readiness
 * Created by Agent Delta
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}\n`)
};

let errors = 0;
let warnings = 0;

/**
 * Check if a file exists
 */
function checkFile(filePath, required = true) {
  const fullPath = path.join(process.cwd(), filePath);
  const exists = fs.existsSync(fullPath);
  
  if (exists) {
    log.success(`Found: ${filePath}`);
    return true;
  } else if (required) {
    log.error(`Missing required file: ${filePath}`);
    errors++;
    return false;
  } else {
    log.warning(`Optional file missing: ${filePath}`);
    warnings++;
    return false;
  }
}

/**
 * Check environment variables
 */
function checkEnvVar(varName, required = true) {
  const value = process.env[varName];
  
  if (value && value !== '' && !value.includes('DEMO') && !value.includes('test')) {
    log.success(`Environment variable set: ${varName}`);
    return true;
  } else if (required) {
    log.error(`Missing or invalid environment variable: ${varName}`);
    errors++;
    return false;
  } else {
    log.warning(`Optional environment variable not set: ${varName}`);
    warnings++;
    return false;
  }
}

/**
 * Load and validate .env file
 */
function loadEnvFile(envFile = '.env') {
  const envPath = path.join(process.cwd(), envFile);
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    
    lines.forEach(line => {
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, value] = line.split('=');
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = value.trim();
        }
      }
    });
    
    log.success(`Loaded environment from: ${envFile}`);
    return true;
  } else {
    log.error(`Environment file not found: ${envFile}`);
    return false;
  }
}

/**
 * Check Node.js version
 */
function checkNodeVersion() {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (major >= 18) {
    log.success(`Node.js version: ${nodeVersion}`);
    return true;
  } else {
    log.error(`Node.js version ${nodeVersion} is too old. Required: >= 18`);
    errors++;
    return false;
  }
}

/**
 * Check npm version
 */
function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(npmVersion.split('.')[0]);
    
    if (major >= 9) {
      log.success(`npm version: ${npmVersion}`);
      return true;
    } else {
      log.warning(`npm version ${npmVersion} is old. Recommended: >= 9`);
      warnings++;
      return true;
    }
  } catch (error) {
    log.error('Failed to check npm version');
    errors++;
    return false;
  }
}

/**
 * Check dependencies
 */
function checkDependencies() {
  try {
    execSync('npm ls --depth=0', { encoding: 'utf-8', stdio: 'pipe' });
    log.success('All dependencies installed');
    return true;
  } catch (error) {
    log.error('Missing or invalid dependencies. Run: npm install');
    errors++;
    return false;
  }
}

/**
 * Run build test
 */
function testBuild() {
  log.info('Testing build process...');
  
  try {
    execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe' });
    log.success('Build completed successfully');
    
    // Check build output
    if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
      const distFiles = fs.readdirSync(path.join(process.cwd(), 'dist'));
      if (distFiles.length > 0) {
        log.success(`Build output contains ${distFiles.length} files`);
        return true;
      }
    }
    
    log.error('Build output is empty');
    errors++;
    return false;
  } catch (error) {
    log.error('Build failed: ' + error.message);
    errors++;
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyDeployment() {
  console.log(colors.cyan + '\n╔════════════════════════════════════════╗');
  console.log('║  DEPLOYMENT VERIFICATION SCRIPT        ║');
  console.log('║  Astral Core Mental Health Platform   ║');
  console.log('╚════════════════════════════════════════╝' + colors.reset);
  
  // 1. Check Node.js and npm versions
  log.header('System Requirements');
  checkNodeVersion();
  checkNpmVersion();
  
  // 2. Check required configuration files
  log.header('Configuration Files');
  checkFile('package.json');
  checkFile('tsconfig.json');
  checkFile('vite.config.ts');
  checkFile('netlify.toml');
  checkFile('.env.example');
  
  // 3. Load environment variables
  log.header('Environment Configuration');
  const envMode = process.env.NODE_ENV || 'production';
  const envFile = envMode === 'production' ? '.env.production' : 
                  envMode === 'staging' ? '.env.staging' : '.env';
  
  if (loadEnvFile(envFile)) {
    // Check critical environment variables
    checkEnvVar('NODE_ENV');
    checkEnvVar('VITE_APP_URL');
    checkEnvVar('VITE_API_BASE_URL');
    checkEnvVar('DATABASE_URL');
    
    // AI Services
    checkEnvVar('VITE_OPENAI_API_KEY');
    checkEnvVar('VITE_ANTHROPIC_API_KEY');
    checkEnvVar('VITE_GEMINI_API_KEY', false);
    
    // Crisis Services
    checkEnvVar('VITE_988_API_KEY', false);
    checkEnvVar('VITE_CRISIS_TEXT_API_KEY', false);
    
    // Security
    checkEnvVar('JWT_SECRET');
    checkEnvVar('SESSION_SECRET');
    checkEnvVar('ENCRYPTION_KEY');
  }
  
  // 4. Check dependencies
  log.header('Dependencies');
  checkDependencies();
  
  // 5. Check source files
  log.header('Source Files');
  checkFile('src/App.tsx');
  checkFile('src/main.tsx');
  checkFile('index.html');
  checkFile('public/manifest.json', false);
  
  // 6. Test build
  log.header('Build Test');
  if (process.argv.includes('--skip-build')) {
    log.info('Skipping build test (--skip-build flag)');
  } else {
    testBuild();
  }
  
  // 7. Summary
  log.header('Verification Summary');
  
  if (errors === 0 && warnings === 0) {
    console.log(colors.green + '\n✅ DEPLOYMENT READY!' + colors.reset);
    console.log('All checks passed. The application is ready for deployment.\n');
    process.exit(0);
  } else if (errors === 0) {
    console.log(colors.yellow + '\n⚠️  DEPLOYMENT POSSIBLE WITH WARNINGS' + colors.reset);
    console.log(`Found ${warnings} warning(s). Review them before deployment.\n`);
    process.exit(0);
  } else {
    console.log(colors.red + '\n❌ DEPLOYMENT NOT READY' + colors.reset);
    console.log(`Found ${errors} error(s) and ${warnings} warning(s).`);
    console.log('Fix all errors before attempting deployment.\n');
    process.exit(1);
  }
}

// Run verification
verifyDeployment().catch(error => {
  console.error('Verification script failed:', error);
  process.exit(1);
});