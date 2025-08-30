/**
 * OptimizedImage Component
 * High-performance image loading with lazy loading, responsive images, and blur-up effect
 */

import React, { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import './OptimizedImage.css';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  placeholder?: string; // Low-quality placeholder or base64
  aspectRatio?: number; // Width/height ratio for maintaining aspect ratio
  priority?: boolean; // Load immediately without lazy loading
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fadeInDuration?: number; // Milliseconds
  observerOptions?: IntersectionObserverInit;
  fallbackSrc?: string; // Fallback image on error
  webpSrc?: string; // WebP version for supported browsers
  avifSrc?: string; // AVIF version for supported browsers
}

const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  srcSet,
  sizes,
  placeholder,
  aspectRatio,
  priority = false,
  onLoad,
  onError,
  fadeInDuration = 300,
  observerOptions = {},
  fallbackSrc = '/images/placeholder.jpg',
  webpSrc,
  avifSrc,
  className = '',
  style = {},
  ...imgProps
}) => {
  const [imageSrc, setImageSrc] = useState<string | undefined>(placeholder);
  const [imageRef, setImageRef] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Determine best image format
  const getBestImageFormat = (): string => {
    if (avifSrc && supportsAvif()) {
      return avifSrc;
    }
    if (webpSrc && supportsWebP()) {
      return webpSrc;
    }
    return src;
  };

  // Check AVIF support
  const supportsAvif = (): boolean => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/avif').indexOf('image/avif') === 0;
  };

  // Check WebP support
  const supportsWebP = (): boolean => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 0;
  };

  // Setup Intersection Observer
  useEffect(() => {
    if (priority || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01,
        ...observerOptions,
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [priority, observerOptions]);

  // Load image when in view
  useEffect(() => {
    if (!isInView) return;

    const bestSrc = getBestImageFormat();
    const img = new Image();

    img.onload = () => {
      setImageSrc(bestSrc);
      setImageRef(bestSrc);
      setIsLoaded(true);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      console.error(`Failed to load image: ${bestSrc}`);
      setHasError(true);
      setImageSrc(fallbackSrc);
      setImageRef(fallbackSrc);
      onError?.(new Error(`Failed to load image: ${bestSrc}`));
    };

    // Set srcset if provided
    if (srcSet) {
      img.srcset = srcSet;
    }

    // Set sizes if provided
    if (sizes) {
      img.sizes = sizes;
    }

    img.src = bestSrc;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [isInView, src, srcSet, sizes, fallbackSrc, webpSrc, avifSrc, onLoad, onError]);

  // Calculate padding for aspect ratio
  const paddingBottom = aspectRatio ? `${(1 / aspectRatio) * 100}%` : undefined;

  // Build class names
  const containerClassName = [
    'optimized-image-container',
    isLoaded && 'is-loaded',
    hasError && 'has-error',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={containerClassName}
      style={{
        ...style,
        paddingBottom,
        position: aspectRatio ? 'relative' : undefined,
      }}
    >
      {/* Placeholder/blur image */}
      {placeholder && !isLoaded && (
        <img
          className="optimized-image-placeholder"
          src={placeholder}
          alt=""
          aria-hidden="true"
          style={{
            position: aspectRatio ? 'absolute' : undefined,
            filter: 'blur(10px)',
            transform: 'scale(1.1)',
          }}
        />
      )}

      {/* Main image */}
      <picture>
        {avifSrc && isInView && (
          <source srcSet={avifSrc} type="image/avif" />
        )}
        {webpSrc && isInView && (
          <source srcSet={webpSrc} type="image/webp" />
        )}
        <img
          ref={imgRef}
          className="optimized-image"
          src={imageRef || (priority ? getBestImageFormat() : undefined)}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          style={{
            position: aspectRatio ? 'absolute' : undefined,
            opacity: isLoaded ? 1 : 0,
            transition: `opacity ${fadeInDuration}ms ease-in-out`,
          }}
          {...imgProps}
        />
      </picture>

      {/* Loading skeleton */}
      {!isLoaded && !placeholder && !hasError && (
        <div className="optimized-image-skeleton" aria-hidden="true" />
      )}

      {/* Error state */}
      {hasError && (
        <div className="optimized-image-error" role="img" aria-label={alt}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor">
            <path d="M21 5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5zm-2 14H5V5h14v14zM6.5 12.5l2.5 3 3.5-4.5 4.5 6H7z"/>
          </svg>
          <span>Image not available</span>
        </div>
      )}
    </div>
  );
};

// Export memoized version for performance
export default React.memo(OptimizedImage);

// Hook for preloading images
export const useImagePreloader = (images: string[]): boolean => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const preloadImages = async () => {
      const promises = images.map((src) => {
        return new Promise<void>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => reject();
          img.src = src;
        });
      });

      try {
        await Promise.all(promises);
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Failed to preload images:', error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, [images]);

  return isLoading;
};

// Utility to generate responsive image srcset
export const generateSrcSet = (
  baseUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1280, 1920]
): string => {
  return sizes
    .map((size) => {
      const url = baseUrl.replace('{width}', size.toString());
      return `${url} ${size}w`;
    })
    .join(', ');
};

// Utility to generate sizes attribute
export const generateSizes = (
  breakpoints: { maxWidth?: number; size: string }[]
): string => {
  return breakpoints
    .map(({ maxWidth, size }) => {
      if (maxWidth) {
        return `(max-width: ${maxWidth}px) ${size}`;
      }
      return size;
    })
    .join(', ');
};

// Image optimization utilities
export const imageOptimizationUtils = {
  // Convert image to base64 for placeholders
  async toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // Generate low-quality placeholder
  async generatePlaceholder(
    src: string,
    width: number = 20,
    height: number = 20
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.1));
      };

      img.onerror = reject;
      img.src = src;
    });
  },

  // Calculate optimal image dimensions
  getOptimalDimensions(
    containerWidth: number,
    devicePixelRatio: number = window.devicePixelRatio || 1
  ): number {
    return Math.ceil(containerWidth * devicePixelRatio);
  },
};