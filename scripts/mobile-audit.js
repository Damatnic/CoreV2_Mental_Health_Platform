#!/usr/bin/env node

/**
 * Mobile Architecture Audit Script
 * Comprehensive analysis of mobile readiness for Astral Core
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple color functions without external dependencies
const colors = {
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  white: (text) => `\x1b[37m${text}\x1b[0m`,
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};
const projectRoot = path.resolve(__dirname, '..');

// Audit categories
const auditCategories = {
  viewport: { score: 0, issues: [], passed: [] },
  touch: { score: 0, issues: [], passed: [] },
  performance: { score: 0, issues: [], passed: [] },
  pwa: { score: 0, issues: [], passed: [] },
  offline: { score: 0, issues: [], passed: [] },
  crisis: { score: 0, issues: [], passed: [] },
  accessibility: { score: 0, issues: [], passed: [] },
  responsive: { score: 0, issues: [], passed: [] }
};

console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   MOBILE ARCHITECTURE AUDIT                ║
║   Astral Core Mental Health Platform       ║
╚════════════════════════════════════════════╝
`)));

// 1. Check Viewport Configuration
function auditViewport() {
  console.log(colors.yellow('\n📱 Auditing Viewport Configuration...'));
  
  const indexPath = path.join(projectRoot, 'index.html');
  const indexContent = fs.readFileSync(indexPath, 'utf-8');
  
  // Check viewport meta tag
  if (indexContent.includes('viewport-fit=cover')) {
    auditCategories.viewport.passed.push('✅ Viewport-fit for notch support');
    auditCategories.viewport.score += 20;
  } else {
    auditCategories.viewport.issues.push('❌ Missing viewport-fit=cover for notch support');
  }
  
  if (!indexContent.includes('maximum-scale=1')) {
    auditCategories.viewport.passed.push('✅ Zoom enabled for accessibility');
    auditCategories.viewport.score += 20;
  } else {
    auditCategories.viewport.issues.push('⚠️ Zoom disabled - accessibility concern');
  }
  
  if (indexContent.includes('width=device-width')) {
    auditCategories.viewport.passed.push('✅ Responsive width configured');
    auditCategories.viewport.score += 20;
  }
  
  if (indexContent.includes('initial-scale=1')) {
    auditCategories.viewport.passed.push('✅ Initial scale set correctly');
    auditCategories.viewport.score += 20;
  }
  
  if (indexContent.includes('user-scalable=yes') || !indexContent.includes('user-scalable=no')) {
    auditCategories.viewport.passed.push('✅ User scaling allowed');
    auditCategories.viewport.score += 20;
  }
}

// 2. Check Touch Interactions
function auditTouchInteractions() {
  console.log(colors.yellow('\n👆 Auditing Touch Interactions...'));
  
  const componentsDir = path.join(projectRoot, 'src/components/mobile');
  
  if (fs.existsSync(componentsDir)) {
    const mobileComponents = fs.readdirSync(componentsDir);
    
    if (mobileComponents.includes('MobileResponsiveComponents.tsx')) {
      auditCategories.touch.passed.push('✅ Mobile responsive components found');
      auditCategories.touch.score += 25;
    }
    
    if (mobileComponents.includes('MobileCrisisKit.tsx')) {
      auditCategories.touch.passed.push('✅ Mobile crisis kit implemented');
      auditCategories.touch.score += 25;
    }
    
    // Check for touch event handlers
    const mobileCompPath = path.join(componentsDir, 'MobileResponsiveComponents.tsx');
    if (fs.existsSync(mobileCompPath)) {
      const content = fs.readFileSync(mobileCompPath, 'utf-8');
      
      if (content.includes('onTouchStart') && content.includes('onTouchEnd')) {
        auditCategories.touch.passed.push('✅ Touch event handlers implemented');
        auditCategories.touch.score += 25;
      }
      
      if (content.includes('swipe') || content.includes('Swiper')) {
        auditCategories.touch.passed.push('✅ Swipe gestures supported');
        auditCategories.touch.score += 25;
      }
    }
  } else {
    auditCategories.touch.issues.push('❌ Mobile components directory not found');
  }
}

// 3. Check PWA Configuration
function auditPWA() {
  console.log(colors.yellow('\n📦 Auditing PWA Configuration...'));
  
  const manifestPath = path.join(projectRoot, 'public/manifest.json');
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    if (manifest.name && manifest.short_name) {
      auditCategories.pwa.passed.push('✅ App names configured');
      auditCategories.pwa.score += 10;
    }
    
    if (manifest.start_url) {
      auditCategories.pwa.passed.push('✅ Start URL defined');
      auditCategories.pwa.score += 10;
    }
    
    if (manifest.display === 'standalone') {
      auditCategories.pwa.passed.push('✅ Standalone display mode');
      auditCategories.pwa.score += 15;
    }
    
    if (manifest.icons && manifest.icons.length >= 2) {
      auditCategories.pwa.passed.push('✅ Multiple icon sizes');
      auditCategories.pwa.score += 15;
    }
    
    if (manifest.shortcuts && manifest.shortcuts.length > 0) {
      auditCategories.pwa.passed.push('✅ App shortcuts configured');
      auditCategories.pwa.score += 15;
      
      // Check for crisis shortcut
      const hasCrisisShortcut = manifest.shortcuts.some(s => 
        s.url === '/crisis' || s.name.toLowerCase().includes('crisis')
      );
      if (hasCrisisShortcut) {
        auditCategories.pwa.passed.push('✅ Crisis shortcut available');
        auditCategories.pwa.score += 10;
      }
    }
    
    if (manifest.screenshots && manifest.screenshots.length > 0) {
      auditCategories.pwa.passed.push('✅ Screenshots for install prompt');
      auditCategories.pwa.score += 10;
    }
    
    if (manifest.categories && manifest.categories.includes('health')) {
      auditCategories.pwa.passed.push('✅ Health category specified');
      auditCategories.pwa.score += 5;
    }
    
    if (manifest.share_target) {
      auditCategories.pwa.passed.push('✅ Share target configured');
      auditCategories.pwa.score += 10;
    }
  } else {
    auditCategories.pwa.issues.push('❌ Manifest.json not found');
  }
}

// 4. Check Offline Capabilities
function auditOffline() {
  console.log(colors.yellow('\n🔌 Auditing Offline Capabilities...'));
  
  const swFiles = [
    'public/sw.js',
    'public/sw-mobile-optimized.js',
    'public/sw-enhanced-pwa.js',
    'public/service-worker.js'
  ];
  
  let swFound = false;
  for (const swFile of swFiles) {
    const swPath = path.join(projectRoot, swFile);
    if (fs.existsSync(swPath)) {
      swFound = true;
      auditCategories.offline.passed.push(`✅ Service worker found: ${path.basename(swFile)}`);
      auditCategories.offline.score += 25;
      
      const swContent = fs.readFileSync(swPath, 'utf-8');
      
      if (swContent.includes('cache') || swContent.includes('Cache')) {
        auditCategories.offline.passed.push('✅ Caching strategy implemented');
        auditCategories.offline.score += 25;
      }
      
      if (swContent.includes('offline') || swContent.includes('networkFirst')) {
        auditCategories.offline.passed.push('✅ Offline fallback configured');
        auditCategories.offline.score += 25;
      }
      
      if (swContent.includes('crisis') || swContent.includes('emergency')) {
        auditCategories.offline.passed.push('✅ Crisis resources cached offline');
        auditCategories.offline.score += 25;
      }
      
      break;
    }
  }
  
  if (!swFound) {
    auditCategories.offline.issues.push('⚠️ No service worker found');
  }
}

// 5. Check Crisis Features
function auditCrisisFeatures() {
  console.log(colors.yellow('\n🆘 Auditing Crisis Features...'));
  
  const crisisKitPath = path.join(projectRoot, 'src/components/mobile/MobileCrisisKit.tsx');
  
  if (fs.existsSync(crisisKitPath)) {
    const content = fs.readFileSync(crisisKitPath, 'utf-8');
    
    if (content.includes('tel:988') || content.includes('tel:911')) {
      auditCategories.crisis.passed.push('✅ Emergency call links configured');
      auditCategories.crisis.score += 25;
    }
    
    if (content.includes('sms:') || content.includes('Text')) {
      auditCategories.crisis.passed.push('✅ Crisis text support available');
      auditCategories.crisis.score += 25;
    }
    
    if (content.includes('breathing') || content.includes('Breathing')) {
      auditCategories.crisis.passed.push('✅ Breathing exercises included');
      auditCategories.crisis.score += 25;
    }
    
    if (content.includes('location') || content.includes('Find Help')) {
      auditCategories.crisis.passed.push('✅ Location-based help finder');
      auditCategories.crisis.score += 25;
    }
  } else {
    auditCategories.crisis.issues.push('❌ Mobile crisis kit not found');
  }
}

// 6. Check Mobile Performance
function auditPerformance() {
  console.log(colors.yellow('\n⚡ Auditing Mobile Performance...'));
  
  const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
  
  if (fs.existsSync(viteConfigPath)) {
    const viteContent = fs.readFileSync(viteConfigPath, 'utf-8');
    
    if (viteContent.includes('rollupOptions') && viteContent.includes('manualChunks')) {
      auditCategories.performance.passed.push('✅ Code splitting configured');
      auditCategories.performance.score += 25;
    }
    
    if (viteContent.includes('terser') || viteContent.includes('minify')) {
      auditCategories.performance.passed.push('✅ Minification enabled');
      auditCategories.performance.score += 25;
    }
  }
  
  // Check for lazy loading
  const srcDir = path.join(projectRoot, 'src');
  const hasLazyLoading = checkForPattern(srcDir, /React\.lazy|lazy\(/);
  if (hasLazyLoading) {
    auditCategories.performance.passed.push('✅ Lazy loading implemented');
    auditCategories.performance.score += 25;
  }
  
  // Check for mobile optimization services
  const mobileServicePath = path.join(projectRoot, 'src/services/mobileFeatureServices.ts');
  if (fs.existsSync(mobileServicePath)) {
    auditCategories.performance.passed.push('✅ Mobile feature services found');
    auditCategories.performance.score += 25;
  }
}

// 7. Check Accessibility
function auditAccessibility() {
  console.log(colors.yellow('\n♿ Auditing Mobile Accessibility...'));
  
  const accessibilityPath = path.join(projectRoot, 'src/components/mobile/MobileAccessibilitySystem.tsx');
  
  if (fs.existsSync(accessibilityPath)) {
    auditCategories.accessibility.passed.push('✅ Mobile accessibility system found');
    auditCategories.accessibility.score += 50;
  }
  
  // Check for ARIA labels in mobile components
  const mobileDir = path.join(projectRoot, 'src/components/mobile');
  if (fs.existsSync(mobileDir)) {
    const hasAriaLabels = checkForPattern(mobileDir, /aria-label|role=/);
    if (hasAriaLabels) {
      auditCategories.accessibility.passed.push('✅ ARIA labels implemented');
      auditCategories.accessibility.score += 50;
    }
  }
}

// 8. Check Responsive Design
function auditResponsive() {
  console.log(colors.yellow('\n📐 Auditing Responsive Design...'));
  
  const stylesDir = path.join(projectRoot, 'src/styles');
  const mobileStyles = fs.readdirSync(stylesDir).filter(f => 
    f.toLowerCase().includes('mobile') || f.toLowerCase().includes('responsive')
  );
  
  if (mobileStyles.length > 5) {
    auditCategories.responsive.passed.push(`✅ ${mobileStyles.length} mobile style files found`);
    auditCategories.responsive.score += 50;
  }
  
  // Check for media queries
  const hasMediaQueries = checkForPattern(stylesDir, /@media.*\(max-width|@media.*\(min-width/);
  if (hasMediaQueries) {
    auditCategories.responsive.passed.push('✅ Media queries implemented');
    auditCategories.responsive.score += 50;
  }
}

// Helper function to check for patterns in files
function checkForPattern(dir, pattern) {
  if (!fs.existsSync(dir)) return false;
  
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (checkForPattern(filePath, pattern)) return true;
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.css')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (pattern.test(content)) return true;
    }
  }
  return false;
}

// Generate report
function generateReport() {
  console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   MOBILE AUDIT RESULTS                     ║
╚════════════════════════════════════════════╝
`)));
  
  let totalScore = 0;
  let totalPossible = 0;
  
  for (const [category, data] of Object.entries(auditCategories)) {
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    console.log(colors.bold(colors.white(`\n${categoryName}:`)));
    console.log(colors.gray('─'.repeat(40)));
    
    // Show passed items
    data.passed.forEach(item => console.log(colors.green(item)));
    
    // Show issues
    data.issues.forEach(issue => console.log(colors.red(issue)));
    
    // Calculate score
    const scoreColor = data.score >= 75 ? colors.green : 
                      data.score >= 50 ? colors.yellow : colors.red;
    console.log(scoreColor(`Score: ${data.score}/100`));
    
    totalScore += data.score;
    totalPossible += 100;
  }
  
  // Overall score
  const overallScore = Math.round((totalScore / totalPossible) * 100);
  console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   OVERALL MOBILE READINESS SCORE           ║
╚════════════════════════════════════════════╝
`)));
  
  const scoreColor = overallScore >= 80 ? (t) => colors.bold(colors.green(t)) :
                    overallScore >= 60 ? (t) => colors.bold(colors.yellow(t)) : (t) => colors.bold(colors.red(t));
  
  console.log(scoreColor(`    Overall Score: ${overallScore}/100`));
  
  // Recommendations
  console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   PRIORITY RECOMMENDATIONS                 ║
╚════════════════════════════════════════════╝
`)));
  
  const recommendations = [];
  
  if (auditCategories.viewport.score < 80) {
    recommendations.push('🔧 Review viewport configuration for better mobile support');
  }
  
  if (auditCategories.touch.score < 75) {
    recommendations.push('👆 Enhance touch interactions and gesture support');
  }
  
  if (auditCategories.performance.score < 75) {
    recommendations.push('⚡ Optimize bundle size and loading performance');
  }
  
  if (auditCategories.offline.score < 50) {
    recommendations.push('🔌 Implement robust offline support with service workers');
  }
  
  if (auditCategories.crisis.score < 100) {
    recommendations.push('🆘 Ensure all crisis features are mobile-optimized');
  }
  
  if (auditCategories.accessibility.score < 100) {
    recommendations.push('♿ Improve mobile accessibility compliance');
  }
  
  recommendations.forEach((rec, i) => {
    console.log(colors.yellow(`${i + 1}. ${rec}`));
  });
  
  // Export detailed report
  const reportData = {
    timestamp: new Date().toISOString(),
    overallScore,
    categories: auditCategories,
    recommendations
  };
  
  const reportPath = path.join(projectRoot, 'mobile-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  console.log(colors.green(`\n✅ Detailed report saved to: mobile-audit-report.json`));
}

// Run all audits
function runAudit() {
  auditViewport();
  auditTouchInteractions();
  auditPWA();
  auditOffline();
  auditCrisisFeatures();
  auditPerformance();
  auditAccessibility();
  auditResponsive();
  generateReport();
}

// Execute audit
runAudit();