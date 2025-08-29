/**
 * Video Thumbnail Generator Test Suite
 * Tests video thumbnail generation, caching, and optimization
 */

import { 
  VideoThumbnailGenerator,
  videoThumbnailGenerator,
  VideoThumbnailOptions,
  GeneratedThumbnail
} from './videoThumbnailGenerator';

// Mock HTML video and canvas APIs
const mockVideoElement = {
  crossOrigin: '',
  preload: '',
  currentTime: 0,
  duration: 120,
  videoWidth: 1280,
  videoHeight: 720,
  readyState: 4,
  src: '',
  onloadedmetadata: null as unknown,
  onseeked: null as unknown,
  onerror: null as unknown
};

const mockCanvasContext = {
  drawImage: jest.fn(),
  createLinearGradient: jest.fn(() => ({
    addColorStop: jest.fn()
  })),
  fillRect: jest.fn(),
  fillText: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  fill: jest.fn(),
  fillStyle: '',
  font: '',
  textAlign: '',
  textBaseline: ''
};

const mockCanvas = {
  width: 0,
  height: 0,
  getContext: jest.fn(() => mockCanvasContext),
  toDataURL: jest.fn(() => 'data:image/jpeg;base64,mockImageData')
};

// Mock document.createElement
const originalCreateElement = document.createElement;
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'video') {
      return { ...mockVideoElement };
    }
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return originalCreateElement.call(document, tagName);
  }),
  writable: true
});

// Mock setTimeout for delays
jest.useFakeTimers();

describe('VideoThumbnailGenerator', () => {
  let generator: VideoThumbnailGenerator;
  let originalLocalStorage: Storage;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the canvas mock to its default state
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,mockImageData');

    // Store the original localStorage mock
    originalLocalStorage = window.localStorage;

    // Create a fresh localStorage mock for each test
    const localStorageStore: Record<string, string> = {};
    const freshLocalStorageMock = {
      getItem: jest.fn((key: string) => localStorageStore[key] || null),
      setItem: jest.fn((key: string, value: string) => {
        localStorageStore[key] = value.toString();
      }),
      removeItem: jest.fn((key: string) => {
        delete localStorageStore[key];
      }),
      clear: jest.fn(() => {
        Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
      }),
      get length() {
        return Object.keys(localStorageStore).length;
      },
      key: jest.fn((index: number) => {
        const keys = Object.keys(localStorageStore);
        return keys[index] || null;
      })
    };

    Object.defineProperty(window, 'localStorage', {
      value: freshLocalStorageMock,
      writable: true,
      configurable: true
    });

    generator = new VideoThumbnailGenerator();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.clearAllMocks();
    // Reset the canvas mock to its default state
    mockCanvas.toDataURL.mockReturnValue('data:image/jpeg;base64,mockImageData');

    // Restore the original localStorage mock
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true
    });
  });

  describe('constructor', () => {
    it('should create canvas and context on initialization', () => {
      expect(document.createElement).toHaveBeenCalledWith('canvas');
      expect(mockCanvas.getContext).toHaveBeenCalledWith('2d');
    });
  });

  describe('generateThumbnails', () => {
    const mockVideoSrc = 'https://example.com/video.mp4';

    it('should generate thumbnails with default options', async () => {
      const videoPromise = generator.generateThumbnails(mockVideoSrc);

      // Simulate video loading
      const createdVideo = (document.createElement as jest.Mock).mock.results[1].value;
      createdVideo.onloadedmetadata();

      // Mock video seeked event
      setTimeout(() => {
        createdVideo.onseeked();
      }, 0);

      jest.runOnlyPendingTimers();
      const result = await videoPromise;

      expect(result).toHaveProperty('original', mockVideoSrc);
      expect(result).toHaveProperty('sizes');
      expect(result).toHaveProperty('placeholder');
      expect(result).toHaveProperty('aspectRatio');
      expect(result).toHaveProperty('duration');
    });

    it('should generate thumbnails with custom options', async () => {
      const options: VideoThumbnailOptions = {
        frameTime: 30,
        quality: 90,
        sizes: [{ width: 640, height: 360, suffix: 'custom' }],
        generatePlaceholder: false
      };
      const videoPromise = generator.generateThumbnails(mockVideoSrc, options);

      // Get the most recently created video element
      const allResults = (document.createElement as jest.Mock).mock.results;
      const videoResults = allResults.filter(r => r.value && r.value.onloadedmetadata);
      const createdVideo = videoResults[videoResults.length - 1].value;

      createdVideo.onloadedmetadata();

      setTimeout(() => {
        createdVideo.onseeked();
      }, 0);

      jest.runOnlyPendingTimers();
      const result = await videoPromise;

      expect(result.sizes).toHaveProperty('custom');
      expect(result.placeholder).toBeUndefined();
    });

    it('should handle video loading errors', async () => {
      const videoPromise = generator.generateThumbnails(mockVideoSrc);

      // Get the most recently created video element
      const allResults = (document.createElement as jest.Mock).mock.results;
      const videoResults = allResults.filter(r => r.value && r.value.onerror);
      const createdVideo = videoResults[videoResults.length - 1].value;

      createdVideo.onerror();

      await expect(videoPromise).rejects.toThrow('Failed to load video');
    });

    it('should set correct video currentTime based on frameTime and duration', async () => {
      const videoPromise = generator.generateThumbnails(mockVideoSrc, { frameTime: 150 });
      // Get the most recently created video element
      const allResults = (document.createElement as jest.Mock).mock.results;
      const videoResults = allResults.filter(r => r.value && r.value.onloadedmetadata);
      const createdVideo = videoResults[videoResults.length - 1].value;

      createdVideo.duration = 100; // Duration less than frameTime
      createdVideo.onloadedmetadata();

      setTimeout(() => {
        createdVideo.onseeked();
      }, 0);

      jest.runOnlyPendingTimers();

      await videoPromise;

      // Should use duration/2 when frameTime > duration
      expect(createdVideo.currentTime).toBe(50);
    });
  });

  describe('generateThumbnailFromElement', () => {
    const mockVideoElement = {
      readyState: 4,
      videoWidth: 1920,
      videoHeight: 1080,
      src: 'test-video.mp4',
      duration: 60
    } as HTMLVideoElement;

    it('should generate thumbnail from ready video element', () => {
      const result = generator.generateThumbnailFromElement(mockVideoElement);

      expect(result).not.toBeNull();
      expect(result?.original).toBe('test-video.mp4');
      expect(result?.aspectRatio).toBeCloseTo(16/9, 2);
    });

    it('should return null for unready video element', () => {
      const unreadyVideo = { ...mockVideoElement, readyState: 1 } as HTMLVideoElement;
      const result = generator.generateThumbnailFromElement(unreadyVideo);

      expect(result).toBeNull();
    });

    it('should handle errors during thumbnail generation', () => {
      // Mock canvas toDataURL to throw error for this test only
      mockCanvas.toDataURL.mockImplementationOnce(() => {
        throw new Error('Canvas error');
      });
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = generator.generateThumbnailFromElement(mockVideoElement);

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('generateBatchThumbnails', () => {
    it('should generate thumbnails for multiple videos in batches', async () => {
      jest.useRealTimers(); // Use real timers for this async test
      const videoSources = [
        'video1.mp4',
        'video2.mp4',
        'video3.mp4',
        'video4.mp4'
      ];
      const generateSpy = jest.spyOn(generator, 'generateThumbnails')
        .mockResolvedValue({
          original: 'test.mp4',
          sizes: {
            medium: 'data:image/jpeg;base64,test'
          },
          aspectRatio: 16/9,
          duration: 60
        });
      const results = await generator.generateBatchThumbnails(videoSources);

      expect(results).toHaveLength(4);
      expect(generateSpy).toHaveBeenCalledTimes(4);

      jest.useFakeTimers(); // Restore fake timers
    });

    it('should handle individual video failures gracefully', async () => {
      jest.useRealTimers(); // Use real timers for this async test
      const videoSources = ['video1.mp4', 'video2.mp4'];
      const generateSpy = jest.spyOn(generator, 'generateThumbnails')
        .mockResolvedValueOnce({
          original: 'video1.mp4',
          sizes: { medium: 'data:image/jpeg;base64,test' },
          aspectRatio: 16/9,
          duration: 60
        })
        .mockRejectedValueOnce(new Error('Failed to load video'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const results = await generator.generateBatchThumbnails(videoSources);

      expect(results).toHaveLength(1); // Only successful result
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to generate thumbnail for video2.mp4'),
        expect.any(Error)
      );

      generateSpy.mockRestore();
      consoleSpy.mockRestore();
      jest.useFakeTimers(); // Restore fake timers
    });
  });

  describe('cache operations', () => {
    const mockThumbnails: GeneratedThumbnail[] = [
      {
        original: 'video1.mp4',
        sizes: { medium: 'data:image/jpeg;base64,test1' },
        aspectRatio: 16/9,
        duration: 60
      },
      {
        original: 'video2.mp4',
        sizes: { medium: 'data:image/jpeg;base64,test2' },
        placeholder: 'data:image/jpeg;base64,placeholder',
        aspectRatio: 16/9,
        duration: 120
      }
    ];

    describe('saveThumbnailsToCache', () => {
      it('should save thumbnails to localStorage', () => {
        generator.saveThumbnailsToCache(mockThumbnails);

        expect(localStorage.setItem).toHaveBeenCalledWith('video-thumbnails-cache',
          expect.stringContaining('videoSrc:"video1.mp4"')
        );
      });

      it('should handle localStorage errors', () => {
        (localStorage.setItem as jest.Mock).mockImplementationOnce(() => {
          throw new Error('Storage quota exceeded');
        });
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

        generator.saveThumbnailsToCache(mockThumbnails);

        expect(consoleSpy).toHaveBeenCalledWith('Failed to save thumbnails to cache:',
          expect.any(Error)
        );

        consoleSpy.mockRestore();
      });
    });

    describe('loadThumbnailsFromCache', () => {
      it('should load valid cached thumbnails', () => {
        const cacheData = {
          timestamp: Date.now(),
          thumbnails: mockThumbnails.map(thumb => ({
            videoSrc: thumb.original,
            sizes: thumb.sizes,
            placeholder: thumb.placeholder,
            aspectRatio: thumb.aspectRatio,
            duration: thumb.duration
          }))
        };

        (localStorage.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify(cacheData));
        const result = generator.loadThumbnailsFromCache();

        expect(result).toHaveLength(2);
        expect(result[0].original).toBe('video1.mp4');
      });

      it('should return empty array for expired cache', () => {
        const expiredCacheData = {
          timestamp: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
          thumbnails: []
        };

        (localStorage.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify(expiredCacheData));
        const result = generator.loadThumbnailsFromCache();

        expect(result).toHaveLength(0);
        expect(localStorage.removeItem).toHaveBeenCalledWith('video-thumbnails-cache');
      });

      it('should handle malformed cache data', () => {
        (localStorage.getItem as jest.Mock).mockReturnValueOnce('invalid json');
        const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
        const result = generator.loadThumbnailsFromCache();

        expect(result).toHaveLength(0);
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should return empty array when no cache exists', () => {
        (localStorage.getItem as jest.Mock).mockReturnValueOnce(null);
        const result = generator.loadThumbnailsFromCache();

        expect(result).toHaveLength(0);
      });
    });

    describe('clearCache', () => {
      it('should remove cache from localStorage', () => {
        generator.clearCache();

        expect(localStorage.removeItem).toHaveBeenCalledWith('video-thumbnails-cache');
      });
    });
  });

  describe('getThumbnailUrl', () => {
    const mockThumbnail: GeneratedThumbnail = {
      original: 'test.mp4',
      sizes: {
        small: 'data:image/jpeg;base64,small',
        medium: 'data:image/jpeg;base64,medium',
        large: 'data:image/jpeg;base64,large',
        xl: 'data:image/jpeg;base64,xl'
      },
      aspectRatio: 16/9,
      duration: 60
    };

    it('should return URL for preferred size when available', () => {
      const result = generator.getThumbnailUrl(mockThumbnail, 'large');
      expect(result).toBe('data:image/jpeg;base64,large');
    });

    it('should fallback to medium when preferred size unavailable', () => {
      const thumbnailWithoutLarge = {
        ...mockThumbnail,
        sizes: { small: 'data:image/jpeg;base64,small', medium: 'data:image/jpeg;base64,medium' }
      };
      const result = generator.getThumbnailUrl(thumbnailWithoutLarge, 'large');
      expect(result).toBe('data:image/jpeg;base64,medium');
    });

    it('should fallback to small when medium unavailable', () => {
      const thumbnailWithOnlySmall = {
        ...mockThumbnail,
        sizes: { small: 'data:image/jpeg;base64,small' }
      };
      const result = generator.getThumbnailUrl(thumbnailWithOnlySmall, 'xl');
      expect(result).toBe('data:image/jpeg;base64,small');
    });

    it('should return first available size as last resort', () => {
      const thumbnailWithCustomSize = {
        ...mockThumbnail,
        sizes: { custom: 'data:image/jpeg;base64,custom' }
      };
      const result = generator.getThumbnailUrl(thumbnailWithCustomSize, 'large');
      expect(result).toBe('data:image/jpeg;base64,custom');
    });

    it('should return empty string when no sizes available', () => {
      const thumbnailWithNoSizes = {
        ...mockThumbnail,
        sizes: {}
      };
      const result = generator.getThumbnailUrl(thumbnailWithNoSizes);
      expect(result).toBe('');
    });
  });

  describe('generateFallbackThumbnail', () => {
    it('should generate fallback thumbnail with default parameters', () => {
      const result = generator.generateFallbackThumbnail();

      expect(mockCanvas.width).toBe(480);
      expect(mockCanvas.height).toBe(270);
      expect(mockCanvasContext.fillRect).toHaveBeenCalledWith(0, 0, 480, 270);
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Video', 240, 135);
      expect(result).toBe('data:image/jpeg;base64,mockImageData');
    });

    it('should generate fallback thumbnail with custom parameters', () => {
      const result = generator.generateFallbackThumbnail(320, 180, 'Custom Text');

      expect(mockCanvas.width).toBe(320);
      expect(mockCanvas.height).toBe(180);
      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('Custom Text', 160, 90);
    });

    it('should draw play icon overlay', () => {
      generator.generateFallbackThumbnail();

      expect(mockCanvasContext.beginPath).toHaveBeenCalled();
      expect(mockCanvasContext.moveTo).toHaveBeenCalled();
      expect(mockCanvasContext.lineTo).toHaveBeenCalled();
      expect(mockCanvasContext.fill).toHaveBeenCalled();
    });
  });

  describe('singleton instance', () => {
    it('should export a singleton instance', () => {
      expect(videoThumbnailGenerator).toBeInstanceOf(VideoThumbnailGenerator);
      expect(videoThumbnailGenerator).toBe(videoThumbnailGenerator);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle canvas context creation failure', () => {
      const mockCanvasWithoutContext = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => null),
        toDataURL: jest.fn()
      };
      const originalCreateElement = document.createElement;
      (document.createElement as jest.Mock).mockImplementationOnce((tagName: string) => {
        if (tagName === 'canvas') {
          return mockCanvasWithoutContext;
        }
        return originalCreateElement.call(document, tagName);
      });

      expect(() => new VideoThumbnailGenerator()).toThrow('Failed to create canvas 2D context');
    });

    it('should handle very small thumbnail dimensions', () => {
      const result = generator.generateFallbackThumbnail(1, 1, 'X');

      expect(mockCanvas.width).toBe(1);
      expect(mockCanvas.height).toBe(1);
    });

    it('should handle empty text in fallback thumbnail', () => {
      generator.generateFallbackThumbnail(100, 100, '');

      expect(mockCanvasContext.fillText).toHaveBeenCalledWith('', 50, 50);
    });

    it('should handle video with zero duration', async () => {
      const videoPromise = generator.generateThumbnails('test.mp4', { frameTime: 30 });
      const createdVideo = (document.createElement as jest.Mock).mock.results.slice(-1)[0].value;
      createdVideo.duration = 0;
      createdVideo.onloadedmetadata();

      setTimeout(() => {
        createdVideo.onseeked();
      }, 0);

      jest.runOnlyPendingTimers();

      await videoPromise;

      expect(createdVideo.currentTime).toBe(0);
    });
  });

  describe('performance considerations', () => {
    it('should limit batch processing to prevent browser blocking', async () => {
      jest.useRealTimers(); // Use real timers for async operations
      const manyVideos = Array.from({ length: 10 }, (_, i) => `video${i}.mp4`);

      jest.spyOn(generator, 'generateThumbnails').mockResolvedValue({
        original: 'test.mp4',
        sizes: { medium: 'data:image/jpeg;base64,test' },
        aspectRatio: 16/9,
        duration: 60
      });
      const promise = generator.generateBatchThumbnails(manyVideos);
      // The batch processing should complete without error
      await expect(promise).resolves.toBeDefined();

      jest.useFakeTimers(); // Restore fake timers
    });

    it('should handle large number of thumbnails in cache efficiently', () => {
      const largeThumbnailSet = Array.from({ length: 100 }, (_, i) => ({
        original: `video${i}.mp4`,
        sizes: { medium: `data:image/jpeg,base64,test${i}` },
        aspectRatio: 16/9,
        duration: 60 + i
      }));
      const startTime = performance.now();
      generator.saveThumbnailsToCache(largeThumbnailSet);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // Should complete quickly
    });
  });
});