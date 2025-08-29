/**
 * Crisis Resource Cache Service for Astral Core
 *
 * Manages offline-first caching of critical crisis resources for immediate access.
 * Provides high-performance resource retrieval with automatic updates and fallback mechanisms.
 */

import { apiClient } from './apiClient';
import { notificationService } from './notificationService';

export enum ResourceType {
  HOTLINE = 'hotline',
  TEXT_LINE = 'text_line',
  CHAT_SERVICE = 'chat_service',
  EMERGENCY_CONTACT = 'emergency_contact',
  HOSPITAL = 'hospital',
  CRISIS_CENTER = 'crisis_center',
  SAFETY_PLAN = 'safety_plan',
  COPING_STRATEGY = 'coping_strategy',
  GROUNDING_TECHNIQUE = 'grounding_technique',
  BREATHING_EXERCISE = 'breathing_exercise',
  MEDITATION = 'meditation'
}

export enum ResourcePriority {
  IMMEDIATE = 'immediate',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface ResourceLocation {
  country: string;
  region?: string;
  city?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ResourceAvailability {
  available24x7: boolean;
  hours?: {
    start: string;
    end: string;
  };
  timezone?: string;
  daysOfWeek?: string[];
}

export interface CrisisResource {
  id: string;
  type: ResourceType;
  priority: ResourcePriority;
  title: string;
  content: string;
  phoneNumbers?: string[];
  textNumbers?: string[];
  websites?: string[];
  location?: ResourceLocation;
  availability: ResourceAvailability;
  languages: string[];
  specializations?: string[];
  lastUpdated: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface CacheMetrics {
  totalResources: number;
  cacheHitRate: number;
  lastUpdate: Date;
  failedFetches: number;
  averageResponseTime: number;
}

export interface ResourceQuery {
  type?: ResourceType;
  priority?: ResourcePriority;
  location?: string;
  language?: string;
  specialization?: string;
  available24x7?: boolean;
}

class AstralCoreCrisisResourceCache {
  private cache = new Map<string, CrisisResource>();
  private lastUpdate: Date | null = null;
  private updateInterval = 30 * 60 * 1000; // 30 minutes
  private metrics: CacheMetrics = {
    totalResources: 0,
    cacheHitRate: 0,
    lastUpdate: new Date(),
    failedFetches: 0,
    averageResponseTime: 0
  };
  private responseTimes: number[] = [];

  constructor() {
    this.initializeCache();
    this.startPeriodicUpdates();
  }

  /**
   * Initialize the cache with default resources
   */
  private async initializeCache(): Promise<void> {
    try {
      await this.loadDefaultResources();
      await this.fetchLatestResources();
    } catch (error) {
      console.error('Failed to initialize crisis resource cache:', error);
      await this.loadFallbackResources();
    }
  }

  /**
   * Load default crisis resources
   */
  private async loadDefaultResources(): Promise<void> {
    const defaultResources: CrisisResource[] = [
      {
        id: 'national-suicide-prevention',
        type: ResourceType.HOTLINE,
        priority: ResourcePriority.IMMEDIATE,
        title: 'National Suicide Prevention Lifeline',
        content: 'Free and confidential emotional support 24/7',
        phoneNumbers: ['988', '1-800-273-8255'],
        textNumbers: ['741741'],
        availability: { available24x7: true },
        languages: ['en', 'es'],
        lastUpdated: new Date(),
        specializations: ['suicide-prevention', 'crisis-intervention']
      },
      {
        id: 'crisis-text-line',
        type: ResourceType.TEXT_LINE,
        priority: ResourcePriority.IMMEDIATE,
        title: 'Crisis Text Line',
        content: 'Text-based crisis support available 24/7',
        textNumbers: ['741741'],
        availability: { available24x7: true },
        languages: ['en', 'es'],
        lastUpdated: new Date(),
        specializations: ['crisis-intervention', 'text-support']
      }
    ];

    defaultResources.forEach(resource => {
      this.cache.set(resource.id, resource);
    });

    this.updateMetrics();
  }

  /**
   * Load fallback resources when API is unavailable
   */
  private async loadFallbackResources(): Promise<void> {
    const fallbackResources: CrisisResource[] = [
      {
        id: 'emergency-services',
        type: ResourceType.EMERGENCY_CONTACT,
        priority: ResourcePriority.IMMEDIATE,
        title: 'Emergency Services',
        content: 'Call for immediate emergency assistance',
        phoneNumbers: ['911'],
        availability: { available24x7: true },
        languages: ['en'],
        lastUpdated: new Date()
      }
    ];

    fallbackResources.forEach(resource => {
      this.cache.set(resource.id, resource);
    });
  }

  /**
   * Fetch latest resources from API
   */
  private async fetchLatestResources(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await apiClient.get('/api/crisis-resources');
      const resources: CrisisResource[] = response.data;

      resources.forEach(resource => {
        this.cache.set(resource.id, {
          ...resource,
          lastUpdated: new Date(resource.lastUpdated)
        });
      });

      this.lastUpdate = new Date();
      this.recordResponseTime(Date.now() - startTime);
      this.updateMetrics();
    } catch (error) {
      this.metrics.failedFetches++;
      console.error('Failed to fetch latest crisis resources:', error);
      throw error;
    }
  }

  /**
   * Get resources by query
   */
  public async getResources(query: ResourceQuery = {}): Promise<CrisisResource[]> {
    const startTime = Date.now();
    let resources = Array.from(this.cache.values());

    // Apply filters
    if (query.type) {
      resources = resources.filter(r => r.type === query.type);
    }

    if (query.priority) {
      resources = resources.filter(r => r.priority === query.priority);
    }

    if (query.language) {
      resources = resources.filter(r => r.languages.includes(query.language));
    }

    if (query.specialization) {
      resources = resources.filter(r => 
        r.specializations?.includes(query.specialization)
      );
    }

    if (query.available24x7) {
      resources = resources.filter(r => r.availability.available24x7);
    }

    if (query.location) {
      resources = resources.filter(r => 
        r.location?.country === query.location ||
        r.location?.region === query.location ||
        r.location?.city === query.location
      );
    }

    // Sort by priority
    resources.sort((a, b) => {
      const priorityOrder = {
        [ResourcePriority.IMMEDIATE]: 0,
        [ResourcePriority.HIGH]: 1,
        [ResourcePriority.MEDIUM]: 2,
        [ResourcePriority.LOW]: 3
      };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    this.recordResponseTime(Date.now() - startTime);
    return resources;
  }

  /**
   * Get immediate crisis resources
   */
  public async getImmediateCrisisResources(): Promise<CrisisResource[]> {
    return this.getResources({ 
      priority: ResourcePriority.IMMEDIATE,
      available24x7: true 
    });
  }

  /**
   * Get resources by type
   */
  public async getResourcesByType(type: ResourceType): Promise<CrisisResource[]> {
    return this.getResources({ type });
  }

  /**
   * Get localized resources
   */
  public async getLocalizedResources(
    language: string,
    location?: string
  ): Promise<CrisisResource[]> {
    return this.getResources({ language, location });
  }

  /**
   * Add or update resource
   */
  public async addResource(resource: CrisisResource): Promise<void> {
    this.cache.set(resource.id, {
      ...resource,
      lastUpdated: new Date()
    });
    this.updateMetrics();
  }

  /**
   * Remove resource
   */
  public async removeResource(resourceId: string): Promise<void> {
    this.cache.delete(resourceId);
    this.updateMetrics();
  }

  /**
   * Clear expired resources
   */
  public async clearExpiredResources(): Promise<void> {
    const now = new Date();
    const expiredResources: string[] = [];

    for (const [id, resource] of this.cache.entries()) {
      if (resource.expiresAt && resource.expiresAt < now) {
        expiredResources.push(id);
      }
    }

    expiredResources.forEach(id => this.cache.delete(id));
    
    if (expiredResources.length > 0) {
      console.log(`Cleared ${expiredResources.length} expired crisis resources`);
      this.updateMetrics();
    }
  }

  /**
   * Force cache refresh
   */
  public async refreshCache(): Promise<void> {
    try {
      await this.fetchLatestResources();
      await this.clearExpiredResources();
    } catch (error) {
      console.error('Failed to refresh crisis resource cache:', error);
    }
  }

  /**
   * Get cache metrics
   */
  public getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  /**
   * Start periodic cache updates
   */
  private startPeriodicUpdates(): void {
    setInterval(async () => {
      try {
        await this.refreshCache();
      } catch (error) {
        console.error('Periodic cache update failed:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Record response time for metrics
   */
  private recordResponseTime(time: number): void {
    this.responseTimes.push(time);
    
    // Keep only last 100 response times
    if (this.responseTimes.length > 100) {
      this.responseTimes.shift();
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.totalResources = this.cache.size;
    this.metrics.lastUpdate = new Date();
    
    if (this.responseTimes.length > 0) {
      this.metrics.averageResponseTime = 
        this.responseTimes.reduce((sum, time) => sum + time, 0) / 
        this.responseTimes.length;
    }
  }

  /**
   * Export cache for offline use
   */
  public exportCache(): CrisisResource[] {
    return Array.from(this.cache.values());
  }

  /**
   * Import cache from offline data
   */
  public importCache(resources: CrisisResource[]): void {
    this.cache.clear();
    resources.forEach(resource => {
      this.cache.set(resource.id, resource);
    });
    this.updateMetrics();
  }
}

// Export singleton instance
export const astralCoreCrisisResourceCache = new AstralCoreCrisisResourceCache();
