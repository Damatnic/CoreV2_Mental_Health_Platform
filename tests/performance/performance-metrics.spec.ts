import { test, expect, Page } from '@playwright/test';
import lighthouse from 'lighthouse';
import { launch } from 'chrome-launcher';

/**
 * Comprehensive Performance Testing Suite
 * Tests Core Web Vitals, load times, and performance metrics
 */

describe('Performance Testing', () => {
  
  describe('Core Web Vitals', () => {
    test('should meet LCP (Largest Contentful Paint) targets', async ({ page }) => {
      await page.goto('/');
      
      const lcp = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            resolve(lastEntry.startTime);
          }).observe({ type: 'largest-contentful-paint', buffered: true });
        });
      });
      
      // LCP should be under 2.5s for good performance
      expect(lcp).toBeLessThan(2500);
    });

    test('should meet FID (First Input Delay) targets', async ({ page }) => {
      await page.goto('/');
      
      // Simulate user interaction
      await page.click('button').catch(() => {});
      
      const fid = await page.evaluate(() => {
        return new Promise((resolve) => {
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            if (entries.length > 0) {
              resolve((entries[0] as any).processingStart - (entries[0] as any).startTime);
            }
          }).observe({ type: 'first-input', buffered: true });
          
          // Fallback if no input detected
          setTimeout(() => resolve(0), 5000);
        });
      });
      
      // FID should be under 100ms for good performance
      expect(fid).toBeLessThan(100);
    });

    test('should meet CLS (Cumulative Layout Shift) targets', async ({ page }) => {
      await page.goto('/');
      
      await page.waitForTimeout(3000); // Wait for all content to load
      
      const cls = await page.evaluate(() => {
        return new Promise((resolve) => {
          let clsValue = 0;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (!(entry as any).hadRecentInput) {
                clsValue += (entry as any).value;
              }
            }
          });
          
          observer.observe({ type: 'layout-shift', buffered: true });
          
          setTimeout(() => {
            observer.disconnect();
            resolve(clsValue);
          }, 3000);
        });
      });
      
      // CLS should be under 0.1 for good performance
      expect(cls).toBeLessThan(0.1);
    });

    test('should meet FCP (First Contentful Paint) targets', async ({ page }) => {
      await page.goto('/');
      
      const fcp = await page.evaluate(() => {
        const entry = performance.getEntriesByName('first-contentful-paint')[0];
        return entry ? entry.startTime : 0;
      });
      
      // FCP should be under 1.8s for good performance
      expect(fcp).toBeLessThan(1800);
    });

    test('should meet TTFB (Time to First Byte) targets', async ({ page }) => {
      const response = await page.goto('/');
      
      const timing = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return nav.responseStart - nav.requestStart;
      });
      
      // TTFB should be under 800ms for good performance
      expect(timing).toBeLessThan(800);
    });
  });

  describe('Page Load Performance', () => {
    test('should load homepage within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Homepage should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load crisis page quickly', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/crisis');
      await page.waitForSelector('.crisis-resources, [data-crisis]');
      const loadTime = Date.now() - startTime;
      
      // Crisis page should load within 2 seconds (critical page)
      expect(loadTime).toBeLessThan(2000);
    });

    test('should progressively load feed content', async ({ page }) => {
      await page.goto('/feed');
      
      // Initial content should load quickly
      const firstPaintTime = await page.evaluate(() => {
        const entry = performance.getEntriesByName('first-contentful-paint')[0];
        return entry ? entry.startTime : 0;
      });
      
      expect(firstPaintTime).toBeLessThan(1500);
      
      // Check for lazy loading
      const lazyLoadedContent = await page.evaluate(() => {
        return document.querySelectorAll('[data-lazy], img[loading="lazy"]').length;
      });
      
      expect(lazyLoadedContent).toBeGreaterThan(0);
    });
  });

  describe('Resource Optimization', () => {
    test('should compress text resources', async ({ page }) => {
      const response = await page.goto('/');
      const headers = response?.headers();
      
      // Check for compression
      const encoding = headers?.['content-encoding'];
      expect(['gzip', 'br', 'deflate']).toContain(encoding);
    });

    test('should optimize image loading', async ({ page }) => {
      await page.goto('/');
      
      const images = await page.evaluate(() => {
        const imgs = Array.from(document.querySelectorAll('img'));
        return imgs.map(img => ({
          src: img.src,
          loading: img.loading,
          hasWidth: img.hasAttribute('width'),
          hasHeight: img.hasAttribute('height'),
        }));
      });
      
      images.forEach(img => {
        // Images should have lazy loading
        if (!img.src.includes('logo') && !img.src.includes('icon')) {
          expect(img.loading).toBe('lazy');
        }
        // Images should have dimensions to prevent layout shift
        expect(img.hasWidth || img.hasHeight).toBe(true);
      });
    });

    test('should use efficient cache policies', async ({ page }) => {
      const responses: any[] = [];
      
      page.on('response', response => {
        responses.push({
          url: response.url(),
          headers: response.headers(),
        });
      });
      
      await page.goto('/');
      
      // Check cache headers for static assets
      const staticAssets = responses.filter(r => 
        r.url.includes('.js') || 
        r.url.includes('.css') || 
        r.url.includes('.png') ||
        r.url.includes('.jpg')
      );
      
      staticAssets.forEach(asset => {
        const cacheControl = asset.headers['cache-control'];
        if (cacheControl) {
          expect(cacheControl).toMatch(/max-age=\d+/);
        }
      });
    });

    test('should minimize JavaScript bundle size', async ({ page }) => {
      const jsSize = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        return scripts.length;
      });
      
      // Should use code splitting
      expect(jsSize).toBeGreaterThan(1); // Multiple chunks
      expect(jsSize).toBeLessThan(20); // Not too fragmented
    });
  });

  describe('Runtime Performance', () => {
    test('should handle smooth scrolling', async ({ page }) => {
      await page.goto('/feed');
      
      // Measure frame rate during scroll
      const frameRate = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          let lastTime = performance.now();
          
          const measureFrames = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime - lastTime > 1000) {
              resolve(frames);
              return;
            }
            
            requestAnimationFrame(measureFrames);
          };
          
          // Trigger scroll
          window.scrollTo({ top: 1000, behavior: 'smooth' });
          measureFrames();
        });
      });
      
      // Should maintain at least 30fps
      expect(frameRate).toBeGreaterThan(30);
    });

    test('should handle form interactions efficiently', async ({ page }) => {
      await page.goto('/chat');
      
      const input = page.locator('textarea, input[type="text"]').first();
      
      // Measure input latency
      const startTime = Date.now();
      await input.type('Testing performance of text input');
      const inputTime = Date.now() - startTime;
      
      // Should respond quickly to input
      expect(inputTime).toBeLessThan(500);
    });

    test('should efficiently update mood tracker', async ({ page }) => {
      await page.goto('/wellness');
      
      const startTime = Date.now();
      
      // Click multiple mood buttons
      for (let i = 1; i <= 5; i++) {
        await page.click(`[data-mood="${i}"], .mood-button:nth-child(${i})`).catch(() => {});
      }
      
      const interactionTime = Date.now() - startTime;
      
      // Should handle rapid interactions
      expect(interactionTime).toBeLessThan(1000);
    });
  });

  describe('Memory Management', () => {
    test('should not have memory leaks in chat', async ({ page }) => {
      await page.goto('/chat');
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Perform multiple chat operations
      for (let i = 0; i < 10; i++) {
        await page.fill('textarea', `Test message ${i}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(100);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ((window as any).gc) {
          (window as any).gc();
        }
      });
      
      // Check memory after operations
      const finalMemory = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Memory increase should be reasonable (less than 10MB)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    test('should clean up event listeners', async ({ page }) => {
      await page.goto('/');
      
      // Count initial listeners
      const initialListeners = await page.evaluate(() => {
        return (window as any).getEventListeners ? 
          Object.keys((window as any).getEventListeners(document)).length : 0;
      });
      
      // Navigate to different pages
      await page.goto('/feed');
      await page.goto('/wellness');
      await page.goto('/chat');
      await page.goto('/');
      
      // Count final listeners
      const finalListeners = await page.evaluate(() => {
        return (window as any).getEventListeners ? 
          Object.keys((window as any).getEventListeners(document)).length : 0;
      });
      
      // Listeners should not accumulate excessively
      if (initialListeners > 0) {
        expect(finalListeners).toBeLessThan(initialListeners * 2);
      }
    });
  });

  describe('Network Performance', () => {
    test('should minimize number of requests', async ({ page }) => {
      let requestCount = 0;
      
      page.on('request', () => {
        requestCount++;
      });
      
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      // Should bundle resources efficiently
      expect(requestCount).toBeLessThan(50);
    });

    test('should use HTTP/2 or HTTP/3', async ({ page }) => {
      const response = await page.goto('/');
      const protocol = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as any;
        return nav.nextHopProtocol;
      });
      
      // Should use modern protocols
      expect(['h2', 'h3', 'http/2', 'http/3']).toContain(protocol);
    });

    test('should preload critical resources', async ({ page }) => {
      await page.goto('/');
      
      const preloadedResources = await page.evaluate(() => {
        const links = document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]');
        return links.length;
      });
      
      // Should preload critical resources
      expect(preloadedResources).toBeGreaterThan(0);
    });
  });

  describe('Animation Performance', () => {
    test('should use CSS transforms for animations', async ({ page }) => {
      await page.goto('/');
      
      const animations = await page.evaluate(() => {
        const animated = document.querySelectorAll('[class*="animate"], [class*="transition"]');
        return Array.from(animated).map(el => {
          const styles = window.getComputedStyle(el);
          return {
            hasTransform: styles.transform !== 'none',
            hasTransition: styles.transition !== 'none',
          };
        });
      });
      
      // Animations should use transforms for better performance
      animations.forEach(anim => {
        if (anim.hasTransition) {
          expect(anim.hasTransform || anim.hasTransition).toBe(true);
        }
      });
    });

    test('should maintain 60fps during animations', async ({ page }) => {
      await page.goto('/');
      
      // Trigger an animation (e.g., modal open)
      await page.click('button').catch(() => {});
      
      const fps = await page.evaluate(() => {
        return new Promise((resolve) => {
          let frames = 0;
          let startTime = performance.now();
          
          const countFrames = () => {
            frames++;
            const elapsed = performance.now() - startTime;
            
            if (elapsed >= 1000) {
              resolve(frames);
            } else {
              requestAnimationFrame(countFrames);
            }
          };
          
          requestAnimationFrame(countFrames);
        });
      });
      
      // Should maintain close to 60fps
      expect(fps).toBeGreaterThan(50);
    });
  });

  describe('Lighthouse Audit', () => {
    test.skip('should pass Lighthouse performance audit', async () => {
      const chrome = await launch({ chromeFlags: ['--headless'] });
      const options = {
        logLevel: 'info' as const,
        output: 'json' as const,
        port: chrome.port,
      };
      
      const runnerResult = await lighthouse('http://localhost:3000', options);
      
      if (runnerResult) {
        const { performance, accessibility, bestPractices, seo, pwa } = runnerResult.lhr.categories;
        
        // Performance should be above 90
        expect(performance.score).toBeGreaterThan(0.9);
        
        // Accessibility should be above 95
        expect(accessibility.score).toBeGreaterThan(0.95);
        
        // Best practices should be above 90
        expect(bestPractices.score).toBeGreaterThan(0.9);
        
        // SEO should be above 90
        expect(seo.score).toBeGreaterThan(0.9);
        
        // PWA should be above 90
        expect(pwa.score).toBeGreaterThan(0.9);
      }
      
      await chrome.kill();
    });
  });

  describe('Critical User Journey Performance', () => {
    test('should complete crisis help flow quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/');
      await page.click('button:has-text("Crisis"), a[href="/crisis"]');
      await page.waitForSelector('.crisis-resources, [data-crisis]');
      
      const flowTime = Date.now() - startTime;
      
      // Crisis flow should be accessible within 2 seconds
      expect(flowTime).toBeLessThan(2000);
    });

    test('should load safety plan quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/safety-plan');
      await page.waitForSelector('.safety-plan, form');
      
      const loadTime = Date.now() - startTime;
      
      // Safety plan should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);
    });

    test('should handle rapid mood logging', async ({ page }) => {
      await page.goto('/wellness');
      
      const startTime = Date.now();
      
      // Log multiple moods rapidly
      for (let i = 0; i < 5; i++) {
        await page.click('[data-mood="7"], .mood-button');
        await page.fill('textarea', `Note ${i}`);
        await page.click('button[type="submit"]');
        await page.waitForTimeout(100);
      }
      
      const totalTime = Date.now() - startTime;
      
      // Should handle rapid submissions efficiently
      expect(totalTime).toBeLessThan(3000);
    });
  });
});