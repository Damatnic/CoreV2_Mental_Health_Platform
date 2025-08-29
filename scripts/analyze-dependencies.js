#!/usr/bin/env node

/**
 * Dependency Analysis and Optimization Script
 * Analyzes package dependencies for optimization opportunities
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

// Dependency categories for analysis
const DEPENDENCY_CATEGORIES = {
  critical: ['react', 'react-dom'],
  ui: ['lucide-react', 'react-icons', 'styled-components', '@emotion'],
  routing: ['react-router', 'react-router-dom'],
  state: ['zustand', '@reduxjs/toolkit', 'redux'],
  forms: ['react-hook-form', 'yup', '@hookform'],
  http: ['axios', 'fetch', 'node-fetch'],
  utils: ['lodash', 'date-fns', 'uuid', 'classnames'],
  build: ['vite', 'rollup', 'webpack', '@vitejs'],
  testing: ['jest', 'vitest', '@testing-library'],
  ai: ['@tensorflow', 'natural', 'sentiment'],
  database: ['pg', 'redis', 'memjs'],
  analytics: ['@sentry', 'google-analytics'],
  pwa: ['workbox', 'vite-plugin-pwa']
};

// Heavy dependencies that should be optimized
const HEAVY_DEPENDENCIES = [
  '@tensorflow/tfjs',
  '@tensorflow/tfjs-core', 
  '@tensorflow/tfjs-backend-webgl',
  'natural',
  'pg',
  'redis',
  '@redis/client',
  'workbox-precaching',
  'workbox-routing',
  'workbox-strategies'
];

// Tree-shaking friendly alternatives
const TREE_SHAKING_ALTERNATIVES = {
  'lodash': 'lodash-es',
  'date-fns': 'date-fns/esm',
  'uuid': 'uuid (already tree-shakable)',
  '@tensorflow/tfjs': '@tensorflow/tfjs-core + specific backends',
  'react-icons': 'lucide-react (smaller, tree-shakable)'
};

class DependencyAnalyzer {
  constructor() {
    this.packagePath = path.join(process.cwd(), 'package.json');
    this.lockfilePath = path.join(process.cwd(), 'package-lock.json');
    this.results = {
      totalDependencies: 0,
      categories: {},
      heavyDependencies: [],
      treeShakingOpportunities: [],
      duplicates: [],
      unused: [],
      recommendations: [],
      bundleImpact: {
        total: 0,
        byCategory: {}
      }
    };
  }

  // Load and parse package.json
  loadPackageInfo() {
    try {
      this.packageData = JSON.parse(fs.readFileSync(this.packagePath, 'utf8'));
      
      // Combine dependencies and devDependencies
      this.dependencies = {
        ...this.packageData.dependencies || {},
        ...this.packageData.devDependencies || {}
      };
      
      this.results.totalDependencies = Object.keys(this.dependencies).length;
      return true;
    } catch (error) {
      log(`❌ Error loading package.json: ${error.message}`, 'red');
      return false;
    }
  }

  // Categorize dependencies
  categorizeDependencies() {
    Object.keys(this.dependencies).forEach(dep => {
      let categorized = false;
      
      for (const [category, patterns] of Object.entries(DEPENDENCY_CATEGORIES)) {
        if (patterns.some(pattern => dep.includes(pattern))) {
          if (!this.results.categories[category]) {
            this.results.categories[category] = [];
          }
          this.results.categories[category].push({
            name: dep,
            version: this.dependencies[dep]
          });
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        if (!this.results.categories.misc) {
          this.results.categories.misc = [];
        }
        this.results.categories.misc.push({
          name: dep,
          version: this.dependencies[dep]
        });
      }
    });
  }

  // Identify heavy dependencies
  identifyHeavyDependencies() {
    HEAVY_DEPENDENCIES.forEach(heavyDep => {
      const foundDep = Object.keys(this.dependencies).find(dep => 
        dep.includes(heavyDep) || heavyDep.includes(dep)
      );
      
      if (foundDep) {
        this.results.heavyDependencies.push({
          name: foundDep,
          version: this.dependencies[foundDep],
          category: this.getDependencyCategory(foundDep),
          optimization: this.getOptimizationSuggestion(foundDep)
        });
      }
    });
  }

  // Get dependency category
  getDependencyCategory(dep) {
    for (const [category, patterns] of Object.entries(DEPENDENCY_CATEGORIES)) {
      if (patterns.some(pattern => dep.includes(pattern))) {
        return category;
      }
    }
    return 'misc';
  }

  // Get optimization suggestion for dependency
  getOptimizationSuggestion(dep) {
    // AI/ML dependencies
    if (dep.includes('tensorflow')) {
      return 'Consider lazy loading TensorFlow modules and using only required backends';
    }
    
    if (dep.includes('natural')) {
      return 'Tree-shake Natural NLP - only import needed modules';
    }
    
    // Database dependencies
    if (dep.includes('pg') || dep.includes('redis')) {
      return 'Move database clients to server-side only, use API for browser';
    }
    
    // Large UI libraries
    if (dep.includes('react-icons')) {
      return 'Replace with lucide-react for better tree-shaking';
    }
    
    // Build tools
    if (dep.includes('workbox')) {
      return 'Use Vite PWA plugin for optimized service worker generation';
    }
    
    return 'Review usage and consider alternatives or tree-shaking';
  }

  // Check for tree-shaking opportunities
  checkTreeShakingOpportunities() {
    Object.keys(TREE_SHAKING_ALTERNATIVES).forEach(dep => {
      if (this.dependencies[dep]) {
        this.results.treeShakingOpportunities.push({
          current: dep,
          alternative: TREE_SHAKING_ALTERNATIVES[dep],
          benefit: 'Better tree-shaking and smaller bundle size'
        });
      }
    });
  }

  // Analyze bundle impact (requires build analysis)
  analyzeBundleImpact() {
    try {
      // Try to get bundle analysis if available
      const bundleAnalysisPath = path.join(process.cwd(), 'bundle-analysis.json');
      if (fs.existsSync(bundleAnalysisPath)) {
        const bundleData = JSON.parse(fs.readFileSync(bundleAnalysisPath, 'utf8'));
        this.results.bundleImpact.total = bundleData.totalSize || 0;
      }
    } catch (error) {
      log(`Warning: Bundle analysis data not available: ${error.message}`, 'yellow');
    }
  }

  // Generate optimization recommendations
  generateRecommendations() {
    const recommendations = [];

    // Heavy dependencies recommendations
    if (this.results.heavyDependencies.length > 0) {
      recommendations.push({
        type: 'heavy-deps',
        priority: 'high',
        title: 'Optimize Heavy Dependencies',
        description: `Found ${this.results.heavyDependencies.length} heavy dependencies that could significantly impact bundle size.`,
        actions: [
          'Implement lazy loading for AI/ML libraries',
          'Move server-only dependencies to devDependencies',
          'Consider lighter alternatives for UI libraries'
        ]
      });
    }

    // Tree-shaking opportunities
    if (this.results.treeShakingOpportunities.length > 0) {
      recommendations.push({
        type: 'tree-shaking',
        priority: 'medium',
        title: 'Improve Tree-Shaking',
        description: `Found ${this.results.treeShakingOpportunities.length} dependencies that could benefit from better tree-shaking.`,
        actions: this.results.treeShakingOpportunities.map(opp => 
          `Replace ${opp.current} with ${opp.alternative}`
        )
      });
    }

    // AI/ML specific recommendations
    const aiDeps = this.results.categories.ai || [];
    if (aiDeps.length > 0) {
      recommendations.push({
        type: 'ai-optimization',
        priority: 'high',
        title: 'Optimize AI/ML Dependencies',
        description: 'AI/ML libraries are among the heaviest dependencies.',
        actions: [
          'Lazy load TensorFlow.js only when needed',
          'Use specific TensorFlow backends instead of full bundle',
          'Consider server-side AI processing for heavy operations',
          'Implement progressive enhancement for AI features'
        ]
      });
    }

    // Database dependencies (should not be in browser)
    const dbDeps = this.results.categories.database || [];
    if (dbDeps.length > 0) {
      recommendations.push({
        type: 'database-deps',
        priority: 'critical',
        title: 'Remove Database Dependencies from Browser Bundle',
        description: 'Database clients should not be included in browser bundles.',
        actions: [
          'Move database dependencies to server-side only',
          'Use Netlify Functions or API endpoints for database operations',
          'Add database packages to build externals configuration'
        ]
      });
    }

    this.results.recommendations = recommendations;
  }

  // Print detailed analysis report
  printReport() {
    log('\n📊 DEPENDENCY ANALYSIS REPORT', 'bright');
    log('='.repeat(50), 'cyan');

    // Overall metrics
    log(`\n📈 Overall Metrics:`, 'bright');
    log(`   Total dependencies: ${this.results.totalDependencies}`, 'green');
    log(`   Heavy dependencies: ${this.results.heavyDependencies.length}`, 
        this.results.heavyDependencies.length > 5 ? 'red' : 'yellow');
    log(`   Tree-shaking opportunities: ${this.results.treeShakingOpportunities.length}`, 'cyan');

    // Category breakdown
    log(`\n📂 Dependency Categories:`, 'bright');
    Object.entries(this.results.categories).forEach(([category, deps]) => {
      log(`   ${category}: ${deps.length} packages`, 'yellow');
      
      // Show specific packages for important categories
      if (['ai', 'database', 'critical'].includes(category)) {
        deps.forEach(dep => {
          log(`     • ${dep.name}@${dep.version}`, 'reset');
        });
      }
    });

    // Heavy dependencies analysis
    if (this.results.heavyDependencies.length > 0) {
      log(`\n⚠️  Heavy Dependencies (Impact Analysis):`, 'red');
      this.results.heavyDependencies.forEach(dep => {
        log(`   • ${dep.name}@${dep.version}`, 'red');
        log(`     Category: ${dep.category}`, 'reset');
        log(`     Optimization: ${dep.optimization}`, 'yellow');
      });
    }

    // Tree-shaking opportunities
    if (this.results.treeShakingOpportunities.length > 0) {
      log(`\n🌳 Tree-Shaking Opportunities:`, 'green');
      this.results.treeShakingOpportunities.forEach(opp => {
        log(`   • Replace ${opp.current} → ${opp.alternative}`, 'green');
        log(`     Benefit: ${opp.benefit}`, 'reset');
      });
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      log(`\n💡 Optimization Recommendations:`, 'bright');
      this.results.recommendations.forEach(rec => {
        let priorityColor = 'green';
        if (rec.priority === 'critical') {
          priorityColor = 'red';
        } else if (rec.priority === 'high') {
          priorityColor = 'yellow';
        }
        
        log(`\n   🎯 [${rec.priority.toUpperCase()}] ${rec.title}`, priorityColor);
        log(`      ${rec.description}`, 'reset');
        log(`      Actions:`, 'cyan');
        rec.actions.forEach(action => {
          log(`        • ${action}`, 'reset');
        });
      });
    }

    // Specific mental health platform recommendations
    log(`\n🏥 Mental Health Platform Specific Recommendations:`, 'bright');
    log(`   • Keep crisis intervention libraries lightweight`, 'green');
    log(`   • Lazy load AI/sentiment analysis features`, 'yellow');
    log(`   • Prioritize offline capability over bundle size for critical features`, 'cyan');
    log(`   • Consider progressive enhancement for advanced features`, 'reset');
  }

  // Save results to JSON file
  saveResults() {
    try {
      const outputPath = path.join(process.cwd(), 'dependency-analysis.json');
      fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2));
      log(`\n💾 Analysis results saved to: ${outputPath}`, 'green');
    } catch (error) {
      log(`\n❌ Failed to save analysis results: ${error.message}`, 'red');
    }
  }

  // Run complete analysis
  run() {
    log('\n🔍 Starting Dependency Analysis...', 'bright');
    
    if (!this.loadPackageInfo()) {
      return false;
    }
    
    this.categorizeDependencies();
    this.identifyHeavyDependencies();
    this.checkTreeShakingOpportunities();
    this.analyzeBundleImpact();
    this.generateRecommendations();
    
    this.printReport();
    this.saveResults();
    
    return true;
  }
}

// Generate optimization shell script
function generateOptimizationScript(analyzer) {
  const scriptContent = `#!/bin/bash
# Dependency Optimization Script
# Generated automatically from dependency analysis

echo "🔧 Starting dependency optimization..."

# Remove heavy database dependencies from production build
echo "📦 Optimizing database dependencies..."
npm uninstall pg pg-connection-string pgpass postgres-bytea
npm install --save-dev pg pg-connection-string

# Optimize AI/ML dependencies
echo "🤖 Optimizing AI dependencies..."
# Consider replacing full tensorflow bundle with specific modules
# npm uninstall @tensorflow/tfjs
# npm install @tensorflow/tfjs-core @tensorflow/tfjs-backend-webgl

# Tree-shaking improvements
echo "🌳 Implementing tree-shaking improvements..."
${analyzer.results.treeShakingOpportunities.map(opp => 
  `# npm uninstall ${opp.current} && npm install ${opp.alternative}`
).join('\n')}

# Bundle analysis
echo "📊 Running bundle analysis..."
npm run build
node scripts/analyze-bundle-advanced.js

echo "✅ Dependency optimization complete!"
`;

  try {
    fs.writeFileSync('scripts/optimize-dependencies.sh', scriptContent);
    log('\n📝 Generated optimization script: scripts/optimize-dependencies.sh', 'green');
  } catch (error) {
    log(`❌ Failed to generate optimization script: ${error.message}`, 'red');
  }
}

// Run analysis if script is executed directly
if (require.main === module) {
  const analyzer = new DependencyAnalyzer();
  const success = analyzer.run();
  
  if (success) {
    generateOptimizationScript(analyzer);
  }
  
  process.exit(success ? 0 : 1);
}

module.exports = DependencyAnalyzer;
