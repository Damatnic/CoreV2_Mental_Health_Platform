/**
 * Image Optimization Utilities
 *
 * Provides comprehensive image optimization for mental health platform including:
 * - Responsive image loading with multiple sizes
 * - Lazy loading with intersection observer
 * - WebP format conversion with fallbacks
 * - Progressive loading with blur-up technique
 * - Bandwidth-aware image serving
 * 
 * @fileoverview Type-safe image optimization with SSR compatibility
 * @version 2.1.0 - Rewritten for complete type safety
 */

// Core Types
export interface ImageFormat {
  url: string;
  format: 'webp' | 'jpeg' | 'png' | 'avif';
  width: number;
  height: number;
  quality?: number;
  fileSize?: number;
}

export interface OptimizedImage {
  id: string;
  originalUrl: string;
  formats: ImageFormat[];
  aspectRatio: number;
  placeholder: string; // Base64 blur placeholder
  alt: string;
  loading: 'lazy' | 'eager';
  priority: number; // 1-10, higher = more important
  category: 'thumbnail' | 'hero' | 'content' | 'avatar';
  metadata?: ImageMetadata;
}

export interface ImageMetadata {
  originalWidth: number;
  originalHeight: number;
  fileSize: number;
  lastModified: Date;
  colorPalette?: string[];
  dominantColor?: string;
}

export interface ImageOptimizationConfig {
  // Responsive breakpoints
  breakpoints: {
    thumbnail: { width: number; height: number };
    small: { width: number; height: number };
    medium: { width: number; height: number };
    large: { width: number; height: number };
    xlarge: { width: number; height: number };
  };
  // Quality settings
  quality: {
    webp: number;
    jpeg: number;
    png: number;
    avif: number;
  };
  // Format preferences by category
  formatPreference: Record<string, string[]>;
  // Lazy loading settings
  lazyLoading: {
    rootMargin: string;
    threshold: number;
    placeholderBlur: number;
  };
}

export interface LazyImageOptions {
  rootMargin?: string;
  threshold?: number;
  onLoad?: (image: HTMLImageElement) => void;
  onError?: (error: Event) => void;
  fadeInDuration?: number;
}

export interface ImageAnalytics {
  totalImages: number;
  optimizedImages: number;
  averageFileSize: number;
  formatDistribution: Record<string, number>;
  loadingMetrics: {
    averageLoadTime: number;
    cacheHitRate: number;
    errorRate: number;
  };
}

// Default configuration
const DEFAULT_CONFIG: ImageOptimizationConfig = {
  breakpoints: {
    thumbnail: { width: 320, height: 180 },
    small: { width: 480, height: 270 },
    medium: { width: 720, height: 405 },
    large: { width: 1280, height: 720 },
    xlarge: { width: 1920, height: 1080 }
  },
  quality: {
    webp: 80,
    jpeg: 85,
    png: 90,
    avif: 75
  },
  formatPreference: {
    thumbnail: ['webp', 'jpeg'],
    hero: ['avif', 'webp', 'jpeg'],
    content: ['webp', 'jpeg', 'png'],
    avatar: ['webp', 'jpeg']
  },
  lazyLoading: {
    rootMargin: '50px',
    threshold: 0.1,
    placeholderBlur: 20
  }
};

/**
 * Type-safe Image Optimization Service
 */
class ImageOptimizationService {
  private config: ImageOptimizationConfig;
  private observer: IntersectionObserver | null = null;
  private loadedImages: Set<string> = new Set();
  private analytics: ImageAnalytics;
  private isSupported: boolean = false;

  constructor(config?: Partial<ImageOptimizationConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.analytics = this.initializeAnalytics();
    this.isSupported = this.checkSupport();
    
    if (this.isSupported) {
      this.initializeObserver();
    }
  }

  /**
   * Check browser support for optimization features
   */
  private checkSupport(): boolean {
    if (typeof window === 'undefined') {
      return false; // SSR environment
    }

    return !!(
      'IntersectionObserver' in window &&
      'createImageBitmap' in window &&
      'fetch' in window
    );
  }

  /**
   * Initialize intersection observer for lazy loading
   */
  private initializeObserver(): void {
    if (!this.isSupported || this.observer) {
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            this.loadImage(img);
            this.observer?.unobserve(img);
          }
        });
      },
      {
        rootMargin: this.config.lazyLoading.rootMargin,
        threshold: this.config.lazyLoading.threshold
      }
    );
  }

  /**
   * Generate optimized image formats for different sizes
   */
  generateOptimizedFormats(
    originalUrl: string,
    category: OptimizedImage['category'] = 'content'
  ): ImageFormat[] {
    const formats: ImageFormat[] = [];
    const preferredFormats = this.config.formatPreference[category] || ['webp', 'jpeg'];

    // Generate formats for each breakpoint
    Object.entries(this.config.breakpoints).forEach(([breakpoint, dimensions]) => {
      preferredFormats.forEach((format) => {
        const formatKey = format as keyof typeof this.config.quality;
        const quality = this.config.quality[formatKey];
        
        formats.push({
          url: this.generateOptimizedUrl(originalUrl, dimensions.width, dimensions.height, format, quality),
          format: format as ImageFormat['format'],
          width: dimensions.width,
          height: dimensions.height,
          quality
        });
      });
    });

    return formats;
  }

  /**
   * Create optimized image object
   */
  createOptimizedImage(
    originalUrl: string,
    alt: string,
    category: OptimizedImage['category'] = 'content',
    priority: number = 5
  ): OptimizedImage {
    const id = this.generateImageId(originalUrl);
    const formats = this.generateOptimizedFormats(originalUrl, category);
    const aspectRatio = this.calculateAspectRatio(originalUrl, category);
    const placeholder = this.generatePlaceholder(originalUrl, aspectRatio);

    return {
      id,
      originalUrl,
      formats,
      aspectRatio,
      placeholder,
      alt,
      loading: priority >= 8 ? 'eager' : 'lazy',
      priority,
      category
    };
  }

  /**
   * Apply lazy loading to image elements
   */
  applyLazyLoading(
    images: HTMLImageElement[], 
    options?: LazyImageOptions
  ): void {
    if (!this.isSupported || !this.observer) {
      // Fallback for environments without support
      images.forEach(img => this.loadImageFallback(img, options));
      return;
    }

    images.forEach(img => {
      // Set placeholder
      if (img.dataset.placeholder) {
        img.src = img.dataset.placeholder;
        img.style.filter = 'blur(20px)';
        img.style.transition = 'filter 0.3s ease';
      }

      // Observe for lazy loading
      this.observer.observe(img);
    });
  }

  /**
   * Preload critical images
   */
  preloadCriticalImages(images: OptimizedImage[]): Promise<void[]> {
    if (!this.isSupported) {
      return Promise.resolve([]);
    }

    const criticalImages = images.filter(img => img.priority >= 8);
    const preloadPromises = criticalImages.map(img => this.preloadImage(img));

    return Promise.all(preloadPromises);
  }

  /**
   * Get best format based on browser support
   */
  getBestFormat(formats: ImageFormat[]): ImageFormat | null {
    if (!this.isSupported || formats.length === 0) {
      return formats.find(f => f.format === 'jpeg') || formats[0] || null;
    }

    // Check format support
    const supportedFormats = formats.filter(format => this.isFormatSupported(format.format));
    
    if (supportedFormats.length === 0) {
      return formats.find(f => f.format === 'jpeg') || formats[0] || null;
    }

    // Return best quality format
    return supportedFormats.reduce((best, current) => 
      (current.quality || 80) > (best.quality || 80) ? current : best
    );
  }

  /**
   * Generate responsive image sources
   */
  generateResponsiveSources(optimizedImage: OptimizedImage): string {
    const sources: string[] = [];
    const formatGroups = this.groupFormatsByType(optimizedImage.formats);

    // Generate source elements for each format
    Object.entries(formatGroups).forEach(([format, formats]) => {
      const srcSet = formats
        .map(f => `${f.url} ${f.width}w`)
        .join(', ');
      
      const sizes = this.generateSizesAttribute(optimizedImage.category);
      sources.push(`<source type="image/${format}" srcset="${srcSet}" sizes="${sizes}">`);
    });

    return sources.join('\n');
  }

  /**
   * Optimize image loading performance
   */
  optimizeLoadingPerformance(container: HTMLElement): void {
    if (!this.isSupported) {
      return;
    }

    const images = container.querySelectorAll('img[data-lazy]') as NodeListOf<HTMLImageElement>;
    this.applyLazyLoading(Array.from(images));

    // Add loading indicators
    this.addLoadingIndicators(images);
    
    // Monitor loading performance
    this.monitorLoadingPerformance(images);
  }

  /**
   * Generate image analytics
   */
  getAnalytics(): ImageAnalytics {
    return { ...this.analytics };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.loadedImages.clear();
  }

  // Private helper methods

  private generateImageId(url: string): string {
    return btoa(url).replace(/[^A-Za-z0-9]/g, '').substring(0, 12);
  }

  private generateOptimizedUrl(
    originalUrl: string, 
    width: number, 
    height: number, 
    format: string, 
    quality: number
  ): string {
    // In production, this would integrate with image optimization service
    // For now, return modified URL with optimization parameters
    const params = new URLSearchParams({
      w: width.toString(),
      h: height.toString(),
      f: format,
      q: quality.toString()
    });
    
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}${params.toString()}`;
  }

  private calculateAspectRatio(url: string, category: OptimizedImage['category']): number {
    // Default aspect ratios by category
    const defaultRatios = {
      thumbnail: 16 / 9,
      hero: 21 / 9,
      content: 4 / 3,
      avatar: 1
    };

    return defaultRatios[category] || 16 / 9;
  }

  private generatePlaceholder(url: string, aspectRatio: number): string {
    // Generate a simple colored placeholder
    const width = 40;
    const height = Math.round(width / aspectRatio);
    const canvas = this.createPlaceholderCanvas(width, height);
    return canvas || this.createSvgPlaceholder(width, height);
  }

  private createPlaceholderCanvas(width: number, height: number): string {
    if (typeof window === 'undefined' || !('CanvasRenderingContext2D' in window)) {
      return '';
    }

    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Create gradient placeholder
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, '#f0f0f0');
      gradient.addColorStop(1, '#e0e0e0');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
      
      return canvas.toDataURL('image/png');
    } catch {
      return '';
    }
  }

  private createSvgPlaceholder(width: number, height: number): string {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
      </svg>
    `)}`;
  }

  private async loadImage(img: HTMLImageElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const startTime = performance.now();
      
      const onLoad = () => {
        const loadTime = performance.now() - startTime;
        this.updateAnalytics('load', loadTime);
        
        // Remove blur effect
        img.style.filter = 'none';
        
        // Mark as loaded
        this.loadedImages.add(img.src);
        
        resolve();
      };

      const onError = (error: Event) => {
        this.updateAnalytics('error', 0);
        reject(error);
      };

      img.addEventListener('load', onLoad, { once: true });
      img.addEventListener('error', onError, { once: true });
      
      // Set the actual source
      if (img.dataset.src) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      }
    });
  }

  private loadImageFallback(img: HTMLImageElement, options?: LazyImageOptions): void {
    if (img.dataset.src) {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
      
      if (options?.onLoad) {
        img.addEventListener('load', () => options.onLoad?.(img), { once: true });
      }
    }
  }

  private async preloadImage(image: OptimizedImage): Promise<void> {
    return new Promise((resolve, reject) => {
      const bestFormat = this.getBestFormat(image.formats);
      if (!bestFormat) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = bestFormat.url;
      
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to preload: ${bestFormat.url}`));
      
      document.head.appendChild(link);
    });
  }

  private isFormatSupported(format: ImageFormat['format']): boolean {
    if (typeof window === 'undefined') {
      return format === 'jpeg'; // Safe fallback for SSR
    }

    // Check format support
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    const supportMap = {
      webp: () => canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0,
      avif: () => canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0,
      jpeg: () => true,
      png: () => true
    };

    try {
      return supportMap[format]?.() || false;
    } catch {
      return format === 'jpeg' || format === 'png';
    }
  }

  private groupFormatsByType(formats: ImageFormat[]): Record<string, ImageFormat[]> {
    return formats.reduce((groups, format) => {
      const type = format.format;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(format);
      return groups;
    }, {} as Record<string, ImageFormat[]>);
  }

  private generateSizesAttribute(category: OptimizedImage['category']): string {
    const sizeMap = {
      thumbnail: '(max-width: 480px) 100vw, (max-width: 768px) 50vw, 25vw',
      hero: '100vw',
      content: '(max-width: 768px) 100vw, 50vw',
      avatar: '(max-width: 480px) 50px, 100px'
    };

    return sizeMap[category] || '(max-width: 768px) 100vw, 50vw';
  }

  private addLoadingIndicators(images: NodeListOf<HTMLImageElement>): void {
    images.forEach(img => {
      if (img.dataset.loading !== 'false') {
        const loader = this.createLoadingIndicator();
        img.parentElement?.appendChild(loader);
        
        img.addEventListener('load', () => {
          loader.remove();
        }, { once: true });
      }
    });
  }

  private createLoadingIndicator(): HTMLElement {
    const loader = document.createElement('div');
    loader.className = 'image-loader';
    loader.innerHTML = '<div class="spinner"></div>';
    loader.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      z-index: 1;
    `;
    return loader;
  }

  private monitorLoadingPerformance(images: NodeListOf<HTMLImageElement>): void {
    const startTime = performance.now();
    let loadedCount = 0;
    
    const checkComplete = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        const totalTime = performance.now() - startTime;
        this.updateAnalytics('batch_load', totalTime / images.length);
      }
    };

    images.forEach(img => {
      img.addEventListener('load', checkComplete, { once: true });
      img.addEventListener('error', checkComplete, { once: true });
    });
  }

  private initializeAnalytics(): ImageAnalytics {
    return {
      totalImages: 0,
      optimizedImages: 0,
      averageFileSize: 0,
      formatDistribution: {},
      loadingMetrics: {
        averageLoadTime: 0,
        cacheHitRate: 0,
        errorRate: 0
      }
    };
  }

  private updateAnalytics(type: 'load' | 'error' | 'batch_load', value: number): void {
    switch (type) {
      case 'load':
        this.analytics.loadingMetrics.averageLoadTime = 
          (this.analytics.loadingMetrics.averageLoadTime + value) / 2;
        break;
      case 'error':
        this.analytics.loadingMetrics.errorRate += 1;
        break;
      case 'batch_load':
        this.analytics.loadingMetrics.averageLoadTime = value;
        break;
    }
  }
}

// Utility functions for direct use
export function createResponsiveImageHtml(
  optimizedImage: OptimizedImage,
  className?: string
): string {
  const service = new ImageOptimizationService();
  const sources = service.generateResponsiveSources(optimizedImage);
  const bestFormat = service.getBestFormat(optimizedImage.formats);
  
  if (!bestFormat) {
    return `<img src="${optimizedImage.originalUrl}" alt="${optimizedImage.alt}" class="${className || ''}" />`;
  }

  return `
    <picture class="${className || ''}">
      ${sources}
      <img 
        src="${bestFormat.url}" 
        alt="${optimizedImage.alt}"
        width="${bestFormat.width}"
        height="${bestFormat.height}"
        loading="${optimizedImage.loading}"
        style="aspect-ratio: ${optimizedImage.aspectRatio}"
      />
    </picture>
  `;
}

export function generateImageSrcSet(formats: ImageFormat[]): string {
  return formats
    .map(format => `${format.url} ${format.width}w`)
    .join(', ');
}

// Export singleton instance
export const imageOptimizationService = new ImageOptimizationService();
export default imageOptimizationService;


