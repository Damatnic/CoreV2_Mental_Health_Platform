/**
 * Optimized Image Loader Component
 * 
 * Provides lazy loading, responsive images, and progressive loading
 */

import React, { useState, useEffect, useRef } from 'react';

interface OptimizedImageLoaderProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  placeholder?: string;
  srcSet?: string;
  sizes?: string;
  loading?: 'lazy' | 'eager';
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  fallback?: string;
}

export const OptimizedImageLoader: React.FC<OptimizedImageLoaderProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  srcSet,
  sizes,
  loading = 'lazy',
  priority = false,
  onLoad,
  onError,
  fallback = '/images/placeholder.png'
}) => {
  const [imageSrc, setImageSrc] = useState<string>(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (priority || loading === 'eager') {
      loadImage();
    } else {
      setupIntersectionObserver();
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [src, priority, loading]);

  const setupIntersectionObserver = () => {
    if (!imgRef.current || typeof IntersectionObserver === 'undefined') {
      loadImage();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadImage();
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    observerRef.current.observe(imgRef.current);
  };

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      onLoad?.();
    };

    img.onerror = () => {
      setImageSrc(fallback);
      setIsLoading(false);
      setHasError(true);
      onError?.(new Error(`Failed to load image: ${src}`));
    };

    img.src = src;
    if (srcSet) img.srcset = srcSet;
    if (sizes) img.sizes = sizes;
  };

  const handleImageError = () => {
    if (!hasError) {
      setImageSrc(fallback);
      setHasError(true);
      onError?.(new Error(`Failed to load image: ${src}`));
    }
  };

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      {isLoading && placeholder && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse rounded" />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc || placeholder || fallback}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        width={width}
        height={height}
        srcSet={imageSrc ? srcSet : undefined}
        sizes={imageSrc ? sizes : undefined}
        loading={loading}
        onError={handleImageError}
      />
      
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded">
          <svg
            className="w-8 h-8 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

/**
 * Preload images for better performance
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload: ${src}`));
    img.src = src;
  });
};

/**
 * Preload multiple images
 */
export const preloadImages = (sources: string[]): Promise<void[]> => {
  return Promise.all(sources.map(preloadImage));
};

export default OptimizedImageLoader;



