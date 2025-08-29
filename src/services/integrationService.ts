import { EventEmitter } from 'events';

// Types for integration service
export interface IntegrationConfig {
  apiKey?: string;
  endpoint?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enableCaching?: boolean;
  enableMetrics?: boolean;
}

export interface IntegrationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration: number;
    timestamp: Date;
    retryAttempt?: number;
    cached?: boolean;
  };
}

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

export interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastChecked: Date;
  details?: Record<string, any>;
}

// Integration providers
export type IntegrationProvider = 
  | 'sentry'
  | 'analytics'
  | 'notification'
  | 'payment'
  | 'auth'
  | 'storage'
  | 'ai'
  | 'health'
  | 'custom';

export interface Integration {
  id: string;
  name: string;
  provider: IntegrationProvider;
  config: IntegrationConfig;
  enabled: boolean;
  lastHealthCheck?: HealthCheck;
  createdAt: Date;
  updatedAt: Date;
}

// Default configuration
const DEFAULT_CONFIG: Required<IntegrationConfig> = {
  apiKey: '',
  endpoint: '',
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000,
  enableCaching: true,
  enableMetrics: true
};

/**
 * Integration Service
 * Manages third-party service integrations and API connections
 */
export class IntegrationService extends EventEmitter {
  private integrations: Map<string, Integration> = new Map();
  private cache: Map<string, { data: any; expires: Date }> = new Map();
  private metrics: Map<string, any[]> = new Map();
  private healthCheckInterval?: ReturnType<typeof setTimeout>;

  constructor() {
    super();
    this.startHealthChecks();
  }

  /**
   * Register a new integration
   */
  async registerIntegration(
    id: string,
    name: string,
    provider: IntegrationProvider,
    config: IntegrationConfig
  ): Promise<IntegrationResult<Integration>> {
    const startTime = performance.now();
    
    try {
      const integration: Integration = {
        id,
        name,
        provider,
        config: { ...DEFAULT_CONFIG, ...config },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate configuration
      const validationResult = await this.validateConfig(provider, integration.config);
      if (!validationResult.success) {
        throw new Error(validationResult.error || 'Configuration validation failed');
      }

      // Test connection
      const connectionResult = await this.testConnection(integration);
      if (!connectionResult.success) {
        throw new Error(connectionResult.error || 'Connection test failed');
      }

      this.integrations.set(id, integration);
      this.emit('integration:registered', integration);

      return {
        success: true,
        data: integration,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.emit('integration:error', { id, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Update integration configuration
   */
  async updateIntegration(
    id: string,
    updates: Partial<Integration>
  ): Promise<IntegrationResult<Integration>> {
    const startTime = performance.now();
    
    try {
      const existing = this.integrations.get(id);
      if (!existing) {
        throw new Error(`Integration ${id} not found`);
      }

      const updated: Integration = {
        ...existing,
        ...updates,
        updatedAt: new Date()
      };

      // Validate if config was updated
      if (updates.config) {
        const validationResult = await this.validateConfig(existing.provider, updated.config);
        if (!validationResult.success) {
          throw new Error(validationResult.error || 'Configuration validation failed');
        }
      }

      this.integrations.set(id, updated);
      this.emit('integration:updated', updated);

      return {
        success: true,
        data: updated,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.emit('integration:error', { id, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Remove an integration
   */
  async removeIntegration(id: string): Promise<IntegrationResult<boolean>> {
    const startTime = performance.now();
    
    try {
      const integration = this.integrations.get(id);
      if (!integration) {
        throw new Error(`Integration ${id} not found`);
      }

      this.integrations.delete(id);
      this.emit('integration:removed', integration);

      return {
        success: true,
        data: true,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Execute API call through integration
   */
  async executeCall<T>(
    integrationId: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    options: { useCache?: boolean; cacheKey?: string } = {}
  ): Promise<IntegrationResult<T>> {
    const startTime = performance.now();
    const integration = this.integrations.get(integrationId);
    
    if (!integration || !integration.enabled) {
      return {
        success: false,
        error: `Integration ${integrationId} not found or disabled`,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    }

    const cacheKey = options.cacheKey || `${integrationId}:${method}:${endpoint}`;
    
    // Check cache first
    if (options.useCache !== false && integration.config.enableCaching) {
      const cached = this.getCachedResult<T>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          metadata: {
            duration: performance.now() - startTime,
            timestamp: new Date(),
            cached: true
          }
        };
      }
    }

    // Execute with retry logic
    let lastError: Error | null = null;
    let attempt = 0;
    
    while (attempt <= integration.config.retryAttempts!) {
      try {
        const result = await this.makeRequest<T>(integration, method, endpoint, data);
        
        // Cache successful results
        if (result.success && integration.config.enableCaching) {
          this.cacheResult(cacheKey, result.data);
        }

        // Record metrics
        if (integration.config.enableMetrics) {
          this.recordMetric(integrationId, {
            method,
            endpoint,
            success: result.success,
            duration: performance.now() - startTime,
            attempt,
            timestamp: new Date()
          });
        }

        return {
          ...result,
          metadata: {
            duration: performance.now() - startTime,
            timestamp: new Date(),
            retryAttempt: attempt > 0 ? attempt : undefined
          }
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        attempt++;
        
        if (attempt <= integration.config.retryAttempts!) {
          await this.delay(integration.config.retryDelay! * attempt);
        }
      }
    }

    // All attempts failed
    this.emit('integration:failed', { integrationId, endpoint, error: lastError });
    
    return {
      success: false,
      error: lastError?.message || 'All retry attempts failed',
      metadata: {
        duration: performance.now() - startTime,
        timestamp: new Date(),
        retryAttempt: attempt - 1
      }
    };
  }

  /**
   * Handle webhook payload
   */
  async handleWebhook(
    integrationId: string,
    payload: WebhookPayload
  ): Promise<IntegrationResult<boolean>> {
    const startTime = performance.now();
    
    try {
      const integration = this.integrations.get(integrationId);
      if (!integration) {
        throw new Error(`Integration ${integrationId} not found`);
      }

      // Verify webhook signature if configured
      if (payload.signature && integration.config.apiKey) {
        const isValid = await this.verifyWebhookSignature(payload, integration.config.apiKey);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      this.emit('webhook:received', { integrationId, payload });
      this.emit(`webhook:${payload.event}`, { integrationId, data: payload.data });

      return {
        success: true,
        data: true,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.emit('webhook:error', { integrationId, payload, error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }

  /**
   * Get integration by ID
   */
  getIntegration(id: string): Integration | undefined {
    return this.integrations.get(id);
  }

  /**
   * List all integrations
   */
  listIntegrations(provider?: IntegrationProvider): Integration[] {
    const integrations = Array.from(this.integrations.values());
    return provider ? integrations.filter(i => i.provider === provider) : integrations;
  }

  /**
   * Get integration metrics
   */
  getMetrics(integrationId?: string): Record<string, any> {
    if (integrationId) {
      return this.metrics.get(integrationId) || [];
    }
    return Object.fromEntries(this.metrics.entries());
  }

  /**
   * Get health status of all integrations
   */
  async getHealthStatus(): Promise<Record<string, HealthCheck>> {
    const health: Record<string, HealthCheck> = {};
    
    for (const [id, integration] of this.integrations.entries()) {
      if (integration.enabled) {
        health[id] = await this.checkHealth(integration);
      }
    }
    
    return health;
  }

  /**
   * Enable/disable integration
   */
  setIntegrationStatus(id: string, enabled: boolean): IntegrationResult<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) {
      return {
        success: false,
        error: `Integration ${id} not found`,
        metadata: { duration: 0, timestamp: new Date() }
      };
    }

    integration.enabled = enabled;
    integration.updatedAt = new Date();
    
    this.emit('integration:status_changed', { id, enabled });
    
    return {
      success: true,
      data: true,
      metadata: { duration: 0, timestamp: new Date() }
    };
  }

  /**
   * Clear cache for integration or specific key
   */
  clearCache(keyPattern?: string): void {
    if (keyPattern) {
      const keysToDelete = Array.from(this.cache.keys()).filter(key => 
        key.includes(keyPattern)
      );
      keysToDelete.forEach(key => this.cache.delete(key));
    } else {
      this.cache.clear();
    }
    
    this.emit('cache:cleared', { pattern: keyPattern });
  }

  /**
   * Destroy service and cleanup
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.cache.clear();
    this.metrics.clear();
    this.removeAllListeners();
  }

  // Private methods
  private async validateConfig(
    provider: IntegrationProvider,
    config: IntegrationConfig
  ): Promise<IntegrationResult<boolean>> {
    try {
      switch (provider) {
        case 'sentry':
          if (!config.apiKey) throw new Error('Sentry requires API key');
          break;
        case 'analytics':
          if (!config.apiKey) throw new Error('Analytics requires API key');
          break;
        case 'notification':
          if (!config.endpoint) throw new Error('Notification service requires endpoint');
          break;
        case 'auth':
          if (!config.apiKey || !config.endpoint) throw new Error('Auth service requires API key and endpoint');
          break;
        default:
          // Custom integrations - basic validation
          if (!config.endpoint) throw new Error('Custom integration requires endpoint');
      }

      return { success: true, data: true, metadata: { duration: 0, timestamp: new Date() } };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Validation failed',
        metadata: { duration: 0, timestamp: new Date() }
      };
    }
  }

  private async testConnection(integration: Integration): Promise<IntegrationResult<boolean>> {
    const startTime = performance.now();
    
    try {
      // Implement provider-specific connection tests
      switch (integration.provider) {
        case 'sentry':
          // Test Sentry connection
          break;
        case 'analytics':
          // Test analytics connection
          break;
        default:
          // Generic HTTP health check
          if (integration.config.endpoint) {
            const response = await fetch(`${integration.config.endpoint}/health`, {
              method: 'GET',
              timeout: integration.config.timeout,
              headers: integration.config.apiKey ? {
                'Authorization': `Bearer ${integration.config.apiKey}`
              } : {}
            });
            
            if (!response.ok) {
              throw new Error(`Connection test failed: ${response.status}`);
            }
          }
      }

      return {
        success: true,
        data: true,
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection test failed',
        metadata: {
          duration: performance.now() - startTime,
          timestamp: new Date()
        }
      };
    }
  }

  private async makeRequest<T>(
    integration: Integration,
    method: string,
    endpoint: string,
    data?: any
  ): Promise<IntegrationResult<T>> {
    const url = integration.config.endpoint ? 
      `${integration.config.endpoint}${endpoint}` : endpoint;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (integration.config.apiKey) {
      headers['Authorization'] = `Bearer ${integration.config.apiKey}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      signal: AbortSignal.timeout(integration.config.timeout!)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const responseData = await response.json();

    return {
      success: true,
      data: responseData,
      metadata: { duration: 0, timestamp: new Date() }
    };
  }

  private getCachedResult<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > new Date()) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private cacheResult(key: string, data: any, ttlMs: number = 300000): void {
    const expires = new Date(Date.now() + ttlMs);
    this.cache.set(key, { data, expires });
  }

  private recordMetric(integrationId: string, metric: any): void {
    if (!this.metrics.has(integrationId)) {
      this.metrics.set(integrationId, []);
    }
    
    const metrics = this.metrics.get(integrationId)!;
    metrics.push(metric);
    
    // Keep only last 1000 metrics per integration
    if (metrics.length > 1000) {
      metrics.splice(0, metrics.length - 1000);
    }
  }

  private async checkHealth(integration: Integration): Promise<HealthCheck> {
    const startTime = performance.now();
    
    try {
      const result = await this.testConnection(integration);
      const responseTime = performance.now() - startTime;
      
      return {
        service: integration.name,
        status: result.success ? 'healthy' : 'unhealthy',
        responseTime,
        lastChecked: new Date(),
        details: result.error ? { error: result.error } : undefined
      };
    } catch (error) {
      return {
        service: integration.name,
        status: 'unhealthy',
        responseTime: performance.now() - startTime,
        lastChecked: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  private async verifyWebhookSignature(
    payload: WebhookPayload,
    secret: string
  ): Promise<boolean> {
    // Implement webhook signature verification
    // This is a placeholder - actual implementation depends on the service
    return true;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      const healthStatus = await this.getHealthStatus();
      this.emit('health:checked', healthStatus);
    }, 60000); // Check every minute
  }
}

// Export singleton instance
export const integrationService = new IntegrationService();
export default integrationService;
