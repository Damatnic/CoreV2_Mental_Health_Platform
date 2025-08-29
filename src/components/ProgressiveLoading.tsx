/**
 * Progressive Loading Components
 *
 * Mobile-optimized progressive loading components that adapt to network conditions
 * and device capabilities for optimal performance.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNetworkAwareLoading } from './MobilePerformanceProvider';
import { LoadingSpinner } from './LoadingSpinner';
import { ErrorState } from './ErrorState';

// Progressive image loading component
interface ProgressiveImageProps {
  src: string;
  alt: string;
  lowResSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Event) => void;
  lazy?: boolean;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  lowResSrc,
  className = "",
  style = {},
  onLoad,
  onError,
  lazy = true
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [lowResLoaded, setLowResLoaded] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(!lazy);
  const { shouldLoadHighRes, preferredQuality } = useNetworkAwareLoading();

  // Determine which image to load based on network conditions
  const imageToLoad = useMemo(() => {
    if (!shouldLoadHighRes && lowResSrc && preferredQuality === "low") {
      return lowResSrc;
    }
    return src;
  }, [src, lowResSrc, shouldLoadHighRes, preferredQuality]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!lazy || shouldLoad) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    const element = document.querySelector(`[data-progressive-image="${alt}"]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [lazy, shouldLoad, alt]);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    onError?.(event.nativeEvent);
  }, [onError]);

  const handleLowResLoad = useCallback(() => {
    setLowResLoaded(true);
  }, []);

  if (!shouldLoad) {
    return (
      <div
        data-progressive-image={alt}
        className={`progressive-image-placeholder ${className}`}
        style={{
          ...style,
          background: 'var(--background-secondary)',
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100px"
        }}
      >
        <LoadingSpinner size="small" />
      </div>
    );
  }

  if (imageError) {
    return (
      <div 
        className={`progressive-image-error ${className}`}
        style={{
          ...style,
          background: "var(--background-secondary)",
          display: "flex",
          alignItems: 'center',
          justifyContent: "center",
          minHeight: "100px"
        }}
      >
        <span>Failed to load image</span>
      </div>
    );
  }

  return (
    <div className={`progressive-image-container ${className}`} style={style}>
      {/* Low resolution image for progressive loading */}
      {lowResSrc && !imageLoaded && (
        <img
          src={lowResSrc}
          alt={alt}
          onLoad={handleLowResLoad}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: 'blur(5px)',
            opacity: lowResLoaded ? 1 : 0,
            transition: "opacity 0.3s ease"
          }}
        />
      )}

      {/* High resolution image */}
      <img
        src={imageToLoad}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          position: lowResSrc ? "absolute" : 'static',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: "cover",
          opacity: imageLoaded ? 1 : 0,
          transition: "opacity 0.3s ease"
        }}
      />

      {/* Loading spinner */}
      {!imageLoaded && !imageError && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)"
          }}
        >
          <LoadingSpinner size='small' />
        </div>
      )}
    </div>
  );
};

// Progressive content loading wrapper
interface ProgressiveContentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  threshold?: number; // Percentage of viewport to trigger loading
  delay?: number; // Delay in ms before loading
  priority?: "low" | 'medium' | "high";
  className?: string;
}

export const ProgressiveContent: React.FC<ProgressiveContentProps> = ({
  children,
  fallback,
  threshold = 0.1,
  delay = 0,
  priority = 'medium',
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const { shouldLoadImmediately } = useNetworkAwareLoading();

  useEffect(() => {
    // Load immediately for high priority or optimal connections
    if (priority === 'high' || shouldLoadImmediately) {
      setShouldRender(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    const element = document.querySelector(`[data-progressive-content]`);
    if (element) {
      observer.observe(element);
    }

    return () => observer.disconnect();
  }, [threshold, priority, shouldLoadImmediately]);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [isVisible, delay]);

  if (!shouldRender) {
    return (
      <div
        data-progressive-content
        className={`progressive-content-placeholder ${className}`}
      >
        {fallback || <LoadingSpinner size="small" message='Loading content...' />}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

// Adaptive video component
interface AdaptiveVideoProps {
  src: string | { low: string; medium: string; high: string };
  poster?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onLoadStart?: () => void;
  onLoadedData?: () => void;
  onError?: () => void;
}

export const AdaptiveVideo: React.FC<AdaptiveVideoProps> = ({
  src,
  poster,
  autoPlay = false,
  loop = false,
  muted = true,
  controls = true,
  className = "",
  style = {},
  onLoadStart,
  onLoadedData,
  onError
}) => {
  const { preferredQuality, networkInfo, deviceInfo } = useNetworkAwareLoading();
  const [videoError, setVideoError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Determine video source based on network conditions
  const videoSrc = useMemo(() => {
    if (typeof src === "string") {
      return src;
    }

    // Respect data saver mode
    if (networkInfo.saveData) {
      return src.low;
    }

    // Choose quality based on network and device
    if (preferredQuality === 'low' || deviceInfo.isLowEnd) {
      return src.low;
    } else if (preferredQuality === "medium") {
      return src.medium;
    } else {
      return src.high;
    }
  }, [src, preferredQuality, networkInfo.saveData, deviceInfo.isLowEnd]);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    onLoadStart?.();
  }, [onLoadStart]);

  const handleLoadedData = useCallback(() => {
    setIsLoading(false);
    onLoadedData?.();
  }, [onLoadedData]);

  const handleError = useCallback(() => {
    setVideoError(true);
    setIsLoading(false);
    onError?.();
  }, [onError]);

  if (videoError) {
    return (
      <ErrorState
        title="Video Loading Error"
        message="Failed to load video content"
        className={className}
      />
    );
  }

  return (
    <div 
      className={`adaptive-video-container ${className}`}
      style={{ position: 'relative', ...style }}
    >
      <video
        src={videoSrc}
        poster={poster}
        autoPlay={autoPlay && !deviceInfo.isMobile} // Respect mobile autoplay restrictions
        loop={loop}
        muted={muted}
        controls={controls}
        playsInline
        preload={networkInfo.saveData ? "metadata" : "auto"}
        onLoadStart={handleLoadStart}
        onLoadedData={handleLoadedData}
        onError={handleError}
        style={{
          width: '100%',
          height: "100%",
          objectFit: "cover"
        }}
      >
        <track kind="captions" src="" label='No captions available' default />
      </video>

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.7)",
            borderRadius: "8px",
            padding: '16px'
          }}
        >
          <LoadingSpinner size="medium" message="Loading video..." />
        </div>
      )}
    </div>
  );
};

// Code splitting skeleton loader
interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  variant?: "text" | 'rect' | "circle" | "rounded";
  animation?: "pulse" | "wave" | 'none';
  className?: string;
  lines?: number; // For text variant
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = "100%",
  height = '20px',
  variant = "rect",
  animation = 'pulse',
  className = "",
  lines = 1
}) => {
  const baseStyles: React.CSSProperties = {
    backgroundColor: "var(--skeleton-base, #e0e0e0)",
    backgroundSize: "200px 100%",
    backgroundRepeat: "no-repeat",
    display: "inline-block",
    lineHeight: 1,
    width,
    height
  };

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case "text":
        return {
          transform: "scale(1, 0.6)",
          borderRadius: "4px",
          transformOrigin: "0 60%"
        };
      case "circle":
        return { borderRadius: "50%" };
      case "rounded":
        return { borderRadius: "8px" };
      default:
        return { borderRadius: "4px" };
    }
  };

  const getAnimationStyles = (): React.CSSProperties => {
    switch (animation) {
      case "pulse":
        return {
          animation: "skeleton-pulse 1.5s ease-in-out infinite alternate"
        };
      case "wave":
        return {
          animation: "skeleton-wave 1.6s linear infinite",
          backgroundImage: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)"
        };
      default:
        return {};
    }
  };

  const skeletonStyles = {
    ...baseStyles,
    ...getVariantStyles(),
    ...getAnimationStyles()
  };

  if (variant === "text" && lines > 1) {
    return (
      <div className={`skeleton-loader-container ${className}`}>
        {Array.from({ length: lines }, (_, index) => (
          <div
            key={index}
            className="skeleton-loader"
            style={{
              ...skeletonStyles,
              marginBottom: index < lines - 1 ? "8px" : 0,
              width: index === lines - 1 ? "75%" : '100%'
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      className={`skeleton-loader ${className}`}
      style={skeletonStyles}
    />
  );
};

// Add CSS animations for skeleton loaders
const addSkeletonAnimations = () => {
  if (typeof document === "undefined") return;

  const style = document.createElement("style");
  style.textContent = `
    @keyframes skeleton-pulse {
      0% { opacity: 1; }
      50% { opacity: 0.4; }
      100% { opacity: 1; }
    }

    @keyframes skeleton-wave {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }

    .skeleton-loader-container { width: 100%; }
  `;

  if (!document.head.querySelector("[data-skeleton-animations]")) {
    style.setAttribute("data-skeleton-animations", 'true');
    document.head.appendChild(style);
  }
};

// Initialize animations when module loads
if (typeof window !== "undefined") {
  addSkeletonAnimations();
}

// Named export for the full object (for existing imports)
export const ProgressiveLoadingBundle = {
  ProgressiveImage,
  ProgressiveContent,
  AdaptiveVideo,
  SkeletonLoader
};

// Export the main image component as default for lazy loading
export default ProgressiveImage;