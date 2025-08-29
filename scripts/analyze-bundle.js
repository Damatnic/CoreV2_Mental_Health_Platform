#!/usr/bin/env node

/**
 * Enhanced Bundle Analysis Script with Core Web Vitals Integration
 * 
 * Analyzes bundle size, performance metrics, and provides optimization recommendations
 * specifically for mobile devices and slow connections.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Performance thresholds for mobile optimization
const PERFORMANCE_BUDGETS = {
  total: 500 * 1024, // 500KB total JS for mobile
  vendor: 200 * 1024, // 200KB for vendor libs
  main: 150 * 1024,   // 150KB for main app code
  css: 50 * 1024,     // 50KB for CSS
  images: 200 * 1024, // 200KB for images
  gzipRatio: 0.3      // Expected gzip compression ratio
};

// Crisis-critical resources that must load fast
const CRISIS_CRITICAL_RESOURCES = [
  'crisis',
  'emergency', 
  'safety',
  'offline'
];

class EnhancedBundleAnalyzer {
  constructor() {
    this.distPath = path.join(__dirname, '..', 'dist');
    this.reportPath = path.join(__dirname, '..', 'bundle-analysis-report.json');
    this.htmlReportPath = path.join(__dirname, '..', 'bundle-analysis-report.html');
    this.analysis = {
      timestamp: new Date().toISOString(),
      bundles: [],
      performance: {},
      recommendations: [],
      crisisOptimization: {},
      mobileOptimization: {},
      summary: {}
    };
  }

  /**
   * Run comprehensive bundle analysis
   */
  async analyze() {
    console.log('🔍 Starting enhanced bundle analysis...');
    
    try {
      // Ensure dist directory exists
      if (!fs.existsSync(this.distPath)) {
        console.error('❌ No build found. Run npm run build first.');
        process.exit(1);
      }

      // Analyze bundle files
      await this.analyzeBundleFiles();
      
      // Analyze performance implications  
      await this.analyzePerformanceImplications();
      
      // Analyze crisis-critical resources
      await this.analyzeCrisisCriticalResources();
      
      // Analyze mobile optimization
      await this.analyzeMobileOptimization();
      
      // Generate recommendations
      await this.generateRecommendations();
      
      // Create reports
      await this.generateReports();
      
      console.log('✅ Bundle analysis complete!');
      console.log(`📊 Report generated: ${this.htmlReportPath}`);
      
    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      process.exit(1);
    }
  }

  /**
   * Analyze all bundle files
   */
  async analyzeBundleFiles() {
    console.log('📦 Analyzing bundle files...');
    
    const jsFiles = this.getFilesByExtension('.js');
    const cssFiles = this.getFilesByExtension('.css');
    const assetFiles = this.getAssetFiles();
    
    // Analyze JavaScript bundles
    for (const file of jsFiles) {
      const analysis = await this.analyzeJSBundle(file);
      this.analysis.bundles.push(analysis);
    }
    
    // Analyze CSS bundles
    for (const file of cssFiles) {
      const analysis = await this.analyzeCSSBundle(file);
      this.analysis.bundles.push(analysis);
    }
    
    // Analyze asset files
    this.analysis.assets = assetFiles.map(file => this.analyzeAsset(file));
    
    // Calculate totals
    this.calculateTotals();
  }

  /**
   * Get files by extension
   */
  getFilesByExtension(ext) {
    const files = [];
    const walkDir = (dir) => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.endsWith(ext)) {
          files.push(fullPath);
        }
      }
    };
    walkDir(this.distPath);
    return files;
  }

  /**
   * Get asset files (images, fonts, etc.)
   */
  getAssetFiles() {
    const assetExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.woff', '.woff2', '.ttf'];
    const files = [];
    
    const walkDir = (dir) => {
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          walkDir(fullPath);
        } else if (assetExtensions.some(ext => entry.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    };
    walkDir(this.distPath);
    return files;
  }

  /**
   * Analyze JavaScript bundle
   */
  async analyzeJSBundle(filePath) {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.distPath, filePath);
    const gzipSize = this.estimateGzipSize(content);
    
    // Determine bundle type
    const bundleType = this.determineBundleType(relativePath, content);
    
    // Check for crisis-critical content
    const isCrisisCritical = CRISIS_CRITICAL_RESOURCES.some(keyword => 
      relativePath.includes(keyword) || content.includes(keyword)
    );
    
    return {
      type: 'javascript',
      name: relativePath,
      size: stat.size,
      gzipSize,
      bundleType,
      isCrisisCritical,
      dependencies: this.extractDependencies(content),
      loadPriority: this.calculateLoadPriority(bundleType, isCrisisCritical),
      mobileOptimized: stat.size < PERFORMANCE_BUDGETS.main,
      metrics: {
        parseTime: this.estimateParseTime(stat.size),
        executeTime: this.estimateExecuteTime(content),
        cacheability: this.assessCacheability(relativePath)
      }
    };
  }

  /**
   * Analyze CSS bundle
   */
  async analyzeCSSBundle(filePath) {
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(this.distPath, filePath);
    const gzipSize = this.estimateGzipSize(content);
    
    return {
      type: 'css',
      name: relativePath,
      size: stat.size,
      gzipSize,
      bundleType: 'styles',
      isCrisisCritical: CRISIS_CRITICAL_RESOURCES.some(keyword => 
        relativePath.includes(keyword)
      ),
      metrics: {
        renderBlocking: !relativePath.includes('async'),
        criticalCSS: this.detectCriticalCSS(content),
        unusedCSS: this.estimateUnusedCSS(content)
      }
    };
  }

  /**
   * Analyze asset file
   */
  analyzeAsset(filePath) {
    const stat = fs.statSync(filePath);
    const relativePath = path.relative(this.distPath, filePath);
    const ext = path.extname(filePath);
    
    return {
      type: 'asset',
      name: relativePath,
      size: stat.size,
      extension: ext,
      optimized: this.isAssetOptimized(ext, stat.size),
      loadStrategy: this.getAssetLoadStrategy(relativePath)
    };
  }

  /**
   * Determine bundle type from file name and content
   */
  determineBundleType(fileName, content) {
    if (fileName.includes('vendor')) return 'vendor';
    if (fileName.includes('react')) return 'react-vendor';
    if (fileName.includes('crisis')) return 'crisis-critical';
    if (fileName.includes('chunk')) return 'lazy-chunk';
    if (fileName.includes('worker')) return 'web-worker';
    if (content.includes('import(')) return 'dynamic-import';
    return 'main';
  }

  /**
   * Extract dependencies from bundle content
   */
  extractDependencies(content) {
    const dependencies = [];
    
    // Look for common library patterns
    const libPatterns = [
      /react/gi,
      /zustand/gi,
      /react-markdown/gi,
      /styled-components/gi,
      /framer-motion/gi
    ];
    
    for (const pattern of libPatterns) {
      if (pattern.test(content)) {
        dependencies.push(pattern.source.replace(/[^a-z]/gi, ''));
      }
    }
    
    return dependencies;
  }

  /**
   * Calculate load priority
   */
  calculateLoadPriority(bundleType, isCrisisCritical) {
    if (isCrisisCritical) return 'critical';
    if (bundleType === 'main' || bundleType === 'react-vendor') return 'high';
    if (bundleType === 'vendor') return 'medium';
    return 'low';
  }

  /**
   * Estimate gzip size
   */
  estimateGzipSize(content) {
    // Rough estimation: 30% of original size for typical JS/CSS
    return Math.round(content.length * PERFORMANCE_BUDGETS.gzipRatio);
  }

  /**
   * Estimate parse time for JavaScript
   */
  estimateParseTime(size) {
    // Rough estimation: 1ms per 1KB on average mobile device
    return Math.round(size / 1024);
  }

  /**
   * Estimate execution time
   */
  estimateExecuteTime(content) {
    // Count function calls and loops as rough complexity indicator
    const functionCalls = (content.match(/\(/g) || []).length;
    const loops = (content.match(/for\s*\(/g) || []).length;
    return Math.round((functionCalls + loops * 10) / 100);
  }

  /**
   * Assess cacheability
   */
  assessCacheability(fileName) {
    if (fileName.includes('hash') || fileName.includes('.')) return 'high';
    if (fileName.includes('chunk')) return 'medium';
    return 'low';
  }

  /**
   * Detect critical CSS
   */
  detectCriticalCSS(content) {
    const criticalSelectors = ['body', 'html', '.crisis', '.emergency', '.loading'];
    return criticalSelectors.some(selector => content.includes(selector));
  }

  /**
   * Estimate unused CSS
   */
  estimateUnusedCSS(content) {
    // Rough estimation based on common patterns
    const totalRules = (content.match(/\{[^}]*\}/g) || []).length;
    const estimatedUsed = Math.round(totalRules * 0.7); // Assume 70% usage
    return Math.max(0, totalRules - estimatedUsed);
  }

  /**
   * Check if asset is optimized
   */
  isAssetOptimized(extension, size) {
    const optimizedThresholds = {
      '.png': 100 * 1024,
      '.jpg': 150 * 1024,
      '.jpeg': 150 * 1024,
      '.svg': 10 * 1024,
      '.webp': 80 * 1024
    };
    
    return size < (optimizedThresholds[extension] || 50 * 1024);
  }

  /**
   * Get asset load strategy
   */
  getAssetLoadStrategy(fileName) {
    if (fileName.includes('icon') || fileName.includes('logo')) return 'preload';
    if (fileName.includes('hero') || fileName.includes('critical')) return 'eager';
    return 'lazy';
  }

  /**
   * Calculate totals
   */
  calculateTotals() {
    const totals = {
      javascript: 0,
      css: 0,
      assets: 0,
      gzipTotal: 0,
      crisisCritical: 0
    };
    
    for (const bundle of this.analysis.bundles) {
      if (bundle.type === 'javascript') {
        totals.javascript += bundle.size;
        totals.gzipTotal += bundle.gzipSize;
      } else if (bundle.type === 'css') {
        totals.css += bundle.size;
        totals.gzipTotal += bundle.gzipSize;
      }
      
      if (bundle.isCrisisCritical) {
        totals.crisisCritical += bundle.size;
      }
    }
    
    for (const asset of this.analysis.assets || []) {
      totals.assets += asset.size;
    }
    
    this.analysis.summary = {
      ...totals,
      total: totals.javascript + totals.css + totals.assets,
      budgetCompliance: {
        total: totals.javascript + totals.css < PERFORMANCE_BUDGETS.total,
        javascript: totals.javascript < PERFORMANCE_BUDGETS.vendor + PERFORMANCE_BUDGETS.main,
        css: totals.css < PERFORMANCE_BUDGETS.css
      }
    };
  }

  /**
   * Analyze performance implications
   */
  async analyzePerformanceImplications() {
    console.log('⚡ Analyzing performance implications...');
    
    const { javascript = 0, css = 0, gzipTotal = 0 } = this.analysis.summary || {};
    
    this.analysis.performance = {
      estimatedLoadTime: {
        '3g': Math.round(gzipTotal / (750 * 1024) * 1000), // 750 KB/s on 3G
        '4g': Math.round(gzipTotal / (2500 * 1024) * 1000), // 2.5 MB/s on 4G
        'wifi': Math.round(gzipTotal / (10000 * 1024) * 1000) // 10 MB/s on WiFi
      },
      parseTime: {
        mobile: Math.round(javascript / 1024 * 1.5), // Slower parsing on mobile
        desktop: Math.round(javascript / 1024)
      },
      memoryUsage: Math.round((javascript + css) * 2), // Rough estimation
      coreWebVitals: {
        estimatedLCP: this.estimateNavigationTiming(),
        estimatedFID: this.estimateInteractionTiming(),
        estimatedCLS: this.estimateLayoutShift()
      }
    };
  }

  /**
   * Estimate navigation timing for LCP
   */
  estimateNavigationTiming() {
    const { gzipTotal } = this.analysis.summary;
    const networkTime = gzipTotal / (750 * 1024) * 1000; // 3G estimation
    const parseTime = this.analysis.performance?.parseTime?.mobile || 100;
    return Math.round(networkTime + parseTime + 500); // + 500ms for rendering
  }

  /**
   * Estimate interaction timing for FID
   */
  estimateInteractionTiming() {
    const mainBundles = this.analysis.bundles.filter(b => 
      b.bundleType === 'main' || b.bundleType === 'react-vendor'
    );
    const totalExecuteTime = mainBundles.reduce((sum, b) => sum + (b.metrics?.executeTime || 0), 0);
    return Math.min(300, totalExecuteTime); // Cap at 300ms
  }

  /**
   * Estimate layout shift potential
   */
  estimateLayoutShift() {
    const asyncBundles = this.analysis.bundles.filter(b => b.bundleType === 'lazy-chunk');
    return asyncBundles.length * 0.02; // Rough estimation
  }

  /**
   * Analyze crisis-critical resources
   */
  async analyzeCrisisCriticalResources() {
    console.log('🚨 Analyzing crisis-critical resources...');
    
    const crisisBundles = this.analysis.bundles.filter(b => b.isCrisisCritical);
    const totalCrisisSize = crisisBundles.reduce((sum, b) => sum + b.size, 0);
    const totalCrisisGzip = crisisBundles.reduce((sum, b) => sum + b.gzipSize, 0);
    
    this.analysis.crisisOptimization = {
      totalSize: totalCrisisSize,
      totalGzipSize: totalCrisisGzip,
      loadTime3G: Math.round(totalCrisisGzip / (750 * 1024) * 1000),
      bundles: crisisBundles.length,
      optimizationScore: this.calculateCrisisOptimizationScore(crisisBundles),
      recommendations: this.generateCrisisRecommendations(crisisBundles)
    };
  }

  /**
   * Calculate crisis optimization score
   */
  calculateCrisisOptimizationScore(crisisBundles) {
    let score = 100;
    
    // Deduct points for large bundles
    const totalSize = crisisBundles.reduce((sum, b) => sum + b.size, 0);
    if (totalSize > 100 * 1024) score -= 20;
    if (totalSize > 200 * 1024) score -= 30;
    
    // Deduct points for many separate bundles
    if (crisisBundles.length > 3) score -= 15;
    
    // Deduct points for low priority bundles
    const lowPriorityBundles = crisisBundles.filter(b => b.loadPriority !== 'critical');
    score -= lowPriorityBundles.length * 10;
    
    return Math.max(0, score);
  }

  /**
   * Generate crisis-specific recommendations
   */
  generateCrisisRecommendations(crisisBundles) {
    const recommendations = [];
    
    const totalSize = crisisBundles.reduce((sum, b) => sum + b.size, 0);
    if (totalSize > 150 * 1024) {
      recommendations.push('Crisis bundles exceed 150KB - consider code splitting');
    }
    
    if (crisisBundles.length > 2) {
      recommendations.push('Too many crisis bundles - consider combining critical resources');
    }
    
    const nonCriticalPriority = crisisBundles.filter(b => b.loadPriority !== 'critical');
    if (nonCriticalPriority.length > 0) {
      recommendations.push('Some crisis resources not marked as critical priority');
    }
    
    return recommendations;
  }

  /**
   * Analyze mobile optimization
   */
  async analyzeMobileOptimization() {
    console.log('📱 Analyzing mobile optimization...');
    
    const { javascript, total } = this.analysis.summary;
    
    this.analysis.mobileOptimization = {
      budgetCompliance: {
        total: total < PERFORMANCE_BUDGETS.total,
        javascript: javascript < PERFORMANCE_BUDGETS.vendor + PERFORMANCE_BUDGETS.main
      },
      loadTimes: {
        '3g': this.analysis.performance.estimatedLoadTime['3g'],
        '4g': this.analysis.performance.estimatedLoadTime['4g']
      },
      optimizationScore: this.calculateMobileOptimizationScore(),
      recommendations: this.generateMobileRecommendations()
    };
  }

  /**
   * Calculate mobile optimization score
   */
  calculateMobileOptimizationScore() {
    let score = 100;
    const { javascript, total } = this.analysis.summary;
    
    // Budget compliance
    if (total > PERFORMANCE_BUDGETS.total) score -= 30;
    if (javascript > PERFORMANCE_BUDGETS.vendor + PERFORMANCE_BUDGETS.main) score -= 25;
    
    // Load time penalties
    const loadTime3G = this.analysis.performance.estimatedLoadTime['3g'];
    if (loadTime3G > 3000) score -= 20;
    if (loadTime3G > 5000) score -= 30;
    
    // Code splitting bonus
    const lazyBundles = this.analysis.bundles.filter(b => b.bundleType === 'lazy-chunk');
    score += Math.min(20, lazyBundles.length * 5);
    
    return Math.max(0, score);
  }

  /**
   * Generate mobile-specific recommendations
   */
  generateMobileRecommendations() {
    const recommendations = [];
    const { javascript, total } = this.analysis.summary;
    
    if (total > PERFORMANCE_BUDGETS.total) {
      recommendations.push(`Total bundle size (${Math.round(total/1024)}KB) exceeds mobile budget (${Math.round(PERFORMANCE_BUDGETS.total/1024)}KB)`);
    }
    
    if (javascript > PERFORMANCE_BUDGETS.vendor + PERFORMANCE_BUDGETS.main) {
      recommendations.push('JavaScript bundle too large for mobile - implement code splitting');
    }
    
    const loadTime3G = this.analysis.performance.estimatedLoadTime['3g'];
    if (loadTime3G > 3000) {
      recommendations.push(`3G load time (${loadTime3G}ms) too slow - target <3s for mobile`);
    }
    
    const mainBundles = this.analysis.bundles.filter(b => b.bundleType === 'main');
    if (mainBundles.some(b => b.size > 100 * 1024)) {
      recommendations.push('Main bundle too large - split into smaller chunks');
    }
    
    return recommendations;
  }

  /**
   * Generate comprehensive recommendations
   */
  async generateRecommendations() {
    console.log('💡 Generating optimization recommendations...');
    
    const recommendations = [];
    
    // Bundle size recommendations
    recommendations.push(...this.generateBundleSizeRecommendations());
    
    // Performance recommendations
    recommendations.push(...this.generatePerformanceRecommendations());
    
    // Crisis optimization recommendations
    recommendations.push(...this.analysis.crisisOptimization.recommendations);
    
    // Mobile optimization recommendations
    recommendations.push(...this.analysis.mobileOptimization.recommendations);
    
    // Asset optimization recommendations
    recommendations.push(...this.generateAssetRecommendations());
    
    this.analysis.recommendations = recommendations;
  }

  /**
   * Generate bundle size recommendations
   */
  generateBundleSizeRecommendations() {
    const recommendations = [];
    
    // Large vendor bundles
    const vendorBundles = this.analysis.bundles.filter(b => b.bundleType === 'vendor');
    const largeVendor = vendorBundles.find(b => b.size > 200 * 1024);
    if (largeVendor) {
      recommendations.push(`Vendor bundle ${largeVendor.name} is ${Math.round(largeVendor.size/1024)}KB - consider splitting`);
    }
    
    // Missing code splitting
    const mainBundles = this.analysis.bundles.filter(b => b.bundleType === 'main');
    if (mainBundles.length === 1 && mainBundles[0].size > 150 * 1024) {
      recommendations.push('Implement route-based code splitting to reduce main bundle size');
    }
    
    // Unused dependencies
    const reactBundles = this.analysis.bundles.filter(b => 
      b.dependencies && b.dependencies.includes('react') && b.size > 100 * 1024
    );
    if (reactBundles.length > 1) {
      recommendations.push('Multiple React bundles detected - ensure proper vendor chunk splitting');
    }
    
    return recommendations;
  }

  /**
   * Generate performance recommendations
   */
  generatePerformanceRecommendations() {
    const recommendations = [];
    
    const { estimatedLCP, estimatedFID, estimatedCLS } = this.analysis.performance.coreWebVitals;
    
    if (estimatedLCP > 2500) {
      recommendations.push(`Estimated LCP (${estimatedLCP}ms) exceeds threshold - optimize critical resource loading`);
    }
    
    if (estimatedFID > 100) {
      recommendations.push(`Estimated FID (${estimatedFID}ms) too high - reduce main thread blocking`);
    }
    
    if (estimatedCLS > 0.1) {
      recommendations.push(`Estimated CLS (${estimatedCLS.toFixed(3)}) too high - ensure stable layouts`);
    }
    
    return recommendations;
  }

  /**
   * Generate asset optimization recommendations
   */
  generateAssetRecommendations() {
    const recommendations = [];
    
    if (!this.analysis.assets) return recommendations;
    
    const unoptimizedAssets = this.analysis.assets.filter(a => !a.optimized);
    if (unoptimizedAssets.length > 0) {
      recommendations.push(`${unoptimizedAssets.length} assets are not optimized for mobile`);
    }
    
    const largeImages = this.analysis.assets.filter(a => 
      a.extension && ['.png', '.jpg', '.jpeg'].includes(a.extension) && a.size > 100 * 1024
    );
    if (largeImages.length > 0) {
      recommendations.push(`${largeImages.length} images exceed 100KB - consider WebP format and compression`);
    }
    
    return recommendations;
  }

  /**
   * Generate HTML report
   */
  async generateReports() {
    console.log('📄 Generating reports...');
    
    // Save JSON report
    fs.writeFileSync(this.reportPath, JSON.stringify(this.analysis, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport();
    fs.writeFileSync(this.htmlReportPath, htmlReport);
    
    // Log summary to console
    this.logSummary();
  }

  /**
   * Get score class for display
   */
  getScoreClass(score) {
    if (score > 80) return 'good';
    if (score > 60) return 'warning';
    return 'error';
  }

  /**
   * Generate HTML report
   */
  generateHTMLReport() {
    const { summary, performance, crisisOptimization, mobileOptimization } = this.analysis;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Astral Core - Bundle Analysis Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #667eea; border-bottom: 3px solid #667eea; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; padding: 15px; background: #f8f9fa; border-radius: 6px; border-left: 4px solid #667eea; }
        .metric.good { border-left-color: #28a745; }
        .metric.warning { border-left-color: #ffc107; }
        .metric.error { border-left-color: #dc3545; }
        .metric-label { font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; }
        .metric-value { font-size: 20px; font-weight: bold; color: #333; }
        .recommendations { background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .recommendation { margin: 8px 0; padding: 8px 0; border-bottom: 1px solid #eee; }
        .bundle-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .bundle-table th, .bundle-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .bundle-table th { background: #f8f9fa; }
        .crisis-critical { background: #ffebee; }
        .score { font-size: 24px; font-weight: bold; padding: 20px; text-align: center; border-radius: 50%; width: 60px; height: 60px; line-height: 60px; display: inline-block; margin: 10px; }
        .score.good { background: #d4edda; color: #155724; }
        .score.warning { background: #fff3cd; color: #856404; }
        .score.error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Astral Core Bundle Analysis Report</h1>
        <p><strong>Generated:</strong> ${this.analysis.timestamp}</p>
        
        <h2>📊 Bundle Summary</h2>
        <div class="metric ${summary.budgetCompliance.total ? 'good' : 'error'}">
            <div class="metric-label">Total Size</div>
            <div class="metric-value">${Math.round(summary.total / 1024)}KB</div>
        </div>
        <div class="metric ${summary.budgetCompliance.javascript ? 'good' : 'warning'}">
            <div class="metric-label">JavaScript</div>
            <div class="metric-value">${Math.round(summary.javascript / 1024)}KB</div>
        </div>
        <div class="metric">
            <div class="metric-label">Gzipped</div>
            <div class="metric-value">${Math.round(summary.gzipTotal / 1024)}KB</div>
        </div>
        
        <h2>⚡ Performance Metrics</h2>
        <div class="metric ${performance.estimatedLoadTime['3g'] < 3000 ? 'good' : 'warning'}">
            <div class="metric-label">3G Load Time</div>
            <div class="metric-value">${performance.estimatedLoadTime['3g']}ms</div>
        </div>
        <div class="metric ${performance.coreWebVitals.estimatedLCP < 2500 ? 'good' : 'error'}">
            <div class="metric-label">Est. LCP</div>
            <div class="metric-value">${performance.coreWebVitals.estimatedLCP}ms</div>
        </div>
        <div class="metric ${performance.coreWebVitals.estimatedFID < 100 ? 'good' : 'warning'}">
            <div class="metric-label">Est. FID</div>
            <div class="metric-value">${performance.coreWebVitals.estimatedFID}ms</div>
        </div>
        
        <h2>🚨 Crisis Optimization</h2>
        <div class="score ${this.getScoreClass(crisisOptimization.optimizationScore)}">
            ${crisisOptimization.optimizationScore}
        </div>
        <div class="metric ${crisisOptimization.loadTime3G < 2000 ? 'good' : 'warning'}">
            <div class="metric-label">Crisis Load Time (3G)</div>
            <div class="metric-value">${crisisOptimization.loadTime3G}ms</div>
        </div>
        <div class="metric">
            <div class="metric-label">Crisis Bundle Size</div>
            <div class="metric-value">${Math.round(crisisOptimization.totalSize / 1024)}KB</div>
        </div>
        
        <h2>📱 Mobile Optimization</h2>
        <div class="score ${this.getScoreClass(mobileOptimization.optimizationScore)}">
            ${mobileOptimization.optimizationScore}
        </div>
        
        <h2>📦 Bundle Details</h2>
        <table class="bundle-table">
            <thead>
                <tr>
                    <th>Bundle</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Gzipped</th>
                    <th>Priority</th>
                    <th>Crisis</th>
                </tr>
            </thead>
            <tbody>
                ${this.analysis.bundles.map(bundle => `
                    <tr class="${bundle.isCrisisCritical ? 'crisis-critical' : ''}">
                        <td>${bundle.name}</td>
                        <td>${bundle.bundleType}</td>
                        <td>${Math.round(bundle.size / 1024)}KB</td>
                        <td>${Math.round(bundle.gzipSize / 1024)}KB</td>
                        <td>${bundle.loadPriority}</td>
                        <td>${bundle.isCrisisCritical ? '🚨' : ''}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <h2>💡 Recommendations</h2>
        <div class="recommendations">
            ${this.analysis.recommendations.map(rec => `
                <div class="recommendation">• ${rec}</div>
            `).join('')}
        </div>
        
        <p><em>Report generated by Enhanced Bundle Analyzer for Astral Core Mental Health Platform</em></p>
    </div>
</body>
</html>`;
  }

  /**
   * Log summary to console
   */
  logSummary() {
    const { summary, performance, crisisOptimization, mobileOptimization } = this.analysis;
    
    console.log('\n📊 BUNDLE ANALYSIS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📦 Total Size: ${Math.round(summary.total / 1024)}KB (${summary.budgetCompliance.total ? '✅' : '❌'} Budget)`);
    console.log(`🚀 JavaScript: ${Math.round(summary.javascript / 1024)}KB`);
    console.log(`🎨 CSS: ${Math.round(summary.css / 1024)}KB`);
    console.log(`📱 Gzipped: ${Math.round(summary.gzipTotal / 1024)}KB`);
    console.log(`⚡ 3G Load Time: ${performance.estimatedLoadTime['3g']}ms`);
    console.log(`🚨 Crisis Optimization Score: ${crisisOptimization.optimizationScore}/100`);
    console.log(`📱 Mobile Optimization Score: ${mobileOptimization.optimizationScore}/100`);
    
    if (this.analysis.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      this.analysis.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    console.log(`\n📄 Full report: ${this.htmlReportPath}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }
}

// Run the analysis
if (require.main === module) {
  const analyzer = new EnhancedBundleAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = EnhancedBundleAnalyzer;
