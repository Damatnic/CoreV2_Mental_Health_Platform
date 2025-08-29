/**
 * Video Thumbnail Generator
 *
 * Generates optimized thumbnails from video files for wellness videos
 * Features:
 * - Extract frames from video sources
 * - Generate multiple thumbnail sizes
 * - Create placeholder images
 * - Optimize for mobile performance
 */

import { logger } from './logger';

export interface VideoThumbnailOptions {
  frameTime?: number; // Time in seconds to extract frame (default: 1)
  quality?: number; // JPEG quality 0-100 (default: 85)
  sizes?: Array<{ width: number; height: number; suffix: string }>;
  generatePlaceholder?: boolean;
}

export interface ThumbnailResult {
  thumbnails: Array<{
    size: string;
    dataUrl: string;
    blob: Blob;
    width: number;
    height: number;
  }>;
  placeholder?: string;
  originalDimensions: {
    width: number;
    height: number;
  };
}

class VideoThumbnailGenerator {
  private readonly defaultSizes = [
    { width: 320, height: 180, suffix: 'small' },
    { width: 640, height: 360, suffix: 'medium' },
    { width: 1280, height: 720, suffix: 'large' }
  ];

  /**
   * Generate thumbnails from video file or URL
   */
  public async generateThumbnails(
    videoSource: File | string,
  options: VideoThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    const {
  frameTime = 1,
      quality = 85,
      sizes = this.defaultSizes,
      generatePlaceholder = true
    } = options;

    try {
      const video = await this.loadVideo(videoSource);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to get canvas context');
      }

      // Set video time to extract frame
      video.currentTime = frameTime;
      
      // Wait for video to load the frame
      await new Promise((resolve) => {
        video.addEventListener('seeked', resolve, { once: true });
      });

      const originalDimensions = {
        width: video.videoWidth,
        height: video.videoHeight
      };

      const thumbnails = [];

      // Generate thumbnails for each size
      for (const size of sizes) {
        canvas.width = size.width;
        canvas.height = size.height;

        // Draw video frame to canvas with proper scaling
        ctx.drawImage(video, 0, 0, size.width, size.height);

        // Convert to blob
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                reject(new Error('Failed to generate thumbnail blob'));
              }
            },
            'image/jpeg',
            quality / 100
          );
        });

        const dataUrl = canvas.toDataURL('image/jpeg', quality / 100);

        thumbnails.push({
          size: size.suffix,
          dataUrl,
          blob,
          width: size.width,
          height: size.height
        });
      }

      const result: ThumbnailResult = {
        thumbnails,
        originalDimensions
      };

      // Generate placeholder if requested
      if (generatePlaceholder) {
        result.placeholder = await this.generatePlaceholder(originalDimensions);
      }

      // Clean up
      video.remove();

      return result;
    } catch (error) {
      logger.error('Thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * Load video element from file or URL
   */
  private async loadVideo(videoSource: File | string): Promise<HTMLVideoElement> {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;

    return new Promise((resolve, reject) => {
      video.addEventListener('loadedmetadata', () => {
        resolve(video);
      });

      video.addEventListener('error', () => {
        reject(new Error('Failed to load video'));
      });

      if (typeof videoSource === 'string') {
        video.src = videoSource;
      } else {
        video.src = URL.createObjectURL(videoSource);
      }

      video.load();
    });
  }

  /**
   * Generate a placeholder image with video dimensions
   */
  private async generatePlaceholder(dimensions: { width: number; height: number }): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Unable to get canvas context for placeholder');
    }

    canvas.width = 320;
    canvas.height = 180;

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add play icon
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const playIconSize = 40;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.moveTo(centerX - playIconSize / 3, centerY - playIconSize / 2);
    ctx.lineTo(centerX - playIconSize / 3, centerY + playIconSize / 2);
    ctx.lineTo(centerX + playIconSize / 2, centerY);
    ctx.closePath();
    ctx.fill();

    // Add dimensions text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${dimensions.width}x${dimensions.height}`,
      centerX,
      centerY + playIconSize / 2 + 20
    );

    return canvas.toDataURL('image/jpeg', 0.8);
  }

  /**
   * Extract multiple frames from video
   */
  public async extractFrames(
    videoSource: File | string,
    frameCount: number = 5,
    size: { width: number; height: number } = { width: 160, height: 90 }
  ): Promise<string[]> {
    try {
      const video = await this.loadVideo(videoSource);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Unable to get canvas context');
      }

      canvas.width = size.width;
      canvas.height = size.height;

      const duration = video.duration;
      const frames: string[] = [];

      for (let i = 0; i < frameCount; i++) {
        const frameTime = (duration / (frameCount + 1)) * (i + 1);
        video.currentTime = frameTime;

        await new Promise((resolve) => {
          video.addEventListener('seeked', resolve, { once: true });
        });

        ctx.drawImage(video, 0, 0, size.width, size.height);
        frames.push(canvas.toDataURL('image/jpeg', 0.8));
      }

      video.remove();
      return frames;
    } catch (error) {
      logger.error('Frame extraction failed:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail from video URL with caching
   */
  public async generateCachedThumbnail(
    videoUrl: string,
    cacheKey: string,
    options: VideoThumbnailOptions = {}
  ): Promise<ThumbnailResult> {
    try {
      // Check if thumbnail exists in cache
      const cached = await this.getCachedThumbnail(cacheKey);
      if (cached) {
        return cached;
      }

      // Generate new thumbnail
      const result = await this.generateThumbnails(videoUrl, options);

      // Cache the result
      await this.cacheThumbnail(cacheKey, result);

      return result;
    } catch (error) {
      logger.error('Cached thumbnail generation failed:', error);
      throw error;
    }
  }

  /**
   * Get cached thumbnail from localStorage
   */
  private async getCachedThumbnail(cacheKey: string): Promise<ThumbnailResult | null> {
    try {
      const cached = localStorage.getItem(`thumbnail_${cacheKey}`);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  /**
   * Cache thumbnail in localStorage
   */
  private async cacheThumbnail(cacheKey: string, result: ThumbnailResult): Promise<void> {
    try {
      // Remove blob data for storage (too large)
      const cacheData = {
        ...result,
        thumbnails: result.thumbnails.map(({ blob, ...thumb }) => thumb)
      };
      
      localStorage.setItem(`thumbnail_${cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
      logger.warn('Failed to cache thumbnail:', error);
    }
  }

  /**
   * Clear thumbnail cache
   */
  public clearCache(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('thumbnail_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      logger.warn('Failed to clear thumbnail cache:', error);
    }
  }
}

export const videoThumbnailGenerator = new VideoThumbnailGenerator();
export default videoThumbnailGenerator;
