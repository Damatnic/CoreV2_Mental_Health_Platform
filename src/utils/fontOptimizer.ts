/**
 * Advanced Font Optimization System
 *
 * Implements intelligent font loading strategies with preloading,
 * fallback systems, and performance optimization for mental health platform.
 * 
 * @fileoverview Font optimization with performance-first loading strategies
 * @version 2.0.0
 */

import * as React from 'react';

/**
 * Font configuration interface
 */
export interface FontConfig {
  family: string;
  weight: number | string;
  style?: 'normal' | 'italic';
  display?: 'auto' | 'block' | 'swap' | 'fallback' | 'optional';
  fallback?: string[];
  preload?: boolean;
  critical?: boolean;
}

/**
 * Font loading status
 */
export type FontLoadStatus = 'unloaded' | 'loading' | 'loaded' | 'error';

/**
 * Font metrics interface
 */
export interface FontMetrics {
  loadTime: number;
  renderTime: number;
  cacheHit: boolean;
  fallbackUsed: boolean;
}

/**
 * Font Optimizer Class
 */
class FontOptimizerClass {
  private loadedFonts: Set<string> = new Set();
  private loadingFonts: Map<string, Promise<void>> = new Map();
  private fontConfigs: Map<string, FontConfig> = new Map();
  private fontMetrics: Map<string, FontMetrics> = new Map();
  private observers: any[] = []; // FontFaceObserver instances

  // Critical fonts that must load immediately
  private readonly CRITICAL_FONTS: FontConfig[] = [
    {
      family: 'Inter',
      weight: 400,
      display: 'swap',
      preload: true,
      critical: true,
      fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    },
    {
      family: 'Inter',
      weight: 600,
      display: 'swap',
      preload: true,
      critical: true,
      fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    }
  ];

  // Secondary fonts loaded after critical content
  private readonly SECONDARY_FONTS: FontConfig[] = [
    {
      family: 'Inter',
      weight: 300,
      display: 'swap',
      preload: false,
      critical: false,
      fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    },
    {
      family: 'Inter',
      weight: 700,
      display: 'swap',
      preload: false,
      critical: false,
      fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
    },
    {
      family: 'Poppins',
      weight: 400,
      display: 'optional',
      preload: false,
      critical: false,
      fallback: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
    },
    {
      family: 'Poppins',
      weight: 600,
      display: 'optional',
      preload: false,
      critical: false,
      fallback: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']
    }
  ];

  constructor() {
    this.initializeFontConfigs();
    this.setupFontObservers();
  }

  /**
   * Initialize font configurations
   */
  private initializeFontConfigs(): void {
    [...this.CRITICAL_FONTS, ...this.SECONDARY_FONTS].forEach(config => {
      const key = this.getFontKey(config.family, config.weight, config.style);
      this.fontConfigs.set(key, config);
    });
  }

  /**
   * Setup font loading observers
   */
  private setupFontObservers(): void {
    if (!('FontFace' in window)) {
      return;
    }

    // Observe system font changes
    if ('fonts' in document) {
      document.fonts.addEventListener('loadingdone', () => {
        this.updateLoadedFonts();
      });

      document.fonts.addEventListener('loadingerror', (event) => {
        console.error('Font loading error:', event);
      });
    }
  }

  /**
   * Generate font key for caching
   */
  private getFontKey(family: string, weight: number | string, style = 'normal'): string {
    return `${family}-${weight}-${style}`;
  }

  /**
   * Generate optimized Google Fonts URL
   */
  generateGoogleFontsUrl(fonts: FontConfig[], display = 'swap'): string {
    const families = new Map<string, Set<string>>();

    fonts.forEach(font => {
      if (!families.has(font.family)) {
        families.set(font.family, new Set());
      }
      const weightStyle = font.style === 'italic' ? `${font.weight}i` : font.weight.toString();
      families.get(font.family)!.add(weightStyle);
    });

    const familyParams = Array.from(families.entries()).map(([family, weights]) => {
      const weightsStr = Array.from(weights).sort().join(',');
      return `${family}:wght@${weightsStr}`;
    });

    const baseUrl = 'https://fonts.googleapis.com/css2';
    const params = new URLSearchParams({
      family: familyParams.join('&family='),
      display
    });

    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Preload critical fonts
   */
  async preloadCriticalFonts(): Promise<void> {
    const criticalFonts = this.CRITICAL_FONTS.filter(font => font.preload);

    if (criticalFonts.length === 0) return;

    // Create preload links
    const preloadPromises = criticalFonts.map(font => this.preloadFont(font));

    // Load Google Fonts CSS for critical fonts
    const googleFontsUrl = this.generateGoogleFontsUrl(criticalFonts, 'swap');
    this.preloadStylesheet(googleFontsUrl, true);

    await Promise.allSettled(preloadPromises);
  }

  /**
   * Preload a specific font
   */
  private async preloadFont(config: FontConfig): Promise<void> {
    const key = this.getFontKey(config.family, config.weight, config.style);

    if (this.loadedFonts.has(key) || this.loadingFonts.has(key)) {
      return this.loadingFonts.get(key) || Promise.resolve();
    }

    const loadPromise = this.loadFontFace(config);
    this.loadingFonts.set(key, loadPromise);

    try {
      const startTime = performance.now();
      await loadPromise;
      const loadTime = performance.now() - startTime;

      this.loadedFonts.add(key);
      this.fontMetrics.set(key, {
        loadTime,
        renderTime: 0,
        cacheHit: loadTime < 50, // Assume cache hit if very fast
        fallbackUsed: false
      });
    } catch (error) {
      console.error(`Failed to load font ${key}:`, error);
    } finally {
      this.loadingFonts.delete(key);
    }
  }

  /**
   * Load font face using FontFace API
   */
  private async loadFontFace(config: FontConfig): Promise<void> {
    if (!('FontFace' in window)) {
      throw new Error('FontFace API not supported');
    }

    // Generate font URL (simplified - in production, use actual font files)
    const fontUrl = this.generateFontUrl(config);

    const fontFace = new FontFace(
      config.family,
      `url(${fontUrl})`,
      {
        weight: config.weight.toString(),
        style: config.style || 'normal',
        display: config.display || 'swap'
      }
    );

    await fontFace.load();
    document.fonts.add(fontFace);
  }

  /**
   * Generate font URL (placeholder - replace with actual font hosting)
   */
  private generateFontUrl(config: FontConfig): string {
    // This is a placeholder - in production, use your font hosting service
    const baseUrl = 'https://fonts.gstatic.com/s';
    const family = config.family.toLowerCase().replace(/\s+/g, '');
    const weight = config.weight;
    const style = config.style === 'italic' ? 'i' : '';
    
    return `${baseUrl}/${family}/v1/${family}-${weight}${style}.woff2`;
  }

  /**
   * Preload stylesheet with high priority
   */
  private preloadStylesheet(href: string, critical = false): void {
    const link = document.createElement('link');
    link.rel = critical ? 'preload' : 'prefetch';
    link.as = 'style';
    link.href = href;
    link.crossOrigin = 'anonymous';

    if (critical) {
      link.onload = () => {
        link.rel = 'stylesheet';
      };
    }

    document.head.appendChild(link);
  }

  /**
   * Load secondary fonts after critical content
   */
  async loadSecondaryFonts(): Promise<void> {
    // Wait for critical fonts to load first
    await this.preloadCriticalFonts();

    // Load secondary fonts
    const secondaryPromises = this.SECONDARY_FONTS.map(font => this.preloadFont(font));
    await Promise.allSettled(secondaryPromises);
  }

  /**
   * Get fallback font stack for a given font family
   */
  getFallbackStack(family: string): string {
    const config = Array.from(this.fontConfigs.values())
      .find(config => config.family === family);

    if (config?.fallback) {
      return [family, ...config.fallback].join(', ');
    }

    // Default fallback stacks
    const fallbacks: Record<string, string[]> = {
      'Inter': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      'Poppins': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      'serif': ['Georgia', 'Times New Roman', 'serif'],
      'monospace': ['Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'monospace']
    };

    const stack = fallbacks[family] || fallbacks['Inter'];
    return [family, ...stack].join(', ');
  }

  /**
   * Check if font is loaded
   */
  isFontLoaded(family: string, weight = 400, style = 'normal'): boolean {
    const key = this.getFontKey(family, weight, style);
    return this.loadedFonts.has(key);
  }

  /**
   * Get font loading status
   */
  getFontStatus(family: string, weight = 400, style = 'normal'): FontLoadStatus {
    const key = this.getFontKey(family, weight, style);
    
    if (this.loadedFonts.has(key)) return 'loaded';
    if (this.loadingFonts.has(key)) return 'loading';

    // Check if font is available using document.fonts
    if ('fonts' in document) {
      const fontFace = `${weight} ${style} 12px ${family}`;
      const status = document.fonts.check(fontFace);
      return status ? 'loaded' : 'unloaded';
    }

    return 'unloaded';
  }

  /**
   * Get font metrics
   */
  getFontMetrics(family: string, weight = 400, style = 'normal'): FontMetrics | null {
    const key = this.getFontKey(family, weight, style);
    return this.fontMetrics.get(key) || null;
  }

  /**
   * Update loaded fonts set
   */
  private updateLoadedFonts(): void {
    if (!('fonts' in document)) return;

    this.fontConfigs.forEach((config, key) => {
      const fontFace = `${config.weight} ${config.style || 'normal'} 12px ${config.family}`;
      if (document.fonts.check(fontFace)) {
        this.loadedFonts.add(key);
      }
    });
  }

  /**
   * Get optimized CSS for critical fonts
   */
  getCriticalFontCSS(): string {
    const styles = this.CRITICAL_FONTS.map(font => {
      const fallbackStack = this.getFallbackStack(font.family);

      return `.font-${font.family.toLowerCase()}-${font.weight} {
        font-family: ${fallbackStack};
        font-weight: ${font.weight};
        font-style: ${font.style || 'normal'};
        font-display: ${font.display || 'swap'};
      }`;
    }).join('\n');

    return styles;
  }

  /**
   * Optimize font loading based on connection speed
   */
  optimizeForConnection(): void {
    if (!('connection' in navigator)) return;

    const connection = (navigator as any).connection;
    const effectiveType = connection.effectiveType;

    // On slow connections, only load critical fonts
    if (effectiveType === 'slow-2g' || effectiveType === '2g') {
      this.preloadCriticalFonts();
      return;
    }

    // On fast connections, load all fonts
    if (effectiveType === '4g') {
      this.preloadCriticalFonts().then(() => {
        setTimeout(() => this.loadSecondaryFonts(), 100);
      });
      return;
    }

    // Default: load critical first, then secondary after delay
    this.preloadCriticalFonts().then(() => {
      setTimeout(() => this.loadSecondaryFonts(), 1000);
    });
  }

  /**
   * Generate font preload HTML
   */
  generatePreloadHTML(): string {
    const criticalFonts = this.CRITICAL_FONTS.filter(font => font.preload);
    
    const preloadLinks = criticalFonts.map(font => {
      const href = this.generateFontUrl(font);
      return `<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin="anonymous">`;
    }).join('\n');

    const googleFontsUrl = this.generateGoogleFontsUrl(criticalFonts, 'swap');
    const googleFontsLink = `<link rel="preload" as="style" href="${googleFontsUrl}" crossorigin="anonymous">`;

    return `${googleFontsLink}\n${preloadLinks}`;
  }

  /**
   * Get font loading statistics
   */
  getStatistics(): {
    totalFonts: number;
    loadedFonts: number;
    loadingFonts: number;
    averageLoadTime: number;
    cacheHitRate: number;
  } {
    const totalFonts = this.fontConfigs.size;
    const loadedFonts = this.loadedFonts.size;
    const loadingFonts = this.loadingFonts.size;

    const metrics = Array.from(this.fontMetrics.values());
    const averageLoadTime = metrics.length > 0 
      ? metrics.reduce((sum, metric) => sum + metric.loadTime, 0) / metrics.length 
      : 0;

    const cacheHits = metrics.filter(metric => metric.cacheHit).length;
    const cacheHitRate = metrics.length > 0 ? (cacheHits / metrics.length) * 100 : 0;

    return {
      totalFonts,
      loadedFonts,
      loadingFonts,
      averageLoadTime,
      cacheHitRate
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect?.());
    this.observers = [];
    this.loadingFonts.clear();
  }
}

/**
 * Font Face Observer for broader browser support
 */
class FontFaceObserverClass {
  private family: string;
  private descriptors: any;

  constructor(family: string, descriptors: any = {}) {
    this.family = family;
    this.descriptors = descriptors;
  }

  load(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ('fonts' in document) {
        const fontFace = `${this.descriptors.weight || 400} ${this.descriptors.style || 'normal'} 12px ${this.family}`;
        
        if (document.fonts.check(fontFace)) {
          resolve();
          return;
        }

        const timeout = setTimeout(() => reject(new Error('Font load timeout')), 3000);

        document.fonts.load(fontFace).then(() => {
          clearTimeout(timeout);
          resolve();
        }).catch(() => {
          clearTimeout(timeout);
          reject(new Error('Font load failed'));
        });
      } else {
        // Fallback for browsers without FontFace API
        setTimeout(resolve, 100);
      }
    });
  }

  disconnect(): void {
    // Cleanup if needed
  }
}

// Singleton instance
const fontOptimizer = new FontOptimizerClass();

// React hook for font loading
export const useFontLoader = () => {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [criticalFontsLoaded, setCriticalFontsLoaded] = React.useState(false);

  React.useEffect(() => {
    fontOptimizer.preloadCriticalFonts().then(() => {
      setCriticalFontsLoaded(true);
    });

    fontOptimizer.loadSecondaryFonts().then(() => {
      setFontsLoaded(true);
    });
  }, []);

  return {
    fontsLoaded,
    criticalFontsLoaded,
    isFontLoaded: fontOptimizer.isFontLoaded.bind(fontOptimizer),
    getFontStatus: fontOptimizer.getFontStatus.bind(fontOptimizer),
    getFallbackStack: fontOptimizer.getFallbackStack.bind(fontOptimizer),
    getStatistics: fontOptimizer.getStatistics.bind(fontOptimizer)
  };
};

// CSS-in-JS helper for font stacks
export const fontStack = (family: string): string => {
  return fontOptimizer.getFallbackStack(family);
};

// Initialize font optimization
if (typeof window !== 'undefined') {
  // Start font optimization based on connection
  fontOptimizer.optimizeForConnection();

  // Preload critical fonts immediately
  fontOptimizer.preloadCriticalFonts();
}

// Export classes and instance
export const FontOptimizer = FontOptimizerClass;
export const FontFaceObserver = FontFaceObserverClass;

export { fontOptimizer };

export default fontOptimizer;
