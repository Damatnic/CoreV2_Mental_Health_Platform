/**
 * OpenTelemetry Service
 * 
 * Provides distributed tracing and observability for the mental health platform
 * Integrates with OpenTelemetry for comprehensive monitoring
 * 
 * @license Apache-2.0
 */

import { 
  trace, 
  context, 
  SpanStatusCode, 
  SpanKind,
  Tracer,
  Span,
  Context,
  Attributes,
  AttributeValue
} from '@opentelemetry/api';
import { WebTracerProvider } from '@opentelemetry/sdk-trace-web';
import { getWebAutoInstrumentations } from '@opentelemetry/auto-instrumentations-web';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { ConsoleSpanExporter, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { ZoneContextManager } from '@opentelemetry/context-zone';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PerformanceObserver } from '@opentelemetry/sdk-metrics';

interface OpenTelemetryConfig {
  serviceName: string;
  serviceVersion: string;
  endpoint?: string;
  enabled: boolean;
  debug?: boolean;
  environment?: string;
  privateMode?: boolean;
}

interface TracingOptions {
  attributes?: Attributes;
  kind?: SpanKind;
  links?: any[];
}

interface CrisisTracingContext {
  userId?: string;
  sessionId: string;
  crisisLevel?: 'low' | 'medium' | 'high' | 'critical';
  location?: string;
  timestamp: number;
}

class OpenTelemetryService {
  private static instance: OpenTelemetryService;
  private tracer: Tracer | null = null;
  private provider: WebTracerProvider | null = null;
  private config: OpenTelemetryConfig;
  private isInitialized = false;
  private activeSpans: Map<string, Span> = new Map();
  private crisisContext: CrisisTracingContext | null = null;

  private constructor() {
    this.config = {
      serviceName: 'astralcore-mental-health',
      serviceVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      endpoint: import.meta.env.VITE_OTEL_ENDPOINT,
      enabled: import.meta.env.VITE_OTEL_ENABLED === 'true',
      debug: import.meta.env.DEV,
      environment: import.meta.env.MODE,
      privateMode: true // Privacy-first by default
    };
  }

  static getInstance(): OpenTelemetryService {
    if (!OpenTelemetryService.instance) {
      OpenTelemetryService.instance = new OpenTelemetryService();
    }
    return OpenTelemetryService.instance;
  }

  /**
   * Initialize OpenTelemetry
   */
  async initialize(config?: Partial<OpenTelemetryConfig>): Promise<void> {
    if (this.isInitialized || !this.config.enabled) {
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    try {
      // Create resource
      const resource = Resource.default().merge(
        new Resource({
          [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
          [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion,
          [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment,
          'service.namespace': 'mental-health',
          'service.instance.id': this.generateInstanceId()
        })
      );

      // Create provider
      this.provider = new WebTracerProvider({
        resource,
        forceFlushTimeoutMillis: 10000
      });

      // Configure exporters
      if (this.config.endpoint) {
        const otlpExporter = new OTLPTraceExporter({
          url: this.config.endpoint,
          headers: this.getHeaders()
        });
        this.provider.addSpanProcessor(new BatchSpanProcessor(otlpExporter));
      }

      // Add console exporter in debug mode
      if (this.config.debug) {
        this.provider.addSpanProcessor(
          new BatchSpanProcessor(new ConsoleSpanExporter())
        );
      }

      // Register provider
      this.provider.register({
        contextManager: new ZoneContextManager()
      });

      // Register auto-instrumentations
      this.registerInstrumentations();

      // Get tracer
      this.tracer = trace.getTracer(
        this.config.serviceName,
        this.config.serviceVersion
      );

      this.isInitialized = true;
      console.log('[OpenTelemetry] Initialized successfully');
    } catch (error) {
      console.error('[OpenTelemetry] Initialization failed:', error);
    }
  }

  /**
   * Register automatic instrumentations
   */
  private registerInstrumentations(): void {
    registerInstrumentations({
      instrumentations: [
        getWebAutoInstrumentations({
          '@opentelemetry/instrumentation-fetch': {
            propagateTraceHeaderCorsUrls: [
              /^https?:\/\/api\.astralcore\.com/,
              /^https?:\/\/localhost:\d+/
            ],
            clearTimingResources: true,
            applyCustomAttributesOnSpan: (span, request, response) => {
              // Add custom attributes while preserving privacy
              if (!this.config.privateMode) {
                span.setAttribute('http.request.body.size', request.body?.length || 0);
              }
              span.setAttribute('http.response.cached', response?.headers?.get('x-cache') === 'HIT');
            }
          },
          '@opentelemetry/instrumentation-document-load': {
            enabled: true
          },
          '@opentelemetry/instrumentation-user-interaction': {
            enabled: true,
            eventNames: ['click', 'submit', 'change'],
            shouldPreventSpanCreation: (event, element) => {
              // Don't trace sensitive elements
              return element.hasAttribute('data-no-trace') ||
                     element.type === 'password' ||
                     element.classList.contains('private');
            }
          }
        })
      ]
    });
  }

  /**
   * Start a new span
   */
  startSpan(name: string, options?: TracingOptions): Span | null {
    if (!this.tracer || !this.isInitialized) {
      return null;
    }

    const span = this.tracer.startSpan(name, {
      kind: options?.kind || SpanKind.INTERNAL,
      attributes: this.sanitizeAttributes(options?.attributes),
      links: options?.links
    });

    // Add crisis context if available
    if (this.crisisContext) {
      span.setAttributes({
        'crisis.level': this.crisisContext.crisisLevel || 'none',
        'crisis.session_id': this.crisisContext.sessionId,
        'crisis.monitoring': true
      });
    }

    this.activeSpans.set(name, span);
    return span;
  }

  /**
   * End a span
   */
  endSpan(name: string, status?: SpanStatusCode, message?: string): void {
    const span = this.activeSpans.get(name);
    if (!span) return;

    if (status !== undefined) {
      span.setStatus({ code: status, message });
    }

    span.end();
    this.activeSpans.delete(name);
  }

  /**
   * Trace an async operation
   */
  async traceAsync<T>(
    name: string,
    operation: () => Promise<T>,
    options?: TracingOptions
  ): Promise<T> {
    const span = this.startSpan(name, options);
    
    try {
      const result = await operation();
      span?.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span?.recordException(error as Error);
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Trace a synchronous operation
   */
  traceSync<T>(
    name: string,
    operation: () => T,
    options?: TracingOptions
  ): T {
    const span = this.startSpan(name, options);
    
    try {
      const result = operation();
      span?.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span?.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span?.recordException(error as Error);
      throw error;
    } finally {
      span?.end();
    }
  }

  /**
   * Trace crisis-related operations
   */
  traceCrisisOperation(
    operationName: string,
    crisisLevel: 'low' | 'medium' | 'high' | 'critical',
    operation: () => Promise<any>
  ): Promise<any> {
    return this.traceAsync(
      `crisis.${operationName}`,
      operation,
      {
        attributes: {
          'crisis.operation': operationName,
          'crisis.level': crisisLevel,
          'crisis.timestamp': Date.now(),
          'crisis.priority': this.getCrisisPriority(crisisLevel)
        },
        kind: SpanKind.INTERNAL
      }
    );
  }

  /**
   * Trace API calls
   */
  traceApiCall(
    method: string,
    endpoint: string,
    operation: () => Promise<Response>
  ): Promise<Response> {
    return this.traceAsync(
      `api.${method.toLowerCase()}.${endpoint}`,
      operation,
      {
        attributes: {
          'http.method': method,
          'http.url': this.sanitizeUrl(endpoint),
          'http.target': endpoint,
          'api.version': 'v1'
        },
        kind: SpanKind.CLIENT
      }
    );
  }

  /**
   * Trace user interactions
   */
  traceUserInteraction(
    action: string,
    element: string,
    metadata?: Record<string, any>
  ): void {
    const span = this.startSpan(`ui.${action}`, {
      attributes: {
        'ui.action': action,
        'ui.element': element,
        'ui.timestamp': Date.now(),
        ...this.sanitizeAttributes(metadata)
      },
      kind: SpanKind.INTERNAL
    });

    // Auto-end after interaction
    setTimeout(() => {
      span?.end();
    }, 100);
  }

  /**
   * Set crisis context for all spans
   */
  setCrisisContext(context: CrisisTracingContext): void {
    this.crisisContext = context;
  }

  /**
   * Clear crisis context
   */
  clearCrisisContext(): void {
    this.crisisContext = null;
  }

  /**
   * Record custom metric
   */
  recordMetric(
    name: string,
    value: number,
    unit?: string,
    labels?: Record<string, string>
  ): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(`metric.${name}`, value);
      if (unit) {
        span.setAttribute(`metric.${name}.unit`, unit);
      }
      if (labels) {
        Object.entries(labels).forEach(([key, val]) => {
          span.setAttribute(`metric.${name}.${key}`, val);
        });
      }
    }
  }

  /**
   * Add baggage to context
   */
  addBaggage(key: string, value: string): void {
    const span = trace.getActiveSpan();
    if (span) {
      span.setAttribute(`baggage.${key}`, value);
    }
  }

  /**
   * Sanitize attributes for privacy
   */
  private sanitizeAttributes(attributes?: Attributes): Attributes {
    if (!attributes || !this.config.privateMode) {
      return attributes || {};
    }

    const sanitized: Attributes = {};
    const sensitiveKeys = ['password', 'email', 'ssn', 'phone', 'address', 'name'];

    Object.entries(attributes).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (!sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize URLs for privacy
   */
  private sanitizeUrl(url: string): string {
    if (!this.config.privateMode) {
      return url;
    }

    try {
      const urlObj = new URL(url);
      // Remove query parameters that might contain sensitive data
      urlObj.search = '';
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Get crisis priority
   */
  private getCrisisPriority(level: string): number {
    const priorities: Record<string, number> = {
      critical: 1,
      high: 2,
      medium: 3,
      low: 4
    };
    return priorities[level] || 5;
  }

  /**
   * Get headers for OTLP exporter
   */
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    const apiKey = import.meta.env.VITE_OTEL_API_KEY;
    if (apiKey) {
      headers['x-api-key'] = apiKey;
    }

    return headers;
  }

  /**
   * Generate instance ID
   */
  private generateInstanceId(): string {
    return `${this.config.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Force flush all spans
   */
  async flush(): Promise<void> {
    if (this.provider) {
      await this.provider.forceFlush();
    }
  }

  /**
   * Shutdown OpenTelemetry
   */
  async shutdown(): Promise<void> {
    // End all active spans
    this.activeSpans.forEach(span => span.end());
    this.activeSpans.clear();

    if (this.provider) {
      await this.provider.shutdown();
    }

    this.isInitialized = false;
    this.tracer = null;
    this.provider = null;
  }

  /**
   * Check if initialized
   */
  isReady(): boolean {
    return this.isInitialized && this.tracer !== null;
  }

  /**
   * Get active span count
   */
  getActiveSpanCount(): number {
    return this.activeSpans.size;
  }

  /**
   * Export for debugging
   */
  exportDebugInfo(): any {
    return {
      initialized: this.isInitialized,
      config: this.config,
      activeSpans: this.activeSpans.size,
      crisisContext: this.crisisContext
    };
  }
}

// Export singleton instance
export const openTelemetryService = OpenTelemetryService.getInstance();

// Export types
export type { 
  OpenTelemetryConfig, 
  TracingOptions, 
  CrisisTracingContext 
};