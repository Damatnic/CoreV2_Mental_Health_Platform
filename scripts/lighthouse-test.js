/**
 * Lighthouse Performance Audit Script
 * Tests Core Web Vitals and overall performance
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

async function runLighthouseAudit() {
  console.log('🚀 Starting Lighthouse Performance Audit...\n');
  
  // Launch Chrome
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox']
  });
  
  const options = {
    logLevel: 'info',
    output: 'html',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port,
    formFactor: 'mobile',
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4
    }
  };
  
  // Test URLs
  const urls = [
    'http://localhost:3000',
    'http://localhost:3000/crisis',
    'http://localhost:3000/wellness'
  ];
  
  const results = [];
  
  for (const url of urls) {
    console.log(`📊 Auditing ${url}...`);
    
    try {
      const runnerResult = await lighthouse(url, options);
      const reportHtml = runnerResult.report;
      const { lhr } = runnerResult;
      
      // Extract key metrics
      const metrics = {
        url,
        performance: Math.round(lhr.categories.performance.score * 100),
        accessibility: Math.round(lhr.categories.accessibility.score * 100),
        bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
        seo: Math.round(lhr.categories.seo.score * 100),
        pwa: Math.round(lhr.categories.pwa.score * 100),
        
        // Core Web Vitals
        fcp: lhr.audits['first-contentful-paint'].numericValue,
        lcp: lhr.audits['largest-contentful-paint'].numericValue,
        cls: lhr.audits['cumulative-layout-shift'].numericValue,
        tti: lhr.audits['interactive'].numericValue,
        tbt: lhr.audits['total-blocking-time'].numericValue,
        speedIndex: lhr.audits['speed-index'].numericValue
      };
      
      results.push(metrics);
      
      // Save HTML report
      const pageName = url === 'http://localhost:3000' ? 'home' : path.basename(url);
      const reportPath = path.join(__dirname, `../lighthouse-report-${pageName}.html`);
      fs.writeFileSync(reportPath, reportHtml);
      
      console.log(`✅ ${url} audit complete`);
      console.log(`   Performance: ${metrics.performance}/100`);
      console.log(`   Accessibility: ${metrics.accessibility}/100`);
      console.log(`   PWA: ${metrics.pwa}/100\n`);
      
    } catch (error) {
      console.error(`❌ Error auditing ${url}:`, error.message);
      results.push({
        url,
        error: error.message
      });
    }
  }
  
  // Generate summary report
  console.log('\n📈 LIGHTHOUSE AUDIT SUMMARY');
  console.log('═══════════════════════════════════════\n');
  
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.url}: ${result.error}\n`);
      return;
    }
    
    console.log(`📍 ${result.url}`);
    console.log(`├─ Performance: ${getScoreEmoji(result.performance)} ${result.performance}/100`);
    console.log(`├─ Accessibility: ${getScoreEmoji(result.accessibility)} ${result.accessibility}/100`);
    console.log(`├─ Best Practices: ${getScoreEmoji(result.bestPractices)} ${result.bestPractices}/100`);
    console.log(`├─ SEO: ${getScoreEmoji(result.seo)} ${result.seo}/100`);
    console.log(`└─ PWA: ${getScoreEmoji(result.pwa)} ${result.pwa}/100`);
    
    console.log('\n   Core Web Vitals:');
    console.log(`   ├─ FCP: ${formatTime(result.fcp)}`);
    console.log(`   ├─ LCP: ${formatTime(result.lcp)}`);
    console.log(`   ├─ CLS: ${result.cls.toFixed(3)}`);
    console.log(`   ├─ TTI: ${formatTime(result.tti)}`);
    console.log(`   └─ TBT: ${formatTime(result.tbt)}\n`);
  });
  
  // Overall assessment
  const avgPerformance = results
    .filter(r => !r.error)
    .reduce((sum, r) => sum + r.performance, 0) / results.filter(r => !r.error).length;
  
  console.log('\n🎯 OVERALL ASSESSMENT');
  console.log('═══════════════════════════════════════');
  
  if (avgPerformance >= 90) {
    console.log('✅ Excellent! Performance is optimal for production.');
  } else if (avgPerformance >= 70) {
    console.log('⚠️  Good, but there\'s room for improvement.');
  } else {
    console.log('❌ Performance needs significant improvement before production.');
  }
  
  console.log(`\nAverage Performance Score: ${Math.round(avgPerformance)}/100`);
  
  // Recommendations
  if (avgPerformance < 90) {
    console.log('\n💡 RECOMMENDATIONS:');
    results.forEach(result => {
      if (result.error) return;
      
      if (result.lcp > 2500) {
        console.log('• Optimize Largest Contentful Paint (LCP)');
      }
      if (result.fcp > 1800) {
        console.log('• Improve First Contentful Paint (FCP)');
      }
      if (result.cls > 0.1) {
        console.log('• Reduce Cumulative Layout Shift (CLS)');
      }
      if (result.tbt > 300) {
        console.log('• Minimize Total Blocking Time (TBT)');
      }
    });
  }
  
  await chrome.kill();
  
  console.log('\n✅ Lighthouse audit complete! Reports saved to project root.');
}

function getScoreEmoji(score) {
  if (score >= 90) return '🟢';
  if (score >= 50) return '🟡';
  return '🔴';
}

function formatTime(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// Check if server is running
const http = require('http');

function checkServerRunning() {
  return new Promise((resolve) => {
    http.get('http://localhost:3000', (res) => {
      resolve(true);
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function main() {
  const serverRunning = await checkServerRunning();
  
  if (!serverRunning) {
    console.log('⚠️  Development server is not running!');
    console.log('Please start the server with: npm run dev');
    process.exit(1);
  }
  
  try {
    await runLighthouseAudit();
  } catch (error) {
    console.error('❌ Lighthouse audit failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { runLighthouseAudit };