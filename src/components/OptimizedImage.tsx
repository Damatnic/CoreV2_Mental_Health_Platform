import React, { useState, useRef, useEffect } from 'react';
import { imageOptimizer, OptimizedImage as OptimizedImageData } from '../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | 'eager';
  priority?: number;
  onLoad?: () => void;
  onError?: () => void;
  style?: React.CSSProperties;
  onClick?: () => void;
}

/**
 * Optimized Image Component with Progressive Loading
 *
 * Features:
 * - Responsive image loading with multiple sizes
 * - Lazy loading with intersection observer
 * - WebP format with JPEG fallback
 * - Progressive loading with blur-up technique
 * - Bandwidth-aware image serving
 */
const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  loading = 'lazy',
  priority = 5,
  onLoad,
  onError,
  style,
  onClick
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [optimizedImage, setOptimizedImage] = useState<OptimizedImageData | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (src) {
      const optimized = imageOptimizer.generateOptimizedImages(src, {
        alt,
        priority,
        loading
      });
      setOptimizedImage(optimized);
    }
  }, [src, alt, priority, loading]);

  useEffect(() => {
    if (optimizedImage && imgRef.current && loading === "lazy") {
      imageOptimizer.setupLazyLoading(imgRef.current);
    }
  }, [optimizedImage, loading]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const handleClick = () => {
    onClick?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === ' ') {
      event.preventDefault();
      onClick?.();
    }
  };

  if (!optimizedImage) {
    return (
      <div className={`optimized-image-loading ${className}`}
        style={{
          ...style, 
          backgroundColor: "#f3f4f6"
        }}
      >
        <div className="loading-spinner" />
      </div>
    );
  }

  const containerClass = [
    "optimized-image-container",
    className,
    isLoaded ? "loaded" : "loading",
    hasError ? "error" : ""
  ].filter(Boolean).join(' ');

  // Generate srcset for responsive images
  const webpSrcSet = imageOptimizer.generateSrcSet(optimizedImage, "webp");
  const jpegSrcSet = imageOptimizer.generateSrcSet(optimizedImage, 'jpeg');
  const sizes = imageOptimizer.generateSizes();

  const containerProps = onClick ? {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    tabIndex: 0,
    role: "button",
    "aria-label": `View ${alt}`
  } : {};

  return (
    <div className={containerClass}
      style={style}
      {...containerProps}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <img className="optimized-image-placeholder"
          src={optimizedImage.placeholder}
          alt=""
          style={{
            filter: "blur(10px)",
            transform: 'scale(1.1)',
            transition: "opacity 0.3s ease-out"
          }}
        />
      )}

      {/* Main optimized image with progressive enhancement */}
      <picture>
        {/* WebP format for modern browsers */}
        <source
          srcSet={webpSrcSet}
          sizes={sizes}
          type="image/webp"
        />

        {/* JPEG fallback */}
        <img
          ref={imgRef}
          className={`optimized-image ${isLoaded ? "visible" : "hidden"}`}
          src={imageOptimizer.getOptimalFormat(optimizedImage).url}
          srcSet={jpegSrcSet}
          sizes={sizes}
          alt={alt}
          loading={loading}
          data-image-id={optimizedImage.id}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            transition: "opacity 0.3s ease-out",
            opacity: isLoaded ? 1 : 0
          }}
        />
      </picture>

      {/* Error fallback */}
      {hasError && (
        <div className="optimized-image-error">
          <span>Failed to load image</span>
        </div>
      )}

      {/* Loading indicator for eager loading */}
      {loading === "eager" && !isLoaded && !hasError && (
        <div className='optimized-image-loading-indicator'>
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

/**
 * Video Thumbnail Component
 * Specialized for wellness video thumbnails with additional features
 */
interface VideoThumbnailProps extends OptimizedImageProps {
  videoId: string;
  videoDuration?: string;
  isPlaying?: boolean;
  showPlayButton?: boolean;
  overlayContent?: React.ReactNode;
}

export const VideoThumbnail: React.FC<VideoThumbnailProps> = ({
  videoId,
  videoDuration,
  isPlaying = false,
  showPlayButton = true,
  overlayContent,
  className = "",
  ...imageProps
}) => {
  const thumbnailClass = [
    "video-thumbnail",
    className,
    isPlaying ? "playing" : ""
  ].filter(Boolean).join(" ");

  return (
    <div className={`video-thumbnail-container ${thumbnailClass}`}>
      <OptimizedImageComponent
        {...imageProps}
        className='video-thumbnail-image'
        loading={imageProps.loading || 'lazy'}
        priority={imageProps.priority || 7} // Slightly higher priority for video thumbnails
      />

      {/* Video overlay elements */}
      <div className="video-thumbnail-overlay">
        {/* Play button */}
        {showPlayButton && !isPlaying && (
          <button className="video-play-button"
            aria-label='Play video'
            onClick={imageProps.onClick}
          >
            <svg className="play-icon"
              viewBox="0 0 24 24"
              fill="currentColor"
              width="24"
              height="24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
        )}

        {/* Duration badge */}
        {videoDuration && (
          <div className="video-duration-badge">
            {videoDuration}
          </div>
        )}

        {/* Custom overlay content */}
        {overlayContent && (
          <div className="video-custom-overlay">
            {overlayContent}
          </div>
        )}
      </div>

      {/* Playing indicator */}
      {isPlaying && (
        <div className='video-playing-indicator'>
          <div className='playing-animation' />
        </div>
      )}
    </div>
  );
};

/**
 * Image Grid Component for multiple thumbnails
 */
interface ImageGridProps {
  images: Array<{
    id: string;
    src: string;
    alt: string;
    priority?: number;
  }>;
  className?: string;
  onImageClick?: (imageId: string) => void;
  maxImages?: number;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  className = "",
  onImageClick,
  maxImages = 12
}) => {
  const visibleImages = images.slice(0, maxImages);

  useEffect(() => {
    // Preload critical images (first 3)
    const criticalImages = visibleImages
      .slice(0, 3)
      .map(img => imageOptimizer.generateOptimizedImages(img.src, {
        alt: img.alt,
        priority: img.priority || 8,
        loading: "eager"
      }));

    imageOptimizer.preloadCriticalImages(criticalImages);
  }, [visibleImages]);

  return (
    <div className={`image-grid ${className}`}>
      {visibleImages.map((image, index) => (
        <OptimizedImageComponent
          key={image.id}
          src={image.src}
          alt={image.alt}
          className="image-grid-item"
          loading={index < 3 ? "eager" : "lazy"}
          priority={index < 3 ? 8 : 5}
          onClick={() => onImageClick?.(image.id)}
        />
      ))}
    </div>
  );
};

export { OptimizedImageComponent as OptimizedImage };
export default OptimizedImageComponent;