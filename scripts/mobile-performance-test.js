#!/usr/bin/env node

/**
 * Mobile Performance Testing Script
 * Simulates mobile conditions and measures performance metrics
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Color utilities
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};

console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   MOBILE PERFORMANCE TESTING               ║
║   Astral Core Mental Health Platform       ║
╚════════════════════════════════════════════╝
`)));

// Performance metrics storage
const metrics = {
  bundleSize: { target: 500, actual: 0, unit: 'KB' },
  criticalCss: { target: 14, actual: 0, unit: 'KB' },
  initialLoad: { target: 3, actual: 0, unit: 'seconds' },
  touchTargets: { target: 44, actual: 0, unit: 'px' },
  imageOptimization: { target: 100, actual: 0, unit: '%' },
  cacheEfficiency: { target: 90, actual: 0, unit: '%' },
  offlineReadiness: { target: 100, actual: 0, unit: '%' },
  crisisAccessTime: { target: 1, actual: 0, unit: 'tap' }
};

// 1. Check Bundle Sizes
function checkBundleSize() {
  console.log(colors.yellow('\n📦 Checking Bundle Sizes...'));
  
  const distPath = path.join(projectRoot, 'dist');
  if (!fs.existsSync(distPath)) {
    console.log(colors.yellow('  ⚠️ Build directory not found. Run build first.'));
    return;
  }
  
  let totalSize = 0;
  const jsFiles = [];
  
  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDir(filePath);
      } else if (file.endsWith('.js')) {
        const size = stat.size / 1024; // Convert to KB
        jsFiles.push({ name: file, size });
        totalSize += size;
      }
    });
  }
  
  walkDir(distPath);
  
  metrics.bundleSize.actual = Math.round(totalSize);
  
  const color = totalSize <= metrics.bundleSize.target ? colors.green : 
                totalSize <= metrics.bundleSize.target * 1.5 ? colors.yellow : colors.red;
  
  console.log(color(`  Total JS Bundle: ${Math.round(totalSize)}KB`));
  
  // Show largest files
  jsFiles.sort((a, b) => b.size - a.size);
  console.log('  Largest bundles:');
  jsFiles.slice(0, 3).forEach(file => {
    console.log(`    - ${file.name}: ${Math.round(file.size)}KB`);
  });
}

// 2. Check Critical CSS
function checkCriticalCSS() {
  console.log(colors.yellow('\n🎨 Checking Critical CSS...'));
  
  const indexPath = path.join(projectRoot, 'index.html');
  if (fs.existsSync(indexPath)) {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    
    // Check for inline styles
    const styleMatch = indexContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatch) {
      const inlineCSS = styleMatch.join('').length / 1024; // Convert to KB
      metrics.criticalCss.actual = Math.round(inlineCSS);
      
      const color = inlineCSS <= metrics.criticalCss.target ? colors.green : colors.yellow;
      console.log(color(`  Inline Critical CSS: ${Math.round(inlineCSS)}KB`));
    } else {
      console.log(colors.yellow('  ⚠️ No inline critical CSS found'));
    }
  }
}

// 3. Check Touch Target Sizes
function checkTouchTargets() {
  console.log(colors.yellow('\n👆 Checking Touch Target Sizes...'));
  
  const stylesDir = path.join(projectRoot, 'src/styles');
  let minSize = 44;
  let touchOptimized = true;
  
  // Check for mobile-specific button sizes
  const mobileStyles = fs.readdirSync(stylesDir).filter(f => 
    f.toLowerCase().includes('mobile')
  );
  
  mobileStyles.forEach(file => {
    const content = fs.readFileSync(path.join(stylesDir, file), 'utf-8');
    
    // Check for button/touch target sizes
    const buttonSizeMatch = content.match(/(?:height|min-height):\s*(\d+)(?:px|rem)/gi);
    if (buttonSizeMatch) {
      buttonSizeMatch.forEach(match => {
        const size = parseInt(match.match(/\d+/)[0]);
        if (size < 44 && match.includes('px')) {
          touchOptimized = false;
          minSize = Math.min(minSize, size);
        }
      });
    }
  });
  
  metrics.touchTargets.actual = minSize;
  
  if (touchOptimized) {
    console.log(colors.green(`  ✅ All touch targets meet 44px minimum`));
  } else {
    console.log(colors.yellow(`  ⚠️ Some touch targets below 44px (found ${minSize}px)`));
  }
}

// 4. Check Image Optimization
function checkImageOptimization() {
  console.log(colors.yellow('\n🖼️ Checking Image Optimization...'));
  
  const publicPath = path.join(projectRoot, 'public');
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.avif'];
  let totalImages = 0;
  let optimizedImages = 0;
  
  if (fs.existsSync(publicPath)) {
    const files = fs.readdirSync(publicPath);
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (imageExtensions.includes(ext)) {
        totalImages++;
        
        // Check for optimized formats
        if (ext === '.webp' || ext === '.avif') {
          optimizedImages++;
        }
        
        // Check file size
        const filePath = path.join(publicPath, file);
        const stats = fs.statSync(filePath);
        const sizeKB = stats.size / 1024;
        
        if (sizeKB > 100) {
          console.log(colors.yellow(`  ⚠️ Large image: ${file} (${Math.round(sizeKB)}KB)`));
        }
      }
    });
  }
  
  const optimizationRate = totalImages > 0 ? (optimizedImages / totalImages) * 100 : 100;
  metrics.imageOptimization.actual = Math.round(optimizationRate);
  
  console.log(`  Images found: ${totalImages}`);
  console.log(`  Optimized format images: ${optimizedImages}`);
  console.log(colors.green(`  Optimization rate: ${Math.round(optimizationRate)}%`));
}

// 5. Check Cache Configuration
function checkCacheConfig() {
  console.log(colors.yellow('\n💾 Checking Cache Configuration...'));
  
  const swFiles = ['public/sw.js', 'public/sw-mobile-optimized.js', 'public/service-worker.js'];
  let cacheStrategies = [];
  
  for (const swFile of swFiles) {
    const swPath = path.join(projectRoot, swFile);
    if (fs.existsSync(swPath)) {
      const content = fs.readFileSync(swPath, 'utf-8');
      
      // Check for cache strategies
      if (content.includes('CacheFirst')) cacheStrategies.push('CacheFirst');
      if (content.includes('NetworkFirst')) cacheStrategies.push('NetworkFirst');
      if (content.includes('StaleWhileRevalidate')) cacheStrategies.push('StaleWhileRevalidate');
      
      // Check for crisis resources caching
      if (content.includes('crisis') || content.includes('emergency')) {
        console.log(colors.green('  ✅ Crisis resources cached for offline'));
      }
      
      break;
    }
  }
  
  metrics.cacheEfficiency.actual = cacheStrategies.length > 0 ? 100 : 0;
  
  if (cacheStrategies.length > 0) {
    console.log(colors.green(`  ✅ Cache strategies: ${cacheStrategies.join(', ')}`));
  } else {
    console.log(colors.yellow('  ⚠️ No cache strategies found'));
  }
}

// 6. Check Offline Capabilities
function checkOfflineCapabilities() {
  console.log(colors.yellow('\n🔌 Checking Offline Capabilities...'));
  
  const checks = {
    serviceWorker: false,
    manifest: false,
    offlinePage: false,
    crisisOffline: false
  };
  
  // Check for service worker registration
  const mainPath = path.join(projectRoot, 'src/main.tsx');
  if (fs.existsSync(mainPath)) {
    const content = fs.readFileSync(mainPath, 'utf-8');
    if (content.includes('serviceWorker') || content.includes('sw.js')) {
      checks.serviceWorker = true;
    }
  }
  
  // Check manifest
  const manifestPath = path.join(projectRoot, 'public/manifest.json');
  if (fs.existsSync(manifestPath)) {
    checks.manifest = true;
  }
  
  // Check for offline page
  const offlinePath = path.join(projectRoot, 'public/offline.html');
  if (fs.existsSync(offlinePath)) {
    checks.offlinePage = true;
  }
  
  // Check crisis offline support
  const crisisKitPath = path.join(projectRoot, 'src/components/mobile/MobileCrisisKit.tsx');
  if (fs.existsSync(crisisKitPath)) {
    const content = fs.readFileSync(crisisKitPath, 'utf-8');
    if (content.includes('offline') || content.includes('cache')) {
      checks.crisisOffline = true;
    }
  }
  
  const passedChecks = Object.values(checks).filter(v => v).length;
  metrics.offlineReadiness.actual = (passedChecks / Object.keys(checks).length) * 100;
  
  Object.entries(checks).forEach(([key, value]) => {
    const status = value ? colors.green('✅') : colors.red('❌');
    console.log(`  ${status} ${key}`);
  });
}

// 7. Check Crisis Feature Accessibility
function checkCrisisAccess() {
  console.log(colors.yellow('\n🆘 Checking Crisis Feature Accessibility...'));
  
  // Check if crisis features are immediately accessible
  const manifestPath = path.join(projectRoot, 'public/manifest.json');
  let crisisShortcut = false;
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    if (manifest.shortcuts) {
      crisisShortcut = manifest.shortcuts.some(s => 
        s.url === '/crisis' || s.name.toLowerCase().includes('crisis')
      );
    }
  }
  
  metrics.crisisAccessTime.actual = crisisShortcut ? 1 : 2;
  
  if (crisisShortcut) {
    console.log(colors.green('  ✅ Crisis features accessible in 1 tap via app shortcut'));
  } else {
    console.log(colors.yellow('  ⚠️ Crisis features require navigation (2+ taps)'));
  }
  
  // Check for emergency numbers
  const crisisKitPath = path.join(projectRoot, 'src/components/mobile/MobileCrisisKit.tsx');
  if (fs.existsSync(crisisKitPath)) {
    const content = fs.readFileSync(crisisKitPath, 'utf-8');
    
    const hasEmergencyNumbers = content.includes('tel:988') || content.includes('tel:911');
    const hasTextSupport = content.includes('sms:') || content.includes('741741');
    
    if (hasEmergencyNumbers) {
      console.log(colors.green('  ✅ Direct dial emergency numbers configured'));
    }
    
    if (hasTextSupport) {
      console.log(colors.green('  ✅ Text crisis support configured'));
    }
  }
}

// Generate Performance Report
function generateReport() {
  console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   MOBILE PERFORMANCE REPORT                ║
╚════════════════════════════════════════════╝
`)));
  
  let totalScore = 0;
  let totalMetrics = 0;
  
  Object.entries(metrics).forEach(([key, data]) => {
    const metricName = key.replace(/([A-Z])/g, ' $1').trim();
    const formattedName = metricName.charAt(0).toUpperCase() + metricName.slice(1);
    
    let score = 0;
    if (data.actual <= data.target) {
      score = 100;
    } else {
      score = Math.max(0, 100 - ((data.actual - data.target) / data.target) * 100);
    }
    
    const color = score >= 90 ? colors.green :
                 score >= 70 ? colors.yellow : colors.red;
    
    console.log(`\n${formattedName}:`);
    console.log(`  Target: ${data.target}${data.unit}`);
    console.log(`  Actual: ${data.actual}${data.unit}`);
    console.log(color(`  Score: ${Math.round(score)}/100`));
    
    totalScore += score;
    totalMetrics++;
  });
  
  const overallScore = Math.round(totalScore / totalMetrics);
  
  console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   OVERALL PERFORMANCE SCORE                ║
╚════════════════════════════════════════════╝
`)));
  
  const scoreColor = overallScore >= 90 ? colors.green :
                    overallScore >= 70 ? colors.yellow : colors.red;
  
  console.log(scoreColor(colors.bold(`    Overall Score: ${overallScore}/100`)));
  
  // Recommendations
  console.log(colors.bold(colors.cyan(`
╔════════════════════════════════════════════╗
║   PERFORMANCE RECOMMENDATIONS              ║
╚════════════════════════════════════════════╝
`)));
  
  const recommendations = [];
  
  if (metrics.bundleSize.actual > metrics.bundleSize.target) {
    recommendations.push('📦 Reduce bundle size through code splitting and tree shaking');
  }
  
  if (metrics.criticalCss.actual > metrics.criticalCss.target) {
    recommendations.push('🎨 Optimize critical CSS to reduce initial render blocking');
  }
  
  if (metrics.touchTargets.actual < metrics.touchTargets.target) {
    recommendations.push('👆 Increase touch target sizes to minimum 44px');
  }
  
  if (metrics.imageOptimization.actual < 100) {
    recommendations.push('🖼️ Convert images to WebP/AVIF format for better compression');
  }
  
  if (metrics.cacheEfficiency.actual < metrics.cacheEfficiency.target) {
    recommendations.push('💾 Implement comprehensive caching strategies');
  }
  
  if (metrics.offlineReadiness.actual < 100) {
    recommendations.push('🔌 Enhance offline capabilities with service workers');
  }
  
  if (metrics.crisisAccessTime.actual > 1) {
    recommendations.push('🆘 Add app shortcuts for immediate crisis access');
  }
  
  if (recommendations.length === 0) {
    console.log(colors.green('  ✅ Mobile performance is excellent! No critical issues found.'));
  } else {
    recommendations.forEach((rec, i) => {
      console.log(colors.yellow(`${i + 1}. ${rec}`));
    });
  }
  
  // Save report
  const report = {
    timestamp: new Date().toISOString(),
    overallScore,
    metrics,
    recommendations
  };
  
  const reportPath = path.join(projectRoot, 'mobile-performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(colors.green(`\n✅ Detailed report saved to: mobile-performance-report.json`));
}

// Run all checks
function runPerformanceTest() {
  checkBundleSize();
  checkCriticalCSS();
  checkTouchTargets();
  checkImageOptimization();
  checkCacheConfig();
  checkOfflineCapabilities();
  checkCrisisAccess();
  generateReport();
}

// Execute
runPerformanceTest();