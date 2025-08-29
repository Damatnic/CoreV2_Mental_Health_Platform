/**
 * Critical CSS Extraction and Optimization Script
 * Extracts above-the-fold CSS and implements lazy loading for non-critical styles
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CriticalCSSConfig {
  width: number;
  height: number;
  css: string;
  inline: boolean;
  extract: boolean;
  inlineImages: boolean;
  minify: boolean;
  timeout: number;
}

class CriticalCSSExtractor {
  private readonly config: CriticalCSSConfig;
  private readonly projectRoot: string;
  private readonly distPath: string;

  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.distPath = path.join(this.projectRoot, 'dist');
    this.config = {
      width: 1300,
      height: 900,
      css: path.join(this.projectRoot, 'index.css'),
      inline: true,
      extract: true,
      inlineImages: false,
      minify: true,
      timeout: 30000
    };
  }

  /**
   * Extract critical CSS based on above-the-fold content
   */
  async extractCriticalCSS(): Promise<string> {
    try {
      const cssContent = await fs.readFile(this.config.css, 'utf-8');
      
      // Define critical CSS selectors for mental health platform
      const criticalSelectors = [
        // Layout fundamentals
        'html', 'body', '#root',
        
        // Loading states
        '#loading-screen', '.loading-logo', '.loading-text', '.loading-spinner',
        
        // Crisis elements (highest priority)
        '.crisis-banner', '.crisis-button', '.floating-crisis-button',
        
        // Core navigation (above the fold)
        '.sidebar', '.mobile-sidebar', '.sidebar-header', '.sidebar-nav',
        '.sidebar-item', '.sidebar-item.active',
        
        // Main content area
        '.main-content', '.main-header', '.content-wrapper',
        
        // Essential typography
        'h1', 'h2', 'h3', '.text-primary', '.text-secondary',
        
        // Critical buttons and interactions
        '.btn', '.btn-primary', '.btn-secondary', '.app-button',
        
        // Form elements (for crisis forms)
        'input', 'textarea', 'select', '.form-group', '.form-control',
        
        // Cards and containers (dashboard items)
        '.card', '.card-header', '.card-body', '.card-footer',
        
        // Toast notifications (critical for crisis alerts)
        '.toast', '.toast-container', '.toast-header', '.toast-body',
        
        // Modal (for crisis interventions)
        '.modal', '.modal-dialog', '.modal-content', '.modal-header', '.modal-body',
        
        // Mental health specific
        '.mood-tracker', '.crisis-resources', '.help-button', '.emergency-contact',
        
        // Responsive utilities (mobile-first)
        '@media (max-width: 768px)', '@media (max-width: 576px)',
        
        // Dark theme essentials
        '.dark-theme', '[data-theme="dark"]',
        
        // Accessibility
        '.sr-only', '.focus-visible', '[aria-hidden]',
        
        // Animation essentials (loading, crisis alerts)
        '@keyframes spin', '@keyframes pulse', '@keyframes fadeIn'
      ];

      // Extract CSS rules that match critical selectors
      const criticalCSS = this.extractMatchingRules(cssContent, criticalSelectors);
      
      // Add viewport and font loading optimizations
      const optimizedCSS = this.addCriticalOptimizations(criticalCSS);
      
      return this.config.minify ? this.minifyCSS(optimizedCSS) : optimizedCSS;
      
    } catch (error) {
      console.error('Error extracting critical CSS:', error);
      return '';
    }
  }

  /**
   * Extract CSS rules that match critical selectors
   */
  private extractMatchingRules(cssContent: string, selectors: string[]): string {
    const rules: string[] = [];
    
    // Split CSS into rules
    const cssRules = cssContent.split('}').map(rule => rule.trim() + '}');
    
    // Add root variables (critical for theme system)
    const rootVariableRule = cssRules.find(rule => rule.includes(':root'));
    if (rootVariableRule) {
      rules.push(rootVariableRule);
    }

    // Add font imports (critical for CLS prevention)
    const fontImports = cssContent.match(/@import[^;]+;/g) || [];
    rules.push(...fontImports);

    // Extract matching rules
    for (const rule of cssRules) {
      for (const selector of selectors) {
        if (rule.includes(selector) && !rules.includes(rule)) {
          rules.push(rule);
        }
      }
    }

    return rules.join('\n').replace(/}\s*}/g, '}');
  }

  /**
   * Add critical performance optimizations
   */
  private addCriticalOptimizations(css: string): string {
    const optimizations = `
      /* Critical CSS Optimizations */
      
      /* Prevent FOUC (Flash of Unstyled Content) */
      html {
        visibility: hidden;
        opacity: 0;
      }
      
      html.css-loaded {
        visibility: visible;
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }
      
      /* Critical loading state */
      .loading-critical {
        display: flex !important;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      
      /* Crisis banner - highest priority */
      .crisis-banner-critical {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100% !important;
        background: #e53e3e !important;
        color: white !important;
        text-align: center !important;
        padding: 12px !important;
        font-weight: 600 !important;
        z-index: 10000 !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15) !important;
      }
      
      /* Font loading optimization */
      @font-face {
        font-family: 'Nunito';
        font-display: swap;
        src: local('Nunito');
      }
      
      /* Reduce layout shift for images */
      img {
        height: auto;
        max-width: 100%;
      }
      
      /* Critical mobile optimization */
      @media (max-width: 768px) {
        .mobile-hide { display: none !important; }
        .mobile-full { width: 100% !important; }
      }
    `;

    return optimizations + '\n\n' + css;
  }

  /**
   * Minify CSS by removing comments, whitespace, and unnecessary characters
   */
  private minifyCSS(css: string): string {
    return css
      // Remove comments
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove extra whitespace
      .replace(/\s+/g, ' ')
      // Remove whitespace around specific characters
      .replace(/\s*{\s*/g, '{')
      .replace(/;\s*/g, ';')
      .replace(/}\s*/g, '}')
      .replace(/,\s*/g, ',')
      .replace(/:\s*/g, ':')
      // Remove trailing semicolons
      .replace(/;}/g, '}')
      .trim();
  }

  /**
   * Create lazy loading CSS implementation
   */
  async createLazyLoadingCSS(): Promise<string> {
    const lazyCSS = `
/**
 * Lazy Loading CSS Implementation
 * Non-critical styles loaded after initial page load
 */

/* Lazy load CSS utility */
function loadCSS(href, media = 'all') {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.media = 'only x'; // Temporarily set to non-matching media
  
  const onload = () => {
    link.media = media;
    link.onload = null;
  };
  
  link.onload = onload;
  
  // Fallback for older browsers
  setTimeout(() => {
    if (link.media === 'only x') {
      onload();
    }
  }, 3000);
  
  document.head.appendChild(link);
  return link;
}

/* Mental Health Platform Lazy Loading Strategy */
const lazyLoadStrategy = {
  // Load after critical content
  immediate: [
    '/assets/components.css',
    '/assets/forms.css',
    '/assets/navigation.css'
  ],
  
  // Load on user interaction
  interaction: [
    '/assets/animations.css',
    '/assets/transitions.css',
    '/assets/hover-effects.css'
  ],
  
  // Load for specific routes
  routes: {
    '/mood-tracker': ['/assets/mood-tracker.css'],
    '/chat': ['/assets/chat.css'],
    '/community': ['/assets/community.css'],
    '/crisis': ['/assets/crisis.css'],
    '/settings': ['/assets/settings.css']
  },
  
  // Load for media queries
  responsive: [
    { media: '(min-width: 1024px)', css: '/assets/desktop.css' },
    { media: '(max-width: 767px)', css: '/assets/mobile.css' },
    { media: 'print', css: '/assets/print.css' }
  ]
};

/* Implement lazy loading */
document.addEventListener('DOMContentLoaded', () => {
  // Load immediate non-critical CSS
  lazyLoadStrategy.immediate.forEach(css => {
    setTimeout(() => loadCSS(css), 100);
  });
  
  // Load interaction-dependent CSS on first user interaction
  let interactionLoaded = false;
  const loadInteractionCSS = () => {
    if (!interactionLoaded) {
      lazyLoadStrategy.interaction.forEach(css => loadCSS(css));
      interactionLoaded = true;
    }
  };
  
  ['click', 'touchstart', 'keydown', 'scroll'].forEach(event => {
    document.addEventListener(event, loadInteractionCSS, { once: true, passive: true });
  });
  
  // Load responsive CSS based on media queries
  lazyLoadStrategy.responsive.forEach(({ media, css }) => {
    if (window.matchMedia(media).matches) {
      loadCSS(css, media);
    }
  });
  
  // Route-based CSS loading
  const currentPath = window.location.pathname;
  Object.entries(lazyLoadStrategy.routes).forEach(([route, cssFiles]) => {
    if (currentPath.startsWith(route)) {
      cssFiles.forEach(css => loadCSS(css));
    }
  });
});

/* Preload next likely CSS based on user behavior */
const intelligentCSSPreloading = {
  // Preload CSS for likely next routes
  preloadRouteCSS(route) {
    const routeCSS = lazyLoadStrategy.routes[route];
    if (routeCSS) {
      routeCSS.forEach(css => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'style';
        link.href = css;
        document.head.appendChild(link);
      });
    }
  },
  
  // Preload based on mental health journey patterns
  preloadJourneyCSS() {
    const journeyPatterns = {
      'mood-tracking': ['/mood-tracker', '/journal'],
      'crisis-support': ['/crisis', '/emergency-contacts'],
      'community-engagement': ['/chat', '/community', '/helpers']
    };
    
    // Implement based on user's current emotional state or route
    const currentRoute = window.location.pathname;
    Object.entries(journeyPatterns).forEach(([pattern, routes]) => {
      if (routes.some(route => currentRoute.startsWith(route))) {
        routes.forEach(route => this.preloadRouteCSS(route));
      }
    });
  }
};

/* Initialize intelligent preloading */
intelligentCSSPreloading.preloadJourneyCSS();
`;

    return lazyCSS;
  }

  /**
   * Update HTML file with optimized critical CSS
   */
  async updateHTMLWithCriticalCSS(): Promise<void> {
    try {
      const htmlPath = path.join(this.projectRoot, 'index.html');
      const criticalCSS = await this.extractCriticalCSS();
      const lazyCSS = await this.createLazyLoadingCSS();
      
      let htmlContent = await fs.readFile(htmlPath, 'utf-8');
      
      // Find the existing critical CSS section
      const criticalCSSStart = htmlContent.indexOf('<!-- Critical CSS -->');
      const criticalCSSEnd = htmlContent.indexOf('</style>') + 8;
      
      if (criticalCSSStart !== -1 && criticalCSSEnd !== -1) {
        // Replace existing critical CSS
        const newCriticalSection = `<!-- Critical CSS -->
    <style>
      ${criticalCSS}
    </style>`;
        
        htmlContent = htmlContent.substring(0, criticalCSSStart) + 
                     newCriticalSection + 
                     htmlContent.substring(criticalCSSEnd);
      } else {
        // Add critical CSS before closing head tag
        const headCloseIndex = htmlContent.indexOf('</head>');
        const criticalSection = `
    <!-- Critical CSS -->
    <style>
      ${criticalCSS}
    </style>
  `;
        
        htmlContent = htmlContent.substring(0, headCloseIndex) + 
                     criticalSection + 
                     htmlContent.substring(headCloseIndex);
      }
      
      // Add lazy loading script before closing body tag
      const bodyCloseIndex = htmlContent.indexOf('</body>');
      const lazyLoadingScript = `
    <!-- Lazy CSS Loading -->
    <script>
      ${lazyCSS}
    </script>
  `;
      
      htmlContent = htmlContent.substring(0, bodyCloseIndex) + 
                   lazyLoadingScript + 
                   htmlContent.substring(bodyCloseIndex);
      
      await fs.writeFile(htmlPath, htmlContent, 'utf-8');
      console.log('✅ Updated HTML with optimized critical CSS');
      
    } catch (error) {
      console.error('Error updating HTML with critical CSS:', error);
      throw error;
    }
  }

  /**
   * Split CSS files for lazy loading
   */
  async splitCSSFiles(): Promise<void> {
    try {
      const cssContent = await fs.readFile(this.config.css, 'utf-8');
      const assetsDir = path.join(this.distPath, 'assets');
      
      // Ensure assets directory exists
      await fs.mkdir(assetsDir, { recursive: true });
      
      // Define CSS splitting strategy
      const cssCategories = {
        'components.css': [
          '.card', '.modal', '.toast', '.dropdown', '.tooltip',
          '.accordion', '.tabs', '.pagination', '.badge', '.progress'
        ],
        'forms.css': [
          'input', 'textarea', 'select', 'form', '.form-group',
          '.form-control', '.form-label', '.form-text', '.form-check'
        ],
        'animations.css': [
          '@keyframes', 'animation', 'transition', 'transform',
          '.fade', '.slide', '.bounce', '.pulse'
        ],
        'mobile.css': [
          '@media (max-width: 767px)', '.mobile-', '.touch-',
          '.swipe-', '.mobile-sidebar', '.mobile-nav'
        ],
        'desktop.css': [
          '@media (min-width: 1024px)', '.desktop-', '.hover:'
        ],
        'themes.css': [
          '.dark-theme', '.light-theme', '[data-theme]',
          '--color-', '--bg-', '--text-'
        ]
      };
      
      // Split CSS into categories
      for (const [filename, selectors] of Object.entries(cssCategories)) {
        const categoryCSS = this.extractMatchingRules(cssContent, selectors);
        const minifiedCSS = this.minifyCSS(categoryCSS);
        
        await fs.writeFile(
          path.join(assetsDir, filename),
          minifiedCSS,
          'utf-8'
        );
      }
      
      console.log('✅ Split CSS files for lazy loading');
      
    } catch (error) {
      console.error('Error splitting CSS files:', error);
      throw error;
    }
  }

  /**
   * Generate performance metrics for critical CSS
   */
  async generateMetrics(): Promise<void> {
    try {
      const originalCSS = await fs.readFile(this.config.css, 'utf-8');
      const criticalCSS = await this.extractCriticalCSS();
      
      const metrics = {
        originalSize: originalCSS.length,
        criticalSize: criticalCSS.length,
        reduction: ((originalCSS.length - criticalCSS.length) / originalCSS.length * 100).toFixed(2),
        timestamp: new Date().toISOString(),
        config: this.config
      };
      
      const metricsPath = path.join(this.projectRoot, 'critical-css-metrics.json');
      await fs.writeFile(metricsPath, JSON.stringify(metrics, null, 2));
      
      console.log(`✅ Critical CSS optimization completed:`);
      console.log(`   Original size: ${(metrics.originalSize / 1024).toFixed(1)}KB`);
      console.log(`   Critical size: ${(metrics.criticalSize / 1024).toFixed(1)}KB`);
      console.log(`   Reduction: ${metrics.reduction}%`);
      
    } catch (error) {
      console.error('Error generating metrics:', error);
    }
  }

  /**
   * Run complete critical CSS optimization
   */
  async optimize(): Promise<void> {
    console.log('🚀 Starting Critical CSS optimization...');
    
    try {
      await this.updateHTMLWithCriticalCSS();
      await this.splitCSSFiles();
      await this.generateMetrics();
      
      console.log('✅ Critical CSS optimization completed successfully!');
      
    } catch (error) {
      console.error('❌ Critical CSS optimization failed:', error);
      throw error;
    }
  }
}

// Export for use in build process
export { CriticalCSSExtractor };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const extractor = new CriticalCSSExtractor();
  extractor.optimize().catch(console.error);
}
