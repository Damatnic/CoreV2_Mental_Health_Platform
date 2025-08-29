import * as fs from 'fs';
import * as path from 'path';

// Type-safe imports with fallbacks
type UserConfig = any;
type Plugin = any;

const defineConfig = (config: any) => config;

// Bundle analysis and optimization configuration
export interface BundleOptimizationConfig {
  // Code splitting configuration
  codeSplitting: {
    enabled: boolean;
    strategy: 'vendor' | 'chunks' | 'dynamic' | 'hybrid';
    chunkSizeWarningLimit: number;
    maxChunkSize: number;
    minChunkSize: number;
  };
  
  // Tree shaking configuration
  treeShaking: {
    enabled: boolean;
    sideEffects: boolean;
    usedExports: boolean;
    deadCodeElimination: boolean;
  };
  
  // Compression configuration  
  compression: {
    gzip: boolean;
    brotli: boolean;
    threshold: number;
    compressionLevel: number;
  };
  
  // Bundle analysis
  analysis: {
    enabled: boolean;
    generateReport: boolean;
    outputPath: string;
    visualizer: boolean;
  };
  
  // Performance budgets
  performance: {
    budgets: BundleBudget[];
    warningsOnly: boolean;
  };
  
  // Preloading configuration
  preloading: {
    enabled: boolean;
    strategy: 'critical' | 'visible' | 'all';
    preloadChunks: string[];
  };
}

export interface BundleBudget {
  type: 'bundle' | 'initial' | 'anyChunkGroup' | 'any' | 'all';
  name?: string;
  baseline?: string;
  maximumWarning?: string | number;
  maximumError?: string | number;
  minimumWarning?: string | number;
  minimumError?: string | number;
}

// Default optimization configuration
export const DEFAULT_BUNDLE_CONFIG: BundleOptimizationConfig = {
  codeSplitting: {
    enabled: true,
    strategy: 'hybrid',
    chunkSizeWarningLimit: 500, // KB
    maxChunkSize: 1000, // KB
    minChunkSize: 20 // KB
  },
  
  treeShaking: {
    enabled: true,
    sideEffects: false,
    usedExports: true,
    deadCodeElimination: true
  },
  
  compression: {
    gzip: true,
    brotli: true,
    threshold: 1024, // bytes
    compressionLevel: 6
  },
  
  analysis: {
    enabled: typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false,
    generateReport: true,
    outputPath: './dist/bundle-analysis',
    visualizer: true
  },
  
  performance: {
    budgets: [
      {
        type: 'initial',
        maximumWarning: '2mb',
        maximumError: '5mb'
      },
      {
        type: 'anyChunkGroup',
        maximumWarning: '1mb',
        maximumError: '2mb'
      }
    ],
    warningsOnly: false
  },
  
  preloading: {
    enabled: true,
    strategy: 'critical',
    preloadChunks: ['vendor', 'common']
  }
};

// Mental health platform specific chunk configuration
export const MENTAL_HEALTH_CHUNKS = {
  // Core application chunks
  core: [
    'src/App.tsx',
    'src/main.tsx',
    'src/routes/',
    'src/contexts/'
  ],
  
  // Crisis support chunks (high priority)
  crisis: [
    'src/components/crisis/',
    'src/services/crisisService',
    'src/features/crisis/',
    'src/components/safety/'
  ],
  
  // Authentication chunks
  auth: [
    'src/services/auth/',
    'src/components/auth/',
    'src/contexts/AuthContext'
  ],
  
  // Chat and communication
  chat: [
    'src/components/LiveChat',
    'src/services/chatService',
    'src/components/AIChatHistory',
    'src/services/realtimeService'
  ],
  
  // Wellness and mood tracking
  wellness: [
    'src/components/MoodTracker',
    'src/components/EnhancedMoodChart',
    'src/services/moodService',
    'src/features/wellness/'
  ],
  
  // UI components (can be lazy loaded)
  ui: [
    'src/components/ui/',
    'src/components/icons.dynamic',
    'src/components/EnhancedToast',
    'src/components/LoadingSkeleton'
  ],
  
  // Analytics and tracking (low priority)
  analytics: [
    'src/services/analyticsService',
    'src/services/performanceMonitoring',
    'src/hooks/useAnalyticsTracking'
  ],
  
  // Testing utilities (development only)
  testing: [
    'src/test-utils/',
    'src/__mocks__/',
    'src/**/*.test.{ts,tsx}',
    'src/**/*.spec.{ts,tsx}'
  ]
};

// Vendor chunk optimization
export const VENDOR_CHUNKS = {
  // React ecosystem
  react: ['react', 'react-dom', 'react-router-dom'],
  
  // UI libraries
  ui: ['lucide-react', '@headlessui/react', '@heroicons/react'],
  
  // State management
  state: ['zustand', '@tanstack/react-query'],
  
  // Utilities
  utils: ['date-fns', 'lodash-es', 'uuid'],
  
  // Charts and visualization
  charts: ['recharts', 'chart.js', 'react-chartjs-2'],
  
  // Development tools (dev only)
  devtools: ['@storybook/react', '@testing-library/react']
};

// Performance optimization utilities
export class BundleOptimizer {
  private config: BundleOptimizationConfig;
  
  constructor(config: Partial<BundleOptimizationConfig> = {}) {
    this.config = { ...DEFAULT_BUNDLE_CONFIG, ...config };
  }
  
  /**
   * Generate Vite rollup options for code splitting
   */
  generateRollupOptions() {
    if (!this.config.codeSplitting.enabled) {
      return {};
    }
    
    const manualChunks = (id: string) => {
      // Vendor chunks
      for (const [chunkName, modules] of Object.entries(VENDOR_CHUNKS)) {
        if (modules.some(module => id.includes(`node_modules/${module}`))) {
          return `vendor-${chunkName}`;
        }
      }
      
      // Application chunks
      for (const [chunkName, patterns] of Object.entries(MENTAL_HEALTH_CHUNKS)) {
        if (patterns.some(pattern => {
          if (pattern.endsWith('/')) {
            return id.includes(pattern);
          }
          return id.includes(pattern) || id.endsWith(pattern);
        })) {
          return chunkName;
        }
      }
      
      // Default chunk for other code
      if (id.includes('node_modules')) {
        return 'vendor-other';
      }
      
      return 'common';
    };
    
    return {
      output: {
        manualChunks,
        chunkFileNames: (chunkInfo: any) => {
          const name = chunkInfo.name;
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo: any) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name]-[hash][extname]';
          }
          if (/css/i.test(extType)) {
            return 'assets/css/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    };
  }
  
  /**
   * Generate compression plugin configuration
   */
  generateCompressionConfig(): Plugin[] {
    const plugins: Plugin[] = [];
    
    if (!this.config.compression.gzip && !this.config.compression.brotli) {
      return plugins;
    }
    
    // Dynamic import to avoid bundling if not used
    const importPlugin = async (pluginName: string) => {
      try {
        const plugin = await import(pluginName);
        return plugin.default || plugin;
      } catch (error) {
        console.warn(`Failed to import ${pluginName}:`, error);
        return null;
      }
    };
    
    if (this.config.compression.gzip) {
      importPlugin('vite-plugin-compression').then(compression => {
        if (compression) {
          plugins.push(
            compression({
              algorithm: 'gzip',
              threshold: this.config.compression.threshold,
              compressionLevel: this.config.compression.compressionLevel,
              ext: '.gz'
            })
          );
        }
      });
    }
    
    if (this.config.compression.brotli) {
      importPlugin('vite-plugin-compression').then(compression => {
        if (compression) {
          plugins.push(
            compression({
              algorithm: 'brotliCompress',
              threshold: this.config.compression.threshold,
              ext: '.br'
            })
          );
        }
      });
    }
    
    return plugins;
  }
  
  /**
   * Generate bundle analyzer configuration
   */
  generateAnalyzerConfig(): Plugin[] {
    if (!this.config.analysis.enabled) {
      return [];
    }
    
    const plugins: Plugin[] = [];
    
    // Bundle analyzer
    if (this.config.analysis.visualizer) {
      try {
        if (typeof require !== 'undefined') {
          const { visualizer } = require('rollup-plugin-visualizer');
          plugins.push(
            visualizer({
              filename: `${this.config.analysis.outputPath}/bundle-visualizer.html`,
              open: false,
              gzipSize: true,
              brotliSize: true
            })
          );
        }
      } catch (error) {
        console.warn('Bundle visualizer plugin not available:', error);
      }
    }
    
    return plugins;
  }
  
  /**
   * Generate performance budgets configuration
   */
  generatePerformanceBudgets() {
    return {
      budgets: this.config.performance.budgets.map(budget => ({
        ...budget,
        maximumWarning: this.parseSize(budget.maximumWarning),
        maximumError: this.parseSize(budget.maximumError),
        minimumWarning: this.parseSize(budget.minimumWarning),
        minimumError: this.parseSize(budget.minimumError)
      }))
    };
  }
  
  /**
   * Parse size string to bytes
   */
  private parseSize(size?: string | number): number | undefined {
    if (!size) return undefined;
    if (typeof size === 'number') return size;
    
    const units: Record<string, number> = {
      b: 1,
      kb: 1024,
      mb: 1024 * 1024,
      gb: 1024 * 1024 * 1024
    };
    
    const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
    if (!match) return undefined;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    return Math.round(value * units[unit]);
  }
  
  /**
   * Generate complete Vite configuration with optimizations
   */
  generateViteConfig(baseConfig: UserConfig = {}): UserConfig {
    const rollupOptions = this.generateRollupOptions();
    const compressionPlugins = this.generateCompressionConfig();
    const analyzerPlugins = this.generateAnalyzerConfig();
    
    return defineConfig({
      ...baseConfig,
      
      build: {
        ...baseConfig.build,
        
        // Rollup options for code splitting
        rollupOptions: {
          ...baseConfig.build?.rollupOptions,
          ...rollupOptions
        },
        
        // Chunk size warning limit
        chunkSizeWarningLimit: this.config.codeSplitting.chunkSizeWarningLimit,
        
        // Target modern browsers for better optimization
        target: 'es2015',
        
        // Generate source maps in development
        sourcemap: typeof process !== 'undefined' ? process.env.NODE_ENV !== 'production' : false,
        
        // Minification options
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: typeof process !== 'undefined' ? process.env.NODE_ENV === 'production' : false,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.warn']
          },
          mangle: {
            safari10: true
          }
        }
      },
      
      // Add optimization plugins
      plugins: [
        ...(baseConfig.plugins || []),
        ...compressionPlugins,
        ...analyzerPlugins
      ],
      
      // Dependency optimization
      optimizeDeps: {
        ...baseConfig.optimizeDeps,
        
        // Include commonly used dependencies
        include: [
          'react',
          'react-dom',
          'react-router-dom',
          'lucide-react',
          '@tanstack/react-query',
          'zustand'
        ],
        
        // Exclude large dependencies that should be loaded separately
        exclude: [
          'fsevents',
          '@storybook/react'
        ]
      },
      
      // Server configuration for development
      server: {
        ...baseConfig.server,
        
        // Enable HTTP/2 for better performance
        https: false,
        
        // Optimize HMR
        hmr: {
          overlay: true
        }
      }
    });
  }
  
  /**
   * Analyze bundle and generate report
   */
  async analyzeBundlePerformance(buildDir: string = 'dist') {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      if (!fs.existsSync(buildDir)) {
        console.warn('Build directory not found:', buildDir);
        return null;
      }
    } catch (error) {
      console.warn('File system not available:', error);
      return null;
    }
    
    const analysis = {
      totalSize: 0,
      chunkCount: 0,
      chunks: [] as Array<{ name: string; size: number; gzipSize?: number }>,
      budgetViolations: [] as Array<{ type: string; actual: number; limit: number }>
    };
    
    // Analyze JavaScript chunks
    const jsFiles = fs.readdirSync(path.join(buildDir, 'assets/js')).filter(file => file.endsWith('.js'));
    
    for (const file of jsFiles) {
      const filePath = path.join(buildDir, 'assets/js', file);
      const stats = fs.statSync(filePath);
      
      analysis.chunks.push({
        name: file,
        size: stats.size
      });
      
      analysis.totalSize += stats.size;
      analysis.chunkCount++;
    }
    
    // Check performance budgets
    for (const budget of this.config.performance.budgets) {
      const limit = this.parseSize(budget.maximumError || budget.maximumWarning);
      if (limit && analysis.totalSize > limit) {
        analysis.budgetViolations.push({
          type: budget.type,
          actual: analysis.totalSize,
          limit
        });
      }
    }
    
    // Generate report
    if (this.config.analysis.generateReport) {
      const reportPath = path.join(this.config.analysis.outputPath, 'performance-report.json');
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
    }
    
    return analysis;
  }
}

// Create and export default optimizer instance
export const bundleOptimizer = new BundleOptimizer();

// Export utility functions
export const createOptimizedViteConfig = (baseConfig?: UserConfig) => {
  return bundleOptimizer.generateViteConfig(baseConfig);
};

export const analyzeBuildPerformance = (buildDir?: string) => {
  return bundleOptimizer.analyzeBundlePerformance(buildDir);
};

// Performance monitoring utilities
export const trackBundleMetrics = () => {
  if (typeof window === 'undefined' || typeof performance === 'undefined') return;
  
  try {
    // Track bundle loading performance
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
  
    const metrics = {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      timeToInteractive: navigation.domInteractive - navigation.fetchStart,
      resourceLoadTime: navigation.responseEnd - navigation.requestStart
    };
    
    // Log metrics for development
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
      console.log('Bundle Performance Metrics:', metrics);
    }
    
    return metrics;
  } catch (error) {
    console.warn('Failed to track bundle metrics:', error);
    return null;
  }
};

// Lazy loading utilities for better performance
export const createLazyChunkLoader = (chunkName: string) => {
  return () => import(
    /* webpackChunkName: "[request]" */
    /* webpackMode: "lazy" */
    `./chunks/${chunkName}`
  );
};

export default bundleOptimizer;
