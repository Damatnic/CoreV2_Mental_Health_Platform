/**
 * Mobile Network Detection Service
 *
 * Detects mobile network connection quality and adapts loading strategies
 * for optimal performance on varying network conditions. Provides intelligent
 * content adaptation, preloading strategies, and offline fallbacks.
 *
 * @fileoverview Mobile network detection and adaptation service
 * @version 2.0.0
 */

import React from 'react';

/**
 * Network connection types
 */
export type NetworkType = '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';

/**
 * Effective connection types from Network Information API
 */
export type EffectiveType = 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';

/**
 * Connection speed categories
 */
export type Speed = 'slow' | 'medium' | 'fast';

/**
 * Connection quality assessment
 */
export type Quality = 'poor' | 'good' | 'excellent';

/**
 * Image quality adaptation levels
 */
export type ImageQuality = 'low' | 'medium' | 'high';

/**
 * Content preloading strategies
 */
export type PreloadLevel = 'minimal' | 'selective' | 'aggressive';

/**
 * Network information interface
 */
export interface NetworkInfo {
  type: NetworkType;
  effectiveType: EffectiveType;
  downlink: number; // Mbps
  rtt: number; // Round-trip time in ms
  saveData: boolean; // Data saver mode
  isOnline: boolean;
  quality: Quality;
  speed: Speed;
  timestamp: number;
}

/**
 * Adaptive content configuration
 */
export interface AdaptiveConfig {
  imageQuality: ImageQuality;
  preloadLevel: PreloadLevel;
  enableVideoAutoplay: boolean;
  enableAnimations: boolean;
  maxConcurrentRequests: number;
  enableCompression: boolean;
  enableLazyLoading: boolean;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
}

/**
 * Network performance metrics
 */
export interface NetworkMetrics {
  averageDownlink: number;
  averageRtt: number;
  connectionStability: number; // 0-1 scale
  dataUsage: number; // Estimated MB
  qualityHistory: Quality[];
  disconnectionCount: number;
  lastDisconnection?: Date;
  performanceScore: number; // 0-100 scale
}

/**
 * Bandwidth estimation result
 */
export interface BandwidthEstimate {
  downloadSpeed: number; // Mbps
  uploadSpeed: number; // Mbps
  latency: number; // ms
  jitter: number; // ms
  reliability: number; // 0-1 scale
  timestamp: number;
}

/**
 * Content optimization recommendations
 */
export interface OptimizationRecommendations {
  imageOptimization: {
    format: 'webp' | 'jpeg' | 'png';
    quality: number; // 0-100
    maxWidth: number;
    maxHeight: number;
  };
  videoOptimization: {
    enableAutoplay: boolean;
    maxBitrate: number;
    preferredResolution: '480p' | '720p' | '1080p';
  };
  contentStrategy: {
    enableLazyLoading: boolean;
    preloadDistance: number; // pixels
    maxConcurrentLoads: number;
  };
  cacheStrategy: {
    ttl: number; // seconds
    maxSize: number; // MB
    priority: 'speed' | 'storage' | 'balanced';
  };
}

/**
 * Mobile Network Detection Service Implementation
 */
export class MobileNetworkService {
  private networkInfo: NetworkInfo | null = null;
  private metrics: NetworkMetrics;
  private listeners: Array<(info: NetworkInfo) => void> = [];
  private monitoringInterval: number | null = null;
  private isMonitoring = false;

  constructor() {
    this.metrics = {
      averageDownlink: 0,
      averageRtt: 0,
      connectionStability: 1,
      dataUsage: 0,
      qualityHistory: [],
      disconnectionCount: 0,
      performanceScore: 100
    };

    this.initializeNetworkDetection();
  }

  /**
   * Initialize network detection and monitoring
   */
  private initializeNetworkDetection(): void {
    // Set up network change listeners
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    // Initial network info gathering
    this.updateNetworkInfo();

    // Start monitoring if Network Information API is available
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', this.handleConnectionChange.bind(this));
    }
  }

  /**
   * Get current network information
   */
  getNetworkInfo(): NetworkInfo {
    if (!this.networkInfo) {
      this.updateNetworkInfo();
    }
    return this.networkInfo!;
  }

  /**
   * Update network information from available APIs
   */
  private updateNetworkInfo(): void {
    const connection = (navigator as any).connection;
    const isOnline = navigator.onLine;

    let type: NetworkType = 'unknown';
    let effectiveType: EffectiveType = 'unknown';
    let downlink = 0;
    let rtt = 0;
    let saveData = false;

    if (connection) {
      type = this.mapConnectionType(connection.type || connection.effectiveType);
      effectiveType = connection.effectiveType || 'unknown';
      downlink = connection.downlink || 0;
      rtt = connection.rtt || 0;
      saveData = connection.saveData || false;
    }

    // Estimate values if not available
    if (downlink === 0) {
      downlink = this.estimateDownlink(effectiveType);
    }
    if (rtt === 0) {
      rtt = this.estimateRtt(effectiveType);
    }

    const quality = this.assessQuality(downlink, rtt);
    const speed = this.categorizeSpeed(downlink);

    this.networkInfo = {
      type,
      effectiveType,
      downlink,
      rtt,
      saveData,
      isOnline,
      quality,
      speed,
      timestamp: Date.now()
    };

    this.updateMetrics();
    this.notifyListeners();
  }

  /**
   * Map connection type to our NetworkType
   */
  private mapConnectionType(connectionType: string): NetworkType {
    const typeMap: Record<string, NetworkType> = {
      'slow-2g': '2g',
      '2g': '2g',
      '3g': '3g',
      '4g': '4g',
      '5g': '5g',
      'wifi': 'wifi',
      'ethernet': 'ethernet'
    };

    return typeMap[connectionType] || 'unknown';
  }

  /**
   * Estimate downlink speed based on effective type
   */
  private estimateDownlink(effectiveType: EffectiveType): number {
    const estimates: Record<EffectiveType, number> = {
      'slow-2g': 0.05,
      '2g': 0.25,
      '3g': 1.5,
      '4g': 10,
      'unknown': 1
    };

    return estimates[effectiveType];
  }

  /**
   * Estimate RTT based on effective type
   */
  private estimateRtt(effectiveType: EffectiveType): number {
    const estimates: Record<EffectiveType, number> = {
      'slow-2g': 2000,
      '2g': 1400,
      '3g': 400,
      '4g': 100,
      'unknown': 500
    };

    return estimates[effectiveType];
  }

  /**
   * Assess connection quality
   */
  private assessQuality(downlink: number, rtt: number): Quality {
    if (downlink >= 5 && rtt <= 150) return 'excellent';
    if (downlink >= 1.5 && rtt <= 500) return 'good';
    return 'poor';
  }

  /**
   * Categorize connection speed
   */
  private categorizeSpeed(downlink: number): Speed {
    if (downlink >= 5) return 'fast';
    if (downlink >= 1) return 'medium';
    return 'slow';
  }

  /**
   * Get adaptive configuration based on current network
   */
  getAdaptiveConfig(): AdaptiveConfig {
    const info = this.getNetworkInfo();

    const config: AdaptiveConfig = {
      imageQuality: 'medium',
      preloadLevel: 'selective',
      enableVideoAutoplay: true,
      enableAnimations: true,
      maxConcurrentRequests: 4,
      enableCompression: true,
      enableLazyLoading: true,
      cacheStrategy: 'moderate'
    };

    // Adapt based on connection quality
    switch (info.quality) {
      case 'poor':
        config.imageQuality = 'low';
        config.preloadLevel = 'minimal';
        config.enableVideoAutoplay = false;
        config.enableAnimations = false;
        config.maxConcurrentRequests = 2;
        config.cacheStrategy = 'aggressive';
        break;

      case 'good':
        config.imageQuality = 'medium';
        config.preloadLevel = 'selective';
        config.enableVideoAutoplay = true;
        config.maxConcurrentRequests = 3;
        config.cacheStrategy = 'moderate';
        break;

      case 'excellent':
        config.imageQuality = 'high';
        config.preloadLevel = 'aggressive';
        config.enableVideoAutoplay = true;
        config.enableAnimations = true;
        config.maxConcurrentRequests = 6;
        config.cacheStrategy = 'minimal';
        break;
    }

    // Respect data saver mode
    if (info.saveData) {
      config.imageQuality = 'low';
      config.preloadLevel = 'minimal';
      config.enableVideoAutoplay = false;
      config.maxConcurrentRequests = 1;
      config.enableCompression = true;
    }

    return config;
  }

  /**
   * Get optimization recommendations
   */
  getOptimizationRecommendations(): OptimizationRecommendations {
    const info = this.getNetworkInfo();
    const config = this.getAdaptiveConfig();

    return {
      imageOptimization: {
        format: info.quality === 'excellent' ? 'webp' : 'jpeg',
        quality: config.imageQuality === 'high' ? 85 : config.imageQuality === 'medium' ? 70 : 50,
        maxWidth: config.imageQuality === 'high' ? 1920 : config.imageQuality === 'medium' ? 1280 : 800,
        maxHeight: config.imageQuality === 'high' ? 1080 : config.imageQuality === 'medium' ? 720 : 600
      },
      videoOptimization: {
        enableAutoplay: config.enableVideoAutoplay,
        maxBitrate: info.quality === 'excellent' ? 5000 : info.quality === 'good' ? 2500 : 1000,
        preferredResolution: info.quality === 'excellent' ? '1080p' : info.quality === 'good' ? '720p' : '480p'
      },
      contentStrategy: {
        enableLazyLoading: config.enableLazyLoading,
        preloadDistance: config.preloadLevel === 'aggressive' ? 2000 : config.preloadLevel === 'selective' ? 1000 : 500,
        maxConcurrentLoads: config.maxConcurrentRequests
      },
      cacheStrategy: {
        ttl: config.cacheStrategy === 'aggressive' ? 86400 : config.cacheStrategy === 'moderate' ? 3600 : 300,
        maxSize: info.quality === 'excellent' ? 100 : info.quality === 'good' ? 50 : 25,
        priority: config.cacheStrategy === 'aggressive' ? 'storage' : config.cacheStrategy === 'moderate' ? 'balanced' : 'speed'
      }
    };
  }

  /**
   * Estimate bandwidth through performance testing
   */
  async estimateBandwidth(): Promise<BandwidthEstimate> {
    const testStartTime = performance.now();
    
    try {
      // Simple bandwidth test using a small image
      const testUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      
      const downloadStart = performance.now();
      const response = await fetch(testUrl);
      await response.blob();
      const downloadEnd = performance.now();

      const downloadTime = downloadEnd - downloadStart;
      const estimatedSpeed = downloadTime > 0 ? (1000 / downloadTime) : 10; // Rough estimate

      return {
        downloadSpeed: estimatedSpeed,
        uploadSpeed: estimatedSpeed * 0.5, // Rough estimate
        latency: this.networkInfo?.rtt || 100,
        jitter: Math.random() * 50, // Simulated
        reliability: 0.9,
        timestamp: Date.now()
      };
    } catch (error) {
      console.warn('Bandwidth estimation failed:', error);
      return {
        downloadSpeed: 1,
        uploadSpeed: 0.5,
        latency: 500,
        jitter: 100,
        reliability: 0.5,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Check if current connection is suitable for heavy content
   */
  isSuitableForHeavyContent(): boolean {
    const info = this.getNetworkInfo();
    return info.quality === 'excellent' && !info.saveData;
  }

  /**
   * Check if current connection requires data saving
   */
  shouldSaveData(): boolean {
    const info = this.getNetworkInfo();
    return info.saveData || info.quality === 'poor' || info.speed === 'slow';
  }

  /**
   * Get recommended image quality
   */
  getRecommendedImageQuality(): ImageQuality {
    return this.getAdaptiveConfig().imageQuality;
  }

  /**
   * Get recommended preload strategy
   */
  getRecommendedPreloadLevel(): PreloadLevel {
    return this.getAdaptiveConfig().preloadLevel;
  }

  /**
   * Add network change listener
   */
  addNetworkChangeListener(callback: (info: NetworkInfo) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove network change listener
   */
  removeNetworkChangeListener(callback: (info: NetworkInfo) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Start continuous network monitoring
   */
  startMonitoring(intervalMs: number = 5000): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = window.setInterval(() => {
      this.updateNetworkInfo();
    }, intervalMs);
  }

  /**
   * Stop continuous network monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
  }

  /**
   * Get network performance metrics
   */
  getMetrics(): NetworkMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      averageDownlink: 0,
      averageRtt: 0,
      connectionStability: 1,
      dataUsage: 0,
      qualityHistory: [],
      disconnectionCount: 0,
      performanceScore: 100
    };
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('Network connection restored');
    this.updateNetworkInfo();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    console.log('Network connection lost');
    this.metrics.disconnectionCount++;
    this.metrics.lastDisconnection = new Date();
    this.updateNetworkInfo();
  }

  /**
   * Handle connection change event
   */
  private handleConnectionChange(): void {
    console.log('Network connection changed');
    this.updateNetworkInfo();
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(): void {
    if (!this.networkInfo) return;

    const info = this.networkInfo;
    
    // Update averages
    this.metrics.averageDownlink = (this.metrics.averageDownlink + info.downlink) / 2;
    this.metrics.averageRtt = (this.metrics.averageRtt + info.rtt) / 2;

    // Update quality history (keep last 20 entries)
    this.metrics.qualityHistory.push(info.quality);
    if (this.metrics.qualityHistory.length > 20) {
      this.metrics.qualityHistory.shift();
    }

    // Calculate connection stability
    const recentQualities = this.metrics.qualityHistory.slice(-5);
    const qualityVariation = new Set(recentQualities).size;
    this.metrics.connectionStability = Math.max(0, 1 - (qualityVariation - 1) * 0.3);

    // Calculate performance score
    this.calculatePerformanceScore();
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(): void {
    const info = this.networkInfo!;
    
    let score = 100;
    
    // Penalize for poor quality
    if (info.quality === 'poor') score -= 40;
    else if (info.quality === 'good') score -= 15;

    // Penalize for instability
    score -= (1 - this.metrics.connectionStability) * 30;

    // Penalize for frequent disconnections
    if (this.metrics.disconnectionCount > 5) {
      score -= Math.min(30, this.metrics.disconnectionCount * 2);
    }

    // Penalize for data saver mode
    if (info.saveData) score -= 10;

    this.metrics.performanceScore = Math.max(0, Math.min(100, score));
  }

  /**
   * Notify all listeners of network changes
   */
  private notifyListeners(): void {
    if (this.networkInfo) {
      this.listeners.forEach(callback => {
        try {
          callback(this.networkInfo!);
        } catch (error) {
          console.error('Network listener error:', error);
        }
      });
    }
  }

  /**
   * Get human-readable connection description
   */
  getConnectionDescription(): string {
    const info = this.getNetworkInfo();
    
    if (!info.isOnline) return 'Offline';
    
    const qualityText = info.quality.charAt(0).toUpperCase() + info.quality.slice(1);
    const typeText = info.type.toUpperCase();
    
    return `${qualityText} ${typeText} connection`;
  }

  /**
   * Check if connection supports real-time features
   */
  supportsRealTime(): boolean {
    const info = this.getNetworkInfo();
    return info.isOnline && info.quality !== 'poor' && info.rtt < 1000;
  }

  /**
   * Get recommended timeout for requests
   */
  getRecommendedTimeout(): number {
    const info = this.getNetworkInfo();
    
    switch (info.quality) {
      case 'excellent': return 5000;
      case 'good': return 10000;
      case 'poor': return 20000;
      default: return 15000;
    }
  }
}

// Create and export singleton instance
export const mobileNetworkService = new MobileNetworkService();

// Export convenience methods
export const getNetworkInfo = () => mobileNetworkService.getNetworkInfo();
export const getAdaptiveConfig = () => mobileNetworkService.getAdaptiveConfig();
export const shouldSaveData = () => mobileNetworkService.shouldSaveData();
export const isSuitableForHeavyContent = () => mobileNetworkService.isSuitableForHeavyContent();

export default mobileNetworkService;
