#!/usr/bin/env node

/**
 * Comprehensive Deployment Validation Script
 * Validates all aspects of the build for Netlify deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('\n========================================');
console.log('   DEPLOYMENT VALIDATION');
console.log('========================================\n');

const issues = [];
const warnings = [];
const successes = [];

function check(condition, successMsg, errorMsg, isWarning = false) {
  if (condition) {
    successes.push(successMsg);
    console.log(`✓ ${successMsg}`);
  } else {
    if (isWarning) {
      warnings.push(errorMsg);
      console.log(`⚠ ${errorMsg}`);
    } else {
      issues.push(errorMsg);
      console.log(`✗ ${errorMsg}`);
    }
  }
}

function fileExists(filePath) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

function validateJSON(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
}

// Start validation
console.log('[1/10] Checking project structure...');
check(dirExists(projectRoot), 'Project root exists', 'Project root not found');
check(fileExists(path.join(projectRoot, 'package.json')), 'package.json exists', 'package.json not found');
check(fileExists(path.join(projectRoot, 'netlify.toml')), 'netlify.toml exists', 'netlify.toml not found');

console.log('\n[2/10] Checking build output...');
const distPath = path.join(projectRoot, 'dist');
check(dirExists(distPath), 'dist/ directory exists', 'dist/ directory not found - run "npm run build"');
check(fileExists(path.join(distPath, 'index.html')), 'index.html exists', 'index.html not found');
check(fileExists(path.join(distPath, '_redirects')), '_redirects file exists', '_redirects not found');
check(fileExists(path.join(distPath, '_headers')), '_headers file exists', '_headers not found', true);

console.log('\n[3/10] Checking assets...');
const assetsPath = path.join(distPath, 'assets');
check(dirExists(assetsPath), 'assets/ directory exists', 'assets/ directory not found');
check(dirExists(path.join(assetsPath, 'js')), 'assets/js/ directory exists', 'JavaScript directory not found');
check(dirExists(path.join(assetsPath, 'css')), 'assets/css/ directory exists', 'CSS directory not found');

// Count files
if (dirExists(path.join(assetsPath, 'js'))) {
  const jsFiles = fs.readdirSync(path.join(assetsPath, 'js'));
  check(jsFiles.length > 0, `JavaScript files found (${jsFiles.length})`, 'No JavaScript files found');
}

if (dirExists(path.join(assetsPath, 'css'))) {
  const cssFiles = fs.readdirSync(path.join(assetsPath, 'css'));
  check(cssFiles.length > 0, `CSS files found (${cssFiles.length})`, 'No CSS files found');
}

console.log('\n[4/10] Checking PWA configuration...');
const manifestPath = path.join(distPath, 'manifest.json');
check(fileExists(manifestPath), 'manifest.json exists', 'manifest.json not found');
if (fileExists(manifestPath)) {
  check(validateJSON(manifestPath), 'manifest.json is valid JSON', 'manifest.json has invalid JSON');
  
  // Check manifest content
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    check(manifest.name, 'Manifest has name', 'Manifest missing name');
    check(manifest.short_name, 'Manifest has short_name', 'Manifest missing short_name');
    check(manifest.start_url, 'Manifest has start_url', 'Manifest missing start_url');
    check(manifest.display, 'Manifest has display mode', 'Manifest missing display mode');
    check(manifest.icons && manifest.icons.length > 0, 'Manifest has icons', 'Manifest missing icons');
  } catch {
    // Already reported as invalid JSON
  }
}

console.log('\n[5/10] Checking icons...');
check(fileExists(path.join(distPath, 'icon-192.png')), 'icon-192.png exists', 'icon-192.png not found');
check(fileExists(path.join(distPath, 'icon-512.png')), 'icon-512.png exists', 'icon-512.png not found');
check(fileExists(path.join(distPath, 'icon.svg')), 'icon.svg exists', 'icon.svg not found', true);

console.log('\n[6/10] Checking service worker...');
const swFiles = ['service-worker.js', 'sw.js', 'sw-enhanced-pwa.js'];
const hasServiceWorker = swFiles.some(f => fileExists(path.join(distPath, f)));
check(hasServiceWorker, 'Service worker file found', 'No service worker found', true);

console.log('\n[7/10] Checking critical resources...');
check(fileExists(path.join(distPath, 'crisis-resources.json')), 'crisis-resources.json exists', 'crisis-resources.json not found', true);
check(fileExists(path.join(distPath, 'emergency-contacts.json')), 'emergency-contacts.json exists', 'emergency-contacts.json not found', true);
check(fileExists(path.join(distPath, 'offline.html')), 'offline.html exists', 'offline.html not found', true);

console.log('\n[8/10] Checking Netlify configuration...');
const netlifyTomlPath = path.join(projectRoot, 'netlify.toml');
if (fileExists(netlifyTomlPath)) {
  const netlifyConfig = fs.readFileSync(netlifyTomlPath, 'utf8');
  check(netlifyConfig.includes('publish = "dist"'), 'Netlify publish directory set to dist', 'Netlify publish directory not configured');
  check(netlifyConfig.includes('command = '), 'Netlify build command configured', 'Netlify build command not configured');
  check(netlifyConfig.includes('NODE_VERSION'), 'Node version specified', 'Node version not specified', true);
}

console.log('\n[9/10] Checking package.json scripts...');
const packageJsonPath = path.join(projectRoot, 'package.json');
if (fileExists(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  check(packageJson.scripts.build, 'Build script exists', 'Build script not found');
  check(packageJson.scripts.dev, 'Dev script exists', 'Dev script not found', true);
  check(packageJson.scripts.test, 'Test script exists', 'Test script not found', true);
}

console.log('\n[10/10] Checking HTML structure...');
if (fileExists(path.join(distPath, 'index.html'))) {
  const html = fs.readFileSync(path.join(distPath, 'index.html'), 'utf8');
  check(html.includes('<div id="root"'), 'Root element found in HTML', 'Root element not found in HTML');
  check(html.includes('viewport'), 'Viewport meta tag found', 'Viewport meta tag not found');
  check(html.includes('manifest.json') || html.includes('manifest'), 'Manifest linked in HTML', 'Manifest not linked in HTML', true);
  check(html.includes('.js') || html.includes('script'), 'JavaScript referenced in HTML', 'No JavaScript references in HTML');
  check(html.includes('.css') || html.includes('style'), 'CSS referenced in HTML', 'No CSS references in HTML');
}

// Summary
console.log('\n========================================');
console.log('   VALIDATION SUMMARY');
console.log('========================================\n');

console.log(`✓ Successes: ${successes.length}`);
console.log(`⚠ Warnings: ${warnings.length}`);
console.log(`✗ Issues: ${issues.length}`);

if (issues.length > 0) {
  console.log('\n❌ CRITICAL ISSUES FOUND:');
  issues.forEach((issue, i) => {
    console.log(`   ${i + 1}. ${issue}`);
  });
}

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:');
  warnings.forEach((warning, i) => {
    console.log(`   ${i + 1}. ${warning}`);
  });
}

// Deployment readiness
console.log('\n========================================');
if (issues.length === 0) {
  console.log('   ✅ READY FOR DEPLOYMENT!');
  console.log('========================================\n');
  console.log('Your application is ready for Netlify deployment.');
  console.log('\nNext steps:');
  console.log('1. Commit your changes: git add . && git commit -m "Ready for deployment"');
  console.log('2. Push to your repository: git push origin main');
  console.log('3. Connect your repository to Netlify');
  console.log('4. Deploy will start automatically');
} else {
  console.log('   ❌ NOT READY FOR DEPLOYMENT');
  console.log('========================================\n');
  console.log('Please fix the critical issues before deploying.');
  process.exit(1);
}

// Additional recommendations
if (warnings.length > 0 || issues.length === 0) {
  console.log('\n📝 RECOMMENDATIONS:');
  console.log('- Test locally with: node scripts/test-server.js');
  console.log('- Run tests with: npm test');
  console.log('- Check build size: Check the dist/ folder size');
  console.log('- Monitor build logs on Netlify dashboard');
}

console.log('\n');