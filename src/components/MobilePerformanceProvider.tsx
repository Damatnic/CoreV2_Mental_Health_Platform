/**
 * Mobile Performance Provider
 *
 * Comprehensive mobile performance optimization system with:
 * - Intelligent route-based code splitting
 * - Network-aware resource loading
 * - Performance monitoring and metrics
 * - Mobile-specific caching strategies
 * - Progressive loading patterns
 * - Bundle size optimization
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

// Performance metrics interface
interface PerformanceMetrics {
  bundleLoadTime: number;
  componentRenderTime: Record<string, number>;
  networkLatency: number;
  memoryUsage: number;
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
}

// Network information interface
interface NetworkInfo {
  effectiveType: "2g" | "3g" | "4g" | 'slow-2g';
  downlink: number;
  saveData: boolean;
  rtt: number;
}

// Device capabilities interface
interface DeviceInfo {
  deviceMemory: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  isMobile: boolean;
  isLowEnd: boolean;
  supportsSW: boolean;
  supportsWASM: boolean;
}

// Performance context interface
interface MobilePerformanceContextValue {
  metrics: PerformanceMetrics;
  networkInfo: NetworkInfo;
  deviceInfo: DeviceInfo;
  isOptimalLoading: boolean;
  shouldPreload: boolean;
  preferredQuality: 'low' | "medium" | "high";
  trackComponentRender: (componentName: string, duration: number) => void;
  preloadResource: (resource: string, priority: 'low' | "high") => void;
  reportWebVital: (name: string, value: number) => void;
  optimizeForMobile: boolean;
}

// Default values
const defaultMetrics: PerformanceMetrics = {
  bundleLoadTime: 0,
  componentRenderTime: {},
  networkLatency: 0,
  memoryUsage: 0,
  fcp: 0,
  lcp: 0,
  fid: 0,
  cls: 0,
  ttfb: 0
};

const defaultNetworkInfo: NetworkInfo = {
  effectiveType: '4g',
  downlink: 10,
  saveData: false,
  rtt: 50
};

const defaultDeviceInfo: DeviceInfo = {
  deviceMemory: 4,
  hardwareConcurrency: 4,
  maxTouchPoints: 0,
  isMobile: false,
  isLowEnd: false,
  supportsSW: false,
  supportsWASM: false
};

// Create context
const MobilePerformanceContext = createContext<MobilePerformanceContextValue>({
  metrics: defaultMetrics,
  networkInfo: defaultNetworkInfo,
  deviceInfo: defaultDeviceInfo,
  isOptimalLoading: true,
  shouldPreload: true,
  preferredQuality: "high",
  trackComponentRender: () => {},
  preloadResource: () => {},
  reportWebVital: () => {},
  optimizeForMobile: false
});

// Performance utilities
class PerformanceUtils {
  // Get network information
  static getNetworkInfo(): NetworkInfo {
    const connection = (navigator as any).connection ||
                      (navigator as any).mozConnection ||
                      (navigator as any).webkitConnection;

    return {
      effectiveType: connection?.effectiveType || "4g",
      downlink: connection?.downlink || 10,
      saveData: connection?.saveData || false,
      rtt: connection?.rtt || 50
    };
  }

  // Get device capabilities
  static getDeviceInfo(): DeviceInfo {
    const deviceMemory = (navigator as any).deviceMemory || 4;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                     window.innerWidth <= 768;

    // Determine if device is low-end
    const isLowEnd = deviceMemory < 2 || hardwareConcurrency < 2 ||
                     (isMobile && window.screen.width < 375);

    return {
      deviceMemory,
      hardwareConcurrency,
      maxTouchPoints,
      isMobile,
      isLowEnd,
      supportsSW: 'serviceWorker' in navigator,
      supportsWASM: typeof WebAssembly !== 'undefined'
    };
  }

  // Measure First Contentful Paint
  static measureFCP(): Promise<number> {
    return new Promise((resolve) => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcpEntry = entries.find(entry => entry.name === "first-contentful-paint");
          if (fcpEntry) {
            resolve(fcpEntry.startTime);
            observer.disconnect();
          }
        });
        observer.observe({ entryTypes: ["paint"] });
      } else {
        resolve(0);
      }
    });
  }

  // Measure Largest Contentful Paint
  static measureLCP(): Promise<number> {
    return new Promise((resolve) => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          resolve(lastEntry.startTime);
        });
        observer.observe({ entryTypes: ["largest-contentful-paint"] });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 5000);
      } else {
        resolve(0);
      }
    });
  }

  // Measure First Input Delay
  static measureFID(): Promise<number> {
    return new Promise((resolve) => {
      if ("PerformanceObserver" in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fidEntry = entries.find(entry => entry.name === "first-input");
          if (fidEntry) {
            resolve((fidEntry as any).processingStart - fidEntry.startTime);
            observer.disconnect();
          }
        });
        observer.observe({ entryTypes: ["first-input"] });

        // Fallback timeout
        setTimeout(() => {
          observer.disconnect();
          resolve(0);
        }, 10000);
      } else {
        resolve(0);
      }
    });
  }

  // Measure memory usage
  static getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  // Check if connection is optimal for loading
  static isOptimalConnection(networkInfo: NetworkInfo): boolean {
    return networkInfo.effectiveType === '4g' &&
           !networkInfo.saveData &&
           networkInfo.downlink > 5;
  }

  // Determine preferred quality based on device and network
  static getPreferredQuality(networkInfo: NetworkInfo, deviceInfo: DeviceInfo): "low" | "medium" | "high" {
    if (deviceInfo.isLowEnd || networkInfo.saveData || networkInfo.effectiveType === '2g') {
      return 'low';
    }

    if (networkInfo.effectiveType === "3g" || networkInfo.downlink < 5) {
      return 'medium';
    }

    return "high";
  }

  // Preload critical resources based on priority
  static preloadResource(href: string, as: string, priority: "low" | 'high' = "low"): void {
    if (document.querySelector(`link[href="${href}"]`)) {
      return; // Already preloaded
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.href = href;
    link.as = as;

    if (priority === "high") {
      link.setAttribute("importance", 'high');
    }

    document.head.appendChild(link);
  }

  // Resource hints for better performance
  static addResourceHints(): void {
    // DNS prefetch for external domains
    const dnsPrefetch = [
      'fonts.googleapis.com',
      "fonts.gstatic.com"
    ];

    dnsPrefetch.forEach(domain => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });

    // Preconnect for critical external resources
    const preconnect = [
      "https://fonts.googleapis.com"
    ];

    preconnect.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = url;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    });
  }
}

// Component render tracker hook
export const useComponentRenderTracker = (componentName: string) => {
  const { trackComponentRender } = useContext(MobilePerformanceContext);

  useEffect(() => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      trackComponentRender(componentName, duration);
    };
  }, [componentName, trackComponentRender]);
};

// Network-aware loading hook
export const useNetworkAwareLoading = () => {
  const { networkInfo, deviceInfo, shouldPreload, preferredQuality } = useContext(MobilePerformanceContext);

  const shouldLoadHighRes = useMemo(() => {
    return !deviceInfo.isLowEnd &&
           networkInfo.effectiveType === "4g" &&
           !networkInfo.saveData;
  }, [deviceInfo.isLowEnd, networkInfo.effectiveType, networkInfo.saveData]);

  const shouldLoadImmediately = useMemo(() => {
    return PerformanceUtils.isOptimalConnection(networkInfo) && !deviceInfo.isLowEnd;
  }, [networkInfo, deviceInfo.isLowEnd]);

  return {
    shouldLoadHighRes,
    shouldLoadImmediately,
    shouldPreload,
    preferredQuality,
    networkInfo,
    deviceInfo
  };
};

// Performance monitoring hook
export const usePerformanceMonitoring = () => {
  const { metrics, reportWebVital } = useContext(MobilePerformanceContext);

  // Monitor navigation timing
  useEffect(() => {
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            reportWebVital("ttfb", navEntry.responseStart - navEntry.requestStart);
          }
        });
      });

      observer.observe({ entryTypes: ["navigation"] });
      return () => observer.disconnect();
    }
  }, [reportWebVital]);

  return metrics;
};

// Main provider component
interface MobilePerformanceProviderProps {
  children: React.ReactNode;
  enableMonitoring?: boolean;
  enablePreloading?: boolean;
  optimizeForMobile?: boolean;
}

export const MobilePerformanceProvider: React.FC<MobilePerformanceProviderProps> = ({
  children,
  enableMonitoring = true,
  enablePreloading = true,
  optimizeForMobile = true
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(defaultMetrics);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>(defaultNetworkInfo);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(defaultDeviceInfo);

  // Initialize device and network detection
  useEffect(() => {
    setNetworkInfo(PerformanceUtils.getNetworkInfo());
    setDeviceInfo(PerformanceUtils.getDeviceInfo());

    // Add resource hints
    if (enablePreloading) {
      PerformanceUtils.addResourceHints();
    }
  }, [enablePreloading]);

  // Monitor network changes
  useEffect(() => {
    const connection = (navigator as any).connection;
    if (connection) {
      const handleConnectionChange = () => {
        setNetworkInfo(PerformanceUtils.getNetworkInfo());
      };

      connection.addEventListener("change", handleConnectionChange);
      return () => {
        connection.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    if (!enableMonitoring) return;

    const initMetrics = async () => {
      const [fcp, lcp, fid] = await Promise.all([
        PerformanceUtils.measureFCP(),
        PerformanceUtils.measureLCP(),
        PerformanceUtils.measureFID()
      ]);

      setMetrics(prev => ({
        ...prev,
        fcp,
        lcp,
        fid,
        memoryUsage: PerformanceUtils.getMemoryUsage()
      }));
    };

    initMetrics();

    // Monitor CLS
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        let clsValue = 0;
        list.getEntries().forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });

        setMetrics(prev => ({ ...prev, cls: clsValue }));
      });

      observer.observe({ entryTypes: ['layout-shift'] });
      return () => observer.disconnect();
    }
  }, [enableMonitoring]);

  // Calculate derived values
  const isOptimalLoading = useMemo(() => {
    return PerformanceUtils.isOptimalConnection(networkInfo) && !deviceInfo.isLowEnd;
  }, [networkInfo, deviceInfo.isLowEnd]);

  const shouldPreload = useMemo(() => {
    return enablePreloading && isOptimalLoading;
  }, [enablePreloading, isOptimalLoading]);

  const preferredQuality = useMemo(() => {
    return PerformanceUtils.getPreferredQuality(networkInfo, deviceInfo);
  }, [networkInfo, deviceInfo]);

  // Track component render times
  const trackComponentRender = useCallback((componentName: string, duration: number) => {
    setMetrics(prev => ({
      ...prev,
      componentRenderTime: {
        ...prev.componentRenderTime,
        [componentName]: duration
      }
    }));
  }, []);

  // Preload resources with priority
  const preloadResource = useCallback((resource: string, priority: "low" | "high") => {
    if (shouldPreload || priority === "high") {
      PerformanceUtils.preloadResource(resource, "script", priority);
    }
  }, [shouldPreload]);

  // Report web vitals
  const reportWebVital = useCallback((name: string, value: number) => {
    setMetrics(prev => ({
      ...prev,
      [name]: value
    }));

    // Send to analytics if configured
    if (process.env.NODE_ENV === "production") {
      // Example: Send to Google Analytics
      if ("gtag" in window) {
        (window as any).gtag("event", name, {
          value: Math.round(value),
          metric_id: name
        });
      }
    }
  }, []);

  const contextValue: MobilePerformanceContextValue = {
    metrics,
    networkInfo,
    deviceInfo,
    isOptimalLoading,
    shouldPreload,
    preferredQuality,
    trackComponentRender,
    preloadResource,
    reportWebVital,
    optimizeForMobile
  };

  return (
    <MobilePerformanceContext.Provider value={contextValue}>
      {children}
    </MobilePerformanceContext.Provider>
  );
};

// Hook to access performance context
export const useMobilePerformance = () => {
  const context = useContext(MobilePerformanceContext);
  if (!context) {
    throw new Error("useMobilePerformance must be used within MobilePerformanceProvider");
  }
  return context;
};

// Performance debugger component (development only)
export const PerformanceDebugger: React.FC = () => {
  const { metrics, networkInfo, deviceInfo } = useMobilePerformance();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "rgba(0, 0, 0, 0.8)",
        color: "white",
        padding: "10px",
        borderRadius: '5px',
        fontSize: '12px',
        fontFamily: "monospace",
        zIndex: 9999,
        maxWidth: '300px'
      }}
    >
      <h4>Performance Metrics</h4>
      <div>FCP: {metrics.fcp.toFixed(0)}ms</div>
      <div>LCP: {metrics.lcp.toFixed(0)}ms</div>
      <div>FID: {metrics.fid.toFixed(0)}ms</div>
      <div>CLS: {metrics.cls.toFixed(3)}</div>
      <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>

      <h4>Network</h4>
      <div>Type: {networkInfo.effectiveType}</div>
      <div>Speed: {networkInfo.downlink}Mbps</div>
      <div>Save Data: {networkInfo.saveData ? "Yes" : "No"}</div>

      <h4>Device</h4>
      <div>Memory: {deviceInfo.deviceMemory}GB</div>
      <div>Cores: {deviceInfo.hardwareConcurrency}</div>
      <div>Mobile: {deviceInfo.isMobile ? "Yes" : "No"}</div>
      <div>Low-end: {deviceInfo.isLowEnd ? "Yes" : 'No'}</div>
    </div>
  );
};

// Named export for the full object (for existing imports)
export const MobilePerformanceBundle = {
  MobilePerformanceProvider,
  useMobilePerformance,
  useComponentRenderTracker,
  useNetworkAwareLoading,
  usePerformanceMonitoring,
  PerformanceDebugger
};

// Export the main provider component as default for lazy loading
export default MobilePerformanceProvider;