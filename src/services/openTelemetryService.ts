/**
 * OpenTelemetry Service Stub
 *
 * This is a stub implementation while OpenTelemetry packages are not installed
 * Replace this with the actual implementation when packages are added
 */
class OpenTelemetryServiceStub { async initialize(): Promise<void> {
    console.log('OpenTelemetry disabled - packages not installed');
    return Promise.resolve() }

  startSpan(_name: string): any {
    return {
      end: () => {},
      setAttribute: () => {},
      setStatus: () => {},
      recordException: () => {}
    };
  }

  recordMetric(_name: string, _value: number): void {
    // No-op
  }

  shutdown(): Promise<void> { return Promise.resolve() }
}

export const openTelemetryService = new OpenTelemetryServiceStub();