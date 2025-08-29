#!/usr/bin/env node

/**
 * Advanced Bundle Analysis Script
 * Analyzes bundle size improvements and chunk distribution
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

// Bundle analysis configuration
const DIST_DIR = path.join(process.cwd(), 'dist');
const ANALYSIS_OUTPUT = path.join(process.cwd(), 'bundle-analysis.json');

// Chunk categories for analysis
const CHUNK_CATEGORIES = {
  critical: ['crisis-intervention', 'react-core', 'react-dom'],
  vendor: ['vendor-misc', 'ui-framework', 'utilities', 'forms'],
  views: ['views-critical', 'views-core', 'views-wellness', 'views-admin'],
  components: ['components-critical', 'components-dashboard', 'components-ui'],
  services: ['services-critical', 'services-auth', 'services-communication'],
  state: ['state-critical', 'state-auth', 'state-misc']
};

// Performance thresholds (in KB)
const PERFORMANCE_THRESHOLDS = {
  critical: 150,      // Crisis chunks should be very small
  vendor: 300,        // Vendor chunks moderate size
  views: 250,         // View chunks can be larger
  components: 200,    // Component chunks moderate
  services: 100,      // Service chunks should be small
  state: 50          // State chunks should be very small
};

class BundleAnalyzer {
  constructor() {
    this.results = {
      totalSize: 0,
      chunkCount: 0,
      categories: {},
      violations: [],
      recommendations: [],
      performance: {
        score: 0,
        criticalChunksSize: 0,
        totalVendorSize: 0,
        lazyLoadableSize: 0
      }
    };
  }

  // Get file size in KB
  getFileSize(filePath) {
    try {
      const stats = fs.statSync(filePath);
      return Math.round(stats.size / 1024 * 100) / 100; // Round to 2 decimal places
    } catch (error) {
      log(`Warning: Could not read file ${filePath}: ${error.message}`, 'yellow');
      return 0;
    }
  }

  // Analyze JavaScript files in dist directory
  analyzeDistFiles() {
    if (!fs.existsSync(DIST_DIR)) {
      log('❌ Dist directory not found. Please run build first.', 'red');
      return false;
    }

    const jsFiles = this.findJSFiles(DIST_DIR);
    log(`\n📦 Found ${jsFiles.length} JavaScript files`, 'cyan');

    jsFiles.forEach(file => {
      const fileName = path.basename(file);
      const size = this.getFileSize(file);
      
      this.results.totalSize += size;
      this.results.chunkCount++;
      
      // Categorize chunk
      const category = this.categorizeChunk(fileName);
      if (!this.results.categories[category]) {
        this.results.categories[category] = {
          files: [],
          totalSize: 0,
          count: 0
        };
      }
      
      this.results.categories[category].files.push({
        name: fileName,
        size: size,
        path: file
      });
      this.results.categories[category].totalSize += size;
      this.results.categories[category].count++;
      
      // Check performance thresholds
      this.checkPerformanceThreshold(fileName, size, category);
    });

    return true;
  }

  // Find all JavaScript files recursively
  findJSFiles(dir) {
    let jsFiles = [];
    
    const items = fs.readdirSync(dir);
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        jsFiles = jsFiles.concat(this.findJSFiles(fullPath));
      } else if (item.endsWith('.js') && !item.includes('.map')) {
        jsFiles.push(fullPath);
      }
    });
    
    return jsFiles;
  }

  // Categorize chunk based on filename
  categorizeChunk(fileName) {
    for (const [category, patterns] of Object.entries(CHUNK_CATEGORIES)) {
      if (patterns.some(pattern => fileName.includes(pattern))) {
        return category;
      }
    }
    
    // Special cases
    if (fileName.includes('index') && !fileName.includes('-')) {
      return 'entry';
    }
    
    if (fileName.includes('vendor') || fileName.includes('node_modules')) {
      return 'vendor';
    }
    
    return 'misc';
  }

  // Check if chunk size violates performance thresholds
  checkPerformanceThreshold(fileName, size, category) {
    const threshold = PERFORMANCE_THRESHOLDS[category];
    if (threshold && size > threshold) {
      this.results.violations.push({
        file: fileName,
        category: category,
        size: size,
        threshold: threshold,
        excess: size - threshold
      });
    }
  }

  // Calculate performance metrics
  calculatePerformance() {
    // Critical chunks size (should be minimal)
    const criticalSize = (this.results.categories.critical?.totalSize || 0);
    this.results.performance.criticalChunksSize = criticalSize;

    // Total vendor size
    const vendorSize = (this.results.categories.vendor?.totalSize || 0);
    this.results.performance.totalVendorSize = vendorSize;

    // Lazy loadable size (everything except critical and entry)
    const entrySize = (this.results.categories.entry?.totalSize || 0);
    const lazyLoadableSize = this.results.totalSize - criticalSize - entrySize;
    this.results.performance.lazyLoadableSize = lazyLoadableSize;

    // Performance score (0-100)
    let score = 100;
    
    // Deduct points for large critical chunks
    if (criticalSize > 200) score -= 30;
    else if (criticalSize > 150) score -= 15;
    
    // Deduct points for violations
    score -= Math.min(this.results.violations.length * 5, 30);
    
    // Bonus for good lazy loading ratio
    const lazyRatio = lazyLoadableSize / this.results.totalSize;
    if (lazyRatio > 0.7) score += 10;
    
    this.results.performance.score = Math.max(0, Math.round(score));
  }

  // Generate optimization recommendations
  generateRecommendations() {
    const recommendations = [];

    // Check critical chunks
    if (this.results.performance.criticalChunksSize > 200) {
      recommendations.push({
        type: 'critical',
        message: 'Critical chunks are too large. Consider reducing React bundle size or moving non-essential code to lazy chunks.',
        impact: 'high'
      });
    }

    // Check for large vendor chunks
    const largeVendorFiles = this.results.categories.vendor?.files?.filter(f => f.size > 300) || [];
    if (largeVendorFiles.length > 0) {
      recommendations.push({
        type: 'vendor',
        message: `Found ${largeVendorFiles.length} large vendor chunks. Consider further splitting or tree-shaking.`,
        impact: 'medium'
      });
    }

    // Check for violations
    if (this.results.violations.length > 0) {
      recommendations.push({
        type: 'violations',
        message: `${this.results.violations.length} chunks exceed size thresholds. Review and optimize these files.`,
        impact: 'high'
      });
    }

    // Check lazy loading opportunities
    const lazyRatio = this.results.performance.lazyLoadableSize / this.results.totalSize;
    if (lazyRatio < 0.6) {
      recommendations.push({
        type: 'lazy-loading',
        message: 'Low lazy loading ratio. Consider moving more code to lazy-loaded chunks.',
        impact: 'medium'
      });
    }

    this.results.recommendations = recommendations;
  }

  // Print detailed analysis report
  printReport() {
    log('\n📊 BUNDLE ANALYSIS REPORT', 'bright');
    log('='.repeat(50), 'cyan');

    // Overall metrics
    log(`\n📈 Overall Metrics:`, 'bright');
    log(`   Total bundle size: ${this.results.totalSize.toFixed(2)}KB`, 'green');
    log(`   Number of chunks: ${this.results.chunkCount}`, 'green');
    // Performance score color
    let scoreColor = 'green';
    if (this.results.performance.score <= 60) {
      scoreColor = 'red';
    } else if (this.results.performance.score <= 80) {
      scoreColor = 'yellow';
    }
    
    log(`   Performance score: ${this.results.performance.score}/100`, scoreColor);

    // Critical metrics
    log(`\n🚨 Critical Metrics:`, 'bright');
    log(`   Critical chunks size: ${this.results.performance.criticalChunksSize.toFixed(2)}KB`, 
        this.results.performance.criticalChunksSize < 150 ? 'green' : 'red');
    log(`   Lazy loadable size: ${this.results.performance.lazyLoadableSize.toFixed(2)}KB`, 'cyan');
    log(`   Lazy loading ratio: ${(this.results.performance.lazyLoadableSize / this.results.totalSize * 100).toFixed(1)}%`, 'cyan');

    // Category breakdown
    log(`\n📂 Category Breakdown:`, 'bright');
    Object.entries(this.results.categories).forEach(([category, data]) => {
      log(`   ${category}: ${data.count} files, ${data.totalSize.toFixed(2)}KB total`, 'yellow');
      
      // Show largest files in each category
      const sortedFiles = data.files.sort((a, b) => b.size - a.size).slice(0, 3);
      sortedFiles.forEach(file => {
        log(`     • ${file.name}: ${file.size.toFixed(2)}KB`, 'reset');
      });
    });

    // Performance violations
    if (this.results.violations.length > 0) {
      log(`\n⚠️  Performance Violations:`, 'red');
      this.results.violations.forEach(violation => {
        log(`   • ${violation.file}: ${violation.size.toFixed(2)}KB (threshold: ${violation.threshold}KB, excess: +${violation.excess.toFixed(2)}KB)`, 'red');
      });
    } else {
      log(`\n✅ No performance violations found!`, 'green');
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      log(`\n💡 Optimization Recommendations:`, 'bright');
      this.results.recommendations.forEach(rec => {
        let color = 'green';
        if (rec.impact === 'high') {
          color = 'red';
        } else if (rec.impact === 'medium') {
          color = 'yellow';
        }
        log(`   • [${rec.impact.toUpperCase()}] ${rec.message}`, color);
      });
    }

    // Bundle splitting effectiveness
    log(`\n🎯 Bundle Splitting Effectiveness:`, 'bright');
    const criticalRatio = this.results.performance.criticalChunksSize / this.results.totalSize;
    const lazyRatio = this.results.performance.lazyLoadableSize / this.results.totalSize;
    
    log(`   Critical code ratio: ${(criticalRatio * 100).toFixed(1)}% ${criticalRatio < 0.3 ? '✅' : '⚠️'}`, 
        criticalRatio < 0.3 ? 'green' : 'yellow');
    log(`   Lazy loadable ratio: ${(lazyRatio * 100).toFixed(1)}% ${lazyRatio > 0.6 ? '✅' : '⚠️'}`, 
        lazyRatio > 0.6 ? 'green' : 'yellow');
  }

  // Save results to JSON file
  saveResults() {
    try {
      fs.writeFileSync(ANALYSIS_OUTPUT, JSON.stringify(this.results, null, 2));
      log(`\n💾 Analysis results saved to: ${ANALYSIS_OUTPUT}`, 'green');
    } catch (error) {
      log(`\n❌ Failed to save analysis results: ${error.message}`, 'red');
    }
  }

  // Run complete analysis
  run() {
    log('\n🔍 Starting Bundle Analysis...', 'bright');
    
    if (!this.analyzeDistFiles()) {
      return false;
    }
    
    this.calculatePerformance();
    this.generateRecommendations();
    this.printReport();
    this.saveResults();
    
    return true;
  }
}

// Run analysis if script is executed directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  const success = analyzer.run();
  process.exit(success ? 0 : 1);
}

module.exports = BundleAnalyzer;
