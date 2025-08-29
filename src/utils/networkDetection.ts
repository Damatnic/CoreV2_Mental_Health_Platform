/**
 * Mobile Network Detection Utility
 * 
 * Detects connection type and quality for adaptive loading strategies.
 * Optimizes mobile performance based on network conditions with comprehensive
 * connection monitoring and adaptive loading recommendations.
 * 
 * @fileoverview Network detection and adaptive loading utilities
 * @version 2.0.0
 */

// Network connection types
export type ConnectionType = '2g' | '3g' | '4g' | '5g' | 'wifi' | 'unknown';

// Network quality levels
export type NetworkQuality = 'poor' | 'good' | 'excellent';

// Loading strategies
export type LoadingStrategy = 'aggressive' | 'conservative' | 'minimal';

// Image quality recommendations
export type ImageQuality = 'low' | 'medium' | 'high';

/**
 * Network connection interface
 */
export interface NetworkConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  addEventListener?: (event: string, handler: () => void) => void;
  removeEventListener?: (event: string, handler: () => void) => void;
}

/**
 * Navigator with connection support
 */
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkConnection;
}

/**
 * Adaptive loading configuration
 */
export interface AdaptiveLoadingConfig {
  connectionType: ConnectionType;
  quality: NetworkQuality;
  downlink: number; // Mbps
  rtt: number; // Round trip time in ms
  saveData: boolean; // Data saver mode
  shouldPreloadImages: boolean;
  shouldPreloadVideos: boolean;
  recommendedImageQuality: ImageQuality;
  chunkLoadingStrategy: LoadingStrategy;
}

/**
 * Network change event
 */
export interface NetworkChangeEvent {
  connectionType: ConnectionType;
  quality: NetworkQuality;
  downlink: number;
  rtt: number;
  saveData: boolean;
  timestamp: number;
}

/**
 * Network monitoring configuration
 */
export interface NetworkMonitorConfig {
  enableChangeDetection: boolean;
  changeCallback?: (event: NetworkChangeEvent) => void;
  monitorInterval: number; // ms
  qualityThresholds: {
    poor: { maxDownlink: number; minRtt: number };
    excellent: { minDownlink: number; maxRtt: number };
  };
}

/**
 * Default network monitor configuration
 */
export const DEFAULT_NETWORK_CONFIG: NetworkMonitorConfig = {
  enableChangeDetection: true,
  monitorInterval: 5000,
  qualityThresholds: {
    poor: { maxDownlink: 0.5, minRtt: 500 },
    excellent: { minDownlink: 2, maxRtt: 150 }
  }
};

/**
 * Detects network connection type from navigator.connection
 */
export const getConnectionType = (): ConnectionType => {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  const connection = navigatorWithConnection.connection;
  
  if (!connection) {
    return 'unknown';
  }
  
  const effectiveType = connection.effectiveType;
  
  switch (effectiveType) {
    case 'slow-2g':
    case '2g':
      return '2g';
    case '3g':
      return '3g';
    case '4g':
      return '4g';
    default:
      // Assume 4g for better performance if unknown
      return '4g';
  }
};

/**
 * Determines network quality based on downlink and RTT
 */
export const getNetworkQuality = (config: NetworkMonitorConfig = DEFAULT_NETWORK_CONFIG): NetworkQuality => {
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  const connection = navigatorWithConnection.connection;
  
  if (!connection) {
    return 'good'; // Default assumption
  }
  
  const { downlink = 1, rtt = 300 } = connection;
  const { qualityThresholds } = config;
  
  // Poor: Slow speeds or high latency
  if (downlink < qualityThresholds.poor.maxDownlink || rtt > qualityThresholds.poor.minRtt) {
    return 'poor';
  }
  
  // Excellent: Fast speeds and low latency
  if (downlink >= qualityThresholds.excellent.minDownlink && rtt < qualityThresholds.excellent.maxRtt) {
    return 'excellent';
  }
  
  // Good: Moderate speeds
  return 'good';
};

/**
 * Gets comprehensive adaptive loading configuration
 */
export const getAdaptiveLoadingConfig = (config: NetworkMonitorConfig = DEFAULT_NETWORK_CONFIG): AdaptiveLoadingConfig => {
  const connectionType = getConnectionType();
  const quality = getNetworkQuality(config);
  const navigatorWithConnection = navigator as NavigatorWithConnection;
  const connection = navigatorWithConnection.connection;
  
  const downlink = connection?.downlink || 1;
  const rtt = connection?.rtt || 300;
  const saveData = connection?.saveData || false;
  
  // Determine loading strategies based on network conditions
  const shouldPreloadImages = quality !== 'poor' && !saveData;
  const shouldPreloadVideos = quality === 'excellent' && !saveData && connectionType !== '2g';
  
  let recommendedImageQuality: ImageQuality = 'medium';
  let chunkLoadingStrategy: LoadingStrategy = 'conservative';
  
  // Adjust quality based on network
  switch (quality) {
    case 'poor':
      recommendedImageQuality = 'low';
      chunkLoadingStrategy = 'minimal';
      break;
    case 'excellent':
      recommendedImageQuality = 'high';
      chunkLoadingStrategy = 'aggressive';
      break;
    default:
      // Keep defaults for 'good'
      break;
  }
  
  // Override for data saver mode
  if (saveData) {
    recommendedImageQuality = 'low';
    chunkLoadingStrategy = 'minimal';
  }
  
  return {
    connectionType,
    quality,
    downlink,
    rtt,
    saveData,
    shouldPreloadImages,
    shouldPreloadVideos,
    recommendedImageQuality,
    chunkLoadingStrategy
  };
};

/**
 * Network monitoring class
 */
export class NetworkMonitor {
  private config: NetworkMonitorConfig;
  private currentState: AdaptiveLoadingConfig;
  private monitoringInterval?: NodeJS.Timeout;
  private listeners: Array<(event: NetworkChangeEvent) => void> = [];

  constructor(config: Partial<NetworkMonitorConfig> = {}) {
    this.config = { ...DEFAULT_NETWORK_CONFIG, ...config };
    this.currentState = getAdaptiveLoadingConfig(this.config);
  }

  /**
   * Start monitoring network changes
   */
  public startMonitoring(): void {
    if (typeof window === 'undefined') return;

    // Monitor connection changes via navigator.connection
    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const connection = navigatorWithConnection.connection;

    if (connection && connection.addEventListener) {
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }

    // Fallback polling for environments without connection API
    if (this.config.monitorInterval > 0) {
      this.monitoringInterval = setInterval(() => {
        this.checkForChanges();
      }, this.config.monitorInterval);
    }
  }

  /**
   * Stop monitoring network changes
   */
  public stopMonitoring(): void {
    const navigatorWithConnection = navigator as NavigatorWithConnection;
    const connection = navigatorWithConnection.connection;

    if (connection && connection.removeEventListener) {
      connection.removeEventListener('change', this.handleConnectionChange.bind(this));
    }

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }

  /**
   * Add network change listener
   */
  public addListener(callback: (event: NetworkChangeEvent) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove network change listener
   */
  public removeListener(callback: (event: NetworkChangeEvent) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Get current network state
   */
  public getCurrentState(): AdaptiveLoadingConfig {
    return { ...this.currentState };
  }

  /**
   * Handle connection change events
   */
  private handleConnectionChange(): void {
    this.checkForChanges();
  }

  /**
   * Check for network changes and notify listeners
   */
  private checkForChanges(): void {
    const newState = getAdaptiveLoadingConfig(this.config);
    
    // Check if state has changed significantly
    if (this.hasStateChanged(this.currentState, newState)) {
      const event: NetworkChangeEvent = {
        connectionType: newState.connectionType,
        quality: newState.quality,
        downlink: newState.downlink,
        rtt: newState.rtt,
        saveData: newState.saveData,
        timestamp: Date.now()
      };

      this.currentState = newState;
      this.notifyListeners(event);
    }
  }

  /**
   * Check if network state has changed significantly
   */
  private hasStateChanged(oldState: AdaptiveLoadingConfig, newState: AdaptiveLoadingConfig): boolean {
    return (
      oldState.connectionType !== newState.connectionType ||
      oldState.quality !== newState.quality ||
      oldState.saveData !== newState.saveData ||
      Math.abs(oldState.downlink - newState.downlink) > 0.5 ||
      Math.abs(oldState.rtt - newState.rtt) > 100
    );
  }

  /**
   * Notify all listeners of network changes
   */
  private notifyListeners(event: NetworkChangeEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.warn('Network change listener error:', error);
      }
    });
  }
}

/**
 * Singleton network monitor instance
 */
let networkMonitor: NetworkMonitor | null = null;

/**
 * Get or create network monitor instance
 */
export const getNetworkMonitor = (config?: Partial<NetworkMonitorConfig>): NetworkMonitor => {
  if (!networkMonitor) {
    networkMonitor = new NetworkMonitor(config);
    networkMonitor.startMonitoring();
  }
  return networkMonitor;
};

/**
 * Utility to determine if feature should be enabled based on network
 */
export const shouldEnableFeature = (
  feature: 'auto-play' | 'high-res-images' | 'video-preload' | 'background-sync',
  config?: AdaptiveLoadingConfig
): boolean => {
  const networkConfig = config || getAdaptiveLoadingConfig();
  
  switch (feature) {
    case 'auto-play':
      return networkConfig.quality !== 'poor' && !networkConfig.saveData;
    
    case 'high-res-images':
      return networkConfig.recommendedImageQuality === 'high';
    
    case 'video-preload':
      return networkConfig.shouldPreloadVideos;
    
    case 'background-sync':
      return networkConfig.quality !== 'poor';
    
    default:
      return false;
  }
};

/**
 * Get loading strategy recommendations
 */
export const getLoadingRecommendations = (config?: AdaptiveLoadingConfig) => {
  const networkConfig = config || getAdaptiveLoadingConfig();
  
  return {
    // Image loading
    lazyLoadImages: networkConfig.quality === 'poor' || networkConfig.saveData,
    imageQuality: networkConfig.recommendedImageQuality,
    preloadImages: networkConfig.shouldPreloadImages,
    
    // Video loading
    autoPlayVideos: networkConfig.quality === 'excellent' && !networkConfig.saveData,
    preloadVideos: networkConfig.shouldPreloadVideos,
    videoQuality: networkConfig.quality === 'poor' ? 'low' : 'medium',
    
    // Code splitting
    chunkStrategy: networkConfig.chunkLoadingStrategy,
    preloadRoutes: networkConfig.quality !== 'poor',
    
    // General performance
    enableServiceWorker: true,
    cacheStrategy: networkConfig.quality === 'poor' ? 'aggressive' : 'normal',
    backgroundSync: networkConfig.quality !== 'poor'
  };
};

/**
 * Log network information for debugging
 */
export const logNetworkInfo = (config?: AdaptiveLoadingConfig): void => {
  const networkConfig = config || getAdaptiveLoadingConfig();
  
  console.group('📱 Mobile Network Detection');
  console.log('Connection Type:', networkConfig.connectionType);
  console.log('Network Quality:', networkConfig.quality);
  console.log('Downlink Speed:', `${networkConfig.downlink} Mbps`);
  console.log('Round Trip Time:', `${networkConfig.rtt}ms`);
  console.log('Data Saver Mode:', networkConfig.saveData);
  console.log('Image Quality:', networkConfig.recommendedImageQuality);
  console.log('Loading Strategy:', networkConfig.chunkLoadingStrategy);
  console.groupEnd();
};

/**
 * Network detection utilities object
 */
export const networkDetection = {
  getConnectionType,
  getNetworkQuality,
  getAdaptiveLoadingConfig,
  shouldEnableFeature,
  getLoadingRecommendations,
  logNetworkInfo,
  NetworkMonitor,
  getNetworkMonitor,
  DEFAULT_NETWORK_CONFIG
};

// Default export
export default networkDetection;
